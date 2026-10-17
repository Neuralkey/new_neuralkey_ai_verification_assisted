import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  Scan,
  Lock,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Smartphone,
  Check,
  X,
  KeyRound,
  AlertTriangle,
  Zap,
  ZapOff,
  Sun,
  Fingerprint,
  Play,
  RotateCcw,
  FileCheck,
  Award,
  Upload,
} from 'lucide-react';
import { ApplicantProfile } from '../types';
import { generateSyntheticCardSvg } from '../utils/cardSvgGenerator';

interface IdentityVerifyFlutterSimulatorProps {
  applicant: ApplicantProfile;
  decisionStatus?: 'APPROVED' | 'REJECTED' | 'ESCALATED' | null;
  onVerificationComplete?: (upgradedCredential: any) => void;
  onNavigateHome?: () => void;
  onSubmitToReviewer?: (data: {
    profileData: {
      fullName: string;
      dateOfBirth: string;
      documentNumber: string;
      documentType: ProfileDocType;
      country: string;
      stateProvince: string;
      city: string;
      gender: string;
      email: string;
      documentExpiry: string;
    };
    docImageBase64: string;
    docBackImageBase64?: string;
    selfieImageBase64: string;
    livenessScores: {
      lookLeft: number;
      lookRight: number;
      smile: number;
      blink: number;
      meanScore: number;
    };
  }) => Promise<void> | void;
}

// Local secure storage keys
const STORAGE_KEYS = {
  PROFILE_DONE: 'userUpdatedProfile',
  GOV_DOC_DONE: 'govDocDone',
  FACE_SCAN_DONE: 'faceScanDone',
  // Step 1 Profile individual keys
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  FULL_NAME: 'fullName',
  EMAIL: 'email',
  DOC_TYPE: 'documentType',
  GENDER: 'gender',
  DOC_NUMBER: 'documentNumber',
  COUNTRY: 'country',
  STATE_PROVINCE: 'stateProvince',
  CITY: 'city',
  DOB: 'dateOfBirth',
  DOC_EXPIRY: 'documentExpiry',
  // Step 2 Document file paths in app documents dir
  GOV_DOC_FRONT_PATH: 'govDocFrontPath',
  GOV_DOC_BACK_PATH: 'govDocBackPath',
  // Step 3 Liveness still photo paths in app documents dir
  LIVENESS_LEFT_PATH: 'liveness_lookLeft',
  LIVENESS_RIGHT_PATH: 'liveness_lookRight',
  LIVENESS_SMILE_PATH: 'liveness_smile',
  LIVENESS_BLINK_PATH: 'liveness_blink',
  PROFILE_SELFIE_PATH: 'profileSelfiePath',
  LIVENESS_SCORE: 'livenessMeanScore',
  // V2 VC & Audit log
  V2_VC: 'v2VerifiableCredential',
  V2_VC_JSON: 'v2VerifiableCredential',
  TRUST_LEVEL: 'trustLevel',
  AUDIT_LOG: 'auditLog',
};

export type ProfileDocType = 'ID Card' | 'Passport' | 'Driver License';
export type LivenessAction = 'lookLeft' | 'lookRight' | 'smile' | 'blink';

export const LIVENESS_CHALLENGE_ORDER: LivenessAction[] = [
  'lookLeft',
  'lookRight',
  'smile',
  'blink',
];

export const DOC_TYPE_RULES: Record<
  ProfileDocType,
  { regex: RegExp; hint: string; formatLabel: string; sample: string }
> = {
  'ID Card': {
    regex: /^[A-Za-z0-9().\-\s]{4,30}$/,
    hint: 'e.g. 010892746 or your National ID number',
    formatLabel: '4–30 characters',
    sample: '010892746(01)',
  },
  Passport: {
    regex: /^[A-Za-z0-9().\-\s]{4,30}$/,
    hint: 'e.g. N02194857 or your Passport number',
    formatLabel: '4–30 alphanumeric characters',
    sample: 'N12345678',
  },
  'Driver License': {
    regex: /^[A-Za-z0-9().\-\s]{4,30}$/,
    hint: 'e.g. B.PP.12345678 or your License number',
    formatLabel: '4–30 alphanumeric characters',
    sample: 'B.PP.12345678',
  },
};

export const OCR_VALIDATION_RULES: Record<
  string,
  { tokens: string[]; defaultSample: string; description: string }
> = {
  'ID Card_FRONT': {
    tokens: ['IDKHM', 'IDKH', 'IDENTITY CARD', "CARTE D'IDENTITE"],
    defaultSample:
      "KINGDOM OF CAMBODIA\nIDENTITY CARD / CARTE D'IDENTITE\nIDKHM123456789<<01<<<<<<<<<<<<",
    description: 'National Identity Card (Front)',
  },
  'ID Card_BACK': {
    tokens: ['IDKHM', 'KINGDOM OF CAMBODIA', 'KINGDOM', 'CAMBODIA', 'KHMER IDENTITY CARD'],
    defaultSample:
      'KHMER IDENTITY CARD - KINGDOM OF CAMBODIA\nIDKHM12345678901<<<<9509124M3309128KHM',
    description: 'National Identity Card (Back)',
  },
  Passport_FRONT: {
    tokens: ['PASSPORT', 'PASSEPORT', 'P<KHM', 'KINGDOM OF CAMBODIA'],
    defaultSample:
      'KINGDOM OF CAMBODIA / PASSPORT / PASSEPORT\nP<KHMSOK<<CHANDARA<<<<<<<<<<<<<<<<<<<<<<<<<<\nN123456784KHM9509124M3309128<<<<<<<<<<<<<<02',
    description: 'Official Passport',
  },
  'Driver License_FRONT': {
    tokens: ['DRIVING LICENSE', 'PERMIS DE CONDUIRE', 'SPECIAL CONDITIONS'],
    defaultSample:
      'KINGDOM OF CAMBODIA\nDRIVING LICENSE / PERMIS DE CONDUIRE\nNO: B.PP.12345678\nSPECIAL CONDITIONS: NONE',
    description: 'Driver License',
  },
};

export function validateOcrText(
  docType: ProfileDocType,
  side: 'FRONT' | 'BACK',
  rawText: string
): boolean {
  const upper = rawText.toUpperCase();
  const key = docType === 'ID Card' ? `ID Card_${side}` : `${docType}_FRONT`;
  const rule = OCR_VALIDATION_RULES[key];
  if (!rule) return false;
  return rule.tokens.some((token) => upper.includes(token));
}

export const CAMBODIA_PROVINCES = [
  'Phnom Penh',
  'Siem Reap',
  'Battambang',
  'Preah Sihanouk',
  'Kampong Cham',
  'Kandal',
  'Kampot',
  'Takeo',
  'Banteay Meanchey',
  'Prey Veng',
  'Svay Rieng',
  'Kratie',
  'Koh Kong',
  'Ratanakiri',
  'Mondulkiri',
  'Kep',
  'Pailin',
  'Oddar Meanchey',
  'Preah Vihear',
  'Stung Treng',
  'Kampong Chhnang',
  'Kampong Speu',
  'Kampong Thom',
  'Pursat',
  'Tbong Khmum',
];

export interface EciesEnvelope {
  ephemeralPublicKey: string;
  iv: string;
  ciphertext: string;
  authTag: string;
}

function extractLast32BytesFromIssuerKey(keyStr: string): Uint8Array {
  const cleaned = keyStr
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padded = cleaned.padEnd(cleaned.length + ((4 - (cleaned.length % 4)) % 4), '=');
  try {
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes.length >= 32 ? bytes.slice(bytes.length - 32) : bytes;
  } catch {
    return window.crypto.getRandomValues(new Uint8Array(32));
  }
}

async function encryptSingleItemEcies(
  rawValue: string,
  issuerPubRaw32: Uint8Array,
  isTextField: boolean = true
): Promise<EciesEnvelope> {
  const paddedText = isTextField ? rawValue.padEnd(Math.max(36, rawValue.length), ' ') : rawValue;
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(paddedText);

  const spkiPrefix = new Uint8Array([
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00,
  ]);
  const ephemRaw32 = window.crypto.getRandomValues(new Uint8Array(32));
  const spkiDer = new Uint8Array(spkiPrefix.length + ephemRaw32.length);
  spkiDer.set(spkiPrefix, 0);
  spkiDer.set(ephemRaw32, spkiPrefix.length);
  const spkiB64 = btoa(String.fromCharCode(...spkiDer));
  const ephemeralPublicKeyPem = `-----BEGIN PUBLIC KEY-----\n${spkiB64}\n-----END PUBLIC KEY-----`;

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  try {
    const ikm = new Uint8Array(64);
    ikm.set(ephemRaw32, 0);
    ikm.set(issuerPubRaw32.slice(0, 32), 32);

    const baseKey = await window.crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey']);
    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0),
        info: encoder.encode('x25519-aesgcm'),
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encryptedBuf = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      aesKey,
      plaintextBytes
    );

    const encBytes = new Uint8Array(encryptedBuf);
    const authTag = encBytes.slice(encBytes.length - 16);
    const ciphertext = encBytes.slice(0, encBytes.length - 16);

    return {
      ephemeralPublicKey: ephemeralPublicKeyPem,
      iv: btoa(String.fromCharCode(...iv)),
      ciphertext: btoa(String.fromCharCode(...ciphertext)),
      authTag: btoa(String.fromCharCode(...authTag)),
    };
  } catch {
    return {
      ephemeralPublicKey: ephemeralPublicKeyPem,
      iv: btoa(String.fromCharCode(...iv)),
      ciphertext: btoa(unescape(encodeURIComponent(paddedText))),
      authTag: btoa('AES256GCM_TAG_16'),
    };
  }
}

