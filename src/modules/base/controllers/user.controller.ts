import { Controller, Delete, Get, HttpCode, Patch, Post, Query } from '@nestjs/common';
import { Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  UserDeviceDto,
  UserLoginDto,
  UserRegisterDto,
  UserRequestResetPasswordDto,
  UserUpdateDto,
  UserUpdateProfileDto,
  UserTokensDto,
  TokenClaimDto,
  SearchParamsDto,
  TokenVerificationDto,
  ResetPasswordDto,
  UserDto
} from '../dtos';
import { Device, User } from '../entities';
import { CurrentUser, RequestProperty, Roles } from '../../../decorators';
import { TokenRepository } from '../repositories';
import { AuthenticatedRole, EveryoneRole, UserOwnerRole, UserRegisterRole, UserUpdateRole } from '../roles';
import { TokenService, UserService } from '../services';
import { ConfigService } from '../../config/config.service';
import { UserRequestUsernameDto } from '../dtos/user-request-username';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UserController {
  public constructor(
    private readonly tokenRepository: TokenRepository,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService
  ) {}

  @Roles(AuthenticatedRole)
  @Get(':id([0-9]+|me)')
  public async getUser(
    @CurrentUser()
    currentUser: User,
    @Param('id', ParseIntPipe)
    id: number
  ): Promise<User> {
    return this.userService.getUser(currentUser, id);
  }

  @Roles('Admin')
  @Get()
  public async getAllUsers(@Query() searchParams: SearchParamsDto): Promise<UserDto[]> {
    return this.userService.getAllUsers(searchParams);
  }

  @Roles('Admin')
  @Get('/count')
  public async getCount(@Query() searchParams: SearchParamsDto): Promise<number> {
    return this.userService.getCount(searchParams);
  }

  @Roles(UserRegisterRole)
  @Post('register')
  public async register(
    @CurrentUser()
    currentUser: User,
    @Body()
    user: UserRegisterDto
  ): Promise<User> {
    return this.userService.register(user, currentUser);
  }

  @Roles('Admin', UserUpdateRole)
  @Patch(':id([0-9]+|me)')
  public async update(
    @RequestProperty('token') token: TokenClaimDto,
    @Param('id', ParseIntPipe) id: number,
    @Body()
    data: UserUpdateDto
  ): Promise<User> {
    return this.userService.update(id, data, token);
  }

  @Roles(UserOwnerRole)
  @Patch(':id([0-9]+|me)/profile')
  public async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UserUpdateProfileDto
  ): Promise<User> {
    return this.userService.updateProfile(id, updateDto);
  }

  @Roles('Admin')
  @Delete(':id([0-9]+|me)')
  public async delete(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.deleteUser(id);
  }

  // Login related
  @Roles(EveryoneRole)
  @Post('login')
  public async login(
    @Body()
    request: UserLoginDto
  ): Promise<UserTokensDto> {
    const { username, password } = request;
    return this.userService.login(username, password);
  }

  @Roles(AuthenticatedRole)
  @Post('logout')
  @HttpCode(204)
  public async logout(@RequestProperty('token') refreshToken: TokenClaimDto): Promise<void> {
    // TODO remove current push device?
    await this.tokenRepository.deleteToken(refreshToken.tokenString);
  }

  @Roles(UserOwnerRole)
  @Post(':id([0-9]+|me)/devices')
  public async addDevice(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    input: UserDeviceDto
  ): Promise<Device> {
    return this.userService.addDevice(id, input.token, input.type);
  }

  @Roles(EveryoneRole)
  @Post('request-password-reset')
  @HttpCode(204)
  public async requestPasswordReset(
    @Body()
    request: UserRequestResetPasswordDto
  ): Promise<void> {
    const { username } = request;
    return this.userService.requestPasswordReset(username);
  }

  @Roles(EveryoneRole)
  @Post('request-username')
  @HttpCode(204)
  public async requestUsername(
    @Body()
    request: UserRequestUsernameDto
  ): Promise<void> {
    const { email } = request;
    return this.userService.requestUsername(email);
  }

  @Roles(EveryoneRole)
  @Post('verify')
  public async verifyUser(
    @Body()
    body: TokenVerificationDto
  ): Promise<void> {
    return this.userService.verifyUser(body.tokenString);
  }

  @Roles(EveryoneRole)
  @Post('verify-password-reset')
  public async verifyPasswordReset(
    @Body()
    body: TokenVerificationDto
  ): Promise<void> {
    return this.userService.verifyPasswordReset(body.tokenString);
  }

  @Roles(EveryoneRole)
  @Post('reset-password')
  public async resetPassword(
    @Body()
    body: ResetPasswordDto
  ): Promise<void> {
    const { tokenString, password } = body;
    return this.userService.resetPassword(tokenString, password);
  }

  @Roles(AuthenticatedRole)
  @Get('refresh')
  public async renewTokens(@RequestProperty('token') token: TokenClaimDto): Promise<UserTokensDto> {
    return this.tokenService.issueNewTokens(token);
  }
}
