import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

import { ConfigService } from '../../config/config.service';

@Injectable()
export class EmailService {
  private _transport;

  constructor(private readonly configService: ConfigService) {}

  public async sendTemplate(from: string, to: string, subject: string, template: string, variables: any) {
    const params: any = {
      from,
      to,
      subject
    };
    const templatePath = process.cwd() + '/templates/emails';

    const textfile = path.resolve(templatePath, `${template}.txt.hbs`);
    try {
      const textHbs = await this.readFile(textfile);
      if (textHbs) {
        const textTemplate = handlebars.compile(textHbs);
        params.text = textTemplate(variables || {});
      }
    } catch (e) {
      // do nothing
    }
    try {
      const htmlfile = path.resolve(templatePath, `${template}.html.hbs`);
      const htmlHbs = await this.readFile(htmlfile);
      if (htmlHbs) {
        const htmlTemplate = handlebars.compile(htmlHbs);
        params.html = htmlTemplate(variables || {});
      }
    } catch (e) {
      // do nothing
    }

    return this.send(params);
  }

  public async send(params: any) {
    if (!this._transport) {
      const config = await this.configService.get('email');
      if (config.settings) {
        this._transport = nodemailer.createTransport(config.settings);
      }
    }

    if (this._transport) {
      return new Promise((resolve, reject) => {
        this._transport.sendMail(params, (error, info) => {
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        });
      });
    }
  }

  private async readFile(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
}
