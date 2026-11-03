import QRCode from 'qrcode';

export async function generateMagazineQrCode(targetUrl) {
  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    const svg = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });

    return { dataUrl, svg, targetUrl };
  } catch (err) {
    console.error('[QR Generator] Error generating QR code:', err);
    return { dataUrl: null, svg: null, targetUrl };
  }
}

