const puppeteer = require('puppeteer');
const path = require('path');

async function convertToPDF() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, '..', 'docs', 'DOCUMENTATION_SGR_UNIKIN.html');
  const pdfPath = path.resolve(__dirname, '..', 'docs', 'DOCUMENTATION_SGR_UNIKIN.pdf');

  console.log('Loading HTML file:', htmlPath);
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  // Wait a bit for fonts to load
  await new Promise(r => setTimeout(r, 2000));

  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; font-size: 9px; color: #9ca3af; text-align: center; padding: 0 20mm;">
        <span>SGR-UNIKIN — Documentation Technique</span>
        <span style="float: right;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
    preferCSSPageSize: false
  });

  console.log('PDF generated successfully:', pdfPath);
  await browser.close();
}

convertToPDF().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
