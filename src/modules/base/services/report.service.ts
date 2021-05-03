import {
  BadRequestException,
  HttpService,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common';
import { Workbook } from 'exceljs';
import { Repository } from 'typeorm';
import * as archiver from 'archiver';
import * as AWS from 'aws-sdk';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';
import { isNil } from 'lodash';
import { format } from 'date-fns';

import { InjectRepository } from '../../database/database.module';
import { Report, User } from '../entities';
import { ReportCreateDto } from '../dtos';
import { Bid, BidPricing, Plans, ProjectDetails } from '../../bid/entities';
import { DivisionValue, Inspections, InspectionType, ProjectCoverParams, ProjectEstimateDto } from '../../bid/dtos';
import {
  BidPricingSelection,
  Division,
  DivisionDescriptions,
  DivisionNames,
  EstimateKeys,
  EstimateTemplateCell,
  ExcelSheetName,
  InspectionDescriptions
} from '../../bid/enums';
import { UserRepository } from '../repositories';
import { StateService } from './state.service';
import { BidPricingRepository } from '../../bid/repositories';
import Printer = require('pdfmake');
import { ConfigService } from '../../config/config.service';

const printer = new Printer({
  OpenSans: {
    normal: path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'fonts', 'OpenSans-Regular.ttf'),
    bold: path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'fonts', 'OpenSans-Bold.ttf')
  }
});
const images = {
  bgPattern: path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'images', 'header-pattern.png'),
  footerPattern: path.resolve(__dirname, '..', '..', '..', '..', 'assets', 'images', 'footer-pattern.png')
};

