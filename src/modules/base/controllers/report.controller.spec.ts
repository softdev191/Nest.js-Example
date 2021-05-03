import { Token, Role, User } from '../entities';
import TestFactory, { TestingModuleMetadata } from '../../../test.factory';

let adminAccessToken;
let normalAccessToken;
let otherAccessToken;

let adminUser;
let normalUser;
let otherUser;

describe('ReportController', () => {
  let module: TestingModuleMetadata;

  beforeAll(async () => {
    module = await TestFactory.createTestModule();
    const adminRole = new Role();
    adminRole.id = 1;
    adminRole.name = 'Admin';
    await module.repositories.roleRepository.save(adminRole);

    // admin user
    adminUser = new User();
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
    adminAccessToken = adminToken.refreshToken;

    // normal user
    normalUser = new User();
    normalUser.username = 'normal';
    normalUser.email = 'normal@example.com';
    normalUser.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
    normalUser.verified = true;
    normalUser.roles = [];
    await module.repositories.userRepository.save(normalUser);

    const normalToken = await module.services.tokenService.generateNewTokens(normalUser);
    normalAccessToken = normalToken.refreshToken;

    // other user
    otherUser = new User();
    otherUser.username = 'other';
    otherUser.email = 'other@example.com';
    otherUser.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
    otherUser.verified = true;
    otherUser.roles = [];
    await module.repositories.userRepository.save(otherUser);

    const otherToken = await module.services.tokenService.generateNewTokens(otherUser);
    otherAccessToken = otherToken.refreshToken;
  });

  afterAll(async () => {
    // close DB connection after this module's tests
    await module.connection.close();
  });

  describe('#report', () => {
    it('ACL - should NOT allow $everyone to make reports', async () => {
      return await module.server.post('/api/reports').expect(403);
    });
    it('ACL - should allow authenticated to make reports', async () => {
      const response = await module.server
        .post('/api/reports')
        .send({
          userId: adminUser.id
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(201);
      const report = await module.repositories.reportRepository.findOne({
        where: { user: adminUser.id, reporter: normalUser.id }
      });
      expect(report.user.id).toBe(1);
      expect(report.reporter.id).toBe(2);
    });
    it('should not allow reporting of non-existing user', async () => {
      await module.server
        .post('/api/reports')
        .send({
          userId: 9999
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(404);
    });
  });
});
