import { Token, User } from '../entities';
import TestFactory, { TestingModuleMetadata } from '../../../test.factory';

let normalAccessToken;

describe('MediaController', () => {
  let module: TestingModuleMetadata;

  beforeAll(async () => {
    module = await TestFactory.createTestModule();

    // normal user
    const normalUser = new User();
    normalUser.username = 'normal';
    normalUser.email = 'normal@example.com';
    normalUser.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
    normalUser.verified = true;
    normalUser.roles = [];
    await module.repositories.userRepository.save(normalUser);

    const normalToken = await module.services.tokenService.generateNewTokens(normalUser);
    normalAccessToken = normalToken.accessToken;
  });

  afterAll(async () => {
    // close DB connection after this module's tests
    await module.connection.close();
  });

  describe('#get-signature', () => {
    it('ACL - should NOT allow $everyone to be able to call the endpoint', async () => {
      const response = await module.server.get('/api/media/signature').expect(403);
    });
    it('ACL - should allow $authenticated to be able to call the endpoint', async () => {
      const response = await module.server
        .get('/api/media/signature')
        .query({
          type: 'image/jpeg', // accepted file type
          acl: 'default-acl'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(200);
    });
  });

  describe('#postMedia', () => {
    it('Should add new media to database.', async () => {
      const response = await module.server
        .post('/api/media')
        .send({
          filename: 'test',
          originalUrl: 'https://isbx-s3-dev.s3.amazonaws.com/media/76d80cd0-8635-11e9-a106-4949f186a8cd-sky1.jpg',
          smallUrl: 'https://isbx-s3-dev.s3.amazonaws.com/media/7681af70-8635-11e9-a106-4949f186a8cd-1559589979113',
          mediumUrl: 'https://isbx-s3-dev.s3.amazonaws.com/media/76ab5780-8635-11e9-a106-4949f186a8cd-1559589979387',
          largeUrl: 'https://isbx-s3-dev.s3.amazonaws.com/media/76c98de0-8635-11e9-a106-4949f186a8cd-1559589979584'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(201); //created
    });
    it('Should NOT allow unauthenticated user to add new media.', async () => {
      const response = await module.server
        .post('/api/media')
        .send({
          filename: 'test',
          originalUrl: 'https://isbx-s3-dev.s3.amazonaws.com/media/76d80cd0-8635-11e9-a106-4949f186a8cd-sky1.jpg',
          smallUrl: 'https://isbx-s3-dev.s3.amazonaws.com/media/7681af70-8635-11e9-a106-4949f186a8cd-1559589979113',
          mediumUrl: 'https://isbx-s3-dev.s3.amazonaws.com/media/76ab5780-8635-11e9-a106-4949f186a8cd-1559589979387',
          largeUrl: 'https://isbx-s3-dev.s3.amazonaws.com/media/76c98de0-8635-11e9-a106-4949f186a8cd-1559589979584'
        })
        .expect(403);
    });
  });
});