@Injectable()
export class ReportService {
  public constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly userRepository: UserRepository,
    private readonly stateService: StateService,
    private readonly bidPricingRepository: BidPricingRepository,
    private readonly configService: ConfigService,
    private httpService: HttpService
  ) {}

  public async createReport(reportInfo: ReportCreateDto, reporter: User) {
    const report = new Report();
    report.reporter = reporter;

    try {
      report.user = new User();
      report.user.id = reportInfo.userId;
      return await this.reportRepository.save(report);
    } catch (e) {
      if (e.code === 'ER_NO_REFERENCED_ROW_2' || e.code === 'ER_NO_REFERENCED_ROW') {
        throw new NotFoundException('User does not exist.');
      } else {
        throw e;
      }
    }
  }

  public async downloadBidEstimatePDF(bid: Bid, estimate: ProjectEstimateDto, res: any): Promise<void> {
    if (!bid) {
      throw new NotFoundException('No bid was found for generating report.');
    }
    const { divisions, inspections, totalCost, daysToComplete, profitMargin } = estimate;
    const { profileMedia } = bid.user;
    const { mediumUrl = '', largeUrl = '', originalUrl = '' } = profileMedia || {};
    const fileURL = mediumUrl || largeUrl || originalUrl;
    let companyLogo;
    if (fileURL) {
      // getting signed url of image from s3 before downloading with httpModule
      const awsConfig = this.configService.get('aws');
      AWS.config.update({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
        region: awsConfig.region,
        s3ForcePathStyle: true
      });
      const S3 = new AWS.S3();
      if (!awsConfig.s3.bucketUrl) {
        throw new InternalServerErrorException('S3 bucket url is missing');
      }
      const fileKey = fileURL.split(awsConfig.s3.bucketUrl)[1];
      const signedURL = S3.getSignedUrl('getObject', {
        Bucket: awsConfig.s3.bucket,
        Key: fileKey
      });
      const result = await this.httpService
        .get(signedURL, {
          responseType: 'arraybuffer'
        })
        .toPromise();
      companyLogo = Buffer.from(result.data, 'base64');
    }
    const pricing = await this.bidPricingRepository.findByBidId(bid.id);

    const genDate = new Date();
    const genDateText = format(genDate, 'yyyy-MMM-dd HH:MM');
    const descriptions = DivisionDescriptions(bid);
    const estimates = Object.values(Division).map(key => {
      const div = key as Division;
      const divEstimate = (divisions as DivisionValue)[div];
      const divEstimateFormatted = isNil(divEstimate)
        ? '-'
        : this.adjustEstimateCost(divEstimate, totalCost, pricing).toLocaleString(undefined, {
            minimumFractionDigits: 2
          });
      return {
        division: DivisionNames[div],
        description: descriptions[div],
        cost: divEstimateFormatted
      };
    });

    estimates.push({
      division: '',
      description: 'Profit/Margin',
      cost: this.adjustEstimateCost(profitMargin, totalCost, pricing).toLocaleString(undefined, {
        minimumFractionDigits: 2
      })
    });

    const finalDaysToComplete =
      pricing && pricing.selected === BidPricingSelection.LOW
        ? pricing.lowSchedule
        : pricing.selected === BidPricingSelection.HIGH
        ? pricing.highSchedule
        : daysToComplete;
    const finalTotalCost =
      pricing && pricing.selected === BidPricingSelection.LOW
        ? pricing.lowCost
        : pricing.selected === BidPricingSelection.HIGH
        ? pricing.highCost
        : totalCost;

    const divisionTable = estimates.map(row => [
      row.division,
      row.description,
      { text: `$${row.cost}`, alignment: 'right' }
    ]);

    let doc: any;
    try {
      doc = printer.createPdfKitDocument({
        info: {
          title: `${bid.name} Bid Estimate`,
          author: 'BidVita',
          subject: `${bid.name} Bid Estimate`
        },
        pageMargins: [70, 80, 70, 110],
        background: (currentPage: number) =>
          currentPage === 1 && {
            image: 'bgPattern',
            fit: [396, 387],
            alignment: 'right',
            margin: [0, 20, 20, 0]
          },
        header: (currentPage: number) => {
          if (currentPage < 5) {
            return currentPage === 1
              ? { text: 'Powered by BidVita', style: 'poweredByTitle' }
              : {
                  stack: [
                    { text: 'Powered by BidVita', style: 'poweredByTitle' },
                    {
                      margin: [70, 0],
                      columns: [
                        { text: bid.name, bold: true, margin: [0, 8] },
                        companyLogo
                          ? {
                              image: 'companyLogo',
                              width: 85,
                              alignment: 'right'
                            }
                          : null
                      ]
                    }
                  ]
                };
          }
        },
        footer: (currentPage: number, pageCount: number) => {
          const footerContent = {
            columns: [
              {
                text: '© 2020 Bidvita. All Rights Reserved.',
                style: 'footer',
                margin: [70, currentPage === 1 ? 0 : -10, 70, 0]
              },
              {
                text: `Page ${currentPage} of ${pageCount}\n${genDateText}`,
                alignment: 'right',
                style: 'footer',
                margin: [70, currentPage === 1 ? 0 : -10, 70, 0]
              }
            ]
          };

          return currentPage === 1
            ? { stack: [{ text: '', margin: [0, 0, 15, 75] }, footerContent] }
            : {
                stack: [
                  { image: 'footerPattern', width: 270, alignment: 'right', margin: [0, -50, 15, 0] },
                  footerContent
                ]
              };
        },
        content: [
          { text: bid.name, style: 'title' },
          {
            stack: [
              {
                text: `${bid.address.addressLine1} ${bid.address.addressLine2}`,
                style: 'address'
              },
              { text: `${bid.address.city}, ${bid.address.state.abbreviation} ${bid.address.zip}`, style: 'address' },
              {
                text: `$${finalTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                style: 'totalEstimate'
              }
            ]
          },
          companyLogo ? { image: 'companyLogo', width: 85, margin: 0 } : null,
          {
            stack: [
              { text: 'Company Name', style: 'subheader' },
              {
                columns: [
                  {
                    width: 'auto',
                    stack: ['Contact', 'Phone', 'Email', 'Address', ''],
                    bold: true,
                    fontSize: 12,
                    lineHeight: 1
                  },
                  {
                    width: 'auto',
                    stack: [
                      `${bid.user.userDetail.firstName} ${bid.user.userDetail.lastName}`,
                      bid.user.userDetail.phone,
                      {
                        text: bid.user.email,
                        link: `mailto:${bid.user.email}`
                      },
                      `${bid.address.addressLine1} ${bid.address.addressLine2}`,
                      `${bid.address.city}, ${bid.address.state.abbreviation} ${bid.address.zip}`
                    ],
                    fontSize: 12,
                    lineHeight: 1
                  }
                ],
                columnGap: 10,
                pageBreak: 'after'
              }
            ]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto'],
              body: [
                [
                  { text: 'Div', bold: true },
                  { text: 'Description', bold: true },
                  {
                    text: 'Cost',
                    alignment: 'right',
                    bold: true
                  }
                ],
                ...divisionTable
              ]
            },
            layout: {
              hLineWidth: (rowIndex: number, node: any) =>
                rowIndex === 0 || rowIndex === node.table.body.length ? 0.7 : 0,
              vLineWidth: (rowIndex: number, node: any) =>
                rowIndex === 0 || rowIndex === node.table.widths.length ? 0.7 : 0,
              paddingLeft: () => 14,
              paddingRight: (rowIndex: number) => (rowIndex === 2 ? 14 : 0),
              paddingTop: () => 6,
              paddingBottom: () => 6,
              fillColor: (rowIndex: any) => (rowIndex % 2 === 0 ? '#ececec' : null)
            }
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*'],
              body: [
                [
                  { text: 'Project Cost Total', bold: true },
                  {
                    text: `$${finalTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    alignment: 'right',
                    bold: true
                  }
                ]
              ]
            },
            layout: {
              defaultBorder: false,
              paddingLeft: () => 14,
              paddingRight: () => 14,
              paddingTop: () => 12,
              paddingBottom: () => 8
            }
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*'],
              body: [
                [
                  { text: 'Number of days to complete the project', bold: true },
                  {
                    text: finalDaysToComplete,
                    alignment: 'right',
                    bold: true
                  }
                ]
              ]
            },
            layout: {
              defaultBorder: false,
              paddingLeft: () => 14,
              paddingRight: () => 14,
              paddingTop: () => 0,
              paddingBottom: () => 8
            }
          },
          {
            table: {
              widths: ['auto', '*'],
              body: [
                [
                  'Total Inspections',
                  {
                    text: inspections.totalInspections,
                    alignment: 'right'
                  }
                ],
                [
                  'Rough Inspections',
                  {
                    text: inspections.roughInspections,
                    alignment: 'right'
                  }
                ],
                [
                  'Final Inspections',
                  {
                    text: inspections.finalInspections,
                    alignment: 'right'
                  }
                ],
                [
                  'Final Building inspection from Fire Department',
                  {
                    text: inspections.fireDeptInspections,
                    alignment: 'right'
                  }
                ]
              ]
            },
            layout: {
              defaultBorder: false,
              paddingLeft: () => 14,
              paddingRight: () => 14,
              paddingTop: () => -2,
              paddingBottom: () => 0
            },
            pageBreak: 'after'
          },
          { text: 'Qualifications & Exclusions', style: 'subheader' },
          {
            separator: ')',
            ol: [
              {
                text: 'All Permits, mall, and city (building & health) fees are by Owner/Client.',
                margin: [0, 3]
              },
              { text: 'All Utilities are tapped into unit and Utility fees are by Owner/Client.', margin: [0, 3] },
              {
                text: 'Any/All Construction Deposit by Management/Landlord is carried by Owner/Client.',
                margin: [0, 3]
              },
              {
                text: 'All special inspections fees are excluded.',
                margin: [0, 3]
              },
              { text: 'All Barricades/fencings are excluded.', margin: [0, 3] },
              {
                text: 'Owner/Client will absorb all architect (design/drawing) and engineering costs.',
                margin: [0, 3]
              },
              {
                text: 'All structural engineering and upgrades are excluded.',
                margin: [0, 3]
              },
              { text: 'All earthwork excluded.', margin: [0, 3] },
              {
                text: 'Excludes all unforeseen and hazardous materials/conditions and its removal and disposal.',
                margin: [0, 3]
              },
              {
                text: 'All building/unit exterior work – facade/parking/roof/landscaping/others works are excluded.',
                margin: [0, 3]
              },
              {
                text: 'All foundation/footing (beam, column & other) work are excluded.',
                margin: [0, 3]
              },
              { text: 'Fire Protection (Fire Sprinkler and Alarm) costs are generalized in the bid.', margin: [0, 3] },
              {
                text:
                  'Walk-in cooler/freezer and Kitchen equipment’s are excluded. Owner/Client vendor Furnish and install.',
                margin: [0, 3]
              },
              {
                text: 'All grease trap/grease interceptor work and materials are excluded.',
                margin: [0, 3]
              },
              { text: 'All furnitures & end fixtures are owner furnish and GC install.', margin: [0, 3] }
            ],
            pageBreak: 'after'
          },
          {
            text:
              'Thank you for the opportunity to bid on your project. It is a privilege and honor to construct your project. We look forward to providing the highest value. Please don’t hesitate to reach out to us.',
            fontSize: 12,
            margin: [0, 30]
          },
          { text: 'Signature', style: 'subheader', margin: [0, 90, 0, 0] },
          {
            stack: [
              {
                text: 'Company Name',
                style: 'subheader'
              },
              {
                columns: [
                  {
                    width: 'auto',
                    stack: ['Contact', 'Phone', 'Email', 'Address', ''],
                    bold: true,
                    fontSize: 12,
                    lineHeight: 1
                  },
                  {
                    width: 'auto',
                    stack: [
                      `${bid.user.userDetail.firstName} ${bid.user.userDetail.lastName}`,
                      bid.user.userDetail.phone,
                      {
                        text: bid.user.email,
                        link: `mailto:${bid.user.email}`
                      },
                      `${bid.address.addressLine1} ${bid.address.addressLine2}`,
                      `${bid.address.city}, ${bid.address.state.abbreviation} ${bid.address.zip}`
                    ],
                    lineHeight: 1,
                    fontSize: 12
                  }
                ],
                columnGap: 10
              }
            ]
          }
        ],
        images: { ...images, companyLogo },
        styles: {
          poweredByTitle: { margin: [70, 20, 0, 20], fontSize: 8 },
          title: { fontSize: 32, bold: true, margin: [0, 120, 0, 95] },
          footer: { margin: [70, 0, 70, -10], fontSize: 8 },
          subheader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
          address: { fontSize: 15, margin: [0, -10, 0, 5] },
          totalEstimate: { fontSize: 15, margin: [0, 15, 0, companyLogo ? 50 : 80] }
        },
        defaultStyle: { fontSize: 10, font: 'OpenSans', lineHeight: 1.2 }
      });
      doc.end();

      const filename = `BidVita-Estimate_${bid.name}-${genDate.toLocaleDateString()}.pdf`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      doc.pipe(res);
    } catch (error) {
      console.error('ERROR PRINTING:', error);
      throw new UnprocessableEntityException(error);
    }
  }

  public async downloadBidCoverPreviewPDF(coverParams: ProjectCoverParams, res: any): Promise<void> {
    const { token, ...bid } = coverParams;

    const { sub: id } = jwt.decode(token);
    const user = await this.userRepository.findOne({ id: Number(id) });
    if (!user) {
      throw new NotFoundException();
    }

    const genDate = new Date();
    const genDateText = format(genDate, 'yyyy-MMM-dd HH:MM');

    const state = await this.stateService.findById(Number(bid.state));
    if (!state) {
      throw new BadRequestException('Invalid state provided.');
    }

    // TODO: put the doc object from downloadBidEstimatePDF() into one const and reuse here for consistency.
    const doc = printer.createPdfKitDocument({
      info: {
        title: `${bid.name} Bid Estimate`,
        author: 'BidVita',
        subject: `${bid.name} Bid Estimate`
      },
      pageMargins: [70, 120, 70, 110],
      background: (currentPage: number) =>
        currentPage === 1 && {
          image: 'bgPattern',
          fit: [396, 387],
          alignment: 'right',
          margin: [0, 20, 20, 0]
        },
      header: (currentPage: number) =>
        currentPage === 1
          ? { text: 'Powered by BidVita', style: 'poweredByTitle' }
          : {
              stack: [
                { text: 'Powered by BidVita', style: 'poweredByTitle' },
                {
                  margin: [70, 0],
                  columns: [
                    { text: bid.name, bold: true, margin: [0, 12] },
                    { image: 'companyLogo', width: 85, alignment: 'right' }
                  ]
                }
              ]
            },
      footer: (currentPage: number, pageCount: number) => {
        const footerContent = {
          columns: [
            {
              text: '© 2020 Bidvita. All Rights Reserved.',
              style: 'footer',
              margin: [70, currentPage === 1 ? 0 : -10, 70, 0]
            },
            {
              text: `Page ${currentPage} of ${pageCount}\n${genDateText}`,
              alignment: 'right',
              style: 'footer',
              margin: [70, currentPage === 1 ? 0 : -10, 70, 0]
            }
          ]
        };

        return currentPage === 1
          ? { stack: [{ text: '', margin: [0, 0, 15, 75] }, footerContent] }
          : {
              stack: [
                { image: 'footerPattern', width: 270, alignment: 'right', margin: [0, -50, 15, 0] },
                footerContent
              ]
            };
      },
      content: [
        { text: bid.name, style: 'title' },
        {
          stack: [
            { text: `${bid.addressLine1} ${bid.addressLine2}`, style: 'address' },
            { text: `${bid.city}, ${state.abbreviation} ${bid.zip}`, style: 'address' },
            { text: '$ (TOTAL ESTIMATE)', style: 'totalEstimate' }
          ]
        },
        { image: 'companyLogo', width: 85, margin: [0, 10, 0, 0] },
        {
          stack: [
            { text: 'Company Name', style: 'subheader' },
            {
              columns: [
                {
                  width: 'auto',
                  stack: ['Contact', 'Phone', 'Email', 'Address', ''],
                  bold: true,
                  fontSize: 12,
                  lineHeight: 1
                },
                {
                  width: 'auto',
                  stack: [
                    `${user.userDetail.firstName} ${user.userDetail.lastName}`,
                    user.userDetail.phone,
                    { text: user.email, link: `mailto:${user.email}` },
                    `${bid.addressLine1} ${bid.addressLine2}`,
                    `${bid.city}, ${state.abbreviation} ${bid.zip}`
                  ],
                  fontSize: 12,
                  lineHeight: 1
                }
              ],
              columnGap: 10
            }
          ]
        }
      ],
      images,
      styles: {
        poweredByTitle: { margin: [70, 20, 0, 20], fontSize: 8 },
        title: { fontSize: 32, bold: true, margin: [0, 120, 0, 95] },
        footer: { margin: [70, 0, 70, -10], fontSize: 8 },
        subheader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
        address: { fontSize: 15, margin: [0, -10, 0, 5] },
        totalEstimate: { fontSize: 15, margin: [0, 15, 0, 80] }
      },
      defaultStyle: { fontSize: 10, font: 'OpenSans', lineHeight: 1.2 }
    });
    doc.end();

    const filename = `Cover-Preview_${bid.name}-${genDate.toLocaleDateString()}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);
  }

  public async downloadBidPricingXLS(
    bid: Bid,
    details: ProjectDetails,
    estimate: ProjectEstimateDto,
    pricing: BidPricing,
    res: any
  ) {
    const { divisions, inspections } = estimate;

    try {
      const genDate = new Date();
      const fileName = `BidVita-Pricing-${bid.name}-${genDate.toLocaleDateString()}.xlsx`;
      res.set('filename', fileName);
      res.set('Content-Disposition', `attachment; filename="${fileName}"`);

      const filePath = process.cwd() + '/templates/pricing/BIDVITA-Pricing-template';
      const excelFile = await new Workbook().xlsx.readFile(`${filePath}.xlsx`);

      const estimateWorksheet = excelFile.getWorksheet(ExcelSheetName.TEMPLATE_ESTIMATE);
      const descriptions = DivisionDescriptions(bid);

      Object.keys(estimate).map(key => {
        if (!['divisions', 'inspections'].includes(key)) {
          const fieldKey = key as EstimateKeys;
          const fieldValue = (estimate as ProjectEstimateDto)[key];
          if (fieldKey === EstimateKeys.TOTAL_COST) {
            const finalValue =
              pricing && pricing.selected === BidPricingSelection.LOW
                ? pricing.lowCost
                : pricing.selected === BidPricingSelection.HIGH
                ? pricing.highCost
                : fieldValue;
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).value = finalValue;
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).numFmt = '"$"#,##0.00';
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).alignment = {
              vertical: 'top',
              horizontal: 'right'
            };
          } else if (fieldKey === EstimateKeys.DAYS_TO_COMPLETE) {
            const finalValue =
              pricing && pricing.selected === BidPricingSelection.LOW
                ? pricing.lowSchedule
                : pricing.selected === BidPricingSelection.HIGH
                ? pricing.highSchedule
                : fieldValue;
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).value = finalValue;
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).numFmt = '"$"#,##0.00';
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
          } else {
            const toAdjustValues = [EstimateKeys.PROFIT_MARGIN, EstimateKeys.COST_PER_SQ];
            const value = toAdjustValues.includes(fieldKey)
              ? this.adjustEstimateCost(fieldValue, estimate.totalCost, pricing)
              : fieldValue;
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).value = value;
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).numFmt = '"$"#,##0.00';
            estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).alignment = {
              vertical: 'top',
              horizontal: 'right'
            };
          }
        }
      });

      Object.keys(divisions).map((key, i) => {
        const div = key as Division;
        const divEstimate = (divisions as DivisionValue)[div];
        const formatDivisionValue = isNil(divEstimate)
          ? 0.0
          : this.adjustEstimateCost(divEstimate, estimate.totalCost, pricing);
        estimateWorksheet.getCell(`C${i + 5}`).value = descriptions[div];
        estimateWorksheet.getCell(`D${i + 5}`).value = formatDivisionValue;
        estimateWorksheet.getCell(`D${i + 5}`).numFmt = '"$"#,##0.00';
        estimateWorksheet.getCell(`D${i + 5}`).alignment = { vertical: 'top', horizontal: 'right' };
      });

      let index = 0;
      Object.keys(inspections).map(key => {
        const fieldKey = key as InspectionType;
        const inspectionValue = (inspections as Inspections)[fieldKey];
        if (fieldKey === InspectionType.TOTAL_INSPECTION) {
          estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).value = inspectionValue;
          estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).numFmt = '##';
          estimateWorksheet.getCell(EstimateTemplateCell[fieldKey]).alignment = {
            vertical: 'top',
            horizontal: 'center'
          };
        }
        if (inspectionValue !== 0 && fieldKey !== InspectionType.TOTAL_INSPECTION) {
          estimateWorksheet.getCell(
            `D${index + 32}`
          ).value = `${InspectionDescriptions[fieldKey]} - ${inspectionValue}`;
          estimateWorksheet.getCell(`D${index + 32}`).alignment = { vertical: 'top', horizontal: 'left' };
          estimateWorksheet.getCell(`D${index + 32}`).numFmt = '##';
          index++;
        }
      });

      await excelFile.xlsx.write(res);
    } catch (err) {
      console.log(err);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
      res.send(err);
    }
  }

  public async downloadBidPlans(bid: Bid, plans: Plans[], res: any) {
    const awsConfig = this.configService.get('aws');
    AWS.config.update({
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region,
      s3ForcePathStyle: true
    });
    const S3 = new AWS.S3();

    if (!awsConfig.s3.bucketUrl) {
      throw new InternalServerErrorException('S3 bucket url is missing');
    }

    if (plans.length > 0) {
      const archive = new archiver.create('zip');
      archive.on('error', err => {
        throw new Error(err);
      });

      plans.map(file => {
        const fileKey = file.url.split(awsConfig.s3.bucketUrl)[1];
        const stream = S3.getObject({ Bucket: awsConfig.s3.bucket, Key: fileKey }).createReadStream();
        archive.append(stream, { name: file.filename });
      });

      archive.finalize();
      const fileName = `${bid.name}-plans.zip`;
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
      archive.pipe(res);
    }
  }

  private adjustEstimateCost(value: number, totalCost: number, pricing?: BidPricing): number {
    const adjustEstimateByCost = (value: number, selected: BidPricingSelection) => {
      let retVal;
      if (selected === BidPricingSelection.LOW) {
        retVal = value * (totalCost < 1000000 ? 0.83 : totalCost < 2000000 ? 0.88 : 0.94);
        return Math.round(retVal * 100) / 100;
      } else {
        retVal = value * (totalCost < 500000 ? 1.17 : totalCost < 1000000 ? 1.12 : 1.07);
        return Math.round(retVal * 100) / 100;
      }
    };

    if (pricing && (pricing.selected === BidPricingSelection.LOW || pricing.selected === BidPricingSelection.HIGH)) {
      return adjustEstimateByCost(value, pricing.selected);
    } else {
      return value;
    }
  }
}
