const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ARTIFACT_DIR_ROOT = path.resolve('/.aistudio/artifacts/brain/e1c7671b-0aac-4384-a272-44a138494cd6');
const ARTIFACT_DIR_LOCAL = path.resolve('.aistudio/artifacts/brain/e1c7671b-0aac-4384-a272-44a138494cd6');
const TMP_DIR = '/tmp/neuralkey_video_build';

[ARTIFACT_DIR_ROOT, ARTIFACT_DIR_LOCAL, TMP_DIR].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.warn('Dir notice:', e.message);
  }
});

// Clean up any old screenshot PNGs from /public so prototype deployment stays 100% clean
[
  '1_applicant_submits_id_and_selfie.png',
  '2_gemini_analyzes_the_id.png',
  '3_reviewer_sees_flag_and_risk_summary.png',
  '4_credential_issued_after_approval.png',
].forEach((file) => {
  const p = path.resolve('public', file);
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
      console.log('Removed non-prototype file from public/:', file);
    } catch (e) {}
  }
});

const FPS = 10;
const CHAPTER_DURATION_SEC = 20; // 12 chapters * 20s = 240s (04:00 - exactly 4 minutes)
const TOTAL_DURATION_SEC = 240;

const CHAPTERS = [
  {
    id: 1,
    startSec: 0,
    timeRange: '0:00 – 0:20',
    title: 'Reviewer Console & ASEAN 40-ID Queue',
    subtitle: 'Live overview of the 40-applicant verification queue with country codes (KH, SG, MY, TH, ID).',
    voiceover:
      'Welcome to the Neuralkey Verification Assistant demonstration. Here in the Reviewer Console, compliance teams oversee forty real-world identity scenarios across ASEAN member states. Filtering by nation codes—such as KH for Cambodia or SG for Singapore—reveals instant queue triage.',
  },
  {
    id: 2,
    startSec: 20,
    timeRange: '0:20 – 0:40',
    title: 'ADK Multi-Agent Architecture & DID Specification',
    subtitle: 'Inspecting the 4-stage verification workflow and Dual-Branch did:neuralkey W3C specification.',
    voiceover:
      'Opening the Architecture modal illustrates our four-stage verification workflow powered by Google ADK. In the DID Specification view, our asymmetric did:neuralkey method operates with Branch A for offline Ed25519 proofs, and Branch B for online institutional trust anchors.',
  },
  {
    id: 3,
    startSec: 40,
    timeRange: '0:40 – 1:00',
    title: 'Applicant Wallet & Portable e-ID Credentials',
    subtitle: 'Managing self-sovereign digital identities and inspecting cryptographic DID status.',
    voiceover:
      'Switching to the Applicant Wallet tab demonstrates self-sovereign identity management. Navigating between verified citizens like Sok Chandara and Elena Rostova displays each applicant\'s cryptographic DID status, biometric assurance tier, and portable identity credential.',
  },
  {
    id: 4,
    startSec: 60,
    timeRange: '1:00 – 1:20',
    title: 'Interactive KYC Submission to Gemini 3.8 Flash',
    subtitle: 'Submitting synthetic ID presets through the 4-stage real-time Gemini multimodal pipeline.',
    voiceover:
      'Applicants can test real-time verification directly within the wallet. Loading a synthetic ID preset and clicking submit activates our four-stage multimodal pipeline: media processing, Gemini 3.8 Flash triage extraction, deterministic MRZ checks, and reviewer dispatch.',
  },
  {
    id: 5,
    startSec: 80,
    timeRange: '1:20 – 1:40',
    title: 'Multimodal Document & 3D Biometric Inspection',
    subtitle: 'Interactive forensic bounding boxes, UV security layer simulation, and 98.6% face match.',
    voiceover:
      'Returning to the Reviewer Console for Sok Chandara\'s Cambodian National ID, reviewers inspect interactive forensic bounding boxes. Toggling simulated ultraviolet illumination and three-D face mesh overlays confirms physical card integrity alongside a 98.6 percent biometric match.',
  },
  {
    id: 6,
    startSec: 100,
    timeRange: '1:40 – 2:00',
    title: 'Deterministic Field Cross-Check & MRZ Checksums',
    subtitle: 'Cross-referencing Declared Form Data, Visual Inspection Zone, and ICAO 9303 MRZ check digits.',
    voiceover:
      'In the Field Cross-Check tab, the engine correlates declared application data against the visual inspection zone and machine readable zone. All deterministic rules—including script transliteration and ICAO 9303 check digits—pass with zero discrepancies.',
  },
  {
    id: 7,
    startSec: 120,
    timeRange: '2:00 – 2:20',
    title: 'ELA Forensics, ADK Agent Trace & 40-ID Benchmarks',
    subtitle: 'Error Level Analysis heatmaps, 4-Agent Google ADK execution trace, and ground-truth metrics.',
    voiceover:
      'The Forensics and Liveness tab provides Error Level Analysis heatmaps and chip geometry checks. In the ADK Agent Pipeline tab, reviewers inspect our four specialist reasoning agents and verify the forty-ID ground-truth benchmark achieving 99.4 percent extraction accuracy.',
  },
  {
    id: 8,
    startSec: 140,
    timeRange: '2:20 – 2:40',
    title: 'Catching Synthetic Identity Fraud (Marcus A. Vance)',
    subtitle: 'Surfacing age-elevation fraud (1994 vs 1982 MRZ mismatch) and rejecting the application.',
    voiceover:
      'Selecting high-risk applicant Marcus Vance immediately surfaces a critical risk score of 89. Gemini catches synthetic age-elevation fraud where the printed birth year 1994 contradicts the MRZ-encoded year 1982. The reviewer promptly marks the submission as rejected.',
  },
  {
    id: 9,
    startSec: 160,
    timeRange: '2:40 – 3:00',
    title: 'Generative Deepfake Detection & Tier-2 Escalation',
    subtitle: 'Identifying facial boundary diffusion on Amira Chen Wei (Risk 64/100) and escalating.',
    voiceover:
      'Next, selecting applicant Amira Chen Wei reveals an elevated risk score of 64. While document checksums pass, our Fraud Signal Agent detects generative deepfake diffusion artifacts along the jawline with a sixty-one percent face match, prompting immediate escalation.',
  },
  {
    id: 10,
    startSec: 180,
    timeRange: '3:00 – 3:20',
    title: 'Approving KYC & Issuing W3C Verifiable Credential',
    subtitle: 'Approving verified applicant Elena Rostova and inspecting the signed Ed25519 W3C VC JSON payload.',
    voiceover:
      'Selecting low-risk applicant Elena Rostova, the reviewer verifies all integrity checks and clicks Approve and Issue Credential. Returning to the Applicant Wallet, her W3C Verifiable Credential is now active, backed by a cryptographic Ed25519 digital signature.',
  },
  {
    id: 11,
    startSec: 200,
    timeRange: '3:20 – 3:40',
    title: 'Tamper-Evident Audit Ledger & Relying Party Bank',
    subtitle: 'Inspecting SHA-256 hash-chained audit log and instant 140ms Zero-Knowledge Bank onboarding.',
    voiceover:
      'Every reviewer action is immutably recorded in our SHA-256 hash-chained Audit Ledger. Moving to the Relying Party Bank simulator, Apex Global Bank verifies Elena\'s credential in 140 milliseconds using Zero-Knowledge Proofs without exposing raw document numbers.',
  },
  {
    id: 12,
    startSec: 220,
    timeRange: '3:40 – 4:00',
    title: 'Multi-Device Responsive Architecture Across Portals',
    subtitle: 'Demonstrating responsive layout adaptation and zero-knowledge verification across portals.',
    voiceover:
      'Our architecture is built for seamless responsive operation across desktop, tablet, and mobile displays—with collapsible queues, flexible card stacks, and adaptive navigation across all three portals. Thank you for evaluating the Neuralkey Verification Assistant.',
  },
];

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateChapterAudio(ai, chapter, index) {
  const pcmPath = path.join(TMP_DIR, `ch_${index}_20s.pcm`);
  const wavPath = path.join(TMP_DIR, `ch_${index}_20s.wav`);

  if (fs.existsSync(pcmPath) && fs.existsSync(wavPath) && fs.statSync(pcmPath).size > 10000) {
    console.log(`✓ Reusing cached Gemini TTS voiceover for Chapter ${chapter.id}`);
    return wavPath;
  }

  if (ai) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: chapter.voiceover }] }],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });
        const b64 = res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (b64) {
          fs.writeFileSync(pcmPath, Buffer.from(b64, 'base64'));
          // Convert 24kHz 16-bit mono PCM to WAV and fit cleanly within 20.0s window
          execSync(
            `ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${pcmPath}" -af "apad=whole_dur=${CHAPTER_DURATION_SEC}" -t ${CHAPTER_DURATION_SEC} "${wavPath}"`,
            { stdio: 'ignore' }
          );
          console.log(`✓ Synthesized Gemini TTS voiceover for Chapter ${chapter.id} (20s)`);
          return wavPath;
        }
      } catch (err) {
        console.warn(`TTS attempt ${attempt} for Chapter ${chapter.id} notice:`, err.message);
        await delay(1200);
      }
    }
  }

  // Fallback clean warm tone + silence if TTS quota is reached
  execSync(
    `ffmpeg -y -f lavfi -i "sine=frequency=528:duration=0.25" -af "afade=t=out:st=0.05:d=0.2,volume=0.08,apad=whole_dur=${CHAPTER_DURATION_SEC}" -ar 24000 -ac 1 -t ${CHAPTER_DURATION_SEC} "${wavPath}"`,
    { stdio: 'ignore' }
  );
  return wavPath;
}

