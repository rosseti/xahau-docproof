const QRCode = require('qrcode');
export default class QrcodeService {
  static generateQRCode = async (text: string) => {
    try {
      return await QRCode.toDataURL(text);
    } catch (err) {
      console.error(err);
    }
  };
}
