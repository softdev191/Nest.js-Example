import { EntityRepository, Repository } from 'typeorm';
import { UserRole, User, Role } from '../entities';

@EntityRepository(UserRole)
export class UserRoleRepository extends Repository<UserRole> {
  public async saveUserRoles(values) {
    return await this.query(
      `
            INSERT INTO user_role
            (user_id, role_id) VALUES ?`,
      [values]
    );
  }

  public async deleteUserRolesExcept(id: number, roles: number[]) {
    return await this.query(
      `
            DELETE FROM user_role
            WHERE user_id = ?
            AND role_id NOT IN ?`,
      [id, [roles]]
    );
  }

  public async deleteAllUserRoles(userId: number) {
    return await this.query(
      `
              DELETE FROM user_role
              WHERE user_id = ${userId}`
    );
  }
}