async function buildFullAudioTrack() {
  console.log('1/3 Generating 12-chapter voiceover narration audio track (04:00 / 240s)...');
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      })
    : null;

  const wavFiles = new Array(CHAPTERS.length);
  // Process in sequential batches with small delay to stay under rate limits
  for (let i = 0; i < CHAPTERS.length; i++) {
    const ch = CHAPTERS[i];
    wavFiles[i] = await generateChapterAudio(ai, ch, i);
    await delay(350);
  }

  const concatListPath = path.join(TMP_DIR, 'audio_concat_240s.txt');
  fs.writeFileSync(
    concatListPath,
    wavFiles.map((f) => `file '${f}'`).join('\n')
  );

  const voiceConcatWav = path.join(TMP_DIR, 'voice_concat_240s.wav');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${voiceConcatWav}"`,
    { stdio: 'ignore' }
  );

  // Mix with subtle warm ambient pad (-36dB) so silence between words feels natural
  const finalAudioWav = path.join(TMP_DIR, 'final_audio_240s.wav');
  execSync(
    `ffmpeg -y -i "${voiceConcatWav}" -f lavfi -i "sine=frequency=220:duration=${TOTAL_DURATION_SEC}" -filter_complex "[1:a]volume=0.012[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=0[aout]" -map "[aout]" -ar 24000 -ac 1 -t ${TOTAL_DURATION_SEC} "${finalAudioWav}"`,
    { stdio: 'ignore' }
  );
  console.log('✓ Full 240.0s (04:00) narration audio track ready.');
  return finalAudioWav;
}

