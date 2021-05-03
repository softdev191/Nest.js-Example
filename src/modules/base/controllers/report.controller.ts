import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRole } from '../roles';
import { CurrentUser, Roles } from '../../../decorators';
import { ReportService } from '../services';
import { ReportCreateDto } from '../dtos';
import { User } from '../entities';

@ApiBearerAuth()
@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  public constructor(private readonly reportService: ReportService) {}

  @Roles(AuthenticatedRole)
  @Post()
  public async createReport(
    @CurrentUser()
    reporter: User,
    @Body()
    reportInfo: ReportCreateDto
  ) {
    return this.reportService.createReport(reportInfo, reporter);
  }
  //TO DO: implement reporting of non-user entities
}
