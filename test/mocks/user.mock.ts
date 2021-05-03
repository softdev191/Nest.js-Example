import { TestingModuleMetadata } from '../../src/test.factory';
import { Role, RoleEnum, User } from '../../src/modules/base/entities';
import { company, internet, name, phone } from 'faker';
import { BusinessType } from '../../src/modules/bid/enums';
import { UserDetail } from '../../src/modules/base/entities/user-detail.entity';

const password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // Password123
const ADMIN_ROLE = { ...new Role(), name: RoleEnum.ADMIN };
const USER_ROLE = { ...new Role(), name: RoleEnum.USER };

const generateAdditionalUsers = () => {
  const userArr = [];
  for (let i = 0; i < 15; i++) {
    const username = internet.userName().toLowerCase();
    const newUser = {
      ...new User(),
      username,
      email: `${username}@isbx.com`,
      password: password,
      verified: true,
      roles: [USER_ROLE],
      userDetail: {
        id: undefined,
        businessName: company.companyName(),
        firstName: name.firstName(),
        lastName: name.lastName(),
        phone: phone.phoneNumberFormat(1),
        businessType: BusinessType.OWNER
      }
    };
    userArr.push(newUser);
  }
  return userArr;
};

export const ROLES: Role[] = [ADMIN_ROLE, USER_ROLE]; // Add additional roles in future
export const USERS: User[] = [
  {
    ...new User(),
    username: 'bidvita_admin',
    email: 'bidvita-admin@isbx.com',
    password,
    verified: true,
    roles: [ADMIN_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'Admin',
      lastName: 'BVITA',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'bidvita_user',
    email: 'bidvita-user@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'User',
      lastName: 'BVITA',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.SUBCON
    }
  },
  {
    ...new User(),
    username: 'tstark',
    email: 'tstark@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: 'Stark Industries - ' + company.companyName(1),
      firstName: 'Tony',
      lastName: 'Stark',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'todinsson',
    email: 'todinsson@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'Thor',
      lastName: 'Odinsson',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'bbanner',
    email: 'bbanner@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'Bruce',
      lastName: 'Banner',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'nromanov',
    email: 'nromanov@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'Natasha',
      lastName: 'Romanov',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'srogers',
    email: 'srogers@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: 'SSR - ' + company.companyName(),
      firstName: 'Steve',
      lastName: 'Rogers',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'sstrange',
    email: 'sstrange@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'Stephen',
      lastName: 'Strange',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'slang',
    email: 'slang@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'Scott',
      lastName: 'Lang',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'cbarton',
    email: 'cbarton@isbx.com',
    password,
    verified: true,
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'Thor',
      lastName: 'Odinsson',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  {
    ...new User(),
    username: 'pcoulson',
    email: 'pcoulson@isbx.com',
    password,
    verified: true,
    deleted: true, // Agent eliminated =(
    roles: [USER_ROLE],
    userDetail: {
      id: undefined,
      businessName: company.companyName(),
      firstName: 'Phillip',
      lastName: 'Coulson',
      phone: phone.phoneNumberFormat(1),
      businessType: BusinessType.OWNER
    }
  },
  ...generateAdditionalUsers()
];

export function UserMock(module: TestingModuleMetadata): void {
  const userRepository = module.repositories.userRepository;
  const roleRepository = module.repositories.roleRepository;
  const userRoleRepository = module.repositories.userRoleRepository;
  const userDetailRepository = module.repositories.userDetailRepository;
  this.count = 0;

  const setupUsers = async (): Promise<void> => {
    for (const newUser of USERS) {
      const { userDetail, roles, ...user } = newUser;
      const savedUser = await userRepository.save(user);
      const { id: userId } = savedUser;

      const newUserDetail = await userDetailRepository.save({ ...userDetail, user: { id: userId } } as UserDetail);
      await userRepository.update(savedUser, { userDetail: newUserDetail });
      const newRoles = roles.map(async role => {
        let dbRole = await roleRepository.findOne({ name: role.name });
        if (!dbRole) {
          dbRole = await roleRepository.save(role);
        }
        return dbRole;
      });
      const userRoleTuple = (await Promise.all(newRoles)).map(userRole => [userId, userRole.id]);
      await userRoleRepository.saveUserRoles(userRoleTuple);
    }
  };

  this.generate = async (): Promise<void> => {
    await setupUsers();
    this.count = await userRepository.count();
  };
}
