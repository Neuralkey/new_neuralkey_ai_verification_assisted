const { chromium } = require('/root/.bun/install/cache/playwright-core@1.64.0-c17905f0d2f6a539@@@1');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const ARTIFACT_DIR_ROOT = path.resolve(__dirname, '../.aistudio/artifacts/brain/e1c7671b-0aac-4384-a272-44a138494cd6');
const ARTIFACT_DIR_LOCAL = path.resolve('.aistudio/artifacts/brain/e1c7671b-0aac-4384-a272-44a138494cd6');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const TMP_DIR = '/tmp/neuralkey_video_build';

[ARTIFACT_DIR_ROOT, ARTIFACT_DIR_LOCAL, PUBLIC_DIR, TMP_DIR].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.warn('Dir notice:', e.message);
  }
});

const FPS = 10;
const CHAPTER_DURATION_SEC = 15; // 12 chapters * 15s = 180s (03:00)
const TOTAL_DURATION_SEC = 180;

const CHAPTERS = [
  {
    id: 1,
    startSec: 0,
    timeRange: '0:00 – 0:15',
    title: 'Reviewer Console & ASEAN 40-ID Queue Filtering',
    subtitle: 'Overview of the 40-applicant verification queue with ASEAN country filters (Cambodia, Singapore, Malaysia, Thailand) and status filters.',
    voiceover:
      '[Your Voiceover Cue] Introduce NeuralKey Reviewer Console and filter the 40-applicant queue across ASEAN countries (Cambodia, Singapore, Malaysia, Thailand) and status views.',
  },
  {
    id: 2,
    startSec: 15,
    timeRange: '0:15 – 0:30',
    title: 'Mobile App — Step 01: Personal Details',
    subtitle: 'Switching to the Mobile App (Verify Your Identity) and completing Step 01 Personal Details.',
    voiceover:
      '[Your Voiceover Cue] Switch to the Mobile App tab. Show the 3 sequential verification steps and complete Step 01 Personal Details matching the official Cambodian National ID.',
  },
  {
    id: 3,
    startSec: 30,
    timeRange: '0:30 – 0:45',
    title: 'Mobile App — Step 02: Live ID Card Capture (Front & Back)',
    subtitle: 'Capturing the Front Side and Back Side (MRZ) of the government ID card via live camera stream.',
    voiceover:
      '[Your Voiceover Cue] Open Step 02 Photo of ID Card. Capture both the Front Side and the Back Side (ICAO 9303 MRZ band) using the live camera stream—file uploads are blocked.',
  },
  {
    id: 4,
    startSec: 45,
    timeRange: '0:45 – 1:00',
    title: 'Mobile App — Step 03: 4-Pose Active Biometric Face Scan',
    subtitle: 'Completing the 4 sequential active liveness challenges: Turn Head Left, Turn Head Right, Smile Naturally, and Blink.',
    voiceover:
      '[Your Voiceover Cue] Open Step 03 Face Scan and complete the 4 sequential active liveness challenges—Turn Head Left, Turn Head Right, Smile Naturally, and Blink.',
  },
  {
    id: 5,
    startSec: 60,
    timeRange: '1:00 – 1:15',
    title: 'Mobile App — Submitting Verification & Wallet Lock Screen',
    subtitle: 'Submitting the 3 completed steps, locking the mobile wallet during review, and inspecting Track status.',
    voiceover:
      '[Your Voiceover Cue] Tap Verify Identity to submit encrypted proofs. Show the Wallet Locked During Review screen and inspect Track activity confirming raw photos are auto-deleted after check.',
  },
  {
    id: 6,
    startSec: 75,
    timeRange: '1:15 – 1:30',
    title: 'Reviewer Console — Vision OCR & ROI Inspector (gemini-3.8-flash)',
    subtitle: 'Running Gemini 3.8 Flash analysis and inspecting the ID document under Normal, UV Light, and Contrast filters.',
    voiceover:
      '[Your Voiceover Cue] Return to the Reviewer Console to inspect Sok Chandara\'s Cambodian National ID in the Vision OCR & ROI Inspector. Run Gemini 3.8 Flash analysis and toggle UV Light and Contrast filters.',
  },
  {
    id: 7,
    startSec: 90,
    timeRange: '1:30 – 1:45',
    title: 'Details Check — 3-Way Information Comparison & MRZ Rules',
    subtitle: 'Comparing Submitted vs. Printed on ID vs. ID Security Band and verifying Automated Consistency Rules.',
    voiceover:
      '[Your Voiceover Cue] In Details Check, review the Information Comparison table cross-checking Submitted form data against Printed on ID text and the ID Security Band (MRZ), plus Automated Consistency Rules.',
  },
  {
    id: 8,
    startSec: 105,
    timeRange: '1:45 – 2:00',
    title: 'Photo Check — Optical & Template Forensics',
    subtitle: 'Inspecting ID Document Preview under UV Light and Contrast alongside Biometric Facial Comparison.',
    voiceover:
      '[Your Voiceover Cue] Switch to Photo Check to inspect the ID Document Preview with Optical & Template Forensics, UV luminescence simulation, and side-by-side biometric portrait matching.',
  },
  {
    id: 9,
    startSec: 120,
    timeRange: '2:00 – 2:15',
    title: 'Catching Tampered ID Fraud & Rejecting (Wallet Unlocks to Re-submit)',
    subtitle: 'Selecting tampered applicant Chhay Rathana, inspecting the name mismatch & bounding box, rejecting, and showing the unlocked re-submit banner.',
    voiceover:
      '[Your Voiceover Cue] Select tampered applicant Chhay Rathana. Gemini flags the Printed on ID vs. ID Security Band name mismatch with a numbered bounding box. Click Reject, unlocking the wallet to allow re-submission.',
  },
  {
    id: 10,
    startSec: 135,
    timeRange: '2:15 – 2:30',
    title: 'Catching Synthetic Portrait Manipulation & Escalating',
    subtitle: 'Selecting Amira Chen Wei Ling, inspecting facial contour tamper flags, escalating, and verifying extended wallet lock.',
    voiceover:
      '[Your Voiceover Cue] Select Amira Chen Wei Ling. Inspect the Tamper & Fraud Signal Detector bounding box around the portrait contour and click Escalate, keeping the wallet locked for specialist review.',
  },
  {
    id: 11,
    startSec: 150,
    timeRange: '2:30 – 2:45',
    title: 'Approving Genuine Applicant, Audit Log & Level 2 Trust Upgrade',
    subtitle: 'Approving Sok Chandara, inspecting the Review History (Audit Log), and verifying Level 2 (IAL2) upgrade in Mobile App.',
    voiceover:
      '[Your Voiceover Cue] Select Sok Chandara and click Approve. Inspect the Review History (Audit Log) recording all decisions, then open Mobile App to confirm the wallet unlocked and upgraded from Level 1 to Level 2.',
  },
  {
    id: 12,
    startSec: 165,
    timeRange: '2:45 – 3:00',
    title: 'Bank Portal — Instant 1-Click Account Opening with Level 2 Identity',
    subtitle: 'Switching to Apex Global Bank Portal and opening a bank account immediately using the verified Level 2 credential.',
    voiceover:
      '[Your Voiceover Cue] Switch to the Bank Portal at Apex Global Bank. With Sok Chandara verified at Level 2, select an account and click Open Account for instant one-click onboarding without re-uploading ID documents.',
  },
];

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildSilentAudioTrack() {
  console.log('1/3 Generating clean silent audio track (03:00 / 180s) for user voiceover...');
  const silentWav = path.join(TMP_DIR, 'silent_180s.wav');
  execSync(
    `ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t ${TOTAL_DURATION_SEC} "${silentWav}"`,
    { stdio: 'ignore' }
  );
  console.log('✓ Clean silent audio track ready (no AI voiceover).');
  return silentWav;
}

