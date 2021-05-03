import { Brackets, EntityRepository, OrderByCondition, Repository } from 'typeorm';
import { UserDto } from '../dtos';
import { User } from '../entities';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  public async findByEmail(email: string): Promise<User> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.profileMedia', 'media')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.email = :email')
      .setParameters({ email })
      .getOne();
  }

  public async findByUsername(username: string): Promise<User> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.profileMedia', 'media')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.username = :username')
      .setParameters({ username })
      .getOne();
  }

  public async getAllUsers(page: number, limit: number, sortString: string, searchString?: string): Promise<UserDto[]> {
    const query = this.createQueryBuilder('user')
      .select([
        'user.id as "id"',
        'CONCAT(userDetail.first_name, " ", userDetail.last_name) as "name"',
        'user.email as "email"',
        'COUNT(bids.id) as "bidCount"',
        'subscriptions.type as "subscriptionType"',
        'subscriptions.is_trial as "subscriptionTrial"',
        'subscriptions.status as "subscriptionStatus"',
        'subscriptions.exp_date as "renewalDate"'
      ])
      .leftJoin('user.userDetail', 'userDetail')
      .leftJoin('user.subscriptions', 'subscriptions', 'subscriptions.deleted = false')
      .leftJoin('user.bids', 'bids', 'bids.deleted = false')
      .where('user.deleted = :deleted', { deleted: false })
      .groupBy('user.id, subscriptions.id');

    if (searchString) {
      const filter = '%' + (searchString || '') + '%';
      const searchId = Number(searchString);
      const possibleId = !isNaN(searchId) && Number.isInteger(searchId) ? searchId : 0;
      query.andWhere(
        new Brackets(sub => {
          sub.where(
            `CONCAT(userDetail.first_name, " ", userDetail.last_name) LIKE :filter OR user.email LIKE :filter`,
            { filter }
          );
          if (possibleId) {
            sub.orWhere(`user.id = :possibleId`, { possibleId }); // Search by id
          }
        })
      );
    }

    const [sortKey, sortValue] = sortString.split(' ');

    switch (sortKey) {
      default:
        query.orderBy({ [`${sortKey || 'id'}`]: sortValue || 'DESC' } as OrderByCondition);
        break;
    }

    query.limit(limit).offset(page * limit);

    return query.getRawMany();
  }

  public async getCount(searchString?: string): Promise<number> {
    const query = this.createQueryBuilder('user')
      .leftJoin('user.userDetail', 'userDetail')
      .where('user.deleted = :deleted', { deleted: false });
    if (searchString) {
      const filter = '%' + (searchString || '') + '%';
      const searchId = Number(searchString);
      const possibleId = !isNaN(searchId) && Number.isInteger(searchId) ? searchId : 0;
      query.andWhere(
        new Brackets(sub => {
          sub.where(
            `CONCAT(userDetail.first_name, " ", userDetail.last_name) LIKE :filter OR user.email LIKE :filter`,
            { filter }
          );
          if (possibleId) {
            sub.orWhere(`user.id = :possibleId`, { possibleId }); // Search by id
          }
        })
      );
    }

    return query.getCount();
  }

  public async getUser(currentUser: User, id: number): Promise<User> {
    //Solution with left join and map
    return this.createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.email', 'user.verified'])
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.profileMedia', 'media')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .where('user.id = :id', { id: id })
      .andWhere('user.deleted = :deleted', { deleted: false })
      .getOne();
  }
}
