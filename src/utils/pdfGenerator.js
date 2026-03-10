const puppeteer = require('puppeteer');

async function htmlToPdf(htmlContent) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--single-process',
        '--no-zygote',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin: {
        top:    '10mm',
        bottom: '10mm',
        left:   '0mm',
        right:  '0mm',
      },
    });

    return pdfBuffer;

  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { htmlToPdf };
