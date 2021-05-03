import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { User } from '../../base/entities/index';
import { RoleResolver } from '../../../guards/roles.guard';
import { BidService } from '../services/index';

@Injectable()
export class BidOwnerRole extends RoleResolver {
  public constructor(private readonly bidService: BidService) {
    super();
  }

  async resolve(user: User, request: Request): Promise<boolean> {
    const { query, params } = request;
    let isBidOwner = false;
    let userId = user ? user.id : null;

    if (!userId && query?.token) {
      const { sub: id } = jwt.decode(query.token);
      userId = parseInt(id, 10);
    }

    if (userId && params) {
      const bidId = parseInt(params.id, 10);
      isBidOwner = await this.bidService.isBidOwner(bidId, userId);
    }
    return isBidOwner;
  }
}
