const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://sgr.unikin.ac.cd';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

const PAGES = [
  { name: '01-homepage-hero', url: '/', fullPage: false, viewport: { width: 1440, height: 900 } },
  { name: '02-homepage-full', url: '/', fullPage: true, viewport: { width: 1440, height: 900 } },
  { name: '03-login', url: '/login', fullPage: true, viewport: { width: 1440, height: 900 } },
  { name: '04-register', url: '/register', fullPage: false, viewport: { width: 1440, height: 900 } },
  { name: '05-guide-inscription', url: '/guide-inscription', fullPage: true, viewport: { width: 1440, height: 900 } },
  { name: '06-guide-soutenance', url: '/guide-soutenance', fullPage: true, viewport: { width: 1440, height: 900 } },
  { name: '07-contact', url: '/contact', fullPage: true, viewport: { width: 1440, height: 900 } },
  { name: '08-rendez-vous', url: '/rendez-vous', fullPage: true, viewport: { width: 1440, height: 900 } },
  { name: '09-forgot-password', url: '/forgot-password', fullPage: true, viewport: { width: 1440, height: 900 } },
  { name: '10-admin-login', url: '/admin/login', fullPage: true, viewport: { width: 1440, height: 900 } },
  // Mobile versions
  { name: '11-homepage-mobile', url: '/', fullPage: false, viewport: { width: 390, height: 844 } },
  { name: '12-login-mobile', url: '/login', fullPage: true, viewport: { width: 390, height: 844 } },
];

async function takeScreenshots() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const page of PAGES) {
    console.log(`Capturing: ${page.name} (${page.url})`);
    try {
      const tab = await browser.newPage();
      await tab.setViewport(page.viewport);
      await tab.goto(`${BASE_URL}${page.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000)); // Wait for animations
      
      const filePath = path.join(OUTPUT_DIR, `${page.name}.png`);
      await tab.screenshot({ path: filePath, fullPage: page.fullPage });
      console.log(`  ✓ Saved: ${filePath}`);
      await tab.close();
    } catch (err) {
      console.error(`  ✗ Failed: ${page.name} - ${err.message}`);
    }
  }

  // Now login as admin and take admin screenshots
  console.log('\nLogging in as admin...');
  try {
    const adminTab = await browser.newPage();
    await adminTab.setViewport({ width: 1440, height: 900 });
    
    // Navigate to admin login
    await adminTab.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    
    // Fill login form
    await adminTab.type('input[type="email"]', 'sg.recherche@unikin.ac.cd');
    await adminTab.type('input[type="password"]', 'Admin@SGR2026!');
    
    // Click submit
    await adminTab.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 5000));
    
    // Take admin dashboard screenshot
    const adminPages = [
      { name: '13-admin-dashboard', url: '/admin' },
      { name: '14-admin-etudiants', url: '/admin/etudiants' },
      { name: '15-admin-documents', url: '/admin/documents' },
      { name: '16-admin-rendez-vous', url: '/admin/rendez-vous' },
      { name: '17-admin-administrateurs', url: '/admin/administrateurs' },
      { name: '18-admin-parametres', url: '/admin/parametres' },
      { name: '19-admin-journal', url: '/admin/journal-activites' },
    ];
    
    for (const ap of adminPages) {
      console.log(`Capturing admin: ${ap.name} (${ap.url})`);
      try {
        await adminTab.goto(`${BASE_URL}${ap.url}`, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
        
        const filePath = path.join(OUTPUT_DIR, `${ap.name}.png`);
        await adminTab.screenshot({ path: filePath, fullPage: true });
        console.log(`  ✓ Saved: ${filePath}`);
      } catch (err) {
        console.error(`  ✗ Failed: ${ap.name} - ${err.message}`);
      }
    }
    
    await adminTab.close();
  } catch (err) {
    console.error(`Admin login failed: ${err.message}`);
  }

  // Login as student for dashboard screenshots
  console.log('\nLogging in as student...');
  try {
    const studentTab = await browser.newPage();
    await studentTab.setViewport({ width: 1440, height: 900 });
    
    await studentTab.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    
    // Try to find a student - we'll capture the login page at least
    const filePath = path.join(OUTPUT_DIR, '20-student-login-filled.png');
    await studentTab.screenshot({ path: filePath, fullPage: true });
    console.log(`  ✓ Saved: ${filePath}`);
    
    await studentTab.close();
  } catch (err) {
    console.error(`Student screenshots failed: ${err.message}`);
  }

  await browser.close();
  console.log('\n=== Screenshot capture complete ===');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  // List captured files
  const files = fs.readdirSync(OUTPUT_DIR);
  console.log(`\nCaptured ${files.length} screenshots:`);
  files.forEach(f => console.log(`  - ${f}`));
}

takeScreenshots().catch(console.error);
