import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { defaults } from 'lodash';
import { addDays } from 'date-fns';

import { InjectRepository } from '../../database/database.module';
import {
  UserRegisterDto,
  UserUpdateDto,
  UserUpdateProfileDto,
  UserTokensDto,
  TokenClaimDto,
  SearchParamsDto,
  DEFAULT_SEARCH_PARAMS,
  UserDto
} from '../dtos';
import { Device, Media, Role, User } from '../entities';
import { TokenRepository, UserRepository, UserRoleRepository } from '../repositories';
import { TokenService, EmailService } from '.';
import { ConfigService } from '../../config/config.service';
import {
  BusinessTypeDescription,
  SubcontractorCategory,
  SubcontractorCategoryDescription,
  SubscriptionStatus
} from '../../bid/enums';
import { UserDetail } from '../entities/user-detail.entity';
import { SubscriptionRepository } from '../../billing/repositories';
import { Subscription } from '../../billing/entities';
import { SubscriptionType, TRIAL_DURATION_DAYS } from '../../billing/enums';

@Injectable()
export class UserService {
  public constructor(
    private readonly tokenRepository: TokenRepository,
    @InjectRepository(Device) private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserDetail) private readonly userDetailRepository: Repository<UserDetail>,

    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly subscriptionRepository: SubscriptionRepository
  ) {}

  public async changePassword(user: User, password: string): Promise<User> {
    const config = await this.configService.get();
    // tslint:disable-next-line
    if (password.indexOf('$2a$') === 0 && password.length === 60) {
      // assume already a hash, maybe copied from another record
      user.password = password;
    } else {
      user.password = await bcrypt.hash(password, config.password.rounds);
    }
    return user;
  }

  public async login(username: string, password: string): Promise<UserTokensDto> {
    const user = await this.userRepository.findByUsername(username);

    if (!user || !user.verified || user.deleted) {
      // take this opportunity to clean up expired tokens
      await this.tokenRepository.cleanExpired();

      // arbitrary bcrypt.compare to prevent(?) timing attacks. Both good/bad paths take
      // roughly the same amount of time
      await bcrypt.compare('1234567890', '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW');

      if (!user.verified) {
        throw new UnauthorizedException('Unverified');
      }

      throw new UnauthorizedException();
    }
    if (await bcrypt.compare(password, user.password)) {
      return await this.tokenService.generateNewTokens(user);
    }
    throw new UnauthorizedException();
  }

  public async register(data: UserRegisterDto, currentUser: User): Promise<User> {
    const {
      username,
      email,
      firstName,
      lastName,
      businessName,
      businessType,
      subContractorName,
      subContractorCategory,
      phone,
      password,
      profileMedia,
      roles
    } = data;
    let newUser = {
      ...new User(),
      username,
      email,
      verified: false
    };

    if (password) {
      newUser = await this.changePassword(newUser, data.password);
    }

    if (profileMedia) {
      newUser.profileMedia = profileMedia;
    }

    // try/catch to catch unique key failure, etc
    let user;
    try {
      user = await this.userRepository.save(newUser);
      const userDetail = await this.userDetailRepository.findOne({ user: { id: user.id } });
      const newUserDetail = new UserDetail();
      newUserDetail.user = user;
      newUserDetail.firstName = firstName;
      newUserDetail.lastName = lastName;
      newUserDetail.phone = phone;
      newUserDetail.businessType = businessType;
      newUserDetail.subContractorName = subContractorName;
      newUserDetail.subContractorCategory = subContractorCategory;
      if (userDetail) {
        newUserDetail.id = userDetail.id;
      }
      await this.userDetailRepository.save(newUserDetail);
      await this.userRepository.update(user, { userDetail: newUserDetail });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        if (e.message.includes('username')) {
          throw new ConflictException('The username is already in use.');
        }
        throw new ConflictException('The email is already in use.');
      }
      throw e;
    }

    let isAdmin = false;
    if (
      currentUser !== null &&
      currentUser.roles.find(elem => {
        return elem.name === 'Admin';
      }) !== undefined
    ) {
      isAdmin = true;
    }

    if (isAdmin && roles && user.id) {
      const values = roles.map(elem => {
        return [user.id, elem.id];
      });
      await this.userRoleRepository.saveUserRoles(values);
      user = await this.userRepository.findOne(user.id);
    }

    const token = await this.tokenService.generateNewUserVerificationToken(user);
    const verifyBaseUrl = await this.configService.get('urls.verification');
    const verifyUrl = `${verifyBaseUrl}?token=${token}`;
    const config = await this.configService.get();
    const linkExpiration = `${config.token.userVerificationToken.ttl.minutes} minutes`;
    const fromEmail = await this.configService.get('email.from');

    // Retrieve full details with joins
    const fullUser = await this.userRepository.findByUsername(user.username);
    const emailParams = this.composeSignUpSuccessEmail(fullUser);
    await this.emailService.sendTemplate(fromEmail, email, 'BidVita - Account Created', 'welcome', {
      ...emailParams,
      verifyUrl,
      linkExpiration
    });

    return user;
  }

  private composeSignUpSuccessEmail(user: User) {
    const {
      username,
      email,
      userDetail: { firstName, lastName, businessName, businessType, subContractorCategory, subContractorName }
    } = user;

    return {
      name: `${firstName} ${lastName}`.trim() || username,
      username,
      email,
      businessName,
      businessType: BusinessTypeDescription[businessType],
      subContractor:
        subContractorCategory in SubcontractorCategory
          ? `* Subcontractor Category: ${SubcontractorCategoryDescription[subContractorCategory]}\n` +
            `* SubContractor Name: ${subContractorName}`
          : ''
    };
    // TODO add subconName if distinct from f,n,business* names?
  }

  public async update(id: number, data: UserUpdateDto, accessToken: TokenClaimDto): Promise<User> {
    // determine if sensitive data is changed
    let oldUser = await this.userRepository.findOne(id);
    if (!oldUser) {
      throw NotFoundException;
    }

    let clearTokens = false;
    if (data.email && data.email !== oldUser.email) {
      clearTokens = true;
    }
    if (data.newPassword) {
      if (await bcrypt.compare(data.currentPassword, oldUser.password)) {
        clearTokens = true;
        oldUser = await this.changePassword(oldUser, data.newPassword);
        delete data.newPassword;
        delete data.currentPassword;
      } else {
        throw new BadRequestException('Current password does not match');
      }
    }

    if (data.roles !== oldUser.roles && data.roles !== undefined) {
      const rolesId = [];
      const values = []; //roles to be inserted
      if (data.roles !== null && data.roles.length > 0) {
        data.roles.forEach(elem => {
          rolesId.push(elem.id);
          if (oldUser.roles.indexOf(elem) < 0) {
            values.push([id, elem.id]);
          }
        });
      }

      if (rolesId.length > 0) {
        await this.userRoleRepository.deleteUserRolesExcept(id, rolesId);
      } else {
        await this.userRoleRepository.deleteAllUserRoles(id);
      }

      if (values.length > 0) {
        await this.userRoleRepository.saveUserRoles(values);
      }
    }

    // create media if necessary
    // const media = data.profileMedia;
    // if (media && !media.id) {
    //   oldUser.profileMedia = await this.mediaRepository.save(media);
    //   delete data.profileMedia;
    // }

    oldUser = Object.assign(oldUser, data);
    const newUser = await this.userRepository.save(oldUser);
    if (clearTokens) {
      // clear tokens if changing sensitive data
      // TODO should retain current accesstoken and refresh token
      // -- unfortunately we don't know which token is the corresponding refresh token
      // await this.tokenRepository.clearOtherTokensForUserId(accessToken.tokenString, newUser.id);
    }

    return newUser;
  }

  public async updateProfile(userId: number, data: UserUpdateProfileDto): Promise<User> {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException();
    }
    // hash password if password was passed
    if (data.newPassword) {
      if (await bcrypt.compare(data.currentPassword, user.password)) {
        const { password } = await this.changePassword(user, data.newPassword);
        data.newPassword = password;
      } else {
        delete data.newPassword;
        throw new BadRequestException('Current password does not match');
      }
    }

    const oldMedia = user.profileMedia;
    if (data.companyLogo) {
      user.profileMedia = await this.mediaRepository.save(data.companyLogo);
      delete data.companyLogo;
    } else {
      if (oldMedia) {
        user.profileMedia = null;
      }
    }

    try {
      const {
        newPassword,
        firstName,
        lastName,
        email,
        phone,
        businessType,
        subContractorName,
        subContractorCategory
      } = data;
      const response = await this.userRepository.save({
        ...user,
        id: userId,
        profileMedia: user.profileMedia,
        email,
        ...(newPassword ? { password: newPassword } : {})
      } as User);

      const existingUserDetail = await this.userDetailRepository.findOne({ where: { user: { id: userId } } });
      if (existingUserDetail) {
        await this.userDetailRepository.update(existingUserDetail.id, {
          firstName,
          lastName,
          phone,
          businessType,
          subContractorName,
          subContractorCategory
        });
      } else {
        await this.userDetailRepository.save({
          user: { id: user.id },
          firstName,
          lastName,
          phone,
          businessType,
          subContractorName,
          subContractorCategory
        });
      }
      return response;
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('The username / email is already in use.');
      }
      throw new InternalServerErrorException(e);
    }
  }

  public async setStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    await this.userRepository.update(userId, { stripeCustomerId });
    return this.findUserByStripeId(stripeCustomerId);
  }

  public async requestPasswordReset(username: string): Promise<void> {
    const user = await this.userRepository.findOne({
      select: ['id', 'username', 'email'],
      where: { username, deleted: false }
    });
    if (!user) {
      return;
    }

    const token = await this.tokenService.generateNewPasswordResetToken(user);
    const resetBaseUrl = await this.configService.get('urls.resetPassword');
    const resetUrl = `${resetBaseUrl}?token=${token}`;
    const config = await this.configService.get();
    const linkExpiration = `${config.token.userVerificationToken.ttl.minutes} minutes`;

    const fromEmail = await this.configService.get('email.from');
    await this.emailService.sendTemplate(
      fromEmail,
      user.email,
      'BidVita - Password Reset Requested',
      'password-reset',
      {
        username: user.username,
        resetUrl,
        linkExpiration
      }
    );
  }

  public async requestUsername(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      select: ['id', 'username', 'email'],
      where: { email, deleted: false }
    });
    if (!user) {
      // For security, consume the same duration as existing user
      await new Promise(resolve => setTimeout(resolve.bind(null), 5000));
      return;
    }

    const fromEmail = await this.configService.get('email.from');
    await this.emailService.sendTemplate(fromEmail, user.email, 'BidVita - Username Query', 'request-username', {
      email: user.email,
      username: user.username
    });
  }

  public async addDevice(userId: number, token: string, type: string): Promise<Device> {
    const user = await this.userRepository.findOne(userId);
    if (!user) {
      throw new NotFoundException();
    }
    const device = await this.deviceRepository.findOne({ user, token, type });
    if (!device) {
      const newDevice = new Device();
      newDevice.user = user;
      newDevice.token = token;
      newDevice.type = type;

      return this.deviceRepository.save(newDevice);
    }

    return device;
  }

  public async getAllUsers(searchParams: SearchParamsDto): Promise<UserDto[]> {
    const { page, limit, sort, search } = defaults(searchParams, DEFAULT_SEARCH_PARAMS);
    return await this.userRepository.getAllUsers(page, limit, sort, search);
  }

  public async getCount(searchParams: SearchParamsDto): Promise<number> {
    const { search } = searchParams;
    return await this.userRepository.getCount(search);
  }

  public async getUser(currentUser: User, id: number): Promise<User> {
    const user = await this.userRepository.getUser(currentUser, id);
    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  public async findUserById(userId: number): Promise<User> {
    return this.userRepository.findOne({
      where: {
        id: userId,
        deleted: false
      },
      join: {
        alias: 'user',
        leftJoinAndSelect: {
          role: 'user.roles',
          media: 'user.profileMedia',
          userDetail: 'user.userDetail'
        }
      }
    });
  }

  public async findUserByStripeId(stripeCustomerId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { stripeCustomerId, deleted: false },
      join: {
        alias: 'user',
        leftJoinAndSelect: {
          userDetail: 'user.userDetail'
        }
      }
    });
    if (!user) {
      throw new NotFoundException();
    }

    return user;
  }

  public async deleteUser(id: number): Promise<User> {
    const deleteUser = await this.userRepository.findOne(id);
    deleteUser.deleted = true;
    return await this.userRepository.save(deleteUser);
  }

  public async getAllRoles() {
    return await this.roleRepository.find();
  }

  public async verifyUser(tokenString: string): Promise<void> {
    const savedToken = await this.tokenService.verifySavedToken(tokenString);
    const { user } = savedToken;
    await this.userRepository.update(user.id, { verified: true });
    await this.tokenRepository.deleteToken(tokenString);

    // initialize a trial subscription. This will be used later for activating Stripe Subscriptions.
    const trialEndDate = addDays(new Date(), TRIAL_DURATION_DAYS);
    (await this.subscriptionRepository.findOne({
      where: { user: { id: user.id }, deleted: false, status: SubscriptionStatus.ACTIVE }
    })) ??
      (await this.subscriptionRepository.save({
        ...new Subscription(),
        user: { id: user.id },
        type: SubscriptionType.MONTHLY,
        isTrial: true,
        status: SubscriptionStatus.NON_RENEWING,
        expirationDate: trialEndDate,
        trialEndDate
      }));
  }

  public async verifyPasswordReset(tokenString: string): Promise<void> {
    await this.tokenService.verifySavedToken(tokenString);
  }

  public async resetPassword(tokenString: string, password: string): Promise<void> {
    const savedToken = await this.tokenService.verifySavedToken(tokenString);
    const { user } = savedToken;

    const newUser = await this.changePassword(user, password);
    await this.userRepository.save(newUser);

    const fromEmail = await this.configService.get('email.from');
    await this.emailService.sendTemplate(
      fromEmail,
      user.email,
      'BidVita - Successful Password Reset',
      'password-reset-success',
      {
        username: user.username
      }
    );

    await this.tokenRepository.deleteToken(tokenString);
  }
}
