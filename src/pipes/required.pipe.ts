import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class RequiredPipe implements PipeTransform<any> {
  public async transform(value, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException(`Missing required parameter: ${metadata.type}[${metadata.data}]`);
    }
    return value;
  }
}
