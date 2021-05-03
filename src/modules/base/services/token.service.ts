import { Injectable, ForbiddenException, GoneException } from '@nestjs/common';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as path from 'path';
import * as dateFns from 'date-fns';

import { Token, User } from '../entities';
import { TokenRepository } from '../repositories';
import { ConfigService } from '../../config/config.service';
import { UserTokensDto, TokenClaimDto } from '../dtos';

@Injectable()
export class TokenService {
  private privateKey: string;
  private publicKey: string;
  private config;

  public constructor(private readonly tokenRepository: TokenRepository, private readonly configService: ConfigService) {
    this.privateKey = fs.readFileSync(path.resolve(__dirname, '../../../../config/server/private.key'), 'utf8');
    this.publicKey = fs.readFileSync(path.resolve(__dirname, '../../../../config/server/public.key'), 'utf8');
    this.config = this.configService.get('token');
  }

  public async generateNewTokens(user: User): Promise<UserTokensDto> {
    const tokens = new UserTokensDto();
    tokens.refreshToken = await this.generateNewRefeshToken(user);
    tokens.accessToken = await this.generateNewAccessToken(user);

    return tokens;
  }

  public setTokenExpiration(tokenConfig: any): Date {
    let expiration = new Date();
    expiration = dateFns.addYears(expiration, tokenConfig.ttl.years || 0);
    expiration = dateFns.addMonths(expiration, tokenConfig.ttl.months || 0);
    expiration = dateFns.addDays(expiration, tokenConfig.ttl.days || 0);
    expiration = dateFns.addHours(expiration, tokenConfig.ttl.hours || 0);
    expiration = dateFns.addMinutes(expiration, tokenConfig.ttl.minutes || 0);
    expiration = dateFns.addSeconds(expiration, tokenConfig.ttl.seconds || 0);
    expiration = dateFns.addMilliseconds(expiration, tokenConfig.ttl.milliseconds || 0);
    return expiration;
  }

  public async generateNewRefeshToken(user: User): Promise<string> {
    const token = new Token();
    token.expiration = this.setTokenExpiration(this.config.refreshToken);
    token.user = user;
    token.id = await this.generateTokenId(token, 'refreshToken');
    const refreshToken = token.id;

    await this.tokenRepository.saveAsHash(token);
    return refreshToken;
  }

  public async generateNewAccessToken(user: User): Promise<string> {
    const token = new Token();
    token.expiration = this.setTokenExpiration(this.config.accessToken);
    token.user = user;
    token.id = await this.generateTokenId(token, 'accessToken');
    const accessToken = token.id;

    if (this.config.accessToken.whitelist) {
      await this.tokenRepository.saveAsHash(token);
    }

    return accessToken;
  }

  public async generateNewUserVerificationToken(user: User): Promise<string> {
    const token = new Token();
    token.expiration = this.setTokenExpiration(this.config.userVerificationToken);
    token.user = user;
    token.id = await this.generateTokenId(token, 'userVerificationToken');
    const userVerificationToken = token.id;

    await this.tokenRepository.saveAsHash(token);
    return userVerificationToken;
  }

  public async generateNewPasswordResetToken(user: User): Promise<string> {
    const token = new Token();
    token.expiration = this.setTokenExpiration(this.config.passwordResetToken);
    token.user = user;
    token.id = await this.generateTokenId(token, 'passwordResetToken');
    const passwordResetToken = token.id;

    await this.tokenRepository.saveAsHash(token);
    return passwordResetToken;
  }

  private async generateTokenId(token: Token, type: string): Promise<string> {
    return jwt.sign(
      {
        sub: token.user.id,
        name: token.user.username,
        roles: token.user.roles,
        exp: token.expiration.getTime() / 1000,
        type
      },
      this.privateKey,
      this.config.signOptions
    );
  }

  public async issueNewTokens(token: TokenClaimDto): Promise<UserTokensDto> {
    if (token && token.type === 'refreshToken') {
      const userToken = await this.tokenRepository.findById(token.tokenString);
      if (userToken) {
        return await this.generateNewTokens(userToken.user);
      }
    }
    throw new ForbiddenException();
  }

  public async verify(token: string): Promise<TokenClaimDto | null> {
    let tokenClaim;
    try {
      tokenClaim = jwt.verify(token, this.publicKey, this.config.verifyOptions);
    } catch (error) {
      return null;
    }
    return { ...tokenClaim, tokenString: token };
  }

  public async verifySavedToken(tokenString: string): Promise<Token> {
    const token = await this.verify(tokenString);
    if (!token) {
      throw new GoneException();
    }
    const savedToken = await this.tokenRepository.findById(token.tokenString);
    if (!savedToken) {
      throw new GoneException();
    }

    return savedToken;
  }
}
