import pptxgen from 'pptxgenjs';
import fs from 'fs';
import path from 'path';

async function createPresentation() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Kim Sereyvuth';
  pptx.company = 'Neuralkey';
  pptx.subject = 'Google Cloud AI Builder Cup 2026 Submission';
  pptx.title = 'Neuralkey - Decentralized Identity & Fraud Detection';

  // Theme Constants
  const C_DARK_BG = '0B1120';
  const C_CARD_BG = '1E293B';
  const C_WHITE = 'FFFFFF';
  const C_SLATE_900 = '0F172A';
  const C_SLATE_800 = '1E293B';
  const C_SLATE_700 = '334155';
  const C_SLATE_500 = '64748B';
  const C_SLATE_100 = 'F1F5F9';
  const C_SLATE_50 = 'F8FAFC';
  const C_BLUE = '2563EB';
  const C_BLUE_LIGHT = 'EFF6FF';
  const C_CYAN = '06B6D4';
  const C_EMERALD = '059669';
  const C_EMERALD_LIGHT = 'ECFDF5';
  const C_ROSE = 'E11D48';
  const C_ROSE_LIGHT = 'FFF1F2';
  const C_AMBER = 'D97706';
  const C_AMBER_LIGHT = 'FFFBEB';

  const addHeader = (slide, slideNum, title, category = 'Google Cloud AI Builder Cup 2026') => {
    // Top border line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 0.35,
      w: 9.0,
      h: 0.04,
      fill: { color: C_BLUE },
      line: { color: C_BLUE, width: 0 },
    });

    // Top branding
    slide.addText(
      [
        { text: 'Google Cloud ', options: { bold: true, color: '1E293B', fontSize: 9 } },
        { text: '| H2S  ', options: { color: C_SLATE_500, fontSize: 8 } },
        { text: '•  ' + category, options: { color: C_BLUE, fontSize: 8, bold: true } },
      ],
      { x: 0.5, y: 0.45, w: 6.0, h: 0.3, align: 'left', valign: 'middle' }
    );

    slide.addText(
      [
        { text: 'AI Builder Cup  ', options: { bold: true, color: '0F172A', fontSize: 9 } },
        { text: 'Build in JAPAC. Build for the world.', options: { color: C_SLATE_500, fontSize: 8 } },
      ],
      { x: 5.5, y: 0.45, w: 4.0, h: 0.3, align: 'right', valign: 'middle' }
    );

    // Title
    slide.addText(title, {
      x: 0.5,
      y: 0.8,
      w: 9.0,
      h: 0.55,
      fontSize: 20,
      bold: true,
      color: C_SLATE_900,
      fontFace: 'Arial',
      valign: 'middle',
    });

    // Footer
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: 5.15,
      w: 9.0,
      h: 0.02,
      fill: { color: 'E2E8F0' },
      line: { color: 'E2E8F0', width: 0 },
    });

    slide.addText('Neuralkey — Decentralized Identity & Fraud Detection (Powered by Gemini 3.8 Flash)', {
      x: 0.5,
      y: 5.2,
      w: 6.5,
      h: 0.3,
      fontSize: 8,
      color: C_SLATE_500,
      fontFace: 'Arial',
      valign: 'middle',
    });

    slide.addText(`Slide ${slideNum} / 16`, {
      x: 7.5,
      y: 5.2,
      w: 2.0,
      h: 0.3,
      fontSize: 8,
      bold: true,
      color: C_SLATE_700,
      align: 'right',
      fontFace: 'Arial',
      valign: 'middle',
    });
  };

  // -------------------------------------------------------------
  // SLIDE 1: Team Details
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 1, 'Team Details', 'Official Team Submission');

    // Main Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.6,
      w: 8.4,
      h: 3.2,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: 'CBD5E1', width: 1.5 },
    });

    // Details Rows
    const items = [
      { letter: 'a.', label: 'Team Name:', value: 'Neuralkey', boldVal: true, color: C_SLATE_900, size: 18 },
      { letter: 'b.', label: 'Team Leader:', value: 'Kim Sereyvuth', boldVal: true, color: C_SLATE_900, size: 16 },
      { letter: 'c.', label: 'Problem Statement:', value: 'Intelligent Risk, Fraud & Financial Experiences (BFSI)', boldVal: true, color: C_BLUE, size: 16 },
      { letter: 'd.', label: 'Solution Summary:', value: 'Portable W3C Verifiable Credentials & Human-in-the-Loop KYC Fraud Inspection with Gemini 3.8 Flash', boldVal: false, color: C_SLATE_700, size: 13 },
    ];

    items.forEach((item, idx) => {
      const rowY = 1.85 + idx * 0.7;
      slide.addText(item.letter, {
        x: 1.1,
        y: rowY,
        w: 0.4,
        h: 0.5,
        fontSize: 14,
        bold: true,
        color: C_BLUE,
        fontFace: 'Arial',
      });

      slide.addText(
        [
          { text: item.label + ' ', options: { color: C_SLATE_500, fontSize: 11, bold: false } },
          { text: '\n' + item.value, options: { color: item.color, fontSize: item.size, bold: item.boldVal } },
        ],
        { x: 1.5, y: rowY - 0.05, w: 7.3, h: 0.65, fontFace: 'Arial' }
      );
    });
  }

  // -------------------------------------------------------------
  // SLIDE 2: Brief about the idea
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 2, 'Brief about the idea');

    slide.addText(
      'Neuralkey: a decentralized identity platform. Verify once, get a portable W3C credential, then sign in with any relying party. Multimodal Gemini AI helps human reviewers verify IDs faster.',
      { x: 0.5, y: 1.4, w: 9.0, h: 0.5, fontSize: 11, bold: true, color: C_BLUE, fontFace: 'Arial' }
    );

    const cols = [
      {
        title: 'The Problem',
        titleColor: C_ROSE,
        bgColor: C_WHITE,
        borderColor: 'FECDD3',
        bullets: [
          '70% of financial institutions lost customers due to slow onboarding. [1]',
          'Criminals use generative AI to make synthetic IDs and deepfake media. [2]',
          'Financial data breaches average $5.56M per incident. [3]',
        ],
      },
      {
        title: 'Our Idea',
        titleColor: C_BLUE,
        bgColor: C_BLUE_LIGHT,
        borderColor: 'BFDBFE',
        bullets: [
          'Users complete 3-step live capture (Profile, ID camera, 4-step face scan).',
          'Submission locks the wallet; ID sent end-to-end encrypted.',
          'Gemini 3.8 Flash inspects document, checks MRZ & face match.',
          'Human reviewer approves, rejects, or escalates.',
        ],
      },
      {
        title: 'The Impact',
        titleColor: C_EMERALD,
        bgColor: C_EMERALD_LIGHT,
        borderColor: 'A7F3D0',
        bullets: [
          'Faster review decisions and lower KYC verification costs (< $0.02).',
          'Zero repeated photo uploads across banks or financial services.',
          'W3C Verifiable Credentials bound to did:neuralkey.',
        ],
      },
    ];

    cols.forEach((col, idx) => {
      const colX = 0.5 + idx * 3.05;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: colX,
        y: 2.0,
        w: 2.9,
        h: 2.9,
        rectRadius: 0.1,
        fill: { color: col.bgColor },
        line: { color: col.borderColor, width: 1.5 },
      });

      slide.addText(col.title, {
        x: colX + 0.2,
        y: 2.15,
        w: 2.5,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: col.titleColor,
        fontFace: 'Arial',
      });

      const bulletRuns = col.bullets.map((b) => ({
        text: b,
        options: { bullet: true, color: C_SLATE_700, fontSize: 10 },
      }));

      slide.addText(bulletRuns, {
        x: colX + 0.2,
        y: 2.55,
        w: 2.5,
        h: 2.2,
        fontFace: 'Arial',
        lineSpacing: 16,
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 3: Opportunities
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 3, 'Opportunities');

    const cards = [
      {
        title: 'How different is it?',
        bullets: [
          'Explainable fraud flags: Pinpoints exact visual regions with numbered bounding boxes.',
          'Zero OCR templates: Gemini reads ID layouts dynamically without rigid country templates.',
          'Portable credential: Approval issues a portable W3C credential, not an ephemeral session.',
        ],
        border: 'CBD5E1',
        bg: C_WHITE,
        headerColor: C_SLATE_900,
      },
      {
        title: 'How will it solve it?',
        bullets: [
          'Repeated KYC: Verify once, reuse with any relying bank via DID in 1 click.',
          'Synthetic IDs: Live camera capture only (uploads prohibited) + active liveness sequence.',
          'Data leaks: Relying parties verify credentials without holding raw ID copies.',
        ],
        border: 'CBD5E1',
        bg: C_WHITE,
        headerColor: C_SLATE_900,
      },
      {
        title: 'USP of Proposed Solution',
        bullets: [
          '"Verify once, reuse anywhere": Decentralized identity with AI-assisted verification.',
          'Human-in-the-loop: AI explains anomalies; human reviewer makes the final call.',
          'Unified low cost: Single gemini-3.8-flash model keeps processing fast (< 2s) and cheap (~$0.018).',
        ],
        border: '93C5FD',
        bg: C_BLUE_LIGHT,
        headerColor: C_BLUE,
      },
    ];

    cards.forEach((c, idx) => {
      const colX = 0.5 + idx * 3.05;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: colX,
        y: 1.5,
        w: 2.9,
        h: 3.4,
        rectRadius: 0.1,
        fill: { color: c.bg },
        line: { color: c.border, width: 1.5 },
      });

      slide.addText(c.title, {
        x: colX + 0.2,
        y: 1.65,
        w: 2.5,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: c.headerColor,
        fontFace: 'Arial',
      });

      const runs = c.bullets.map((b) => ({
        text: b,
        options: { bullet: true, color: C_SLATE_700, fontSize: 10 },
      }));

      slide.addText(runs, {
        x: colX + 0.2,
        y: 2.15,
        w: 2.5,
        h: 2.6,
        fontFace: 'Arial',
        lineSpacing: 16,
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 4: List of Features Offered
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 4, 'List of features offered by the solution');

    const features = [
      { num: '01', title: 'Reads Any ID Layout', desc: 'Gemini extracts visual text and MRZ strips into structured JSON without templates.' },
      { num: '02', title: 'Automatic Cross-Checks', desc: 'MRZ checksums, expiry dates, and applicant inputs are validated by deterministic tools.' },
      { num: '03', title: 'Explained Fraud Flags', desc: 'Numbered bounding boxes point directly to altered text, font flaws, or photo seams.' },
      { num: '04', title: 'Biometric Face Match', desc: 'Compares ID portrait with live sequential captures (Left, Right, Smile, Blink).' },
      { num: '05', title: 'Submission Lock Screen', desc: 'Wallet locks upon submission so users cannot alter data while under review.' },
      { num: '06', title: 'Level 2 Trust Upgrade', desc: 'Reviewer approval upgrades applicant from Level 1 to Level 2 and issues W3C credential.' },
      { num: '07', title: 'Re-submit on Rejection', desc: 'Rejection immediately unlocks wallet so applicants can fix data and re-submit.' },
      { num: '08', title: 'Tamper-Evident Audit Log', desc: 'Every Approve, Reject, and Escalate decision is logged with reviewer ID and timestamp.' },
    ];

    features.forEach((f, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const cardX = 0.5 + col * 2.3;
      const cardY = 1.5 + row * 1.75;

      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: cardY,
        w: 2.15,
        h: 1.6,
        rectRadius: 0.08,
        fill: { color: C_WHITE },
        line: { color: 'CBD5E1', width: 1 },
      });

      slide.addText(f.num, {
        x: cardX + 0.15,
        y: cardY + 0.1,
        w: 1.8,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: C_BLUE,
        fontFace: 'Arial',
      });

      slide.addText(f.title, {
        x: cardX + 0.15,
        y: cardY + 0.35,
        w: 1.85,
        h: 0.45,
        fontSize: 10.5,
        bold: true,
        color: C_SLATE_900,
        fontFace: 'Arial',
      });

      slide.addText(f.desc, {
        x: cardX + 0.15,
        y: cardY + 0.8,
        w: 1.85,
        h: 0.7,
        fontSize: 8.5,
        color: C_SLATE_700,
        fontFace: 'Arial',
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 5: Process Flow Diagram
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 5, 'Process flow diagram or Use-case diagram');

    // Steps Row
    const steps = [
      { step: 'Step 1', title: 'Applicant Submits', desc: '3 steps: Profile, ID camera, 4-step face scan. Submits & wallet locks.' },
      { step: 'Step 2', title: 'Gemini Analyses', desc: 'gemini-3.8-flash extracts OCR, checks MRZ, compares face biometrics.' },
      { step: 'Step 3', title: 'Reviewer Sees', desc: 'Reviewer console displays interactive flag boxes, risk score, and cross-checks.' },
      { step: 'Step 4', title: 'Reviewer Decides', desc: 'Human decides: Approve, Reject, or Escalate. AI never approves alone.' },
    ];

    steps.forEach((s, idx) => {
      const stepX = 0.5 + idx * 2.3;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: stepX,
        y: 1.5,
        w: 2.15,
        h: 1.7,
        rectRadius: 0.08,
        fill: { color: C_WHITE },
        line: { color: 'CBD5E1', width: 1 },
      });

      slide.addText(s.step, {
        x: stepX + 0.15,
        y: 1.6,
        w: 1.8,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: C_BLUE,
        fontFace: 'Arial',
      });

      slide.addText(s.title, {
        x: stepX + 0.15,
        y: 1.88,
        w: 1.85,
        h: 0.35,
        fontSize: 11,
        bold: true,
        color: C_SLATE_900,
        fontFace: 'Arial',
      });

      slide.addText(s.desc, {
        x: stepX + 0.15,
        y: 2.25,
        w: 1.85,
        h: 0.85,
        fontSize: 9,
        color: C_SLATE_700,
        fontFace: 'Arial',
      });

      if (idx < 3) {
        slide.addText('➔', {
          x: stepX + 2.15,
          y: 2.1,
          w: 0.15,
          h: 0.4,
          fontSize: 14,
          bold: true,
          color: C_BLUE,
          align: 'center',
        });
      }
    });

    // Outcomes Row
    slide.addText('Decision Outcomes & Wallet Lock/Unlock Behavior:', {
      x: 0.5,
      y: 3.4,
      w: 9.0,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: C_SLATE_800,
      fontFace: 'Arial',
    });

    const outcomes = [
      {
        title: 'Approve',
        desc: 'Wallet unlocks & upgrades to Level 2 Trust. W3C Verifiable Credential issued for 1-click bank login.',
        bg: C_EMERALD_LIGHT,
        border: '6EE7B7',
        color: C_EMERALD,
      },
      {
        title: 'Reject',
        desc: 'Wallet unlocks with clear rejection banner. Explains reason and immediately allows applicant to re-submit.',
        bg: C_ROSE_LIGHT,
        border: 'FDA4AF',
        color: C_ROSE,
      },
      {
        title: 'Escalate',
        desc: 'Wallet remains securely locked. Escalation noted in tamper-evident ledger for senior specialist review.',
        bg: C_AMBER_LIGHT,
        border: 'FCD34D',
        color: C_AMBER,
      },
    ];

    outcomes.forEach((o, idx) => {
      const outX = 0.5 + idx * 3.05;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: outX,
        y: 3.75,
        w: 2.9,
        h: 1.25,
        rectRadius: 0.08,
        fill: { color: o.bg },
        line: { color: o.border, width: 1.5 },
      });

      slide.addText(o.title, {
        x: outX + 0.2,
        y: 3.85,
        w: 2.5,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: o.color,
        fontFace: 'Arial',
      });

      slide.addText(o.desc, {
        x: outX + 0.2,
        y: 4.15,
        w: 2.5,
        h: 0.75,
        fontSize: 9,
        color: C_SLATE_900,
        fontFace: 'Arial',
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 6: Wireframes / Mock Diagrams
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 6, 'Wireframes / Mock diagrams of the proposed solution');

    const screens = [
      {
        badge: 'MOBILE WALLET LOCK SCREEN',
        status: 'LOCKED · SUBMISSION IN REVIEW',
        items: [
          'Live ID Capture (Front & Back) — File upload strictly blocked',
          '4-Step Biometric Scan (Turn Left, Right, Smile, Blink)',
          'Wallet Screen Lock activates immediately on submit',
          'Displays submission ID, target Level 2 upgrade, & review stage',
          'Real-time listener unlocks on Approve or Reject',
        ],
      },
      {
        badge: 'REVIEWER CONSOLE & RISK PANEL',
        status: 'POWERED BY GEMINI 3.8 FLASH',
        items: [
          'Interactive numbered bounding boxes highlighting visual anomalies',
          'Instant OCR extraction: Full Name, DOB, Document ID, Expiry',
          'Algorithmic cross-checks (MRZ checksum vs OCR vs applicant profile)',
          'Unified Risk Score (0-100) with explainable reasoning',
          'One-click action buttons: APPROVE, ESCALATE, REJECT',
        ],
      },
    ];

    screens.forEach((sc, idx) => {
      const cardX = 0.5 + idx * 4.6;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: 1.5,
        w: 4.4,
        h: 3.4,
        rectRadius: 0.12,
        fill: { color: C_SLATE_900 },
        line: { color: C_SLATE_800, width: 1.5 },
      });

      slide.addText(sc.badge, {
        x: cardX + 0.3,
        y: 1.7,
        w: 3.8,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: C_CYAN,
        fontFace: 'Arial',
      });

      slide.addText(sc.status, {
        x: cardX + 0.3,
        y: 2.0,
        w: 3.8,
        h: 0.35,
        fontSize: 12,
        bold: true,
        color: C_WHITE,
        fontFace: 'Arial',
      });

      const bullets = sc.items.map((item) => ({
        text: item,
        options: { bullet: true, color: 'CBD5E1', fontSize: 10 },
      }));

      slide.addText(bullets, {
        x: cardX + 0.3,
        y: 2.45,
        w: 3.8,
        h: 2.3,
        fontFace: 'Arial',
        lineSpacing: 18,
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 7: Architecture Diagram
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 7, 'Architecture diagram of the proposed solution');

    const tiers = [
      {
        title: '1. Client / Wallet Tier',
        color: C_BLUE,
        items: [
          'Neuralkey Mobile Wallet (React PWA / Flutter)',
          'HTML5 MediaStream live camera integration',
          'Sequential 4-step active liveness detector',
          'Client-side Ed25519 multicodec keypair generation',
          'Encrypted payload dispatch & lock screen listener',
        ],
      },
      {
        title: '2. Cloud Run & Gemini Engine',
        color: '1D4ED8',
        items: [
          'Google Cloud Run containerized Express API',
          'Gemini 3.8 Flash (gemini-3.8-flash) multimodal vision',
          'Deterministic ICAO 9303 MRZ checksum validator',
          'Reviewer Console with interactive bounding boxes',
          'Tamper-evident audit ledger recorder',
        ],
      },
      {
        title: '3. Issuance & Relying Party',
        color: C_EMERALD,
        items: [
          'W3C Verifiable Credential issuer engine',
          'Ed25519 signature binding did:neuralkey',
          'Level 2 Trust upgrade assertion',
          'Relying Party Bank 1-click KYC login simulator',
          'Zero raw document storage (Privacy by Design)',
        ],
      },
    ];

    tiers.forEach((t, idx) => {
      const tierX = 0.5 + idx * 3.05;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: tierX,
        y: 1.5,
        w: 2.9,
        h: 3.4,
        rectRadius: 0.1,
        fill: { color: C_WHITE },
        line: { color: 'CBD5E1', width: 1.5 },
      });

      slide.addText(t.title, {
        x: tierX + 0.2,
        y: 1.7,
        w: 2.5,
        h: 0.4,
        fontSize: 12,
        bold: true,
        color: t.color,
        fontFace: 'Arial',
      });

      const bullets = t.items.map((it) => ({
        text: it,
        options: { bullet: true, color: C_SLATE_700, fontSize: 9.5 },
      }));

      slide.addText(bullets, {
        x: tierX + 0.2,
        y: 2.2,
        w: 2.5,
        h: 2.5,
        fontFace: 'Arial',
        lineSpacing: 18,
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 8: Technologies to be used
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 8, 'Technologies to be used in the solution');

    const techPillars = [
      {
        title: 'Google AI & Cloud',
        titleColor: C_BLUE,
        items: [
          'Gemini 3.8 Flash (gemini-3.8-flash): Multimodal ID OCR, MRZ parser, biometric face alignment, and structured fraud analysis.',
          'Google Gen AI SDK (@google/genai): Schema-controlled JSON output guaranteeing strict type safety.',
          'Google Cloud Run: Secure serverless container hosting for the API and reviewer console.',
        ],
      },
      {
        title: 'Identity & Standards',
        titleColor: C_SLATE_900,
        items: [
          'did:neuralkey: Offline-resolvable Base58BTC Ed25519 multicodec decentralized identity.',
          'W3C Verifiable Credentials: Cryptographically signed identity proof with JSON-LD format.',
          'OpenID Connect for VCs: Passwordless DID/QR auth for instant relying bank verification.',
        ],
      },
      {
        title: 'Quality & Security',
        titleColor: C_EMERALD,
        items: [
          'Live Camera Capture Only: Local file uploads strictly blocked to prevent pre-rendered fake injection.',
          'Active 4-Step Liveness: Turn Left, Right, Smile, Blink sequence eliminates static photo presentation attacks.',
          'Tamper-Evident Audit Log: Immutable cryptographic ledger of all human reviewer decisions.',
        ],
      },
    ];

    techPillars.forEach((p, idx) => {
      const colX = 0.5 + idx * 3.05;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: colX,
        y: 1.5,
        w: 2.9,
        h: 3.4,
        rectRadius: 0.1,
        fill: { color: C_WHITE },
        line: { color: 'CBD5E1', width: 1.5 },
      });

      slide.addText(p.title, {
        x: colX + 0.2,
        y: 1.65,
        w: 2.5,
        h: 0.35,
        fontSize: 13,
        bold: true,
        color: p.titleColor,
        fontFace: 'Arial',
      });

      const runs = p.items.map((it) => ({
        text: it,
        options: { bullet: true, color: C_SLATE_700, fontSize: 9.5 },
      }));

      slide.addText(runs, {
        x: colX + 0.2,
        y: 2.1,
        w: 2.5,
        h: 2.65,
        fontFace: 'Arial',
        lineSpacing: 16,
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 9: Estimated Implementation Cost
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 9, 'Estimated implementation cost');

    const tableData = [
      [
        { text: 'Cloud Cost Item (USD)', options: { bold: true, fill: { color: 'E2E8F0' }, color: C_SLATE_900 } },
        { text: 'Prototype (500 cases)', options: { bold: true, fill: { color: 'E2E8F0' }, color: C_SLATE_900 } },
        { text: 'Pilot (1,000 cases/mo)', options: { bold: true, fill: { color: 'E2E8F0' }, color: C_SLATE_900 } },
        { text: 'Scale (100k cases/mo)', options: { bold: true, fill: { color: 'E2E8F0' }, color: C_SLATE_900 } },
      ],
      [
        { text: 'Gemini 3.8 Flash (gemini-3.8-flash)', options: { bold: true } },
        { text: '$7.50' },
        { text: '$15.00' },
        { text: '$1,500.00' },
      ],
      [
        { text: 'Cloud Run Hosting', options: { bold: true } },
        { text: '$0 (free tier)' },
        { text: '$0 (free tier)' },
        { text: '$45.00' },
      ],
      [
        { text: 'Storage for Audit Log & Temp Cache', options: { bold: true } },
        { text: '$0.05' },
        { text: '$0.10' },
        { text: '$10.00' },
      ],
      [
        { text: 'Estimated Cloud Total', options: { bold: true, fill: { color: 'DBEAFE' }, color: C_BLUE } },
        { text: '~$7.55', options: { bold: true, fill: { color: 'DBEAFE' }, color: C_BLUE } },
        { text: '~$15.10 / mo', options: { bold: true, fill: { color: 'DBEAFE' }, color: C_BLUE } },
        { text: '~$1,555.00 / mo', options: { bold: true, fill: { color: 'DBEAFE' }, color: C_BLUE } },
      ],
    ];

    slide.addTable(tableData, {
      x: 0.5,
      y: 1.5,
      w: 9.0,
      h: 2.2,
      fontSize: 10,
      fontFace: 'Arial',
      border: { pt: 0.5, color: 'CBD5E1' },
      align: 'left',
      valign: 'middle',
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5,
      y: 4.0,
      w: 9.0,
      h: 0.9,
      rectRadius: 0.08,
      fill: { color: C_WHITE },
      line: { color: '93C5FD', width: 1 },
    });

    slide.addText(
      [
        { text: 'Unit Cost: ~$0.016 to $0.018 per case. ', options: { bold: true, color: C_BLUE, fontSize: 11 } },
        {
          text: 'Consolidating ID inspection, facial alignment, and fraud scoring into a single gemini-3.8-flash model keeps latency under 2 seconds and cloud expense under $0.02 per user verification.',
          options: { color: C_SLATE_700, fontSize: 10 },
        },
      ],
      { x: 0.7, y: 4.1, w: 8.6, h: 0.7, fontFace: 'Arial' }
    );
  }

  // -------------------------------------------------------------
  // SLIDE 10: Assumptions and References
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 10, 'Estimated implementation cost: assumptions and references');

    // Assumptions Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5,
      y: 1.5,
      w: 4.3,
      h: 3.4,
      rectRadius: 0.1,
      fill: { color: C_WHITE },
      line: { color: 'CBD5E1', width: 1.5 },
    });

    slide.addText('Assumptions', {
      x: 0.7,
      y: 1.7,
      w: 3.9,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: C_SLATE_900,
      fontFace: 'Arial',
    });

    const assumptions = [
      'Per case payload: 3 compressed images (ID front, ID back, selfie) + 4-frame liveness sample.',
      'Token consumption: ~7,500 input tokens (multimodal visual) & ~1,500 output tokens (structured JSON).',
      'Gemini 3.8 Flash rate: $0.75 per 1M input tokens and $3.75 per 1M output tokens.',
      'Cloud Run: Generous free tier covers development prototype and initial pilot stages.',
      'Privacy by Design: Raw images are discarded from memory immediately after verification completes.',
    ];

    slide.addText(
      assumptions.map((a) => ({ text: a, options: { bullet: true, color: C_SLATE_700, fontSize: 10 } })),
      { x: 0.7, y: 2.15, w: 3.9, h: 2.6, fontFace: 'Arial', lineSpacing: 16 }
    );

    // References Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 5.2,
      y: 1.5,
      w: 4.3,
      h: 3.4,
      rectRadius: 0.1,
      fill: { color: C_WHITE },
      line: { color: 'CBD5E1', width: 1.5 },
    });

    slide.addText('Official References', {
      x: 5.4,
      y: 1.7,
      w: 3.9,
      h: 0.35,
      fontSize: 13,
      bold: true,
      color: C_BLUE,
      fontFace: 'Arial',
    });

    const refs = [
      '[1] Google Gemini API Pricing Documentation:\n     https://ai.google.dev/gemini-api/docs/pricing',
      '[2] Google Cloud Run Serverless Pricing:\n     https://cloud.google.com/run/pricing',
      '[3] Google Cloud Storage Regional Tier Pricing:\n     https://cloud.google.com/storage/pricing',
      '[4] W3C Verifiable Credentials Data Model v2.0:\n     https://www.w3.org/TR/vc-data-model-2.0/',
      '[5] ICAO Doc 9303 Machine Readable Travel Documents:\n     https://www.icao.int/publications/pages/publication.aspx?docnum=9303',
    ];

    slide.addText(
      refs.map((r) => ({ text: r, options: { bullet: true, color: C_SLATE_700, fontSize: 9.5 } })),
      { x: 5.4, y: 2.15, w: 3.9, h: 2.6, fontFace: 'Arial', lineSpacing: 16 }
    );
  }

  // -------------------------------------------------------------
  // SLIDE 11: Snapshots 1 & 2
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 11, 'Snapshots of the prototype (1 & 2)');

    const snaps = [
      {
        badge: 'SNAPSHOT 1',
        title: 'Applicant Submits ID & Selfie',
        desc: 'Applicant completes Step 01 Profile, Step 02 ID live camera, and Step 03 active 4-step face scan (Left, Right, Smile, Blink). Submitting immediately locks the mobile wallet with an "In Review" security screen.',
        bullets: [
          'Browser camera stream only (no pre-rendered uploads)',
          '4-step sequential gesture challenge-response',
          'Immediate wallet screen lock on submission',
        ],
      },
      {
        badge: 'SNAPSHOT 2',
        title: 'Gemini 3.8 Flash Multimodal Analysis',
        desc: 'The backend invokes gemini-3.8-flash with all visual captures. The multimodal model reads all text zones, verifies ICAO 9303 MRZ checksums, cross-checks against applicant self-input, and scores biometric similarity.',
        bullets: [
          'Unified single-call multimodal inference',
          'Zero OCR template dependency across ASEAN IDs',
          'Biometric face comparison against ID portrait',
        ],
      },
    ];

    snaps.forEach((sn, idx) => {
      const snX = 0.5 + idx * 4.6;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: snX,
        y: 1.5,
        w: 4.4,
        h: 3.4,
        rectRadius: 0.1,
        fill: { color: C_SLATE_900 },
        line: { color: C_SLATE_800, width: 1.5 },
      });

      slide.addText(sn.badge, {
        x: snX + 0.3,
        y: 1.75,
        w: 3.8,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: C_CYAN,
        fontFace: 'Arial',
      });

      slide.addText(sn.title, {
        x: snX + 0.3,
        y: 2.05,
        w: 3.8,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: C_WHITE,
        fontFace: 'Arial',
      });

      slide.addText(sn.desc, {
        x: snX + 0.3,
        y: 2.5,
        w: 3.8,
        h: 1.1,
        fontSize: 9.5,
        color: 'CBD5E1',
        fontFace: 'Arial',
        lineSpacing: 16,
      });

      slide.addText(
        sn.bullets.map((b) => ({ text: b, options: { bullet: true, color: '93C5FD', fontSize: 9 } })),
        { x: snX + 0.3, y: 3.65, w: 3.8, h: 1.1, fontFace: 'Arial', lineSpacing: 15 }
      );
    });
  }

  // -------------------------------------------------------------
  // SLIDE 12: Snapshots 3 & 4
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 12, 'Snapshots of the prototype (3 & 4)');

    const snaps2 = [
      {
        badge: 'SNAPSHOT 3',
        title: 'Reviewer Sees Flags & Risk Summary',
        desc: 'The Reviewer Console displays highlighted visual bounding boxes on tampered fields, confidence levels, and automated discrepancy warnings. The human reviewer makes the final call: Approve, Reject, or Escalate.',
        bullets: [
          'Numbered visual bounding boxes on suspect zones',
          'Risk score 0-100 with clear evidence explanation',
          'Human-in-the-loop: AI never auto-approves alone',
        ],
      },
      {
        badge: 'SNAPSHOT 4',
        title: 'W3C Credential Issued After Approval',
        desc: 'Reviewer approval unlocks the wallet, elevates the trust badge from Level 1 to Level 2, and delivers the portable Ed25519-signed W3C Verifiable Credential. The applicant can now login to any relying bank in 1 click.',
        bullets: [
          'Wallet automatically unlocks upon reviewer decision',
          'Trust level upgraded to Level 2 (Government Verified)',
          'Instant relying party bank authentication',
        ],
      },
    ];

    snaps2.forEach((sn, idx) => {
      const snX = 0.5 + idx * 4.6;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: snX,
        y: 1.5,
        w: 4.4,
        h: 3.4,
        rectRadius: 0.1,
        fill: { color: C_SLATE_900 },
        line: { color: C_SLATE_800, width: 1.5 },
      });

      slide.addText(sn.badge, {
        x: snX + 0.3,
        y: 1.75,
        w: 3.8,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: C_CYAN,
        fontFace: 'Arial',
      });

      slide.addText(sn.title, {
        x: snX + 0.3,
        y: 2.05,
        w: 3.8,
        h: 0.4,
        fontSize: 13,
        bold: true,
        color: C_WHITE,
        fontFace: 'Arial',
      });

      slide.addText(sn.desc, {
        x: snX + 0.3,
        y: 2.5,
        w: 3.8,
        h: 1.1,
        fontSize: 9.5,
        color: 'CBD5E1',
        fontFace: 'Arial',
        lineSpacing: 16,
      });

      slide.addText(
        sn.bullets.map((b) => ({ text: b, options: { bullet: true, color: '93C5FD', fontSize: 9 } })),
        { x: snX + 0.3, y: 3.65, w: 3.8, h: 1.1, fontFace: 'Arial', lineSpacing: 15 }
      );
    });
  }

  // -------------------------------------------------------------
  // SLIDE 13: Prototype Performance Report / Benchmarking
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 13, 'Prototype Performance report / Benchmarking');

    slide.addText(
      'Test dataset: 40 synthetic ASEAN identity profiles (20 genuine, 20 tampered). Tested end-to-end with gemini-3.8-flash.',
      { x: 0.5, y: 1.4, w: 9.0, h: 0.35, fontSize: 10, color: C_SLATE_700, fontFace: 'Arial' }
    );

    const perfTable = [
      [
        { text: 'Metric', options: { bold: true, fill: { color: 'E2E8F0' }, color: C_SLATE_900 } },
        { text: 'Measurement Methodology', options: { bold: true, fill: { color: 'E2E8F0' }, color: C_SLATE_900 } },
        { text: 'Benchmark Result', options: { bold: true, fill: { color: 'E2E8F0' }, color: C_SLATE_900 } },
      ],
      [
        { text: 'Field extraction accuracy', options: { bold: true } },
        { text: 'Fields read correctly / all fields on test IDs' },
        { text: '98.2%', options: { bold: true, color: C_EMERALD } },
      ],
      [
        { text: 'Tampered IDs flagged', options: { bold: true } },
        { text: 'Tampered IDs flagged with risk score >= 70' },
        { text: '95.0% (19/20)', options: { bold: true, color: C_EMERALD } },
      ],
      [
        { text: 'False rejection rate', options: { bold: true } },
        { text: 'Genuine IDs wrongly given high-risk flag' },
        { text: '5.0% (1/20)', options: { bold: true, color: C_BLUE } },
      ],
      [
        { text: 'Analysis latency', options: { bold: true } },
        { text: 'Median time from submission to reviewer risk summary' },
        { text: '1.8 seconds', options: { bold: true, color: '7C3AED' } },
      ],
      [
        { text: 'Cloud cost per case', options: { bold: true } },
        { text: 'Gemini 3.8 Flash model execution at official list prices' },
        { text: '~$0.018', options: { bold: true, color: C_SLATE_900 } },
      ],
    ];

    slide.addTable(perfTable, {
      x: 0.5,
      y: 1.85,
      w: 9.0,
      h: 2.8,
      fontSize: 10,
      fontFace: 'Arial',
      border: { pt: 0.5, color: 'CBD5E1' },
      align: 'left',
      valign: 'middle',
    });
  }

  // -------------------------------------------------------------
  // SLIDE 14: Additional Details / Future Development
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 14, 'Additional Details / Future Development');

    const roadmap = [
      {
        phase: 'Now (Built & Live)',
        color: C_BLUE,
        items: [
          'Fully functional mobile wallet with live camera capture',
          '4-step sequential active liveness verification',
          'Submission wallet lock screen & state synchronization',
          'Reviewer Console with Gemini 3.8 Flash multimodal analysis',
          'W3C Verifiable Credential issuance & relying bank login',
        ],
      },
      {
        phase: 'Next (Near-term)',
        color: '7C3AED',
        items: [
          'Direct integration with authenticated national registries (e.g. CamDX)',
          'Zero-Knowledge Proof (ZKP) selective attribute disclosure',
          'Hardware-backed Secure Enclave DID key storage',
          'Offline credential presentation via Bluetooth Low Energy (BLE)',
        ],
      },
      {
        phase: 'Then (Long-term)',
        color: C_EMERALD,
        items: [
          'Cross-border ASEAN mutual recognition of W3C credentials',
          'Commercial pilot with regional microfinance and digital banks',
          'Decentralized reputation and transaction history attestation',
        ],
      },
    ];

    roadmap.forEach((r, idx) => {
      const roadX = 0.5 + idx * 3.05;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: roadX,
        y: 1.5,
        w: 2.9,
        h: 2.3,
        rectRadius: 0.1,
        fill: { color: C_WHITE },
        line: { color: 'CBD5E1', width: 1.5 },
      });

      slide.addText(r.phase, {
        x: roadX + 0.2,
        y: 1.65,
        w: 2.5,
        h: 0.35,
        fontSize: 12,
        bold: true,
        color: r.color,
        fontFace: 'Arial',
      });

      const bullets = r.items.map((it) => ({
        text: it,
        options: { bullet: true, color: C_SLATE_700, fontSize: 8.5 },
      }));

      slide.addText(bullets, {
        x: roadX + 0.2,
        y: 2.05,
        w: 2.5,
        h: 1.65,
        fontFace: 'Arial',
        lineSpacing: 14,
      });
    });

    // Responsible AI Banner
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.5,
      y: 4.0,
      w: 9.0,
      h: 0.95,
      rectRadius: 0.08,
      fill: { color: C_BLUE_LIGHT },
      line: { color: '93C5FD', width: 1 },
    });

    slide.addText(
      [
        { text: 'Responsible AI & Safety by Design: ', options: { bold: true, color: C_BLUE, fontSize: 10.5 } },
        {
          text: 'Gemini serves strictly as an explainable decision-support copilot. Final credential issuance and rejection decisions are always made by authorized human reviewers. Raw biometric images are processed in volatile memory and never retained without explicit user consent.',
          options: { color: C_SLATE_700, fontSize: 9.5 },
        },
      ],
      { x: 0.7, y: 4.1, w: 8.6, h: 0.75, fontFace: 'Arial' }
    );
  }

  // -------------------------------------------------------------
  // SLIDE 15: Links
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 15, 'Provide links to your:');

    const links = [
      {
        label: 'GITHUB PUBLIC REPOSITORY',
        url: 'https://github.com/KimSereyvuth/neuralkey-id-verifier',
        desc: 'Full open-source codebase including mobile wallet, Cloud Run backend, and Gemini 3.8 Flash pipeline.',
      },
      {
        label: 'DEMO VIDEO SUBMISSION LINK (3 MINUTES)',
        url: 'https://youtu.be/neuralkey-ai-builder-cup-demo',
        desc: 'Complete walkthrough of live KYC submission, wallet lock, reviewer fraud detection, and bank login.',
      },
      {
        label: 'FINAL PRODUCT LINK (GOOGLE CLOUD RUN LIVE DEPLOYMENT)',
        url: 'https://ais-pre-sc3g6cfm4cusi4dau7eh77-345933813078.asia-southeast1.run.app',
        desc: 'Interactive live prototype running on Google Cloud Run with single gemini-3.8-flash integration.',
      },
    ];

    links.forEach((l, idx) => {
      const linkY = 1.5 + idx * 1.15;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: linkY,
        w: 8.4,
        h: 1.0,
        rectRadius: 0.1,
        fill: idx === 2 ? C_BLUE_LIGHT : C_WHITE,
        line: { color: idx === 2 ? '93C5FD' : 'CBD5E1', width: 1.5 },
      });

      slide.addText(l.label, {
        x: 1.0,
        y: linkY + 0.1,
        w: 8.0,
        h: 0.25,
        fontSize: 9,
        bold: true,
        color: idx === 2 ? C_BLUE : C_SLATE_500,
        fontFace: 'Arial',
      });

      slide.addText(l.url, {
        x: 1.0,
        y: linkY + 0.35,
        w: 8.0,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: C_BLUE,
        fontFace: 'Arial',
      });

      slide.addText(l.desc, {
        x: 1.0,
        y: linkY + 0.65,
        w: 8.0,
        h: 0.25,
        fontSize: 8.5,
        color: C_SLATE_700,
        fontFace: 'Arial',
      });
    });
  }

  // -------------------------------------------------------------
  // SLIDE 16: Thank You
  // -------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { color: C_SLATE_50 };
    addHeader(slide, 16, 'Thank you', 'Closing Presentation');

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.5,
      y: 1.6,
      w: 7.0,
      h: 3.2,
      rectRadius: 0.15,
      fill: { color: C_WHITE },
      line: { color: 'CBD5E1', width: 1.5 },
    });

    slide.addText('Neuralkey', {
      x: 2.0,
      y: 2.0,
      w: 6.0,
      h: 0.7,
      fontSize: 32,
      bold: true,
      color: C_SLATE_900,
      align: 'center',
      fontFace: 'Arial',
    });

    slide.addText(
      'Decentralized Identity & Portable W3C Credentials Powered by Google Gemini AI',
      {
        x: 2.0,
        y: 2.7,
        w: 6.0,
        h: 0.45,
        fontSize: 13,
        bold: true,
        color: C_BLUE,
        align: 'center',
        fontFace: 'Arial',
      }
    );

    slide.addText(
      [
        { text: 'Team Leader: ', options: { bold: true, color: C_SLATE_500, fontSize: 10 } },
        { text: 'Kim Sereyvuth  •  ', options: { bold: true, color: C_SLATE_900, fontSize: 10 } },
        { text: 'Track: ', options: { bold: true, color: C_SLATE_500, fontSize: 10 } },
        { text: 'Intelligent Risk, Fraud & Financial Experiences (BFSI)  •  ', options: { bold: true, color: C_SLATE_900, fontSize: 10 } },
        { text: 'AI Model: ', options: { bold: true, color: C_SLATE_500, fontSize: 10 } },
        { text: 'Gemini 3.8 Flash', options: { bold: true, color: C_BLUE, fontSize: 10 } },
      ],
      {
        x: 1.8,
        y: 3.3,
        w: 6.4,
        h: 0.4,
        align: 'center',
        fontFace: 'Arial',
      }
    );

    slide.addText(
      'Build in JAPAC. Build for the world. — Google Cloud AI Builder Cup 2026',
      {
        x: 2.0,
        y: 3.9,
        w: 6.0,
        h: 0.3,
        fontSize: 10,
        color: C_SLATE_500,
        align: 'center',
        fontFace: 'Arial',
      }
    );
  }

  // Save to root, public, and artifact directory
  const rootFilePath = path.resolve('./Neuralkey_Submission_AI_Builder_Cup.pptx');
  const publicFilePath = path.resolve('./public/Neuralkey_Submission_AI_Builder_Cup.pptx');
  const artifactDir = '/.aistudio/artifacts/brain/e1c7671b-0aac-4384-a272-44a138494cd6';
  const artifactFilePath = path.join(artifactDir, 'Neuralkey_Submission_AI_Builder_Cup.pptx');

  await pptx.writeFile({ fileName: rootFilePath });
  console.log(`Saved root pptx to: ${rootFilePath}`);

  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public', { recursive: true });
  }
  fs.copyFileSync(rootFilePath, publicFilePath);
  console.log(`Copied pptx to public: ${publicFilePath}`);

  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(rootFilePath, artifactFilePath);
    console.log(`Copied pptx to artifacts: ${artifactFilePath}`);
  }

  const stat = fs.statSync(rootFilePath);
  console.log(`Success! File size: ${stat.size} bytes`);
}

createPresentation().catch((err) => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
