const QRCode = require('qrcode');
export default class QrcodeService {
  static generateQRCode = async (text: string) => {
    try {
      const qrCode = await QRCode.toDataURL(text);
      return qrCode;
    } catch (err) {
      console.error(err);
    }
  };
}
