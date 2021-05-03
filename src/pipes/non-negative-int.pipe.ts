import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class NonNegativeIntPipe implements PipeTransform<any> {
  public async transform(value: any, metadata: ArgumentMetadata) {
    if (value !== undefined) {
      if (isNaN(value) || value < 0 || !Number.isInteger(Number(value))) {
        throw new BadRequestException('Parameter may only be a non-negative integer');
      }
    }
    return value;
  }
}
