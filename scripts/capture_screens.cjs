const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR_ROOT = path.resolve('/.aistudio/artifacts/brain/e1c7671b-0aac-4384-a272-44a138494cd6');
const ARTIFACT_DIR_LOCAL = path.resolve('.aistudio/artifacts/brain/e1c7671b-0aac-4384-a272-44a138494cd6');
const PUBLIC_DIR = path.resolve('public');

[ARTIFACT_DIR_ROOT, ARTIFACT_DIR_LOCAL, PUBLIC_DIR].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.warn('Could not create dir:', dir, e.message);
  }
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching browser for prototype screen captures...');
  const browser = await puppeteer.launch({
    executablePath: '/app/applet/chrome/chrome/linux-155.0.8059.79/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(1200);

  const saveScreenshots = async (baseName) => {
    const publicPath = path.join(PUBLIC_DIR, `${baseName}.png`);
    await page.screenshot({ path: publicPath, fullPage: false });

    // Copy to artifact directories
    const pathsToCopy = [
      path.join(ARTIFACT_DIR_LOCAL, `${baseName}.png`),
      path.join(ARTIFACT_DIR_ROOT, `${baseName}.png`)
    ];
    for (const p of pathsToCopy) {
      try {
        fs.copyFileSync(publicPath, p);
      } catch (err) {
        console.warn('Artifact copy notice:', err.message);
      }
    }
    console.log(`Saved screenshot: ${baseName}.png (size: ${fs.statSync(publicPath).size} bytes)`);
  };

  // ==========================================
  // IMAGE 1: Applicant submits an ID and selfie
  // ==========================================
  console.log('--- Capturing 1: Applicant submits an ID and selfie ---');
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const walletBtn = navButtons.find(b => b.innerText.includes('Applicant Wallet'));
    if (walletBtn) walletBtn.click();
  });
  await delay(1000);

  // In the mobile phone frame, click "Submit ID"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitTab = buttons.find(b => b.innerText.trim() === 'Submit ID');
    if (submitTab) submitTab.click();
  });
  await delay(1000);
  await saveScreenshots('1_applicant_submits_id_and_selfie');

  // ==========================================
  // IMAGE 2: Gemini analyzes the ID
  // ==========================================
  console.log('--- Capturing 2: Gemini analyzes the ID ---');
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const consoleBtn = navButtons.find(b => b.innerText.includes('Reviewer Console'));
    if (consoleBtn) consoleBtn.click();
  });
  await delay(1000);

  // Ensure Elena Rostova is selected
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const elenaBtn = buttons.find(b => b.innerText.includes('Elena Rostova'));
    if (elenaBtn) elenaBtn.click();
  });
  await delay(800);

  // Switch to "Forensics & Liveness" tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const forensicsBtn = buttons.find(b => b.innerText.includes('Forensics & Liveness'));
    if (forensicsBtn) forensicsBtn.click();
  });
  await delay(1000);
  await saveScreenshots('2_gemini_analyzes_the_id');

  // ==========================================
  // IMAGE 3: Reviewer sees the flag and risk summary
  // ==========================================
  console.log('--- Capturing 3: Reviewer sees the flag and risk summary ---');
  // Click on Marcus A. Vance (the high-risk synthetic flag case)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const marcusBtn = buttons.find(b => b.innerText.includes('Marcus'));
    if (marcusBtn) marcusBtn.click();
  });
  await delay(1000);

  // Scroll directly so the Gemini Risk Panel & Fraud Signals are in prominent view
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    const riskHeader = elements.find(el => el.innerText && el.innerText.includes('Gemini Risk & Fraud Assessment'));
    if (riskHeader) {
      riskHeader.scrollIntoView({ behavior: 'instant', block: 'center' });
    } else {
      window.scrollBy({ top: 450, behavior: 'instant' });
    }
  });
  await delay(1000);
  await saveScreenshots('3_reviewer_sees_flag_and_risk_summary');

  // ==========================================
  // IMAGE 4: Credential issued after approval
  // ==========================================
  console.log('--- Capturing 4: Credential issued after approval ---');
  // Scroll back to top
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await delay(400);

  // Select Elena Rostova
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const elenaBtn = buttons.find(b => b.innerText.includes('Elena Rostova'));
    if (elenaBtn) elenaBtn.click();
  });
  await delay(800);

  // Click "Approve & Issue Credential"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const approveBtn = buttons.find(b => b.innerText && (b.innerText.includes('Approve & Issue') || b.innerText.includes('Approve')));
    if (approveBtn) approveBtn.click();
  });
  await delay(1500);

  // Go to Applicant Wallet to view the verified issued credential in the phone
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const walletBtn = navButtons.find(b => b.innerText.includes('Applicant Wallet'));
    if (walletBtn) walletBtn.click();
  });
  await delay(1000);

  // Ensure Credentials tab is active inside the phone
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const credTab = buttons.find(b => b.innerText.trim() === 'Credentials');
    if (credTab) credTab.click();
  });
  await delay(1000);
  await saveScreenshots('4_credential_issued_after_approval');

  console.log('All 4 distinct prototype workflow screenshots captured successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
