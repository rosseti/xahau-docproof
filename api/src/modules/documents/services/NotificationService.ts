import { EmailService } from "@/modules/email/services/EmailService";
import { IUserDocument } from "../models/UserDocument";
import { Xumm } from "xumm";

export class NotificationService {
  private emailService: EmailService;
  private xummService: Xumm;

  constructor() {
    this.emailService = new EmailService();
    this.xummService = new Xumm(process.env.NEXT_PUBLIC_XAMAN_API_KEY || "", process.env.XAMAN_SECRET_KEY || "");
  }

  async notifyPushNotification(userToken: string, subtitle: string, body: string): Promise<void> {
    await this.xummService.push?.notification(
      {
        user_token: userToken,
        subtitle,
        body,
    })
  }

  async notifySignersForReview(document: IUserDocument): Promise<void> {
    
    const normalizedSigners = document.signers.map(signer => {
      return { email: signer.email, signed: signer.signed }; // Cria um novo objeto sem protótipos herdados
    });

    console.log(normalizedSigners);

    for (const signer of document.signers) {

      const signingLink = `${process.env.XAPP_URL}sign/${document.id}/${signer.id}`;
      const emailSubject = `Review and Sign: ${document.name}`;
      //const emailBody = `Hello ${signer.email}, please review and sign the document: <a href="${signingLink}">${signingLink}</a>`;
      const emailBody = await this.emailService.loadTemplate('review_and_sign.html',        
        {
          app_url: process.env.XAPP_URL,
          email: signer.email,
          doc_name: document.name,
          link: signingLink,
          signers: normalizedSigners
      });

      await this.emailService.sendEmail(signer.email, emailSubject, emailBody);
    }
  }
}
