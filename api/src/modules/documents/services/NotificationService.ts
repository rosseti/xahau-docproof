import { EmailService } from "@/modules/email/services/EmailService";
import { IUserDocument } from "../models/UserDocument";

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async notifySignersForReview(document: IUserDocument): Promise<void> {
    for (const signer of document.signers) {
      const signingLink = `${process.env.APP_URL}sign/${document.id}/${signer.id}`;
      const emailSubject = `Review and Sign: ${document.name}`;
      const emailBody = `Hello ${signer.email}, please review and sign the document: <a href="${signingLink}">${signingLink}</a>`;

      await this.emailService.sendEmail(signer.email, emailSubject, emailBody);
    }
  }
}
