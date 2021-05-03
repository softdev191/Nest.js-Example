import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import { TokenRepository } from './repositories';
import { TokenService } from './services';
import { ConfigService } from '../config/config.service';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  public constructor(
    private readonly configService: ConfigService,
    private readonly tokenRepository: TokenRepository,
    private readonly tokenService: TokenService
  ) {}

  public async use(req: Request & { token?: any }, res: Response, next: Function) {
    let token = req.headers['authorization'];
    if (token !== undefined && token.split(' ')[0] === 'Bearer') {
      // Remove Bearer from string
      token = token.slice(7, token.length);
    }
    req.token = await this.tokenService.verify(token);

    if (req.token) {
      const whitelist = this.configService.get('token.accessToken.whitelist');
      if (whitelist) {
        // verified, but whitelist is enabled so need to verify whitelist
        const retval = await this.tokenRepository.findById(token);
        if (!retval) {
          req.token = null;
        }
      }
    }

    next();
  }
}
