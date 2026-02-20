const puppeteer = require('puppeteer');

/**
 * Konversi HTML string menjadi Buffer PDF menggunakan Puppeteer.
 * Format kertas: A4, orientasi portrait.
 *
 * @param {string} htmlContent - HTML lengkap yang akan dirender
 * @returns {Promise<Buffer>}  - Binary PDF siap dikirim sebagai response
 */
async function htmlToPdf(htmlContent) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',  // Penting untuk environment server/Docker
      ],
    });

    const page = await browser.newPage();

    // Load HTML langsung dari string (bukan URL)
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format:            'A4',
      printBackground:   true,
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