/* eslint-disable @typescript-eslint/no-unused-vars */
import { Media, Role, User } from '../entities';
import TestFactory, { TestingModuleMetadata } from '../../../test.factory';
import * as jwt from 'jsonwebtoken';

import { EmailService } from '../services/email.service';
import { EmailServiceMock } from '../../../../test/services/email.service-mock';
import { UserDetail } from '../entities/user-detail.entity';
import { BusinessType, SubcontractorCategory, SubscriptionStatus } from '../../bid/enums';
import { HttpStatus } from '@nestjs/common';
import { SubscriptionType } from '../../billing/enums';
import { isFuture } from 'date-fns';

let adminAccessToken;
let normalAccessToken;
let otherAccessToken;
let otherRefreshToken;
let logOutTestAccessToken;
let normalUser;
let normalUserDetail;

describe('UserController', () => {
  let module: TestingModuleMetadata;

  beforeAll(async () => {
    jest.setTimeout(10000);
    module = await TestFactory.createTestModule({
      overrideProviders: [{ provider: EmailService, mock: new EmailServiceMock() }]
    });
    const adminRole = new Role();
    adminRole.id = 1;
    adminRole.name = 'Admin';
    await module.repositories.roleRepository.save(adminRole);

    // admin user
    const adminUser = new User();
    adminUser.username = 'admin';
    adminUser.email = 'admin@example.com';
    adminUser.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
    adminUser.verified = true;
    await module.repositories.userRepository.save(adminUser);
    await module.repositories.userRoleRepository.saveUserRoles([[1, 1]]);
    const adminToken = await module.services.tokenService.generateNewTokens({
      ...adminUser,
      roles: [adminRole]
    });
    adminAccessToken = adminToken.accessToken;

    // normal user
    normalUser = new User();
    normalUser.username = 'normal';
    normalUser.email = 'normal@example.com';
    normalUser.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
    normalUser.verified = true;
    normalUser.roles = [];
    await module.repositories.userRepository.save(normalUser);

    normalUserDetail = new UserDetail();
    normalUserDetail.user = normalUser;
    await module.repositories.userDetailRepository.save(normalUserDetail);

    const normalToken = await module.services.tokenService.generateNewTokens(normalUser);
    normalAccessToken = normalToken.accessToken;

    // other user
    const otherUser = new User();
    otherUser.username = 'other';
    otherUser.email = 'other@example.com';
    otherUser.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
    otherUser.verified = true;
    otherUser.roles = [];
    await module.repositories.userRepository.save(otherUser);

    const otherToken = await module.services.tokenService.generateNewTokens(otherUser);
    otherAccessToken = otherToken.accessToken;
    otherRefreshToken = otherToken.refreshToken;
  });

  afterAll(async () => {
    // close DB connection after this module's tests
    await module.connection.close();
  });

  describe('#getAllUsers', () => {
    beforeAll(async () => {
      //regular users
      const regUser1 = new User();
      regUser1.username = 'regular1';
      regUser1.email = 'regular1@example.com';
      regUser1.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
      regUser1.verified = true;
      regUser1.roles = [];
      await module.repositories.userRepository.save(regUser1);

      const regUser2 = new User();
      regUser2.username = 'regular2';
      regUser2.email = 'regular2@example.com';
      regUser2.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
      regUser2.verified = true;
      regUser2.roles = [];
      await module.repositories.userRepository.save(regUser2);

      const regUser3 = new User();
      regUser3.username = 'regular3';
      regUser3.email = 'regular3@example.com';
      regUser3.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
      regUser3.verified = true;
      regUser3.roles = [];
      await module.repositories.userRepository.save(regUser3);

      const regUser4 = new User();
      regUser4.username = 'regular4';
      regUser4.email = 'regular4@example.com';
      regUser4.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
      regUser4.verified = true;
      regUser4.roles = [];
      await module.repositories.userRepository.save(regUser4);
    });

    it('should return total number of users, Admin Access only', async () => {
      const response = await module.server
        .get('/api/users/count')
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(response.text).toBe('7');

      await module.server
        .get('/api/users/count')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(403);
    });

    it('should return a search result', async () => {
      const expected = normalUser.username;
      const response = await module.server
        .get('/api/users')
        .query({
          page: 0,
          limit: 1,
          sort: 'id ASC',
          search: expected
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      const [resultUser] = JSON.parse(response.text) as User[];
      expect(resultUser.username).toBe(expected);
    });

    it('should not return a search result for unknown search', async () => {
      const response = await module.server
        .get('/api/users')
        .query({
          page: 0,
          limit: 1,
          sort: 'id ASC',
          search: `User${Date.now()}`
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      const result = JSON.parse(response.text) as User[];
      expect(result).toHaveLength(0);
    });

    it('should return a search result count', async () => {
      const response = await module.server
        .get('/api/users/count')
        .query({ search: normalUser.username })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      const count = JSON.parse(response.text) as number;
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should return 0 search result count for unknown search', async () => {
      const response = await module.server
        .get('/api/users/count')
        .query({ search: `User${Date.now()}` })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      const count = JSON.parse(response.text) as number;
      expect(count).toBe(0);
    });

    it('should NOT allow normal users to Access users records', async () => {
      const response = await module.server
        .get('/api/users')
        .query({
          page: 0,
          limit: 3,
          sort: 'id ASC'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(403);
    });

    it('should receive the limit amount of records, includes emails', async () => {
      const response = await module.server
        .get('/api/users')
        .query({
          page: 0,
          limit: 3,
          sort: 'id ASC'
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);

      expect(response.body.length).toBe(3);
      expect(response.body[0].username).toBe('admin');
      expect(response.body[0].email).toBe('admin@example.com');
    });

    it('should support sorting', async () => {
      const response = await module.server
        .get('/api/users')
        .query({
          page: 1,
          limit: 3,
          sort: 'username DESC'
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(response.body.length).toBe(3);
      expect(response.body[2].username).toBe('normal');
      expect(response.body[0].username).toBe('regular1');
    });
  });

  describe('#deleteUser', () => {
    it('should not allow normal users to delete users', async () => {
      await module.server
        .delete('/api/users/5')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(403);
    });

    it('should set deleted column in users to true', async () => {
      await module.server
        .delete('/api/users/5')
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);

      await module.server
        .get('/api/users/5')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(404);
    });

    it('should return the updated total', async () => {
      const response = await module.server
        .get('/api/users/count')
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(response.text).toBe('6');
    });
  });

  describe('#getUser', () => {
    it('ACL - should NOT allow $everyone to get an account', async () => {
      return module.server.get('/api/users/1').expect(403);
    });
    it('ACL - should allow $unblocked to get another account', async () => {
      const response = await module.server
        .get('/api/users/1')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);
      const body = response.body;
      expect(body.username).toBe('admin');
      expect(body.password).toBeUndefined();
    });

    it('should support me substitution', async () => {
      const response = await module.server
        .get('/api/users/me')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);
      const { body } = response;
      expect(body.username).toBe('normal');
    });
  });

  describe('#login', () => {
    it('ACL - should allow $everyone to try to login', async () => {
      const response = await module.server.post('/api/users/login').expect(400);
    });
    it('should fail on using email query to login', async () => {
      const response = await module.server
        .post('/api/users/login')
        .send({
          email: 'regular1@example.com',
          password: 'Password123'
        })
        .expect(400);
    });
    it('should fail on using email value as login', async () => {
      const response = await module.server
        .post('/api/users/login')
        .send({
          username: 'regular1@example.com',
          password: 'Password123'
        })
        .expect(400);
    });
    it('should fail on bad username', async () => {
      const response = await module.server
        .post('/api/users/login')
        .send({
          username: 'bad',
          password: 'Password123'
        })
        .expect(401);
    });
    it('should fail on bad password', async () => {
      const response = await module.server
        .post('/api/users/login')
        .send({
          username: 'regular1',
          password: 'BadPassword123'
        })
        .expect(401);
    });
    it('should succeed on correct username', async () => {
      const username = 'regular1';
      const response = await module.server
        .post('/api/users/login')
        .send({
          username,
          password: 'Password123'
        })
        .expect(201);
      const { body } = response;
      logOutTestAccessToken = body.refreshToken; // save token for logout test
      const decoded = jwt.decode(logOutTestAccessToken);
      expect(decoded.name).toBe(username);
    });
  });

  describe('#logout', () => {
    it('ACL - should NOT allow $everyone to logout', async () => {
      const response = await module.server.post('/api/users/logout').expect(403);
    });
    it('ACL - should allow $authenticated to logout', async () => {
      const response = await module.server
        .post('/api/users/logout')
        .set('Authorization', 'Bearer ' + logOutTestAccessToken)
        .expect(204);
    });
    // it('should invalidate the test token', async () => {
    //   const response = await module.server
    //     .post('/api/users/logout')
    //     .set('Authorization', 'Bearer ' + logOutTestAccessToken)
    //     .expect(403);
    // });
  });

  describe('#register', () => {
    it('ACL - should allow $everyone to try to register', async () => {
      const response = await module.server.post('/api/users/register').expect(400);
    });
    it('should check for duplicate usernames', async () => {
      const response = await module.server
        .post('/api/users/register')
        .send({
          username: 'normal',
          email: '123@example.com',
          password: 'Password123'
        })
        .expect(409);
    });
    it('should check for duplicate emails', async () => {
      const response = await module.server
        .post('/api/users/register')
        .send({
          username: '123',
          email: 'normal@example.com',
          password: 'Password123'
        })
        .expect(409);
    });
    it('should successfully register a user, but unverified', async () => {
      const response = await module.server
        .post('/api/users/register')
        .send({
          username: 'register',
          email: 'register@example.com',
          password: 'Password123'
        })
        .expect(201);
      const { body } = response;
      expect(body.verified).toBe(false);
      // TODO use mock email service that will allow us to check the email sent
    });
    it('should not allow newly registered account to login', async () => {
      const response = await module.server
        .post('/api/users/login')
        .send({
          username: 'register',
          password: 'Password123'
        })
        .expect(401);
    });
    it('should only allow Admin to assign Admin role', async () => {
      await module.server
        .post('/api/users/register')
        .send({
          username: 'newUser',
          email: 'newUser@example.com',
          password: 'Password123',
          roles: [{ id: 1, name: 'Admin' }]
        })
        .expect(403);

      await module.server
        .post('/api/users/register')
        .send({
          username: 'newUser',
          email: 'newUser@example.com',
          password: 'Password123',
          roles: [{ id: 1, name: 'User' }]
        })
        .expect(403);

      await module.server
        .post('/api/users/register')
        .send({
          username: 'newUser',
          email: 'newUser@example.com',
          password: 'Password123',
          roles: [{ id: 1, name: 'Admin' }]
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(201);
    });
  });

  describe('#verify-user', () => {
    let user: User;
    let tokenString: string;

    beforeAll(async () => {
      const response = await module.server
        .post('/api/users/register')
        .send({
          username: 'verify_user',
          email: 'verify@example.com',
          password: 'Password123'
        })
        .expect(HttpStatus.CREATED);

      user = response.body;
      tokenString = await module.services.tokenService.generateNewUserVerificationToken(user);
    });

    it('should verify user with valid token and activate trial', async () => {
      await module.server
        .post('/api/users/verify')
        .send({ tokenString })
        .expect(HttpStatus.CREATED);

      const user = await module.repositories.userRepository.findByUsername('verify_user');
      expect(user).toBeTruthy();

      const subscription = await module.repositories.subscriptionRepository.findOne({
        where: { user: { id: user.id } }
      });
      expect(subscription).toBeTruthy();
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(subscription.type).toBe(SubscriptionType.TRIAL);
      expect(isFuture(subscription.expirationDate)).toBeTruthy();
    });
    it('should NOT verify user with non-existing token', async () => {
      const nonExistingTokenString = '123';
      await module.server
        .post('/api/users/verify')
        .send({ tokenString: nonExistingTokenString })
        .expect(HttpStatus.GONE);
    });
  });

  describe('#request-password-reset', () => {
    it('ACL - should allow $everyone to try to request a password reset', async () => {
      const response = await module.server.post('/api/users/request-password-reset').expect(400);
    });
    it('should succeed even with a non-existent username', async () => {
      const response = await module.server
        .post('/api/users/request-password-reset')
        .send({
          username: '123example'
        })
        .expect(204);
      // TODO use mock email service that will allow us to check that no email was sent
    });
    it('should succeed with an existent username', async () => {
      const response = await module.server
        .post('/api/users/request-password-reset')
        .send({
          username: 'normal'
        })
        .expect(204);
      // TODO use mock email service that will allow us to check that email was sent
    });
  });

  describe('#request-username', () => {
    it('ACL - should allow $everyone to try to request their username', async () => {
      const response = await module.server.post('/api/users/request-password-reset').expect(400);
    });
    it('should succeed even with a non-existent email', async () => {
      const response = await module.server
        .post('/api/users/request-username')
        .send({
          email: '123@example.com'
        })
        .expect(204);
      // TODO use mock email service that will allow us to check that no email was sent
    });
    it('should succeed with an existent username', async () => {
      const response = await module.server
        .post('/api/users/request-username')
        .send({
          email: 'normal@example.com'
        })
        .expect(204);
      // TODO use mock email service that will allow us to check that email was sent
    });
  });

  describe('#add-device', () => {
    it('ACL - should NOT allow $everyone to be able to call the endpoint', async () => {
      const response = await module.server.post('/api/users/2/devices').expect(403);
    });
    it('ACL - should allow $userOwner to be able to call the endpoint', async () => {
      const response = await module.server
        .post('/api/users/2/devices')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .send({
          token: 'default-token',
          type: 'default-type'
        })
        .expect(201);
      const device = await module.repositories.deviceRepository.findOne({
        select: ['type', 'token'],
        where: { type: 'default-type', token: 'default-token' }
      });
      expect(device.type).toBe('default-type');
      expect(device.token).toBe('default-token');
    });
  });

  describe('#update-profile', () => {
    beforeAll(async () => {
      normalUserDetail = new UserDetail();
      normalUserDetail.user = normalUser;
      normalUserDetail.firstName = 'Normal';
      normalUserDetail.lastName = 'User';
      normalUserDetail.phone = '(000) 000-0000';
      normalUserDetail.businessType = BusinessType.SUBCON;
      normalUserDetail.subContractorCategory = SubcontractorCategory.FRAME_DRYWALL;
      normalUserDetail.subContractorName = 'Sample Name';
      await module.repositories.userDetailRepository.save(normalUserDetail);
    });

    it('ACL - should NOT allow $everyone to update a profile', async () => {
      await module.server.patch('/api/users/me/profile').expect(403);
    });
    it('ACL - should allow $userOwner to update their profile', async () => {
      const response = await module.server
        .patch('/api/users/me/profile')
        .send({
          businessType: BusinessType.OWNER,
          email: 'test@example.com',
          firstName: 'Test First Name',
          lastName: 'Test Last Name',
          phone: '(123) 456-7890'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);

      const { body } = response;
      expect(body.email).toBe('test@example.com');
      expect(body.firstName).toBe('Test First Name');
      expect(body.lastName).toBe('Test Last Name');
      expect(body.phone).toBe('(123) 456-7890');
      expect(body.businessType).toBe(BusinessType.OWNER);
    });
    it('Should allow update of company logo', async () => {
      const response = await module.server
        .patch('/api/users/me/profile')
        .send({
          businessType: BusinessType.OWNER,
          email: 'test@example.com',
          firstName: 'Test First Name',
          lastName: 'Test Last Name',
          phone: '(123) 456-7890',
          companyLogo: {
            filename: 'company-logo.jpg',
            originalUrl: 'https:/isbx-s3-dev.s3.amazonaws.com/media/company-logo.jpg',
            smallUrl: 'https:/isbx-s3-dev.s3.amazonaws.com/media/company-logo.jpg',
            mediumUrl: 'https:/isbx-s3-dev.s3.amazonaws.com/media/company-logo.jpg',
            largeUrl: 'https:/isbx-s3-dev.s3.amazonaws.com/media/company-logo.jpg'
          }
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);

      const { body } = response;
      expect(body.email).toBe('test@example.com');
      expect(body.firstName).toBe('Test First Name');
      expect(body.lastName).toBe('Test Last Name');
      expect(body.phone).toBe('(123) 456-7890');
      expect(body.businessType).toBe(BusinessType.OWNER);
      expect(body.profileMedia.filename).toBe('company-logo.jpg');
    });
  });

  describe('#update', () => {
    it('ACL - should not allow $everyone to update', async () => {
      const response = await module.server.patch('/api/users/1').expect(403);
    });
    it('ACL - should not allow $authorized to update a different user', async () => {
      const response = await module.server
        .patch('/api/users/1')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(403);
    });
    it('ACL - should allow admin to update a different user', async () => {
      const response = await module.server
        .patch('/api/users/2')
        .send({
          username: 'normal x admin'
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      const { body } = response;
      expect(body.username).toBe('normal x admin');
    });
    it('ACL - should allow $userOwner to update themselves', async () => {
      const response = await module.server
        .patch('/api/users/2')
        .send({
          username: 'normal',
          email: 'normal2@example.com'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);
      const { body } = response;
      expect(body.username).toBe('normal');
      const user = await module.repositories.userRepository.findOne({
        select: ['id', 'username', 'email'],
        where: { id: 2 }
      });
      expect(user.email).toBe('normal2@example.com');

      // restore original value
      user.email = 'normal@example.com';
      await module.repositories.userRepository.save(user);
    });
    it('should NOT allow to update password directly', async () => {
      const response = await module.server
        .patch('/api/users/me')
        .send({
          password: 'Password123'
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(400);
      const pwQuery = await module.repositories.userRepository.find({ where: { password: 'Password123' } });
      expect(pwQuery.length).toBe(0);
    });
    it('should not allow regular users to assign themselves as Admin', async () => {
      await module.server
        .patch('/api/users/2')
        .send({
          roles: [{ id: 1, name: 'Admin' }]
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(403);

      await module.server
        .patch('/api/users/2')
        .send({
          roles: [{ id: 1, name: 'User' }]
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(403);
    });
    it('should allow Admin to assign other users with Admin role', async () => {
      const resp = await module.server
        .patch('/api/users/4')
        .send({
          roles: [{ id: 1, name: 'Admin' }]
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(resp.body.roles[0].name).toBe('Admin');
    });
  });

  describe('#getNewTokens', () => {
    it('should not be accessible with an access token', async () => {
      await module.server
        .get('/api/users/refresh')
        .set('Authorization', 'Bearer ' + otherAccessToken)
        .expect(403);
    });
    it('should take refresh token and return a new pair of refresh and access tokens', async () => {
      const resp = await module.server
        .get('/api/users/refresh')
        .set('Authorization', 'Bearer ' + otherRefreshToken)
        .expect(200);
      expect(resp.body.refreshToken).toBeTruthy();
      expect(resp.body.accessToken).toBeTruthy();
    });
  });

  describe('#ProfileMedia', () => {
    it('Should add new profile media by updating user field.', async () => {
      const testMedia = new Media();
      testMedia.filename = 'test';
      testMedia.originalUrl =
        'https://isbx-s3-dev.s3.amazonaws.com/media/76d80cd0-8635-11e9-a106-4949f186a8cd-sky1.jpg';
      testMedia.smallUrl =
        'https://isbx-s3-dev.s3.amazonaws.com/media/7681af70-8635-11e9-a106-4949f186a8cd-1559589979113';
      testMedia.mediumUrl =
        'https://isbx-s3-dev.s3.amazonaws.com/media/76ab5780-8635-11e9-a106-4949f186a8cd-1559589979387';
      testMedia.largeUrl =
        'https://isbx-s3-dev.s3.amazonaws.com/media/76c98de0-8635-11e9-a106-4949f186a8cd-1559589979584';
      const mediaObj = await module.server
        .post('/api/media')
        .send(testMedia)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(201);

      const response = await module.server
        .patch('/api/users/1')
        .send({ profileMedia: mediaObj.body })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(response.body.profileMedia.id).toBe(mediaObj.body.id);
    });
    it('Should set profile media field to null when media is removed.', async () => {
      const response = await module.server
        .patch('/api/users/1')
        .send({
          profileMedia: {
            id: null,
            filename: '',
            originalUrl: '',
            smallUrl: '',
            mediumUrl: '',
            largeUrl: ''
          }
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(response.body.profileMedia.id).toBe(null);
    });
  });

  describe('#UserRole', () => {
    beforeAll(async () => {
      const role2 = new Role();
      role2.id = 2;
      role2.name = 'Role2';
      await module.repositories.roleRepository.save(role2);

      const role3 = new Role();
      role3.id = 3;
      role3.name = 'Role3';
      await module.repositories.roleRepository.save(role3);

      const role4 = new Role();
      role4.id = 4;
      role4.name = 'Role4';
      await module.repositories.roleRepository.save(role4);

      const role5 = new Role();
      role5.id = 5;
      role5.name = 'Role5';
      await module.repositories.roleRepository.save(role5);
    });

    it('Should be able to retrieve all user roles, Admin access only', async () => {
      const resp1 = await module.server
        .get('/api/roles')
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(403);

      const resp2 = await module.server
        .get('/api/roles')
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(resp2.body.length).toBe(5);
    });
    it('Should NOT allow normal users to add roles when registering', async () => {
      const resp1 = await module.server
        .post('/api/users/register')
        .send({
          username: 'user5',
          email: 'user5@example.com',
          password: 'Password123',
          roles: [
            { id: 2, name: 'Role2' },
            { id: 4, name: 'Role4' }
          ]
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(201);

      const resp2 = await module.server
        .get('/api/users/' + resp1.body.id)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);
      expect(resp2.body.roles.length).toBe(0);
    });
    it('Should add user roles when adding a new user by Admin', async () => {
      const resp1 = await module.server
        .post('/api/users/register')
        .send({
          username: 'user6',
          email: 'user6@example.com',
          password: 'Password123',
          roles: [
            { id: 2, name: 'Role2' },
            { id: 4, name: 'Role4' }
          ]
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(201);

      const resp2 = await module.server
        .get('/api/users/' + resp1.body.id)
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(resp2.body.roles.length).toBe(2);
      expect(resp2.body.roles[0].name).toBe('Role2');
    });
    it('Should be able to add and delete user roles, when updating user', async () => {
      const resp1 = await module.server
        .post('/api/users/register')
        .send({
          username: 'user7',
          email: 'user7@example.com',
          password: 'Password123',
          roles: [
            { id: 2, name: 'Role2' },
            { id: 4, name: 'Role4' }
          ]
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(201);

      const userId = resp1.body.id;

      const resp2 = await module.server
        .patch('/api/users/' + userId)
        .send({
          roles: [
            { id: 2, name: 'Role2' },
            { id: 3, name: 'Role3' },
            { id: 5, name: 'Role5' }
          ]
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(resp2.body.roles.length).toBe(3);
      expect(resp2.body.roles[2].id).toBe(5);

      const resp3 = await module.server
        .patch('/api/users/' + userId)
        .send({
          roles: []
        })
        .set('Authorization', 'Bearer ' + adminAccessToken)
        .expect(200);
      expect(resp3.body.roles.length).toBe(0);
    });
  });
});