// Injects only the presenter cursor and click ripple into the page.
// PER USER REQUIREMENTS:
// - Don't show up the slide number container at the bottom center of the video screen
// - Remove the minute counter at the top right
async function injectHudIntoPage(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-hud-root')) return;
    const root = document.createElement('div');
    root.id = 'demo-hud-root';
    root.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;';
    root.innerHTML = `
      <!-- Presenter Cursor & Click Ripple (Non-intrusive) -->
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

// Helper to find button/element by text, return its center coordinates, and click it
async function clickElementByText(page, selector, textIncludes) {
  return await page.evaluate(
    ({ sel, txt }) => {
      const els = Array.from(document.querySelectorAll(sel));
      const target = els.find((el) => el.innerText && el.innerText.includes(txt));
      if (target) {
        const rect = target.getBoundingClientRect();
        target.click();
        return {
          found: true,
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
        };
      }
      return { found: false, x: 640, y: 320 };
    },
    { sel: selector, txt: textIncludes }
  );
}

async function run() {
  const audioWavPath = await buildFullAudioTrack();
  const outMp4Path = path.join(ARTIFACT_DIR_ROOT, 'neuralkey_solution_demo_4m00s.mp4');
  const outMp4LocalPath = path.join(ARTIFACT_DIR_LOCAL, 'neuralkey_solution_demo_4m00s.mp4');
  // Also maintain 3m24s filename alias so existing downloads and links remain valid
  const legacyMp4Path = path.join(ARTIFACT_DIR_ROOT, 'neuralkey_solution_demo_3m24s.mp4');
  const legacyMp4LocalPath = path.join(ARTIFACT_DIR_LOCAL, 'neuralkey_solution_demo_3m24s.mp4');

  console.log('2/3 Launching browser & recording 12 interactive chapters (2,400 frames @ 10fps = 04:00)...');
  const browser = await puppeteer.launch({
    executablePath:
      '/tmp/chrome-shell/chrome-headless-shell/linux-155.0.8059.84/chrome-headless-shell-linux64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await delay(1000);
  await injectHudIntoPage(page);

  // Spawn FFmpeg process reading JPEG frames from stdin and muxing with the 240s audio track
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
    '23',
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
    let cursor = { x: 640, y: 340, ripple: false };
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
  // CHAPTER 1 (0:00 - 0:20): Reviewer Console & ASEAN 40-ID Queue (KH, SG, ALL)
  // =========================================================================
  console.log('Recording Chapter 1: Reviewer Console & ASEAN 40-ID Queue...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    return { x: 240, y: 180, ripple: false };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'KH');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'SG');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'All ASEAN');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // CHAPTER 2 (0:20 - 0:40): ADK Multi-Agent Architecture & DID Specification
  // =========================================================================
  console.log('Recording Chapter 2: ADK Multi-Agent Architecture & DID Spec...');
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'header button', 'About');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => {
      const modal = document.querySelector('.overflow-y-auto');
      if (modal) modal.scrollBy({ top: 320, behavior: 'instant' });
    });
    return { x: 640, y: 380, ripple: false };
  });
  await recordSubStep(5, async () => {
    // Close About modal and open DID Spec modal
    await clickElementByText(page, 'button', 'Return to');
    await delay(200);
    const c = await clickElementByText(page, 'header button', 'DID Spec');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Branch B');
    await delay(300);
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const close = closeBtns.find(
        (b) => b.innerText.includes('Close') || b.querySelector('svg.lucide-x')
      );
      if (close) close.click();
    });
    return { ...c, ripple: true };
  });

  // =========================================================================
  // CHAPTER 3 (0:40 - 1:00): Applicant Wallet & Portable e-ID Credentials
  // =========================================================================
  console.log('Recording Chapter 3: Applicant Wallet & Credentials...');
  await recordSubStep(5, async () => {
    await page.keyboard.press('Escape');
    const c = await clickElementByText(page, 'nav button', 'Applicant Wallet');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Elena Rostova');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Marcus A. Vance');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Sok Chandara');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // CHAPTER 4 (1:00 - 1:20): Interactive KYC Submission to Gemini 3.8 Flash
  // =========================================================================
  console.log('Recording Chapter 4: Interactive KYC Submission...');
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Submit ID');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Cambodia ID');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Submit to Gemini');
    await delay(300);
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await delay(1200);
    return { x: 800, y: 520, ripple: false };
  });

  // =========================================================================
  // CHAPTER 5 (1:20 - 1:40): Multimodal Document & 3D Biometric Inspection
  // =========================================================================
  console.log('Recording Chapter 5: Document & Biometrics Inspection...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'nav button', 'Reviewer Console');
    await delay(200);
    await clickElementByText(page, 'button', 'Sok Chandara');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'UV Light');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Liveness');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Standard');
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'instant' }));
    return { ...c, ripple: true };
  });

  // =========================================================================
  // CHAPTER 6 (1:40 - 2:00): Deterministic Field Cross-Check & MRZ Checksums
  // =========================================================================
  console.log('Recording Chapter 6: Deterministic Field Cross-Check & MRZ...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'button', 'Field Cross-Check');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'instant' }));
    return { x: 560, y: 340, ripple: false };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 220, behavior: 'instant' }));
    return { x: 560, y: 440, ripple: false };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    return { x: 640, y: 220, ripple: false };
  });

  // =========================================================================
  // CHAPTER 7 (2:00 - 2:20): ELA Forensics, ADK Agent Trace & 40-ID Benchmarks
  // =========================================================================
  console.log('Recording Chapter 7: Forensics & Benchmarks...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'button', 'Forensics & Liveness');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'ELA');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'ADK Agent Pipeline');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 280, behavior: 'instant' }));
    return { x: 580, y: 420, ripple: false };
  });

  // =========================================================================
  // CHAPTER 8 (2:20 - 2:40): Catching Synthetic Identity Fraud (Marcus A. Vance)
  // =========================================================================
  console.log('Recording Chapter 8: Marcus Vance Synthetic Identity Fraud...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'button', 'Marcus A. Vance');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Field Cross-Check');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Document & Biometrics');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Reject');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // CHAPTER 9 (2:40 - 3:00): Generative Deepfake Detection & Tier-2 Escalation
  // =========================================================================
  console.log('Recording Chapter 9: Deepfake Detection & Escalation...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'button', 'Amira Chen Wei');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 180, behavior: 'instant' }));
    return { x: 1020, y: 380, ripple: false };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Escalate');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await delay(300);
    return { x: 1020, y: 450, ripple: false };
  });

  // =========================================================================
  // CHAPTER 10 (3:00 - 3:20): Approving KYC & Issuing W3C Verifiable Credential
  // =========================================================================
  console.log('Recording Chapter 10: Human Approval & Credential Issuance...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'button', 'Elena Rostova');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'Approve & Issue');
    await delay(300);
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'nav button', 'Applicant Wallet');
    await delay(200);
    await clickElementByText(page, 'button', 'Credentials');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'button', 'View Raw W3C VC JSON');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // CHAPTER 11 (3:20 - 3:40): Tamper-Evident Audit Ledger & Relying Party Bank
  // =========================================================================
  console.log('Recording Chapter 11: Audit Ledger & Relying Party Bank...');
  await recordSubStep(5, async () => {
    await clickElementByText(page, 'button', 'Close');
    await delay(150);
    const c = await clickElementByText(page, 'header button', 'Audit Ledger');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('button'));
      const close = closeBtns.find((b) => b.querySelector('svg.lucide-x'));
      if (close) close.click();
    });
    await delay(150);
    const c = await clickElementByText(page, 'nav button', 'Relying Party Bank');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 220, behavior: 'instant' }));
    const c = await clickElementByText(page, 'button', 'Present Neuralkey VC');
    await delay(400);
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollBy({ top: 280, behavior: 'instant' }));
    const c = await clickElementByText(page, 'button', 'Branch B: Issuer');
    return { ...c, ripple: true };
  });

  // =========================================================================
  // CHAPTER 12 (3:40 - 4:00): Multi-Device Responsive Architecture Across Portals
  // PER USER REQUIREMENT:
  // - At 03:08 - 03:20 minute the screen was zoom in in a large scale that cause the screen become complex.
  // FIXED: Maintain 1280x720 standard viewport! No zoom-in, no scaling up!
  // =========================================================================
  console.log('Recording Chapter 12: Multi-Device Responsive Architecture...');
  await recordSubStep(5, async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    const c = await clickElementByText(page, 'nav button', 'Reviewer Console');
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    // Scroll smoothly through the reviewer console columns demonstrating the responsive grid
    await page.evaluate(() => window.scrollBy({ top: 240, behavior: 'smooth' }));
    return { x: 640, y: 360, ripple: false };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'nav button', 'Applicant Wallet');
    await page.evaluate(() => window.scrollTo(0, 0));
    return { ...c, ripple: true };
  });
  await recordSubStep(5, async () => {
    const c = await clickElementByText(page, 'nav button', 'Relying Party Bank');
    await page.evaluate(() => window.scrollTo(0, 0));
    return { ...c, ripple: true };
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
    `✓ Generated 4:00 MP4 video: ${outMp4Path} (${(stat.size / (1024 * 1024)).toFixed(2)} MB, ${totalFramesWritten} frames = ${(totalFramesWritten / FPS).toFixed(1)}s)`
  );

  try {
    fs.copyFileSync(outMp4Path, outMp4LocalPath);
    fs.copyFileSync(outMp4Path, legacyMp4Path);
    fs.copyFileSync(outMp4Path, legacyMp4LocalPath);
  } catch (e) {
    console.warn('Copy notice:', e.message);
  }

  console.log('3/3 Embedding 4:00 MP4 and chapter manifest into standalone Artifact HTML...');
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
      const content = fs.readFileSync(htmlFile, 'utf8');
      const updated = content.replace(
        /<!-- VIDEO_BASE64_PAYLOAD_START -->[\s\S]*?<!-- VIDEO_BASE64_PAYLOAD_END -->/,
        payloadBlock
      );
      fs.writeFileSync(htmlFile, updated, 'utf8');
      console.log('✓ Updated standalone artifact HTML:', htmlFile);
    }
  });

  console.log('Done! 04:00 video demonstration studio is ready in the Artifacts directory.');
}

run().catch((err) => {
  console.error('Error generating demo video:', err);
  process.exit(1);
});
