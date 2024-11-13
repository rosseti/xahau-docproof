const nodemailer = require("nodemailer");
import Handlebars from "handlebars";
import fs from "fs";
import * as path from 'path';


export class EmailService {
  private readonly transporter: any;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async loadTemplate(templatePath: string, variables: any): Promise<string> {
    const absolutePath = path.join(__dirname, '../templates/', templatePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    const template = Handlebars.compile(source);
    return template(variables);
  }

  async sendEmail(
    recipient: string,
    subject: string,
    body: string
  ): Promise<void> {
    const mailOptions = {
      from:
        process.env.SMTP_MAIL_FROM ||
        '"Xahau Docproof" <docproof@xahau.network>',
      to: recipient,
      subject,
      text: body.replace(/<\/?[^>]+(>|$)/g, ""),
      html: body,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
