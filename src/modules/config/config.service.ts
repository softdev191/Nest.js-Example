import * as _ from 'lodash';
import * as Yup from 'yup';
import { Injectable } from '@nestjs/common';

Yup.addMethod(Yup.object, 's3BucketFormat', function(message) {
  return this.test('s3BucketTest', message, function(s3) {
    const { createError, path } = this;
    if (!s3 || !s3.bucket || !s3.bucketUrl) {
      return createError({ path, message: 'Error: Please check your AWS S3 Bucket entries in your config.json.' });
    }
    const [protocol, awsS3VirtualHost] = s3.bucketUrl.split('://') || '';
    if (protocol !== 'https') {
      return createError({
        path,
        message: 'Error: Please ensure your AWS S3 Bucket URL configuration uses secure HTTPS.'
      });
    } else if (awsS3VirtualHost.startsWith('s3.')) {
      // Path-style: this is deprecated and will no longer work
      return createError({
        path,
        message: 'Error: Please update your AWS S3 bucket URL configuration to virtual hosted-style.'
      });
    } else if (!awsS3VirtualHost.startsWith(`${s3.bucket}.`)) {
      return createError({
        path,
        message: 'Error: Please check whether your AWS S3 Bucket URL matches your bucket name.'
      });
    }

    return true;
  });
});

// config.json > aws
const awsS3ConfigSchema = Yup.object({
  s3: Yup.object({
    bucket: Yup.string().required(),
    bucketUrl: Yup.string().required()
  }).s3BucketFormat()
});

@Injectable()
export class ConfigService {
  private config;

  constructor() {
    // TODO support client config
    const profile = 'server';
    this.config = this.load(profile);
  }

  public load(profile) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    let config = require(`../../../config/${profile}/config.json`);

    const env = process.env.NODE_ENV || 'development';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const envConfig = require(`../../../config/${profile}/config.${env}.json`);
      config = _.merge(config, envConfig);
    } catch (e) {
      //
    }

    // iterate and replace any environment vars if necessary
    const traverse = (obj: any) => {
      _.forOwn(obj, (val, key) => {
        if (_.isArray(val)) {
          val.forEach(el => {
            traverse(el);
          });
        } else if (_.isObject(val)) {
          traverse(val);
        } else if (_.isString(val) && val.match(/^ENV\:/)) {
          const parts = val.split(':');
          const envkey = parts[1];
          if (process.env[envkey]) {
            obj[key] = process.env[envkey];
          }
        }
      });
    };
    traverse(config);

    config.aws = awsS3ConfigSchema.validateSync(config.aws);
    return config;
  }

  public get(path?: string) {
    if (!path) {
      return this.config;
    } else {
      return _.get(this.config, path);
    }
  }
}