async function injectHudIntoPage(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-hud-root')) return;
    const root = document.createElement('div');
    root.id = 'demo-hud-root';
    root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;';
    root.innerHTML = `
      <div id="demo-cursor" style="
        position:fixed;left:640px;top:360px;
        width:22px;height:22px;
        margin-left:-11px;margin-top:-11px;
        border-radius:50%;
        background:rgba(56,189,248,0.35);
        border:2.5px solid #38bdf8;
        box-shadow:0 0 16px rgba(56,189,248,0.9);
        transition:none;
      ">
        <div style="position:absolute;left:50%;top:50%;width:6px;height:6px;margin-left:-3px;margin-top:-3px;border-radius:50%;background:#ffffff;"></div>
      </div>
      <div id="demo-ripple" style="
        position:fixed;left:640px;top:360px;
        width:48px;height:48px;
        margin-left:-24px;margin-top:-24px;
        border-radius:50%;
        border:2px solid #34d399;
        opacity:0;
      "></div>
    `;
    document.body.appendChild(root);
  });
}

async function updateHudState(page, { cursorX, cursorY, showRipple }) {
  await page.evaluate(
    ({ x, y, ripple }) => {
      const cursorEl = document.getElementById('demo-cursor');
      const rippleEl = document.getElementById('demo-ripple');
      if (cursorEl && typeof x === 'number' && typeof y === 'number') {
        cursorEl.style.left = `${x}px`;
        cursorEl.style.top = `${y}px`;
      }
      if (rippleEl && typeof x === 'number' && typeof y === 'number') {
        rippleEl.style.left = `${x}px`;
        rippleEl.style.top = `${y}px`;
        rippleEl.style.opacity = ripple ? '0.95' : '0';
      }
    },
    {
      x: cursorX,
      y: cursorY,
      ripple: Boolean(showRipple),
    }
  );
}

