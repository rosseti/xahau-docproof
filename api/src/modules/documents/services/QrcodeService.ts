const QRCode = require('qrcode');
export default class QrcodeService {
  static generateQRCode = async (text: string) => {
    try {
      const qrCode = await QRCode.toDataURL(text);
      console.log("QR Code gerado como Base64:");
      console.log(qrCode); // Você pode usar isso como uma tag `<img src="data:image/png;base64,...">`

      return qrCode;
    } catch (err) {
      console.error(err);
    }
  };
}