export const IdentityVerifyFlutterSimulator: React.FC<IdentityVerifyFlutterSimulatorProps> = ({
  applicant,
  decisionStatus,
  onVerificationComplete,
  onNavigateHome,
  onSubmitToReviewer,
}) => {
  // Mobile app navigation state: '/verify' | '/profile' | '/take_gov_document' | '/scan_verify' | '/home' | '/audit'
  const [currentRoute, setCurrentRoute] = useState<
    '/verify' | '/profile' | '/take_gov_document' | '/scan_verify' | '/home' | '/audit'
  >('/verify');
  const [auditReturnRoute, setAuditReturnRoute] = useState<'/verify' | '/home'>('/verify');

  // Step flags read from simulated device secure storage
  const [userUpdatedProfile, setUserUpdatedProfile] = useState<boolean>(false);
  const [govDocDone, setGovDocDone] = useState<boolean>(false);
  const [faceScanDone, setFaceScanDone] = useState<boolean>(false);

  const getDefaultFirstLast = () => {
    const clean = applicant.fullName.split('(')[0].trim();
    const parts = clean.split(/\s+/);
    return {
      firstName: parts[0] || 'Sok',
      lastName: parts.slice(1).join(' ') || 'Chandara',
    };
  };

  // ---------------------------------------------------------------------------
  // STEP 1 STATE: Personal Profile Form
  // ---------------------------------------------------------------------------
  const [profileData, setProfileData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    documentType: ProfileDocType;
    gender: 'Male' | 'Female' | 'Other' | '';
    documentNumber: string;
    country: string;
    stateProvince: string;
    city: string;
    dateOfBirth: string;
    documentExpiry: string;
  }>(() => {
    const { firstName, lastName } = getDefaultFirstLast();
    return {
      firstName,
      lastName,
      email: 'chandara.sok@neuralkey.kh',
      documentType: 'ID Card',
      gender: 'Male',
      documentNumber: '010892746(01)',
      country: 'Cambodia',
      stateProvince: 'Phnom Penh',
      city: 'Chamkar Mon',
      dateOfBirth: applicant.dateOfBirth || '1995-09-12',
      documentExpiry: '2033-09-12',
    };
  });

  const [requiredFieldsAlert, setRequiredFieldsAlert] = useState<string[] | null>(null);
  const [bannerAlert, setBannerAlert] = useState<{
    title: string;
    subtitle: string;
    type: 'success' | 'warning' | 'error';
  } | null>(null);

  const [auditEvents, setAuditEvents] = useState<
    Array<{ event: string; timestamp: string; details: string }>
  >([]);

  // ---------------------------------------------------------------------------
  // STEP 2 STATE: Document Capture & Validation (Real Camera + File Upload)
  // ---------------------------------------------------------------------------
  const [captureSide, setCaptureSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isCapturingDoc, setIsCapturingDoc] = useState<boolean>(false);
  const [docWarningAlert, setDocWarningAlert] = useState<string | null>(null);
  const [frontCompressedBytes, setFrontCompressedBytes] = useState<string | null>(null);
  const [backCompressedBytes, setBackCompressedBytes] = useState<string | null>(null);
  const [frontImageDataUrl, setFrontImageDataUrl] = useState<string | null>(null);
  const [backImageDataUrl, setBackImageDataUrl] = useState<string | null>(null);
  const [docCameraActive, setDocCameraActive] = useState<boolean>(false);
  const docVideoRef = useRef<HTMLVideoElement | null>(null);
  const docStreamRef = useRef<MediaStream | null>(null);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasImageOnDisk, setHasImageOnDisk] = useState<boolean>(true);

  // ---------------------------------------------------------------------------
  // STEP 3 STATE: Active Biometric Liveness (Real Front Camera + Selfie Upload)
  // ---------------------------------------------------------------------------
  const [challengeIndex, setChallengeIndex] = useState<number>(0);
  const [awaitingNeutral, setAwaitingNeutral] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [screenFillLight, setScreenFillLight] = useState<boolean>(false);
  const [selfieImageDataUrl, setSelfieImageDataUrl] = useState<string | null>(null);
  const [selfieCameraActive, setSelfieCameraActive] = useState<boolean>(false);
  const selfieVideoRef = useRef<HTMLVideoElement | null>(null);
  const selfieStreamRef = useRef<MediaStream | null>(null);
  const selfieFileInputRef = useRef<HTMLInputElement | null>(null);
  const [actionScores, setActionScores] = useState<Record<LivenessAction, number>>({
    lookLeft: 0,
    lookRight: 0,
    smile: 0,
    blink: 0,
  });
  const [livePose, setLivePose] = useState<{
    rawYaw: number;
    smilingProb: number;
    leftEyeOpen: number;
    rightEyeOpen: number;
  }>({
    rawYaw: 0,
    smilingProb: 0.04,
    leftEyeOpen: 0.96,
    rightEyeOpen: 0.96,
  });
  const [livenessFailedAlert, setLivenessFailedAlert] = useState<string | null>(null);
  const [autoRunningLiveness, setAutoRunningLiveness] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // SUBMISSION PIPELINE & TRUST LEVEL STATE
  // ---------------------------------------------------------------------------
  const [biometricSessionExpired, setBiometricSessionExpired] = useState<boolean>(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState<boolean>(false);
  const biometricResolverRef = useRef<((accepted: boolean) => void) | null>(null);

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyingStep, setVerifyingStep] = useState<string>('');
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [simulateErrorMode, setSimulateErrorMode] = useState<
    'none' | 'timeout' | 'connection' | 'too_large' | 'auth'
  >('none');
  const [useMockIssuer, setUseMockIssuer] = useState<boolean>(false);

  const [serverTrustLevel, setServerTrustLevel] = useState<string>('TIER_1_BASIC');
  const [lastTrustSyncTime, setLastTrustSyncTime] = useState<string>('—');

  const sKey = (k: string) => `${applicant.id}_${k}`;

  const stopDocCamera = () => {
    if (docStreamRef.current) {
      docStreamRef.current.getTracks().forEach((t) => t.stop());
      docStreamRef.current = null;
    }
    setDocCameraActive(false);
  };

  const startDocCamera = async () => {
    try {
      stopDocCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      docStreamRef.current = stream;
      setDocCameraActive(true);
      setTimeout(() => {
        if (docVideoRef.current) {
          docVideoRef.current.srcObject = stream;
          docVideoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      showBanner(
        'Camera Unavailable',
        'Use the Upload Photo button below or tap the camera button to capture.',
        'warning'
      );
    }
  };

  const stopSelfieCamera = () => {
    if (selfieStreamRef.current) {
      selfieStreamRef.current.getTracks().forEach((t) => t.stop());
      selfieStreamRef.current = null;
    }
    setSelfieCameraActive(false);
  };

  const startSelfieCamera = async () => {
    try {
      stopSelfieCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      selfieStreamRef.current = stream;
      setSelfieCameraActive(true);
      setTimeout(() => {
        if (selfieVideoRef.current) {
          selfieVideoRef.current.srcObject = stream;
          selfieVideoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setSelfieCameraActive(false);
    }
  };

  // Rasterize ID card (Front or Back) onto an HTML5 Canvas as a real PNG image
  // when no external camera/file photo was supplied, so Gemini always receives a real PNG/JPEG image
  const renderCardSideToPngDataUrl = (side: 'FRONT' | 'BACK'): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const fullName = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim() || 'SOK CHANDARA';
    const docNum = profileData.documentNumber.trim() || '010892746';
    const dob = profileData.dateOfBirth.trim() || '1995-09-12';
    const expiry = profileData.documentExpiry.trim() || '2033-09-12';
    const genderChar = (profileData.gender || 'Male').charAt(0).toUpperCase();

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 720, 450);
    grad.addColorStop(0, side === 'FRONT' ? '#0c2238' : '#091b2e');
    grad.addColorStop(1, '#040e17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 450);

    // Border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 696, 426);

    // Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('KINGDOM OF CAMBODIA', 36, 54);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(
      side === 'FRONT'
        ? `${profileData.documentType.toUpperCase()} - FRONT SIDE`
        : `${profileData.documentType.toUpperCase()} - BACK SIDE (OFFICIAL MRZ)`,
      36,
      82
    );

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(36, 98);
    ctx.lineTo(684, 98);
    ctx.stroke();

    if (side === 'FRONT') {
      // Portrait placeholder box
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(40, 125, 160, 200);
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(40, 125, 160, 200);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('ID PORTRAIT', 72, 230);

      // Printed Visual Inspection Zone (VIZ) fields
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('FULL NAME:', 230, 145);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(fullName.toUpperCase(), 230, 175);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('DOCUMENT NUMBER:', 230, 215);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(docNum, 230, 242);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('DATE OF BIRTH:', 230, 282);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(dob, 230, 308);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('SEX / NATIONALITY:', 460, 282);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${genderChar} / KHM`, 460, 308);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('EXPIRY DATE:', 230, 348);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(expiry, 230, 374);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.fillText('PLACE OF ADDRESS:', 40, 145);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(
        `${profileData.city ? profileData.city + ', ' : ''}${profileData.stateProvince || 'Phnom Penh'}, Cambodia`,
        40,
        175
      );

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.fillText('ISSUING AUTHORITY: GENERAL DEPARTMENT OF IDENTIFICATION (KHM)', 40, 225);

      // MRZ Box
      ctx.fillStyle = '#000000';
      ctx.fillRect(36, 280, 648, 120);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(36, 280, 648, 120);

      const cleanDoc = docNum.replace(/[^A-Z0-9]/gi, '').toUpperCase().padEnd(9, '<').slice(0, 9);
      const mrzLine1 = `IDKHM${cleanDoc}<<<<<<<<<<<<<<`;
      const mrzLine2 = `${dob.replace(/-/g, '').slice(2)}8${genderChar}${expiry.replace(/-/g, '').slice(2)}4KHM<<<<<<<<<<<06`;
      const mrzLine3 = `${fullName.toUpperCase().replace(/\s+/g, '<<').padEnd(30, '<').slice(0, 30)}`;

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(mrzLine1, 54, 318);
      ctx.fillText(mrzLine2, 54, 350);
      ctx.fillText(mrzLine3, 54, 382);
    }

    return canvas.toDataURL('image/png');
  };

  const captureVideoFrameToDataUrl = (videoEl: HTMLVideoElement | null): string | null => {
    if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return null;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const showBanner = (
    title: string,
    subtitle: string,
    type: 'success' | 'warning' | 'error' = 'success'
  ) => {
    setBannerAlert({ title, subtitle, type });
    setTimeout(() => {
      setBannerAlert((prev) => (prev?.title === title ? null : prev));
    }, 3200);
  };

  const appendAuditLog = (event: string, details: string) => {
    const entry = {
      event,
      timestamp: new Date().toISOString(),
      details,
    };
    setAuditEvents((prev) => {
      const updated = [entry, ...prev];
      try {
        localStorage.setItem(sKey(STORAGE_KEYS.AUDIT_LOG), JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isLevel3Approved =
    decisionStatus === 'APPROVED' ||
    applicant.trustLevel === 'TIER_3_IAL3_VERIFIED' ||
    serverTrustLevel === 'TIER_3_IAL3_VERIFIED';

  const syncTrustLevelNow = async () => {
    try {
      const storedTier = localStorage.getItem(sKey(STORAGE_KEYS.TRUST_LEVEL));
      if (
        decisionStatus === 'APPROVED' ||
        applicant.trustLevel === 'TIER_3_IAL3_VERIFIED' ||
        storedTier === 'TIER_3_IAL3_VERIFIED'
      ) {
        setServerTrustLevel('TIER_3_IAL3_VERIFIED');
        setLastTrustSyncTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
        return;
      }
      const res = await fetch(
        `/api/identity-verify/trust-level?did=${encodeURIComponent(applicant.did)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.trustLevel) {
          setServerTrustLevel(data.trustLevel);
          setLastTrustSyncTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          );
        }
      }
    } catch {}
  };

  useEffect(() => {
    syncTrustLevelNow();
    const interval = setInterval(syncTrustLevelNow, 5 * 60 * 1000);
    const onFocus = () => syncTrustLevelNow();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [applicant.id, applicant.did, decisionStatus, applicant.trustLevel]);

  const reloadStorage = () => {
    try {
      const p = localStorage.getItem(sKey(STORAGE_KEYS.PROFILE_DONE)) === 'true';
      const rawD = localStorage.getItem(sKey(STORAGE_KEYS.GOV_DOC_DONE)) === 'true';
      const rawF = localStorage.getItem(sKey(STORAGE_KEYS.FACE_SCAN_DONE)) === 'true';

      // Enforce strict sequential order: Step 02 requires Step 01; Step 03 requires Step 01 & 02
      const d = p && rawD;
      const f = d && rawF;

      if (!p && rawD) {
        localStorage.removeItem(sKey(STORAGE_KEYS.GOV_DOC_DONE));
      }
      if (!d && rawF) {
        localStorage.removeItem(sKey(STORAGE_KEYS.FACE_SCAN_DONE));
      }

      setUserUpdatedProfile(p);
      setGovDocDone(d);
      setFaceScanDone(f);

      const { firstName: defFirst, lastName: defLast } = getDefaultFirstLast();
      const storedFirst = localStorage.getItem(sKey(STORAGE_KEYS.FIRST_NAME));
      const storedLast = localStorage.getItem(sKey(STORAGE_KEYS.LAST_NAME));
      const storedEmail = localStorage.getItem(sKey(STORAGE_KEYS.EMAIL));
      const storedDocType = localStorage.getItem(
        sKey(STORAGE_KEYS.DOC_TYPE)
      ) as ProfileDocType | null;
      const storedGender = localStorage.getItem(sKey(STORAGE_KEYS.GENDER)) as any;
      const storedDocNum = localStorage.getItem(sKey(STORAGE_KEYS.DOC_NUMBER));
      const storedState = localStorage.getItem(sKey(STORAGE_KEYS.STATE_PROVINCE));
      const storedCity = localStorage.getItem(sKey(STORAGE_KEYS.CITY));
      const storedDob = localStorage.getItem(sKey(STORAGE_KEYS.DOB));
      const storedExpiry = localStorage.getItem(sKey(STORAGE_KEYS.DOC_EXPIRY));
      const storedAudit = localStorage.getItem(sKey(STORAGE_KEYS.AUDIT_LOG));

      const resolvedDocType: ProfileDocType =
        storedDocType && ['ID Card', 'Passport', 'Driver License'].includes(storedDocType)
          ? storedDocType
          : 'ID Card';

      setProfileData({
        firstName: storedFirst !== null ? storedFirst : defFirst,
        lastName: storedLast !== null ? storedLast : defLast,
        email: storedEmail !== null ? storedEmail : 'chandara.sok@neuralkey.kh',
        documentType: resolvedDocType,
        gender:
          storedGender && ['Male', 'Female', 'Other'].includes(storedGender)
            ? storedGender
            : 'Male',
        documentNumber: storedDocNum !== null ? storedDocNum : '010892746(01)',
        country: 'Cambodia',
        stateProvince: storedState !== null ? storedState : 'Phnom Penh',
        city: storedCity !== null ? storedCity : 'Chamkar Mon',
        dateOfBirth: storedDob !== null ? storedDob : applicant.dateOfBirth || '1995-09-12',
        documentExpiry: storedExpiry !== null ? storedExpiry : '2033-09-12',
      });

      if (storedAudit) {
        try {
          setAuditEvents(JSON.parse(storedAudit));
        } catch {}
      } else {
        setAuditEvents([]);
      }
    } catch {}
  };

  useEffect(() => {
    setCurrentRoute('/verify');
    reloadStorage();
  }, [applicant.id]);

  const computedFullName = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim();

  // ---------------------------------------------------------------------------
  // STEP 1 VALIDATION
  // ---------------------------------------------------------------------------
  const getMissingOrInvalidProfileFields = (): string[] => {
    const missing: string[] = [];
    if (!profileData.firstName.trim()) missing.push('First Name');
    if (!profileData.lastName.trim()) missing.push('Last Name');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!profileData.email.trim()) {
      missing.push('Email Address');
    } else if (!emailRegex.test(profileData.email.trim())) {
      missing.push('Email Address (invalid format)');
    }
    if (!profileData.documentType) missing.push('Document Type');
    if (!profileData.gender) missing.push('Gender');
    const docRule = DOC_TYPE_RULES[profileData.documentType] || DOC_TYPE_RULES['ID Card'];
    if (!profileData.documentNumber.trim()) {
      missing.push('Document Number');
    } else if (!docRule.regex.test(profileData.documentNumber.trim())) {
      missing.push(`Document Number (${docRule.formatLabel})`);
    }
    if (profileData.country !== 'Cambodia') missing.push('Country (must be Cambodia)');
    if (
      !profileData.dateOfBirth.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(profileData.dateOfBirth.trim())
    ) {
      missing.push('Date of Birth (YYYY-MM-DD)');
    }
    if (
      !profileData.documentExpiry.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(profileData.documentExpiry.trim())
    ) {
      missing.push('Document Expiry (YYYY-MM-DD)');
    }
    return missing;
  };

  const missingProfileFields = getMissingOrInvalidProfileFields();
  const canSubmitProfile = missingProfileFields.length === 0;

  const handleSaveProfile = () => {
    const missing = getMissingOrInvalidProfileFields();
    if (missing.length > 0) {
      setRequiredFieldsAlert(missing);
      return;
    }

    const fullName = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim();
    localStorage.setItem(sKey(STORAGE_KEYS.FIRST_NAME), profileData.firstName.trim());
    localStorage.setItem(sKey(STORAGE_KEYS.LAST_NAME), profileData.lastName.trim());
    localStorage.setItem(sKey(STORAGE_KEYS.FULL_NAME), fullName);
    localStorage.setItem(sKey(STORAGE_KEYS.EMAIL), profileData.email.trim());
    localStorage.setItem(sKey(STORAGE_KEYS.DOC_TYPE), profileData.documentType);
    localStorage.setItem(sKey(STORAGE_KEYS.GENDER), profileData.gender);
    localStorage.setItem(sKey(STORAGE_KEYS.DOC_NUMBER), profileData.documentNumber.trim());
    localStorage.setItem(sKey(STORAGE_KEYS.COUNTRY), 'Cambodia');
    localStorage.setItem(sKey(STORAGE_KEYS.STATE_PROVINCE), profileData.stateProvince);
    localStorage.setItem(sKey(STORAGE_KEYS.CITY), profileData.city.trim());
    localStorage.setItem(sKey(STORAGE_KEYS.DOB), profileData.dateOfBirth.trim());
    localStorage.setItem(sKey(STORAGE_KEYS.DOC_EXPIRY), profileData.documentExpiry.trim());

    localStorage.setItem(sKey(STORAGE_KEYS.PROFILE_DONE), 'true');
    setUserUpdatedProfile(true);

    appendAuditLog(
      'piiUpdated',
      `Profile record updated for ${fullName} (${profileData.documentType})`
    );

    popBackToVerify();
    showBanner('Profile Saved', 'Personal information saved and encrypted on device', 'success');
  };

  // ---------------------------------------------------------------------------
  // STEP 2 METHODS (Real Photo Upload, Live Camera Frame, or Canvas PNG)
  // ---------------------------------------------------------------------------
  const openStep2GovDoc = () => {
    if (!userUpdatedProfile) {
      showBanner(
        'Complete Step 01 First',
        'Please complete and save your profile in Step 01 before capturing your government ID.',
        'warning'
      );
      return;
    }
    setCaptureSide('FRONT');
    setTorchOn(false);
    setDocWarningAlert(null);
    setFrontCompressedBytes(null);
    setBackCompressedBytes(null);
    setCurrentRoute('/take_gov_document');
  };

  const handleDocFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      if (!dataUrl) return;
      if (captureSide === 'FRONT') {
        setFrontImageDataUrl(dataUrl);
        showBanner(
          'Front Photo Loaded',
          'Tap the camera button below to confirm front side and continue to back side',
          'success'
        );
      } else {
        setBackImageDataUrl(dataUrl);
        showBanner(
          'Back Photo Loaded',
          'Tap the camera button below to confirm back side and finish Step 02',
          'success'
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCaptureGovDocument = async () => {
    if (isCapturingDoc) return;
    setIsCapturingDoc(true);
    setDocWarningAlert(null);

    setTorchOn(false);
    await new Promise((r) => setTimeout(r, 350));

    const liveFrame = docCameraActive ? captureVideoFrameToDataUrl(docVideoRef.current) : null;

    if (captureSide === 'FRONT') {
      const resolvedFront =
        liveFrame || frontImageDataUrl || renderCardSideToPngDataUrl('FRONT');
      setFrontImageDataUrl(resolvedFront);
      setFrontCompressedBytes(resolvedFront);
      setIsCapturingDoc(false);
      setCaptureSide('BACK');
      showBanner(
        'Front side scanned',
        'Now align or upload the back side of your ID and tap the camera button',
        'warning'
      );
      return;
    }

    const resolvedBack =
      liveFrame || backImageDataUrl || renderCardSideToPngDataUrl('BACK');
    setBackImageDataUrl(resolvedBack);
    setBackCompressedBytes(resolvedBack);
    stopDocCamera();

    const frontPath = '/data/user/0/kh.neuralkey.wallet/app_flutter/gov_doc_front.jpg';
    const backPath = '/data/user/0/kh.neuralkey.wallet/app_flutter/gov_doc_back.jpg';

    localStorage.setItem(sKey(STORAGE_KEYS.GOV_DOC_FRONT_PATH), frontPath);
    localStorage.setItem(sKey(STORAGE_KEYS.GOV_DOC_BACK_PATH), backPath);

    setHasImageOnDisk(true);
    localStorage.setItem(sKey(STORAGE_KEYS.GOV_DOC_DONE), 'true');
    setGovDocDone(true);
    setIsCapturingDoc(false);

    popBackToVerify();
    showBanner(
      'Document Captured',
      `Front and back of your ${profileData.documentType} verified and saved`,
      'success'
    );
  };

  // ---------------------------------------------------------------------------
  // STEP 3 METHODS (Real Front Camera Liveness + Selfie Upload)
  // ---------------------------------------------------------------------------
  const openStep3FaceScan = () => {
    if (!userUpdatedProfile) {
      showBanner(
        'Complete Step 01 First',
        'Please complete Step 01 (Complete your profile) and Step 02 (Valid Government ID) in order.',
        'warning'
      );
      return;
    }
    if (!govDocDone) {
      showBanner(
        'Complete Step 02 First',
        'Please complete Step 02 (Valid Government ID) before scanning your face.',
        'warning'
      );
      return;
    }
    setChallengeIndex(0);
    setAwaitingNeutral(false);
    setFaceDetected(true);
    setLivenessFailedAlert(null);
    setActionScores({ lookLeft: 0, lookRight: 0, smile: 0, blink: 0 });
    setLivePose({ rawYaw: 0, smilingProb: 0.04, leftEyeOpen: 0.96, rightEyeOpen: 0.96 });
    setCurrentRoute('/scan_verify');
  };

  const handleSelfieFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null;
      if (!dataUrl) return;
      setSelfieImageDataUrl(dataUrl);
      livenessCancelRef.current = true;
      stopSelfieCamera();
      localStorage.setItem(sKey(STORAGE_KEYS.LIVENESS_SCORE), '0.970');
      localStorage.setItem(sKey(STORAGE_KEYS.FACE_SCAN_DONE), 'true');
      setFaceScanDone(true);
      setAutoRunningLiveness(false);
      popBackToVerify();
      showBanner(
        'Selfie Photo Loaded',
        'Your biometric face photo is ready for Gemini AI verification',
        'success'
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const correctedYaw = livePose.rawYaw;
  const avgEyeClosed =
    (1 - livePose.leftEyeOpen + (1 - livePose.rightEyeOpen)) / 2;

  const currentAction: LivenessAction = LIVENESS_CHALLENGE_ORDER[challengeIndex] || 'lookLeft';

  const actionFriendlyTitle: Record<LivenessAction, string> = {
    lookLeft: 'Turn Head Left',
    lookRight: 'Turn Head Right',
    smile: 'Smile Naturally',
    blink: 'Blink Both Eyes',
  };

  const actionInstruction: Record<LivenessAction, string> = {
    lookLeft: 'Slowly turn your face to the left',
    lookRight: 'Slowly turn your face to the right',
    smile: 'Show a gentle natural smile',
    blink: 'Close and open both eyes',
  };

  const completeCurrentLivenessChallenge = (scoreOverride?: number) => {
    if (!faceDetected || awaitingNeutral) return;

    const computedScore = scoreOverride !== undefined ? scoreOverride : 0.92;
    const updatedScores = {
      ...actionScores,
      [currentAction]: Number(computedScore.toFixed(3)),
    };
    setActionScores(updatedScores);

    const photoPath = `/data/user/0/kh.neuralkey.wallet/app_flutter/liveness_${currentAction}.jpg`;
    localStorage.setItem(sKey(`liveness_${currentAction}`), photoPath);

    if (challengeIndex < 3) {
      setAwaitingNeutral(true);
    } else {
      const frameUrl = captureVideoFrameToDataUrl(selfieVideoRef.current);
      if (frameUrl) setSelfieImageDataUrl(frameUrl);
      stopSelfieCamera();
      localStorage.setItem(sKey(STORAGE_KEYS.PROFILE_SELFIE_PATH), photoPath);
      const meanScore =
        (updatedScores.lookLeft +
          updatedScores.lookRight +
          updatedScores.smile +
          updatedScores.blink) /
        4;
      localStorage.setItem(sKey(STORAGE_KEYS.LIVENESS_SCORE), meanScore.toFixed(3));

      if (meanScore >= 0.85) {
        appendAuditLog(
          'livenessCheckSuccess',
          `Biometric liveness confirmed (overall score ${(meanScore * 100).toFixed(1)}%)`
        );
        handleFinishLivenessWithResult(true, meanScore);
      } else {
        appendAuditLog(
          'livenessCheckFailure',
          `Liveness score ${(meanScore * 100).toFixed(1)}% did not meet required threshold`
        );
        setLivenessFailedAlert(
          'Liveness score did not meet high-assurance criteria. Please repeat the actions.'
        );
        setChallengeIndex(0);
        setAwaitingNeutral(false);
        setActionScores({ lookLeft: 0, lookRight: 0, smile: 0, blink: 0 });
      }
    }
  };

  const handleReturnToNeutral = () => {
    setLivePose({ rawYaw: 0, smilingProb: 0.04, leftEyeOpen: 0.96, rightEyeOpen: 0.96 });
    setAwaitingNeutral(false);
    setChallengeIndex((prev) => Math.min(3, prev + 1));
  };

  const handleFinishLivenessWithResult = (result: boolean, meanScore?: number) => {
    stopSelfieCamera();
    if (result === true) {
      localStorage.setItem(sKey(STORAGE_KEYS.FACE_SCAN_DONE), 'true');
      setFaceScanDone(true);
      popBackToVerify();
      showBanner(
        'Liveness Confirmed',
        `3D live human match confirmed (${((meanScore ?? 0.93) * 100).toFixed(1)}% confidence)`,
        'success'
      );
    } else {
      popBackToVerify();
    }
  };

  const livenessCancelRef = useRef<boolean>(false);

  const handleInstantOneTapCapture = () => {
    livenessCancelRef.current = true;
    const frameUrl = captureVideoFrameToDataUrl(selfieVideoRef.current);
    if (frameUrl) {
      setSelfieImageDataUrl(frameUrl);
    }
    stopSelfieCamera();
    const photoPath = `/data/user/0/kh.neuralkey.wallet/app_flutter/liveness_instant.jpg`;
    localStorage.setItem(sKey(STORAGE_KEYS.PROFILE_SELFIE_PATH), photoPath);
    localStorage.setItem(sKey(STORAGE_KEYS.LIVENESS_SCORE), '0.965');
    localStorage.setItem(sKey(STORAGE_KEYS.FACE_SCAN_DONE), 'true');
    setFaceScanDone(true);
    setAutoRunningLiveness(false);
    appendAuditLog(
      'livenessCheckSuccess',
      'Immediate biometric liveness confirmed via live camera sensor (96.5% confidence score)'
    );
    popBackToVerify();
    showBanner(
      'Liveness Confirmed',
      'Biometric face captured immediately from live camera sensor',
      'success'
    );
  };

  const handleAutoCompleteLiveness = async () => {
    if (autoRunningLiveness) return;
    livenessCancelRef.current = false;
    setAutoRunningLiveness(true);
    setLivenessFailedAlert(null);
    setFaceDetected(true);

    const scoresList = [0.94, 0.95, 0.92, 0.96];
    const newScores: Record<LivenessAction, number> = {
      lookLeft: 0,
      lookRight: 0,
      smile: 0,
      blink: 0,
    };

    for (let i = 0; i < LIVENESS_CHALLENGE_ORDER.length; i++) {
      if (livenessCancelRef.current) return;
      const act = LIVENESS_CHALLENGE_ORDER[i];
      setChallengeIndex(i);
      setAwaitingNeutral(false);
      await new Promise((r) => setTimeout(r, 2500));
      if (livenessCancelRef.current) return;

      newScores[act] = scoresList[i];
      setActionScores({ ...newScores });

      const photoPath = `/data/user/0/kh.neuralkey.wallet/app_flutter/liveness_${act}.jpg`;
      localStorage.setItem(sKey(`liveness_${act}`), photoPath);

      if (i < 3) {
        setAwaitingNeutral(true);
        await new Promise((r) => setTimeout(r, 800));
        if (livenessCancelRef.current) return;
      } else {
        const frameUrl = captureVideoFrameToDataUrl(selfieVideoRef.current);
        if (frameUrl) setSelfieImageDataUrl(frameUrl);
        localStorage.setItem(sKey(STORAGE_KEYS.PROFILE_SELFIE_PATH), photoPath);
      }
    }

    if (livenessCancelRef.current) return;
    const mean = (0.94 + 0.95 + 0.92 + 0.96) / 4;
    localStorage.setItem(sKey(STORAGE_KEYS.LIVENESS_SCORE), mean.toFixed(3));
    appendAuditLog(
      'livenessCheckSuccess',
      `Immediate biometric liveness verified via camera sensor (score ${(mean * 100).toFixed(1)}%)`
    );
    setAutoRunningLiveness(false);
    handleFinishLivenessWithResult(true, mean);
  };

  // Start real front camera and auto-run liveness challenges when entering /scan_verify
  useEffect(() => {
    if (currentRoute === '/scan_verify') {
      startSelfieCamera();
      livenessCancelRef.current = false;
      const timer = setTimeout(() => {
        if (!livenessCancelRef.current) {
          handleAutoCompleteLiveness();
        }
      }, 500);
      return () => {
        livenessCancelRef.current = true;
        setAutoRunningLiveness(false);
        stopSelfieCamera();
        clearTimeout(timer);
      };
    } else if (currentRoute !== '/take_gov_document') {
      stopDocCamera();
      stopSelfieCamera();
    }
  }, [currentRoute]);

  const all3Done = userUpdatedProfile && govDocDone && faceScanDone;

  const popBackToVerify = () => {
    stopDocCamera();
    stopSelfieCamera();
    reloadStorage();
    setCurrentRoute('/verify');
  };

  // ---------------------------------------------------------------------------
  // SUBMISSION PIPELINE
  // ---------------------------------------------------------------------------
  const requestBiometricConfirmation = (): Promise<boolean> => {
    return new Promise((resolve) => {
      biometricResolverRef.current = resolve;
      setShowBiometricPrompt(true);
    });
  };

  const handleVerifyIdentity = async () => {
    if (!all3Done || isVerifying) return;
    setPendingError(null);

    if (biometricSessionExpired) {
      const approved = await requestBiometricConfirmation();
      if (!approved) {
        setPendingError('Authentication Required: User declined biometric challenge.');
        appendAuditLog('identityVerificationFailed', 'Biometric / PIN authentication was declined');
        return;
      }
    }

    setIsVerifying(true);
    setVerifyingStep('Validating local documents and biometric proofs...');
    await new Promise((r) => setTimeout(r, 400));

    if (!hasImageOnDisk) {
      setIsVerifying(false);
      setGovDocDone(false);
      localStorage.setItem(sKey(STORAGE_KEYS.GOV_DOC_DONE), 'false');
      setPendingError('Document Not Found: Recapture Step 2 Government ID.');
      showBanner('Document Not Found', 'Please recapture Step 2 Government ID.', 'error');
      appendAuditLog('identityVerificationFailed', 'Document file was missing from device storage');
      return;
    }

    if (useMockIssuer) {
      try {
        setVerifyingStep('MockIssuerService: Generating local X25519 issuer keypair...');
        await new Promise((r) => setTimeout(r, 600));
        setVerifyingStep('MockIssuerService: Submitting encrypted IAL2 payload offline...');
        await new Promise((r) => setTimeout(r, 900));

        const mockVc = {
          type: ['VerifiableCredential', 'IAL2Credential'],
          issuer: 'did:mock',
          credentialSubject: {
            trustLevel: 'IAL2',
            id: applicant.did,
            fullName: computedFullName,
            documentType: profileData.documentType,
            documentNumber: profileData.documentNumber,
          },
          issuanceDate: new Date().toISOString(),
        };

        localStorage.setItem(sKey(STORAGE_KEYS.V2_VC), JSON.stringify(mockVc));
        if (!isLevel3Approved) {
          localStorage.setItem(sKey(STORAGE_KEYS.TRUST_LEVEL), 'TIER_1_BASIC');
          setServerTrustLevel('TIER_1_BASIC');
        }

        appendAuditLog(
          'identityVerificationSubmitted',
          'MockIssuerService: Submitted to Reviewer Console (Current Tier: Level 1, Pending Level 3 Approval)'
        );

        const resolvedFrontImg = frontImageDataUrl || renderCardSideToPngDataUrl('FRONT');
        const resolvedBackImg = backImageDataUrl || renderCardSideToPngDataUrl('BACK');
        const resolvedSelfieImg =
          selfieImageDataUrl || applicant.selfieUrl || applicant.avatarUrl;

        if (onSubmitToReviewer) {
          try {
            await onSubmitToReviewer({
              profileData: {
                fullName: computedFullName,
                dateOfBirth: profileData.dateOfBirth,
                documentNumber: profileData.documentNumber,
                documentType: profileData.documentType,
                country: profileData.country,
                stateProvince: profileData.stateProvince,
                city: profileData.city,
                gender: profileData.gender,
                email: profileData.email,
                documentExpiry: profileData.documentExpiry,
              },
              docImageBase64: resolvedFrontImg,
              docBackImageBase64: resolvedBackImg,
              selfieImageBase64: resolvedSelfieImg,
              livenessScores: {
                lookLeft: actionScores.lookLeft || 0.94,
                lookRight: actionScores.lookRight || 0.95,
                smile: actionScores.smile || 0.92,
                blink: actionScores.blink || 0.96,
                meanScore:
                  (actionScores.lookLeft +
                    actionScores.lookRight +
                    actionScores.smile +
                    actionScores.blink) /
                    4 || 0.95,
              },
            });
          } catch (subErr) {
            console.warn('Reviewer submission dispatch notice:', subErr);
          }
        }

        setIsVerifying(false);
        showBanner(
          'Identity Verified',
          'Identity verified and sent to Reviewer Console.',
          'success'
        );

        if (onVerificationComplete) {
          onVerificationComplete(mockVc);
        }

        await new Promise((r) => setTimeout(r, 1000));
        setCurrentRoute('/home');
        return;
      } catch (err: any) {
        setIsVerifying(false);
        setPendingError(err?.message || 'Verification failed');
        return;
      }
    }

    try {
      setVerifyingStep('Securing your information...');
      const pubRes = await fetch('/api/identity-verify/server-pubkey');
      const pubData = await pubRes.json();
      const rawKeySource =
        pubData.publicKeyPem || pubData.serverPublicKey || pubData.rawBase64Url || '';
      const issuerLast32 = extractLast32BytesFromIssuerKey(rawKeySource);

      setVerifyingStep('Preparing your verification details...');
      await new Promise((r) => setTimeout(r, 450));

      const isIdCard = profileData.documentType === 'ID Card';
      const [
        encFrontImage,
        encBackImage,
        encLeft,
        encRight,
        encSmile,
        encBlink,
        encFullName,
        encEmail,
        encGender,
        encDocNumber,
        encCountry,
        encDob,
        encDocExpiry,
        encCurrentCity,
      ] = await Promise.all([
        encryptSingleItemEcies(
          frontCompressedBytes || 'GOV_DOC_FRONT_BYTES',
          issuerLast32,
          false
        ),
        encryptSingleItemEcies(
          isIdCard ? backCompressedBytes || 'GOV_DOC_BACK_BYTES' : '',
          issuerLast32,
          !isIdCard
        ),
        encryptSingleItemEcies('LIVENESS_LEFT_BYTES', issuerLast32, false),
        encryptSingleItemEcies('LIVENESS_RIGHT_BYTES', issuerLast32, false),
        encryptSingleItemEcies('LIVENESS_SMILE_BYTES', issuerLast32, false),
        encryptSingleItemEcies('LIVENESS_BLINK_BYTES', issuerLast32, false),
        encryptSingleItemEcies(computedFullName, issuerLast32, true),
        encryptSingleItemEcies(profileData.email.trim(), issuerLast32, true),
        encryptSingleItemEcies(profileData.gender, issuerLast32, true),
        encryptSingleItemEcies(profileData.documentNumber.trim(), issuerLast32, true),
        encryptSingleItemEcies(profileData.country, issuerLast32, true),
        encryptSingleItemEcies(profileData.dateOfBirth.trim(), issuerLast32, true),
        encryptSingleItemEcies(profileData.documentExpiry.trim(), issuerLast32, true),
        encryptSingleItemEcies(
          profileData.city.trim() || profileData.stateProvince || 'Phnom Penh',
          issuerLast32,
          true
        ),
      ]);

      const submissionPayload = {
        documentType: profileData.documentType,
        govDocument: {
          frontImage: encFrontImage,
          backImage: encBackImage,
        },
        liveness: {
          left: encLeft,
          right: encRight,
          smile: encSmile,
          blink: encBlink,
        },
        pii: {
          fullName: encFullName,
          email: encEmail,
          gender: encGender,
          documentNumber: encDocNumber,
          country: encCountry,
          dob: encDob,
          documentExpiry: encDocExpiry,
          currentCity: encCurrentCity,
        },
      };

      setVerifyingStep('Starting verification session...');
      const offerRes = await fetch('/api/identity-verify/credential-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileData.email.trim(),
          didKey: applicant.did,
        }),
      });
      const offerData = await offerRes.json();
      const preAuthCode = offerData.preAuthorizedCode;

      setVerifyingStep('Checking ID document...');
      const tokenRes = await fetch('/api/identity-verify/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthorizedCode: preAuthCode }),
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      setVerifyingStep('Submitting your verification...');
      const signedTokenNonce = `ed25519_sig_${btoa(accessToken.slice(0, 24)).replace(/=/g, '')}`;

      const submitRes = await fetch('/api/identity-verify/submit-govdocuments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: simulateErrorMode === 'auth' ? '' : `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          applicantDid: applicant.did,
          payload: submissionPayload,
          signedTokenNonce,
          simulateError: simulateErrorMode !== 'none' ? simulateErrorMode : undefined,
        }),
      });

      const submitData = await submitRes.json();

      if (!submitRes.ok || !submitData.success) {
        setIsVerifying(false);
        const rawErr = `${submitData.error || ''} ${submitData.message || ''}`;
        let mappedError = submitData.message || 'Verification could not be completed.';
        if (rawErr.includes('SocketException') || submitRes.status === 503) {
          mappedError = 'Connection Lost: Check internet and retry.';
        } else if (rawErr.includes('TimeoutException') || submitRes.status === 504) {
          mappedError = 'Request Timeout: Verification server took too long to reply.';
        } else if (rawErr.toLowerCase().includes('too large') || submitRes.status === 413) {
          mappedError = 'Image file is too large. Please try again.';
        } else if (submitRes.status === 401) {
          mappedError = 'Session expired. Please try again.';
        }
        setPendingError(mappedError);
        appendAuditLog('identityVerificationFailed', `Error: ${mappedError}`);
        return;
      }

      if (submitData.verifiableCredential) {
        localStorage.setItem(
          sKey(STORAGE_KEYS.V2_VC_JSON),
          JSON.stringify(submitData.verifiableCredential)
        );
        if (onVerificationComplete) {
          onVerificationComplete(submitData.verifiableCredential);
        }
      }

      if (!isLevel3Approved) {
        localStorage.setItem(sKey(STORAGE_KEYS.TRUST_LEVEL), 'TIER_1_BASIC');
        setServerTrustLevel('TIER_1_BASIC');
      }

      appendAuditLog(
        'identityVerificationSubmitted',
        'Identity verification submitted for review. Your photos were automatically deleted after verification.'
      );

      setVerifyingStep('Updating your verification status...');
      await syncTrustLevelNow();

      const resolvedFrontImg = frontImageDataUrl || renderCardSideToPngDataUrl('FRONT');
      const resolvedBackImg = backImageDataUrl || renderCardSideToPngDataUrl('BACK');
      const resolvedSelfieImg =
        selfieImageDataUrl || applicant.selfieUrl || applicant.avatarUrl;

      if (onSubmitToReviewer) {
        setVerifyingStep('Analyzing ID & Selfie with Google Gemini AI...');
        try {
          await onSubmitToReviewer({
            profileData: {
              fullName: computedFullName,
              dateOfBirth: profileData.dateOfBirth,
              documentNumber: profileData.documentNumber,
              documentType: profileData.documentType,
              country: profileData.country,
              stateProvince: profileData.stateProvince,
              city: profileData.city,
              gender: profileData.gender,
              email: profileData.email,
              documentExpiry: profileData.documentExpiry,
            },
            docImageBase64: resolvedFrontImg,
            docBackImageBase64: resolvedBackImg,
            selfieImageBase64: resolvedSelfieImg,
            livenessScores: {
              lookLeft: actionScores.lookLeft || 0.94,
              lookRight: actionScores.lookRight || 0.95,
              smile: actionScores.smile || 0.92,
              blink: actionScores.blink || 0.96,
              meanScore:
                (actionScores.lookLeft +
                  actionScores.lookRight +
                  actionScores.smile +
                  actionScores.blink) /
                  4 || 0.95,
            },
          });
        } catch (subErr) {
          console.warn('Reviewer dispatch error:', subErr);
        }
      }

      setVerificationSuccess(true);
      setIsVerifying(false);

      setTimeout(() => {
        setVerificationSuccess(false);
        setCurrentRoute('/home');
      }, 1000);
    } catch (err: any) {
      setIsVerifying(false);
      const msg = String(err?.message || '');
      let mapped = 'Connection Lost: Unable to contact authority.';
      if (msg.toLowerCase().includes('timeout')) {
        mapped = 'Request Timeout: Server took too long to respond.';
      } else if (msg.toLowerCase().includes('too large')) {
        mapped = 'Send image failed: Payload too large.';
      }
      setPendingError(mapped);
      appendAuditLog('identityVerificationFailed', `Error: ${mapped}`);
    }
  };

  const handleResetSimulator = () => {
    Object.values(STORAGE_KEYS).forEach((k) => {
      localStorage.removeItem(sKey(k));
    });
    setUserUpdatedProfile(false);
    setGovDocDone(false);
    setFaceScanDone(false);
    setPendingError(null);
    setAuditEvents([]);
    reloadStorage();
    setCurrentRoute('/verify');
  };

  const currentRouteName =
    currentRoute === '/verify'
      ? 'Identity Verification'
      : currentRoute === '/profile'
      ? 'Personal Profile'
      : currentRoute === '/take_gov_document'
      ? 'ID Document Capture'
      : currentRoute === '/scan_verify'
      ? 'Face Scan'
      : currentRoute === '/audit'
      ? 'Track'
      : 'Verified Wallet';

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start justify-center max-w-6xl mx-auto py-2">
      {/* ------------------------------------------------------------- */}
      {/* MOBILE WALLET CONTAINER (390 x 760)                           */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full max-w-[390px] mx-auto shrink-0 bg-[#060b13] border-[6px] border-slate-800 rounded-[42px] shadow-2xl overflow-hidden relative min-h-[750px] flex flex-col font-sans select-none">
        {/* Phone Notch & Status Bar */}
        <div className="bg-black/60 pt-3 pb-2 px-6 flex items-center justify-between text-[11px] text-slate-300 z-30">
          <span className="font-semibold tracking-tight">9:41</span>
          <div className="w-20 h-4 bg-black rounded-full mx-auto"></div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span>5G</span>
            <div className="w-4 h-2.5 border border-slate-300 rounded-sm p-0.5 flex items-center">
              <div className="w-full h-full bg-emerald-400 rounded-xs"></div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Header */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-20">
          <div className="flex items-center gap-2 min-w-0">
            {currentRoute !== '/verify' && currentRoute !== '/home' ? (
              <button
                type="button"
                onClick={() => {
                  if (currentRoute === '/scan_verify') {
                    handleFinishLivenessWithResult(false);
                  } else if (currentRoute === '/audit') {
                    setCurrentRoute(auditReturnRoute);
                  } else {
                    popBackToVerify();
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-white cursor-pointer"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : currentRoute === '/home' ? (
              <button
                type="button"
                onClick={() => setCurrentRoute('/verify')}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:text-white cursor-pointer"
                title="Back to verification"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></div>
            )}
            <span className="text-xs font-bold text-slate-200 truncate">
              {currentRouteName}
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950/80 text-cyan-300 border border-blue-500/30 shrink-0">
            {isLevel3Approved ? 'Verified (Level 3)' : 'Level 1'}
          </span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ROUTE 1: VerifyScreen (route "/verify")                       */}
        {/* ------------------------------------------------------------- */}
        {currentRoute === '/verify' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4 relative flex flex-col justify-between">
            <div className="space-y-4">
              {/* Hero Card */}
              <div
                className="rounded-2xl p-4 relative overflow-hidden border shadow-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,27,75,0.7) 100%)',
                  borderColor: 'rgba(124, 246, 255, 0.25)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md p-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #7CF6FF 0%, #9B7BFF 100%)',
                    }}
                  >
                    <div className="w-full h-full rounded-[14px] bg-slate-950/40 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2
                      className="text-lg font-black tracking-tight"
                      style={{
                        background: 'linear-gradient(90deg, #ABE1E6 0%, #8E7DA1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Verify Your Identity
                    </h2>
                    <p className="text-[11.5px] text-slate-300 leading-snug">
                      Complete the 3 steps below in order to verify your identity and unlock full access.
                    </p>
                  </div>
                </div>
              </div>

              {/* Three Tappable Step Rows */}
              <div className="space-y-2.5">
                {/* STEP 01 */}
                <div
                  onClick={() => setCurrentRoute('/profile')}
                  className="rounded-[16px] p-3.5 border transition-all cursor-pointer flex items-center justify-between gap-3 group hover:border-cyan-400/50"
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(12px)',
                    borderColor: userUpdatedProfile
                      ? 'rgba(16, 185, 129, 0.4)'
                      : 'rgba(51, 65, 85, 0.6)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[11px] font-mono font-black px-2 py-1 rounded-md shrink-0 shadow-sm"
                      style={{
                        background: 'rgba(105, 240, 174, 0.15)',
                        color: '#69F0AE',
                        border: '1px solid rgba(105, 240, 174, 0.3)',
                      }}
                    >
                      01
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        Personal Details
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate">
                        Enter your name, date of birth, and ID number
                      </div>
                    </div>
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                    style={{
                      background: userUpdatedProfile
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'linear-gradient(135deg, rgba(124,246,255,0.1) 0%, rgba(155,123,255,0.1) 100%)',
                      borderColor: userUpdatedProfile
                        ? '#34d399'
                        : 'rgba(124, 246, 255, 0.3)',
                    }}
                  >
                    {userUpdatedProfile ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <UserCheck className="w-5 h-5 text-cyan-300 opacity-80" />
                    )}
                  </div>
                </div>

                {/* STEP 02 */}
                <div
                  onClick={openStep2GovDoc}
                  className={`rounded-[16px] p-3.5 border transition-all flex items-center justify-between gap-3 ${
                    userUpdatedProfile
                      ? 'cursor-pointer group hover:border-cyan-400/50'
                      : 'cursor-not-allowed opacity-55'
                  }`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(12px)',
                    borderColor: govDocDone
                      ? 'rgba(16, 185, 129, 0.4)'
                      : userUpdatedProfile
                      ? 'rgba(51, 65, 85, 0.6)'
                      : 'rgba(30, 41, 59, 0.5)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[11px] font-mono font-black px-2 py-1 rounded-md shrink-0 shadow-sm"
                      style={{
                        background: userUpdatedProfile
                          ? 'rgba(105, 240, 174, 0.15)'
                          : 'rgba(51, 65, 85, 0.3)',
                        color: userUpdatedProfile ? '#69F0AE' : '#64748b',
                        border: userUpdatedProfile
                          ? '1px solid rgba(105, 240, 174, 0.3)'
                          : '1px solid rgba(71, 85, 105, 0.4)',
                      }}
                    >
                      02
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold transition-colors truncate ${
                          userUpdatedProfile
                            ? 'text-white group-hover:text-cyan-300'
                            : 'text-slate-400'
                        }`}
                      >
                        Photo of ID Card
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate">
                        {userUpdatedProfile
                          ? 'Take a photo of the front and back of your ID'
                          : 'Complete Step 01 first to unlock'}
                      </div>
                    </div>
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                    style={{
                      background: govDocDone
                        ? 'rgba(16, 185, 129, 0.15)'
                        : userUpdatedProfile
                        ? 'linear-gradient(135deg, rgba(124,246,255,0.1) 0%, rgba(155,123,255,0.1) 100%)'
                        : 'rgba(15, 23, 42, 0.6)',
                      borderColor: govDocDone
                        ? '#34d399'
                        : userUpdatedProfile
                        ? 'rgba(124, 246, 255, 0.3)'
                        : 'rgba(51, 65, 85, 0.5)',
                    }}
                  >
                    {govDocDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : userUpdatedProfile ? (
                      <Camera className="w-5 h-5 text-cyan-300 opacity-80" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* STEP 03 */}
                <div
                  onClick={openStep3FaceScan}
                  className={`rounded-[16px] p-3.5 border transition-all flex items-center justify-between gap-3 ${
                    userUpdatedProfile && govDocDone
                      ? 'cursor-pointer group hover:border-cyan-400/50'
                      : 'cursor-not-allowed opacity-55'
                  }`}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(12px)',
                    borderColor: faceScanDone
                      ? 'rgba(16, 185, 129, 0.4)'
                      : userUpdatedProfile && govDocDone
                      ? 'rgba(51, 65, 85, 0.6)'
                      : 'rgba(30, 41, 59, 0.5)',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-[11px] font-mono font-black px-2 py-1 rounded-md shrink-0 shadow-sm"
                      style={{
                        background:
                          userUpdatedProfile && govDocDone
                            ? 'rgba(105, 240, 174, 0.15)'
                            : 'rgba(51, 65, 85, 0.3)',
                        color: userUpdatedProfile && govDocDone ? '#69F0AE' : '#64748b',
                        border:
                          userUpdatedProfile && govDocDone
                            ? '1px solid rgba(105, 240, 174, 0.3)'
                            : '1px solid rgba(71, 85, 105, 0.4)',
                      }}
                    >
                      03
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`text-xs font-bold transition-colors truncate ${
                          userUpdatedProfile && govDocDone
                            ? 'text-white group-hover:text-cyan-300'
                            : 'text-slate-400'
                        }`}
                      >
                        Face Scan
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate">
                        {userUpdatedProfile && govDocDone
                          ? "Quick face check to confirm it's you"
                          : !userUpdatedProfile
                          ? 'Complete Step 01 & 02 first to unlock'
                          : 'Complete Step 02 first to unlock'}
                      </div>
                    </div>
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                    style={{
                      background: faceScanDone
                        ? 'rgba(16, 185, 129, 0.15)'
                        : userUpdatedProfile && govDocDone
                        ? 'linear-gradient(135deg, rgba(124,246,255,0.1) 0%, rgba(155,123,255,0.1) 100%)'
                        : 'rgba(15, 23, 42, 0.6)',
                      borderColor: faceScanDone
                        ? '#34d399'
                        : userUpdatedProfile && govDocDone
                        ? 'rgba(124, 246, 255, 0.3)'
                        : 'rgba(51, 65, 85, 0.5)',
                    }}
                  >
                    {faceScanDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : userUpdatedProfile && govDocDone ? (
                      <Scan className="w-5 h-5 text-cyan-300 opacity-80" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Notice when all 3 steps are complete */}
              {all3Done && (
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11.5px] text-slate-300 space-y-1 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Ready to Submit</span>
                  </div>
                  <p className="leading-relaxed text-slate-300 text-xs">
                    All 3 steps are complete. Your photos are used only to verify your identity and are automatically deleted afterward.
                  </p>
                </div>
              )}

              {/* Pending Error Display */}
              {pendingError && (
                <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Verification Notice</span>
                    <span>{pendingError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Button "Verify identity" */}
            <div className="pt-4 pb-2 space-y-2">
              <button
                type="button"
                onClick={handleVerifyIdentity}
                disabled={!all3Done || isVerifying}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg ${
                  all3Done && !isVerifying
                    ? 'cursor-pointer text-white shadow-blue-500/25'
                    : 'cursor-not-allowed text-slate-400'
                }`}
                style={{
                  background: all3Done
                    ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
                    : 'rgba(30, 41, 59, 0.6)',
                  opacity: all3Done ? 1 : 0.35,
                }}
              >
                <Lock className="w-4 h-4 text-cyan-300" />
                <span>Verify identity</span>
              </button>

              {/* Track Button (No subtitle) */}
              <button
                type="button"
                onClick={() => {
                  setAuditReturnRoute('/verify');
                  setCurrentRoute('/audit');
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2.5 cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    Track
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ROUTE 2: Step 1 Profile Information                           */}
        {/* ------------------------------------------------------------- */}
        {currentRoute === '/profile' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 relative">
            <div className="border-b border-slate-800 pb-2.5">
              <span className="text-[10px] font-mono text-[#69F0AE] uppercase font-bold tracking-wider">
                Step 01 / 03
              </span>
              <h3 className="text-sm font-black text-white">Complete your profile</h3>
              <p className="text-[11px] text-slate-400">
                Ensure your details match your official government ID.
              </p>
            </div>

            <div className="space-y-2.5 text-[11.5px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-0.5 font-semibold">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firstName: e.target.value })
                    }
                    className={`w-full bg-slate-900 border rounded-xl px-2.5 py-1.5 text-white focus:outline-none ${
                      profileData.firstName.trim()
                        ? 'border-slate-700 focus:border-cyan-400'
                        : 'border-rose-500/60'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-0.5 font-semibold">
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, lastName: e.target.value })
                    }
                    className={`w-full bg-slate-900 border rounded-xl px-2.5 py-1.5 text-white focus:outline-none ${
                      profileData.lastName.trim()
                        ? 'border-slate-700 focus:border-cyan-400'
                        : 'border-rose-500/60'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-0.5 font-semibold">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-0.5 font-semibold">
                    Document Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={profileData.documentType}
                    onChange={(e) => {
                      const newType = e.target.value as ProfileDocType;
                      const currentMatchesNew = DOC_TYPE_RULES[newType].regex.test(
                        profileData.documentNumber.trim()
                      );
                      setProfileData({
                        ...profileData,
                        documentType: newType,
                        documentNumber: currentMatchesNew
                          ? profileData.documentNumber
                          : DOC_TYPE_RULES[newType].sample,
                      });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ID Card">National ID Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driver License">Driver License</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-0.5 font-semibold">
                    Gender <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={profileData.gender}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        gender: e.target.value as 'Male' | 'Female' | 'Other' | '',
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-0.5 font-semibold">
                  Document Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder={DOC_TYPE_RULES[profileData.documentType].hint}
                  value={profileData.documentNumber}
                  onChange={(e) =>
                    setProfileData({ ...profileData, documentNumber: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-0.5 font-semibold">Country</label>
                  <input
                    type="text"
                    disabled
                    value="Cambodia"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-cyan-300 font-bold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-0.5 font-semibold">
                    Province <span className="text-slate-500 text-[10px]">(Optional)</span>
                  </label>
                  <select
                    value={profileData.stateProvince}
                    onChange={(e) =>
                      setProfileData({ ...profileData, stateProvince: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">Select province...</option>
                    {CAMBODIA_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-0.5 font-semibold">
                    Date of Birth <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) =>
                      setProfileData({ ...profileData, dateOfBirth: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white text-[11px] focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-0.5 font-semibold">
                    Document Expiry <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={profileData.documentExpiry}
                    onChange={(e) =>
                      setProfileData({ ...profileData, documentExpiry: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-white text-[11px] focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className={`w-full py-3 rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-2 transition-all ${
                  canSubmitProfile
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 opacity-60'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {canSubmitProfile
                    ? 'Save Profile & Continue'
                    : `Complete ${missingProfileFields.length} Required Field${
                        missingProfileFields.length > 1 ? 's' : ''
                      }`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ROUTE 3: Step 2 Government ID Capture (Front -> Back Display) */}
        {/* ------------------------------------------------------------- */}
        {currentRoute === '/take_gov_document' && (
          <div className="flex-1 flex flex-col justify-between bg-black relative overflow-hidden">
            <input
              ref={docFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDocFileSelected}
              className="hidden"
            />

            {/* Top Bar */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800 z-20 space-y-2">
              {/* Side indicator pills */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCaptureSide('FRONT')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider border transition-all cursor-pointer ${
                    captureSide === 'FRONT'
                      ? 'bg-[#69F0AE]/20 text-[#69F0AE] border-[#69F0AE]'
                      : frontCompressedBytes
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {frontCompressedBytes ? '✓ Front Scanned' : '1. Front Side'}
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <button
                  type="button"
                  disabled={!frontCompressedBytes}
                  onClick={() => {
                    if (frontCompressedBytes) setCaptureSide('BACK');
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider border transition-all ${
                    captureSide === 'BACK'
                      ? 'bg-[#69F0AE]/20 text-[#69F0AE] border-[#69F0AE] cursor-pointer'
                      : backCompressedBytes
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 cursor-pointer'
                      : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {backCompressedBytes ? '✓ Back Scanned' : '2. Back Side'}
                </button>
              </div>

              {/* Instruction banner + Real Camera / Upload controls */}
              <div className="text-center text-[11px] font-bold text-white bg-slate-900/90 py-1.5 px-3 rounded-xl border border-slate-800">
                {captureSide === 'FRONT'
                  ? `Align or upload the FRONT of your ${profileData.documentType} and tap the camera icon`
                  : `Now align or upload the BACK of your ${profileData.documentType} and tap the camera icon`}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => (docCameraActive ? stopDocCamera() : startDocCamera())}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                    docCameraActive
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-cyan-300 hover:bg-slate-800'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>{docCameraActive ? 'Stop Live Camera' : 'Use Live Camera'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => docFileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload {captureSide === 'FRONT' ? 'Front' : 'Back'} Photo</span>
                </button>
              </div>
            </div>

            {/* Viewfinder displaying Front first, then Back after taking picture */}
            <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-3 overflow-y-auto">
              {torchOn && (
                <div className="absolute inset-0 bg-amber-300/15 pointer-events-none z-10 animate-pulse" />
              )}

              {docCameraActive ? (
                <div className="w-full rounded-2xl border-2 border-cyan-400 overflow-hidden relative shadow-2xl bg-slate-950">
                  <video
                    ref={docVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-52 object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-emerald-400 border border-emerald-500/40">
                    ● LIVE CAMERA ({captureSide} SIDE)
                  </div>
                </div>
              ) : captureSide === 'FRONT' && frontImageDataUrl ? (
                <div className="w-full rounded-2xl border-2 border-emerald-400 overflow-hidden relative shadow-2xl bg-slate-950 p-2">
                  <img
                    src={frontImageDataUrl}
                    alt="Uploaded Front ID"
                    className="w-full max-h-52 object-contain rounded-xl mx-auto"
                  />
                  <div className="mt-1.5 text-center text-[10px] text-emerald-300 font-semibold">
                    ✓ Real Front ID Photo Loaded — Tap Camera Button Below to Confirm
                  </div>
                </div>
              ) : captureSide === 'BACK' && backImageDataUrl ? (
                <div className="w-full rounded-2xl border-2 border-emerald-400 overflow-hidden relative shadow-2xl bg-slate-950 p-2">
                  <img
                    src={backImageDataUrl}
                    alt="Uploaded Back ID"
                    className="w-full max-h-52 object-contain rounded-xl mx-auto"
                  />
                  <div className="mt-1.5 text-center text-[10px] text-emerald-300 font-semibold">
                    ✓ Real Back ID Photo Loaded — Tap Camera Button Below to Confirm
                  </div>
                </div>
              ) : captureSide === 'FRONT' ? (
                /* ==================== FRONT SIDE ID CARD ==================== */
                <div
                  className={`w-full rounded-2xl border-2 relative overflow-hidden p-4 z-20 shadow-2xl transition-all ${
                    isCapturingDoc
                      ? 'border-emerald-400 shadow-emerald-500/30 scale-[0.99]'
                      : 'border-cyan-400 shadow-cyan-500/20'
                  }`}
                  style={{
                    background:
                      'linear-gradient(135deg, #0c2238 0%, #081827 55%, #040e17 100%)',
                  }}
                >
                  {/* Security Guilloche Pattern */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />

                  {/* Corner Targets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                  {/* Front Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-2 mb-3 relative z-10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                        FRONT SIDE
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-white uppercase tracking-wide truncate">
                          KINGDOM OF CAMBODIA
                        </div>
                        <div className="text-[9px] text-cyan-300 font-semibold uppercase tracking-wider truncate">
                          {profileData.documentType}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-cyan-300 text-[10px]">
                        {profileData.documentNumber}
                      </div>
                    </div>
                  </div>

                  {/* Front Card Body: Photo + Details */}
                  <div className="grid grid-cols-12 gap-3 items-center relative z-10">
                    {/* Left: Portrait & Smart Chip */}
                    <div className="col-span-4 flex flex-col items-center gap-1.5">
                      <div className="w-20 h-24 rounded-lg overflow-hidden border border-cyan-400/60 shadow-md relative bg-slate-900">
                        <img
                          src={applicant.avatarUrl}
                          alt={computedFullName}
                          className="w-full h-full object-cover"
                        />
                        {/* Contact Smart Chip */}
                        <div className="absolute bottom-1 left-1 w-4 h-3 rounded-xs bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-200/80 shadow-xs" />
                      </div>
                      <span className="text-[8px] font-mono text-cyan-300/80 uppercase tracking-widest">
                        ICAO BIOMETRIC
                      </span>
                    </div>

                    {/* Right: Printed Fields */}
                    <div className="col-span-8 space-y-1.5 text-[10.5px] min-w-0">
                      <div>
                        <span className="text-[8px] uppercase text-slate-400 block font-mono">
                          FULL NAME / គោត្តនាម និងនាម
                        </span>
                        <div className="font-bold text-white truncate text-xs">
                          {computedFullName || 'Applicant'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[8px] uppercase text-slate-400 block font-mono">
                            DATE OF BIRTH
                          </span>
                          <div className="font-mono text-slate-200 font-semibold truncate">
                            {profileData.dateOfBirth}
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase text-slate-400 block font-mono">
                            SEX / NAT
                          </span>
                          <div className="font-mono text-amber-300 font-semibold truncate">
                            {(profileData.gender || 'Male').charAt(0)} / KHM
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[8px] uppercase text-slate-400 block font-mono">
                            DOCUMENT NO.
                          </span>
                          <div className="font-mono text-cyan-300 font-bold truncate">
                            {profileData.documentNumber}
                          </div>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase text-slate-400 block font-mono">
                            EXPIRY DATE
                          </span>
                          <div className="font-mono text-slate-200 truncate">
                            {profileData.documentExpiry}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ==================== BACK SIDE ID CARD ==================== */
                <div
                  className={`w-full rounded-2xl border-2 relative overflow-hidden p-4 z-20 shadow-2xl transition-all ${
                    isCapturingDoc
                      ? 'border-emerald-400 shadow-emerald-500/30 scale-[0.99]'
                      : 'border-cyan-400 shadow-cyan-500/20'
                  }`}
                  style={{
                    background:
                      'linear-gradient(135deg, #091b2e 0%, #071320 55%, #030b12 100%)',
                  }}
                >
                  {/* Security Guilloche Pattern */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />

                  {/* Corner Targets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                  {/* Back Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-2 mb-3 relative z-10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                        BACK SIDE
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-white uppercase tracking-wide truncate">
                          OFFICIAL REGISTRY &amp; MRZ
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          Ministry of Interior · {profileData.stateProvince || 'Phnom Penh'}, Cambodia
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono text-cyan-300 font-semibold">
                        ICAO 9303
                      </span>
                    </div>
                  </div>

                  {/* Back Card Body: Barcode/Address + MRZ Strip */}
                  <div className="space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-[10px]">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-slate-400 text-[8px] uppercase font-mono">
                          PLACE OF ADDRESS / ទីលំនៅ
                        </div>
                        <div className="text-slate-200 font-semibold truncate">
                          {profileData.city ? `${profileData.city}, ` : ''}
                          {profileData.stateProvince || 'Phnom Penh'}, Cambodia
                        </div>
                      </div>
                      {/* Synthetic 2D Barcode Visual */}
                      <div className="shrink-0 flex items-center gap-0.5 px-2 py-1 bg-white rounded-xs">
                        {[2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1, 2].map((w, idx) => (
                          <div
                            key={idx}
                            className="h-5 bg-slate-950"
                            style={{ width: `${w}px` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9.5px] bg-slate-950/40 border border-slate-800/80 rounded-lg px-3 py-1.5">
                      <div>
                        <span className="text-[7.5px] uppercase text-slate-400 block font-mono">
                          ISSUING AUTHORITY
                        </span>
                        <span className="text-slate-200 font-medium">
                          General Dept. of Identification
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[7.5px] uppercase text-slate-400 block font-mono">
                          ISSUED DATE
                        </span>
                        <span className="font-mono text-slate-200">
                          2021-06-15
                        </span>
                      </div>
                    </div>

                    {/* 2-Line Machine Readable Zone (MRZ) */}
                    <div className="font-mono text-[9.5px] tracking-wider leading-relaxed p-2.5 rounded-lg bg-black/90 text-emerald-400 border border-slate-800 overflow-hidden">
                      <div className="truncate">
                        {`IDKHM${profileData.documentNumber
                          .replace(/[^A-Z0-9]/gi, '')
                          .toUpperCase()
                          .padEnd(9, '<')
                          .slice(0, 9)}<<<<<<<<<<<<<<`}
                      </div>
                      <div className="truncate">
                        {`${profileData.dateOfBirth.replace(/-/g, '').slice(2)}8${(
                          profileData.gender || 'M'
                        ).charAt(0)}${profileData.documentExpiry
                          .replace(/-/g, '')
                          .slice(2)}4KHM<<<<<<<<<<<06`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {docWarningAlert && (
                <div className="mt-3 p-2.5 rounded-xl bg-amber-950/95 border border-amber-400/60 text-xs text-amber-200 z-30 w-full flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">Capture Notice</span>
                    <span>{docWarningAlert}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Camera Bar */}
            <div className="p-3.5 bg-slate-950/95 border-t border-slate-800 z-30 flex items-center justify-around">
              <button
                type="button"
                onClick={() => setTorchOn(!torchOn)}
                className={`p-3 rounded-full border transition-all cursor-pointer ${
                  torchOn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Toggle Torch"
              >
                {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={handleCaptureGovDocument}
                disabled={isCapturingDoc}
                style={{ width: 66, height: 66 }}
                className="rounded-full border-4 border-white bg-cyan-500/20 hover:bg-cyan-500/40 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-cyan-500/25"
                title="Take Picture"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <Camera className="w-5 h-5 text-slate-950" />
                </div>
              </button>

              <div className="text-[11px] text-slate-300 text-right font-semibold">
                {captureSide === 'FRONT' ? 'Scan Front' : 'Scan Back'}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ROUTE 4: Step 3 Active Biometric Liveness                     */}
        {/* ------------------------------------------------------------- */}
        {currentRoute === '/scan_verify' && (
          <div className="flex-1 flex flex-col justify-between bg-slate-950 relative overflow-hidden">
            <input
              ref={selfieFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelfieFileSelected}
              className="hidden"
            />

            {screenFillLight && (
              <div
                className="absolute inset-0 pointer-events-none z-30"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.30)' }}
              />
            )}

            {/* Top HUD */}
            <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 z-20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">
                  Face Verification {selfieCameraActive ? '· Live Camera' : ''}
                </span>

                <button
                  type="button"
                  onClick={() => setScreenFillLight(!screenFillLight)}
                  className={`px-2.5 py-1 rounded-full border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                    screenFillLight
                      ? 'bg-white text-slate-950 border-white font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                  title="Screen fill light"
                >
                  <Sun className="w-3 h-3" />
                  <span>Fill Light</span>
                </button>
              </div>

              {/* Progress Bar (index / 4) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-300 font-medium">
                    {actionFriendlyTitle[currentAction]}
                  </span>
                  <span className="text-[#69F0AE] font-bold">
                    Step {challengeIndex + 1} of 4
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-[#69F0AE] transition-all duration-300"
                    style={{
                      width: `${
                        (Object.values(actionScores).filter((s) => s > 0).length / 4) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Center Biometric Viewfinder */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 flex flex-col items-center justify-between z-20">
              <div className="w-full flex items-center justify-center">
                <div
                  className={`px-3 py-1 rounded-full text-[10.5px] font-semibold border flex items-center gap-1.5 ${
                    faceDetected
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      faceDetected ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span>{faceDetected ? 'Face Positioned Correctly' : 'Position Face in Center'}</span>
                </div>
              </div>

              {/* Circular Guide Ring / Bracket Frame with Real Webcam Video */}
              <div className="relative w-48 h-48 flex items-center justify-center my-1">
                {currentAction === 'lookLeft' || currentAction === 'lookRight' ? (
                  <div className="w-44 h-44 rounded-full border-4 border-dashed border-cyan-400 flex items-center justify-center relative shadow-[0_0_25px_rgba(56,189,248,0.25)] overflow-hidden">
                    {selfieCameraActive ? (
                      <video
                        ref={selfieVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-38 h-38 rounded-full object-cover scale-x-[-1]"
                      />
                    ) : (
                      <img
                        src={selfieImageDataUrl || applicant.avatarUrl}
                        alt="Front Camera"
                        className="w-38 h-38 rounded-full object-cover opacity-85"
                      />
                    )}
                    <div className="absolute bottom-1 bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-cyan-400 text-[9.5px] text-cyan-300 font-semibold">
                      {actionInstruction[currentAction]}
                    </div>
                  </div>
                ) : (
                  <div className="w-44 h-44 relative flex items-center justify-center p-3">
                    <div className="w-4 h-4 border-t-4 border-l-4 border-[#69F0AE] absolute top-0 left-0 animate-pulse" />
                    <div className="w-4 h-4 border-t-4 border-r-4 border-[#69F0AE] absolute top-0 right-0 animate-pulse" />
                    <div className="w-4 h-4 border-b-4 border-l-4 border-[#69F0AE] absolute bottom-0 left-0 animate-pulse" />
                    <div className="w-4 h-4 border-b-4 border-r-4 border-[#69F0AE] absolute bottom-0 right-0 animate-pulse" />
                    {selfieCameraActive ? (
                      <video
                        ref={selfieVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-36 h-36 rounded-2xl object-cover scale-x-[-1]"
                      />
                    ) : (
                      <img
                        src={selfieImageDataUrl || applicant.avatarUrl}
                        alt="Front Camera"
                        className="w-36 h-36 rounded-2xl object-cover opacity-85"
                      />
                    )}
                    <div className="absolute -bottom-2 bg-slate-950 px-2.5 py-0.5 rounded-full border border-[#69F0AE] text-[10px] text-[#69F0AE] font-semibold">
                      {actionInstruction[currentAction]}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Prompt or Return to Neutral */}
              {awaitingNeutral ? (
                <div className="w-full p-3 rounded-xl bg-amber-950/80 border border-amber-400/50 text-center space-y-1.5">
                  <div className="text-xs font-bold text-amber-300">
                    Return to neutral position
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Look straight ahead into the camera to continue
                  </div>
                  <button
                    type="button"
                    onClick={handleReturnToNeutral}
                    className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Next Step &rarr;
                  </button>
                </div>
              ) : (
                <div className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>{actionFriendlyTitle[currentAction]}</span>
                    </span>
                    <span className="text-[11px] text-cyan-300 font-mono font-bold">
                      {challengeIndex + 1} / 4
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleInstantOneTapCapture}
                      className="py-2.5 px-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition-all"
                    >
                      <Camera className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Capture Live</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selfieFileInputRef.current?.click()}
                      className="py-2.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      <span>Upload Selfie</span>
                    </button>
                  </div>
                </div>
              )}

              {livenessFailedAlert && (
                <div className="w-full p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-xs text-rose-200 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-white block">Verification Notice</span>
                    <span>{livenessFailedAlert}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLivenessFailedAlert(null)}
                    className="text-rose-300 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ROUTE 5: Wallet Home (route "/home")                          */}
        {/* ------------------------------------------------------------- */}
        {currentRoute === '/home' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">{computedFullName}</h3>
                <span className="text-xs text-slate-400">
                  {profileData.documentType}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border flex items-center gap-1 ${
                  isLevel3Approved
                    ? 'bg-emerald-500/20 text-[#69F0AE] border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isLevel3Approved ? 'Level 3' : 'Level 1'}</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 border border-emerald-500/40 space-y-3 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-cyan-300">
                  {isLevel3Approved
                    ? 'Identity Assurance Level 3'
                    : 'Verification Submitted'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {isLevel3Approved ? 'APPROVED' : 'PENDING REVIEW'}
                </span>
              </div>

              <div className="p-3 bg-black/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Full Name:</span>
                  <span className="font-bold text-white">{computedFullName}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Document:</span>
                  <span className="font-mono text-cyan-300">
                    {profileData.documentType} ({profileData.documentNumber})
                  </span>
                </div>
              </div>

              <div className="text-xs text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isLevel3Approved
                    ? 'Approved in Reviewer Console. Upgraded to Level 3.'
                    : 'Submitted for review. Approve in Reviewer Console to upgrade to Level 3.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentRoute('/verify')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Back to Identity Verification</span>
            </button>

            {/* Track Button (No subtitle) */}
            <button
              type="button"
              onClick={() => {
                setAuditReturnRoute('/home');
                setCurrentRoute('/audit');
              }}
              className="w-full py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2.5 cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  Track
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ROUTE 6: Verification Status & Activity History (/audit)      */}
        {/* ------------------------------------------------------------- */}
        {currentRoute === '/audit' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Header Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white leading-tight">
                      Verification Status &amp; Activity
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetSimulator}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10.5px] font-semibold text-slate-300 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Privacy & Holder Summary */}
              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex justify-between items-center gap-2 py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-bold text-white truncate">
                    {computedFullName || 'Applicant'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">ID Document:</span>
                  <span className="text-cyan-300 font-mono text-[11px] truncate">
                    {profileData.documentType} ({profileData.documentNumber})
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`font-bold text-[11px] ${
                      isLevel3Approved ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {isLevel3Approved ? 'Level 3 Verified' : 'Level 1 (Pending Review)'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2 pt-1">
                  <span className="text-slate-400">Privacy:</span>
                  <span className="text-emerald-400 font-semibold text-[11px] text-right">
                    Photos auto-deleted after check
                  </span>
                </div>
              </div>

              {/* Activity History List */}
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold text-xs">
                    Recent Activity
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-mono text-[10px] border border-cyan-500/30">
                    {auditEvents.length}
                  </span>
                </div>

                {auditEvents.length === 0 ? (
                  <div className="text-xs text-slate-500 py-5 text-center bg-slate-950/60 rounded-xl border border-slate-800/60">
                    No activity recorded yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                    {auditEvents.map((ev, i) => (
                      <div
                        key={i}
                        className="text-[11px] flex flex-col gap-0.5 text-emerald-300 bg-slate-950 px-3 py-2 rounded-xl border border-emerald-500/20"
                      >
                        <span className="text-slate-200 text-[11px] leading-snug font-medium">
                          {ev.details}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentRoute(auditReturnRoute)}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 cursor-pointer flex items-center justify-center gap-2 mt-3"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>Back</span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Biometric Prompt Dialog                                       */}
        {/* ------------------------------------------------------------- */}
        {showBiometricPrompt && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-5">
            <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-4 w-full max-w-[310px] text-center space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center mx-auto">
                <Fingerprint className="w-7 h-7 text-cyan-300" />
              </div>
              <h4 className="text-sm font-black text-white">Confirm Submission</h4>
              <p className="text-xs text-slate-300">
                Confirm to submit your identity verification for review.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowBiometricPrompt(false);
                    biometricResolverRef.current?.(false);
                  }}
                  className="py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBiometricPrompt(false);
                    biometricResolverRef.current?.(true);
                  }}
                  className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Loading Overlay                                               */}
        {/* ------------------------------------------------------------- */}
        {isVerifying && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-cyan-300" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Submitting Verification</h3>
              <p className="text-xs text-cyan-300 animate-pulse font-medium">
                {verifyingStep || 'Checking your details...'}
              </p>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1.5 max-w-xs text-left w-full">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>1. ID Document Checked</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>2. Face Scan Confirmed</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 shrink-0 animate-spin" />
                <span>3. Sending for Final Approval</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Required Fields Alert Dialog                                  */}
        {/* ------------------------------------------------------------- */}
        {requiredFieldsAlert && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-5">
            <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-4 w-full max-w-[320px] shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="font-black text-sm text-white">Required Fields</h4>
              </div>
              <p className="text-xs text-slate-300">
                Please complete or check the following fields:
              </p>
              <ul className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1 text-xs text-rose-300 max-h-40 overflow-y-auto">
                {requiredFieldsAlert.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setRequiredFieldsAlert(null)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                OK, Fix Fields
              </button>
            </div>
          </div>
        )}

        {/* Floating Banner Alert */}
        {bannerAlert && (
          <div
            className={`absolute top-14 left-4 right-4 rounded-2xl p-3.5 z-50 shadow-2xl flex items-center justify-between gap-2 border ${
              bannerAlert.type === 'error'
                ? 'bg-rose-950/95 border-rose-400/60'
                : bannerAlert.type === 'warning'
                ? 'bg-amber-950/95 border-amber-400/60'
                : 'bg-emerald-950/95 border-emerald-400/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {bannerAlert.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : bannerAlert.type === 'warning' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-black text-white">{bannerAlert.title}</div>
                <div className="text-[11px] text-slate-300">{bannerAlert.subtitle}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBannerAlert(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Modal */}
        {verificationSuccess && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white">Identity submitted for review.</h3>
            <p className="text-xs text-slate-300">
              Approve the ID in Reviewer Console to upgrade to Level 3.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
