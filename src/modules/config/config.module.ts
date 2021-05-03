import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

@Global()
@Module({
  exports: [ConfigService],
  providers: [ConfigService]
})
export class ConfigModule { }