async function clickElementByText(page, selector, textIncludes) {
  return await page.evaluate(
    ({ sel, txt }) => {
      const els = Array.from(document.querySelectorAll(sel));
      const target = els.find((el) => el.innerText && el.innerText.includes(txt));
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'nearest' });
        const rect = target.getBoundingClientRect();
        target.click();
        return {
          found: true,
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
        };
      }
      return { found: false, x: 640, y: 360 };
    },
    { sel: selector, txt: textIncludes }
  );
}

async function clickSelector(page, selector) {
  return await page.evaluate((sel) => {
    const target = document.querySelector(sel);
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      const rect = target.getBoundingClientRect();
      target.click();
      return {
        found: true,
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
    }
    return { found: false, x: 640, y: 360 };
  }, selector);
}

async function run() {
  const audioWavPath = buildSilentAudioTrack();
  const outMp4Path = path.join(ARTIFACT_DIR_ROOT, 'neuralkey_solution_demo_4m00s.mp4');
  const outMp4LocalPath = path.join(ARTIFACT_DIR_LOCAL, 'neuralkey_solution_demo_4m00s.mp4');
  const legacyMp4Path = path.join(ARTIFACT_DIR_ROOT, 'neuralkey_solution_demo_3m24s.mp4');
  const legacyMp4LocalPath = path.join(ARTIFACT_DIR_LOCAL, 'neuralkey_solution_demo_3m24s.mp4');

  console.log('2/3 Launching browser & recording 12 scenes of current prototype (1,800 frames @ 10fps = 03:00, silent for user voiceover)...');
  const browser = await chromium.launch({
    executablePath:
      '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Inject synthetic live camera feed for Step 02 (ID Front/Back) and Step 03 (4-Pose Face Scan)
  await page.addInitScript(() => {
    if (!navigator.mediaDevices) navigator.mediaDevices = {};
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const isSelfie = JSON.stringify(constraints || {}).includes('user');
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      let tick = 0;
      setInterval(() => {
        tick++;
        if (isSelfie) {
          // Biometric face scan live viewfinder simulation
          const grad = ctx.createRadialGradient(320, 240, 40, 320, 240, 300);
          grad.addColorStop(0, '#1e293b');
          grad.addColorStop(1, '#090d16');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 640, 480);

          // Head & shoulders silhouette
          const sway = Math.sin(tick * 0.15) * 8;
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.ellipse(320 + sway, 420, 140, 90, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.ellipse(320 + sway, 220, 75, 95, 0, 0, Math.PI * 2);
          ctx.fill();

          // Facial alignment mesh points
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(235 + sway, 115, 170, 210);
          ctx.fillStyle = '#34d399';
          [
            [290 + sway, 195],
            [350 + sway, 195],
            [320 + sway, 230],
            [295 + sway, 265],
            [345 + sway, 265],
          ].forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
          // Government ID live camera capture simulation
          ctx.fillStyle = '#0c2238';
          ctx.fillRect(0, 0, 640, 480);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 4;
          ctx.strokeRect(28, 36, 584, 408);

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('KINGDOM OF CAMBODIA · NATIONAL IDENTITY CARD', 52, 82);

          // Portrait box on card
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(52, 110, 140, 175);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(52, 110, 140, 175);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '13px monospace';
          ctx.fillText('HOLDER NAME:', 216, 130);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText('SOK CHANDARA', 216, 158);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '13px monospace';
          ctx.fillText('ID NUMBER:', 216, 195);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 20px monospace';
          ctx.fillText('010892746(01)', 216, 222);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '13px monospace';
          ctx.fillText('DOB / EXPIRY:', 216, 255);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px monospace';
          ctx.fillText('1995-09-12 / 2033-09-12', 216, 280);

          // MRZ band
          ctx.fillStyle = '#020617';
          ctx.fillRect(44, 330, 552, 92);
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 19px monospace';
          ctx.fillText('IDKHM010892746<<<<<<<<<<<<<<', 60, 365);
          ctx.fillText('9509124M3309128KHM<<<<<<<<<<<2', 60, 400);

          const scanY = 40 + ((tick * 10) % 390);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.fillRect(32, scanY, 576, 4);
        }
      }, 50);
      return canvas.captureStream(25);
    };
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await delay(800);
  await injectHudIntoPage(page);

  const ffmpegArgs = [
    '-y',
    '-f',
    'image2pipe',
    '-vcodec',
    'mjpeg',
    '-framerate',
    String(FPS),
    '-i',
    '-',
    '-i',
    audioWavPath,
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '22',
    '-pix_fmt',
    'yuv420p',
    '-vf',
    'scale=1280:720',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    '-t',
    String(TOTAL_DURATION_SEC),
    outMp4Path,
  ];

  const ffmpegProc = spawn('ffmpeg', ffmpegArgs, { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffmpegErr = '';
  ffmpegProc.stderr.on('data', (chunk) => {
    ffmpegErr += chunk.toString();
  });

  let totalFramesWritten = 0;

  async function recordSubStep(durationSec, actionFn) {
    let cursor = { x: 640, y: 360, ripple: false };
    if (actionFn) {
      const res = await actionFn();
      if (res && typeof res.x === 'number') {
        cursor = { x: res.x, y: res.y, ripple: Boolean(res.ripple) };
      }
    }
    await injectHudIntoPage(page);
    await updateHudState(page, {
      cursorX: cursor.x,
      cursorY: cursor.y,
      showRipple: cursor.ripple,
    });
    const jpegBuf = await page.screenshot({ type: 'jpeg', quality: 90 });
    const framesToEmit = Math.round(durationSec * FPS);
    for (let f = 0; f < framesToEmit; f++) {
      const canWrite = ffmpegProc.stdin.write(jpegBuf);
      if (!canWrite) {
        await new Promise((resolve) => ffmpegProc.stdin.once('drain', resolve));
      }
      totalFramesWritten++;
    }
  }

  // =========================================================================
  // SCENE 1 (0:00 - 0:15): Reviewer Console & ASEAN 40-ID Queue Filtering
  // =========================================================================
  console.log('Recording Scene 1: Reviewer Console & ASEAN Queue Filtering...');
  await recordSubStep(3, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    return { x: 200, y: 210, ripple: false };
  });
  await recordSubStep(3, async () => {
    const c = await clickElementByText(page, 'button', 'Cambodia');
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    const c = await clickElementByText(page, 'button', 'Singapore');
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    const c = await clickElementByText(page, 'button', 'Malaysia');
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    const c = await clickElementByText(page, 'button', 'All Countries');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // SCENE 2 (0:15 - 0:30): Mobile App — Step 01 Personal Details
  // =========================================================================
  console.log('Recording Scene 2: Mobile App — Step 01 Personal Details...');
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'nav button', 'Mobile App');
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'div.cursor-pointer', 'Personal Details');
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    return { x: 640, y: 420, ripple: false };
  });
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'button', 'Save Profile & Continue');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // SCENE 3 (0:30 - 0:45): Mobile App — Step 02 Photo of ID Card (Front & Back)
  // =========================================================================
  console.log('Recording Scene 3: Mobile App — Step 02 Photo of ID Card...');
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'div.cursor-pointer', 'Photo of ID Card');
    await delay(400);
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    // Capture Front Side
    const c = await clickSelector(page, 'button[title="Take Picture"]');
    await delay(300);
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    // Show Back Side viewfinder ready
    return { x: 640, y: 420, ripple: false };
  });
  await recordSubStep(4, async () => {
    // Capture Back Side -> returns to /verify with Step 02 checked
    const c = await clickSelector(page, 'button[title="Take Picture"]');
    await delay(300);
    return { ...c, ripple: true };
  });

  // =========================================================================
  // SCENE 4 (0:45 - 1:00): Mobile App — Step 03 4-Pose Active Face Scan
  // =========================================================================
  console.log('Recording Scene 4: Mobile App — Step 03 4-Pose Face Scan...');
  await recordSubStep(3, async () => {
    const c = await clickElementByText(page, 'div.cursor-pointer', 'Face Scan');
    await delay(400);
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    // Pose 1: Turn Head Left
    const c = await clickElementByText(page, 'button', 'Capture');
    await delay(200);
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    // Pose 2: Turn Head Right
    const c = await clickElementByText(page, 'button', 'Capture');
    await delay(200);
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    // Pose 3: Smile Naturally
    const c = await clickElementByText(page, 'button', 'Capture');
    await delay(200);
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    // Pose 4: Blink -> Completes & returns to /verify ("Ready to Submit")
    const c = await clickElementByText(page, 'button', 'Capture');
    await delay(300);
    return { ...c, ripple: true };
  });

  // =========================================================================
  // SCENE 5 (1:00 - 1:15): Mobile App — Submitting & Wallet Lock Screen
  // =========================================================================
  console.log('Recording Scene 5: Submitting Verification & Wallet Lock Screen...');
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'button', 'Verify identity');
    await delay(350);
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    // Wait for submission to complete and Wallet Locked During Review screen to appear
    await delay(2600);
    return { x: 640, y: 360, ripple: false };
  });
  await recordSubStep(4, async () => {
    // Click Track button on Lock Screen
    const c = await clickElementByText(page, 'button', 'Track');
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    // Click Back to return to Wallet Lock Screen
    const c = await clickElementByText(page, 'button', 'Back');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // SCENE 6 (1:15 - 1:30): Reviewer Console — Vision OCR & ROI Inspector
  // =========================================================================
  console.log('Recording Scene 6: Reviewer Console — Vision OCR & ROI Inspector...');
  await recordSubStep(4, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'nav button', 'Reviewer Console');
    await delay(250);
    await clickElementByText(page, 'button', 'Sok Chandara');
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'button', 'Run Gemini Analysis');
    await delay(400);
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'button', 'UV Light');
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    await clickElementByText(page, 'button', 'Contrast');
    await delay(150);
    const c = await clickElementByText(page, 'button', 'Normal');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // SCENE 7 (1:30 - 1:45): Details Check — 3-Way Information Comparison
  // =========================================================================
  console.log('Recording Scene 7: Details Check — Information Comparison...');
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Details Check');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 240, behavior: 'instant' }));
    return { x: 640, y: 420, ripple: false };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'instant' }));
    return { x: 640, y: 500, ripple: false };
  });

  // =========================================================================
  // SCENE 8 (1:45 - 2:00): Photo Check — Optical & Template Forensics
  // =========================================================================
  console.log('Recording Scene 8: Photo Check — Optical & Template Forensics...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 220));
    const c = await clickElementByText(page, 'button', 'Photo Check');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const btns = await page.evaluate(() => {
      const allUv = Array.from(document.querySelectorAll('button')).filter((b) =>
        b.innerText.includes('UV Light')
      );
      const target = allUv[allUv.length - 1];
      if (target) {
        const r = target.getBoundingClientRect();
        target.click();
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
      }
      return { x: 640, y: 360 };
    });
    return { ...btns, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 260, behavior: 'instant' }));
    return { x: 640, y: 460, ripple: false };
  });

  // =========================================================================
  // SCENE 9 (2:00 - 2:15): Catching Tampered ID Fraud & Rejecting
  // =========================================================================
  console.log('Recording Scene 9: Catching Tampered ID Fraud & Rejecting...');
  await recordSubStep(4, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await clickElementByText(page, 'button', 'Details Check');
    const c = await clickElementByText(page, 'button', 'Chhay Rathana');
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'instant' }));
    return { x: 640, y: 380, ripple: false };
  });
  await recordSubStep(4, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'button', 'Reject');
    await delay(250);
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    // Show unlocked wallet with Rejection Banner ("Submission Rejected — Please Re-submit")
    const c = await clickElementByText(page, 'nav button', 'Mobile App');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // SCENE 10 (2:15 - 2:30): Catching Portrait Manipulation & Escalating
  // =========================================================================
  console.log('Recording Scene 10: Catching Portrait Manipulation & Escalating...');
  await recordSubStep(4, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await clickElementByText(page, 'nav button', 'Reviewer Console');
    await delay(200);
    const c = await clickElementByText(page, 'button', 'Amira Chen Wei Ling');
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    return { x: 1020, y: 360, ripple: false };
  });
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'button', 'Escalate');
    await delay(250);
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    return { x: 1020, y: 420, ripple: false };
  });

  // =========================================================================
  // SCENE 11 (2:30 - 2:45): Approving Genuine Applicant, Audit Log & Level 2
  // =========================================================================
  console.log('Recording Scene 11: Approving Sok Chandara, Audit Log & Level 2 Upgrade...');
  await recordSubStep(4, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'button', 'Sok Chandara');
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'button', 'Approve');
    await delay(300);
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'button', 'Review History');
    await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'instant' }));
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'nav button', 'Mobile App');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // SCENE 12 (2:45 - 3:00): Bank Portal — Instant 1-Click Account Opening
  // =========================================================================
  console.log('Recording Scene 12: Bank Portal — Instant 1-Click Account Opening...');
  await recordSubStep(4, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'nav button', 'Bank Portal');
    return { ...c, ripple: true };
  });
  await recordSubStep(3, async () => {
    const c = await clickElementByText(page, 'button', 'Business Account');
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    const c = await clickElementByText(page, 'button', 'Open Account');
    await delay(900);
    return { ...c, ripple: true };
  });
  await recordSubStep(4, async () => {
    return { x: 640, y: 520, ripple: false };
  });

  ffmpegProc.stdin.end();
  await new Promise((resolve, reject) => {
    ffmpegProc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${ffmpegErr.slice(-500)}`));
    });
  });

  await browser.close();

  const stat = fs.statSync(outMp4Path);
  console.log(
    `✓ Generated 03:00 silent MP4 video of current prototype: ${outMp4Path} (${(stat.size / (1024 * 1024)).toFixed(2)} MB, ${totalFramesWritten} frames = ${(totalFramesWritten / FPS).toFixed(1)}s)`
  );

  try {
    fs.copyFileSync(outMp4Path, outMp4LocalPath);
    fs.copyFileSync(outMp4Path, legacyMp4Path);
    fs.copyFileSync(outMp4Path, legacyMp4LocalPath);
  } catch (e) {
    console.warn('Copy notice:', e.message);
  }

  console.log('3/3 Embedding silent MP4 and storyboard chapter manifest into standalone Artifact HTML...');
  const videoB64 = fs.readFileSync(outMp4Path).toString('base64');
  const payloadBlock = `<!-- VIDEO_BASE64_PAYLOAD_START -->
  <script id="videoPayloadScript">
    window.VIDEO_BASE64 = "${videoB64}";
    window.CHAPTER_MANIFEST = ${JSON.stringify(CHAPTERS, null, 2)};
  </script>
  <!-- VIDEO_BASE64_PAYLOAD_END -->`;

  [
    path.join(ARTIFACT_DIR_ROOT, 'demo_video_submission.html'),
    path.join(ARTIFACT_DIR_LOCAL, 'demo_video_submission.html'),
  ].forEach((htmlFile) => {
    if (fs.existsSync(htmlFile)) {
      let content = fs.readFileSync(htmlFile, 'utf8');
      content = content
        .replace(/04:00/g, '03:00')
        .replace(/240\.0s/g, '180.0s')
        .replace(/With AI Voiceover/g, 'Video Only · Ready for Your Voiceover')
        .replace(/Synchronized AI Voiceover Included/g, 'Silent Video Only · Ready for Your Voiceover');
      const updated = content.replace(
        /<!-- VIDEO_BASE64_PAYLOAD_START -->[\s\S]*?<!-- VIDEO_BASE64_PAYLOAD_END -->/,
        payloadBlock
      );
      fs.writeFileSync(htmlFile, updated, 'utf8');
      console.log('✓ Updated standalone artifact HTML:', htmlFile);
    }
  });

  console.log('Done! Silent MP4 video of the current prototype is ready in the Artifacts directory.');
}

run().catch((err) => {
  console.error('Error generating demo video:', err);
  process.exit(1);
});
