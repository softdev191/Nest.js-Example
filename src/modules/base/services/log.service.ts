import * as bunyan from 'bunyan';
import { LoggerService } from '@nestjs/common';

export class LogService implements LoggerService {
  private logger;

  constructor() {
    const packageJSON = require('../../../../package.json');
    this.logger = bunyan.createLogger({ name: packageJSON.name || 'app' });
  }

  public log(message: string) {
    this.logger.info(message);
  }

  public error(message: string, trace: string) {
    this.logger.error(message, trace);
  }

  public warn(message: string) {
    this.logger.warn(message);
  }
}
