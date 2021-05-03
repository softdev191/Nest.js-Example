/* eslint-disable @typescript-eslint/camelcase */
import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { addSeconds } from 'date-fns';
import * as uuid from 'uuid';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class MediaService {
  public constructor(private readonly configService: ConfigService) {}

  public async getSignature(type: string, acl: string) {
    const awsConfig = this.configService.get('aws');

    const fileType = type.toLowerCase();
    if (['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(fileType)) {
      let fileExtension = '';
      let maxSize = 5242880; // default size
      let key = 'media/';
      switch (fileType) {
        case 'video/mov':
          fileExtension = 'mov';
          maxSize = 104857600;
          break; // increase size for videos
        case 'image/jpeg':
          fileExtension = 'jpeg';
          break;
        case 'image/jpg':
          fileExtension = 'jpg';
          break;
        case 'image/png':
          fileExtension = 'png';
          break;
        case 'image/gif':
          fileExtension = 'gif';
          break;
        case 'application/pdf':
          fileExtension = 'pdf';
          maxSize = 30000000;
          key = 'documents/';
          break;
        default:
          break;
      }
      const expirationLength = 900; // 15min
      const expirationDate = addSeconds(new Date(), expirationLength).toISOString();

      const policy = {
        expiration: expirationDate,
        conditions: [
          { bucket: awsConfig.s3.bucket },
          { acl: acl || 'private' },
          { success_action_status: '201' },
          ['starts-with', '$key', key],
          ['starts-with', '$Content-Type', fileType],
          ['content-length-range', 0, maxSize]
        ]
      };

      const base64Policy = Buffer.from(JSON.stringify(policy)).toString('base64'); // .replace(/\n|\r/, '');
      const hmac = crypto.createHmac('sha1', awsConfig.secretAccessKey);
      hmac.update(base64Policy);
      const encoding = 'base64';
      const signature = hmac.digest(encoding);

      // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
      const credentials = {
        expirationDate,
        uniqueFilePrefix: key + uuid.v1() + '-',
        AWSAccessKeyId: awsConfig.accessKeyId,
        success_action_status: '201',
        'Content-Type': fileType,
        policy: base64Policy,
        signature,
        bucket: awsConfig.s3.bucket
      };
      return credentials;
    } else {
      throw new BadRequestException('invalid fileType specified');
    }
  }
}
