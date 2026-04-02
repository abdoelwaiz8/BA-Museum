const puppeteer = require('puppeteer');

async function htmlToPdf(htmlContent) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Beri waktu render selesai sebelum print
    await new Promise(resolve => setTimeout(resolve, 800));

    const pdfBuffer = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin: {
        top:    '14mm',
        bottom: '14mm',
        left:   '22mm',   
        right:  '16mm',
      },
    });

    return pdfBuffer;

  } catch (err) {
    console.error('[pdfGenerator] ERROR:', err.message);
    console.error(err.stack);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { htmlToPdf };