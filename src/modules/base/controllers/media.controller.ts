import { Controller, Delete, Get, HttpCode, Post, Patch, Query, NotFoundException } from '@nestjs/common';
import { Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { InjectRepository } from '../../database/database.module';
import { Media } from '../entities';
import { MediaCreateDto, MediaUpdateDto } from '../dtos';
import { Roles } from '../../../decorators';
import { RequiredPipe } from '../../../pipes';
import { AuthenticatedRole, EveryoneRole } from '../roles';
import { MediaService } from '../services';

@ApiBearerAuth()
@ApiTags('Media')
@Controller('media')
export class MediaController {
  public constructor(
    private readonly mediaService: MediaService,
    @InjectRepository(Media) private readonly mediaRepository: Repository<Media>
  ) {}

  // CRUD related

  @Roles(AuthenticatedRole)
  @Get(':id([0-9]+)')
  public async getOne(
    @Param('id', ParseIntPipe)
    id: number
  ) {
    const media = await this.mediaRepository.findOne(id);
    if (!media) {
      throw new NotFoundException();
    }
    return media;
  }

  @Roles(EveryoneRole)
  @Post()
  public async create(
    @Body()
    media: MediaCreateDto
  ) {
    return await this.mediaRepository.save(media);
  }

  @Roles('Admin')
  @Patch(':id([0-9]+)')
  public async update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body()
    media: MediaUpdateDto
  ) {
    media.id = id;
    return this.mediaRepository.save(media);
  }

  @Roles('Admin')
  @Delete(':id([0-9]+)')
  @HttpCode(204)
  public async remove(@Param('id') id: number) {
    return this.mediaRepository.delete(id);
  }

  // Upload signing
  @Roles(EveryoneRole)
  @Get('signature')
  public async getSignature(
    @Query('type', RequiredPipe)
    type: string,
    @Query('acl', RequiredPipe)
    acl: string
  ) {
    return this.mediaService.getSignature(type, acl);
  }
}
