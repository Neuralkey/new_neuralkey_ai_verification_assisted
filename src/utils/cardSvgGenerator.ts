/**
 * Utility to generate high-fidelity synthetic ASEAN identity documents (Cambodia National ID, Passport, Driver License)
 * as valid, self-contained SVG data URLs for realistic display in inspection, audit modal, and mobile views.
 */

function escapeXml(unsafe: string): string {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSyntheticCardSvg(options: {
  countryCode: string;
  countryName: string;
  docType: string;
  fullName: string;
  documentNumber: string;
  dateOfBirth: string;
  expiryDate?: string;
  gender?: string;
  avatarUrl?: string;
  caseNumber?: number;
}): string {
  const {
    countryCode = 'KHM',
    countryName = 'Kingdom of Cambodia',
    docType = 'National Identity Card',
    fullName = 'SOK CHANDARA',
    documentNumber = '010892746',
    dateOfBirth = '1995-09-12',
    expiryDate = '2033-09-12',
    gender = 'Male',
    caseNumber,
  } = options;

  const isPassport = docType.toLowerCase().includes('passport');
  const isDriverLicense = docType.toLowerCase().includes('driver');

  const bgGradStart = isPassport ? '#1a102f' : isDriverLicense ? '#0a2318' : '#0b1e36';
  const bgGradMid = isPassport ? '#120b22' : isDriverLicense ? '#061710' : '#081526';
  const bgGradEnd = isPassport ? '#0a0514' : isDriverLicense ? '#030d09' : '#040b14';
  const borderColor = isPassport ? '#a855f7' : isDriverLicense ? '#10b981' : '#0284c7';
  const accentColor = isPassport ? '#c084fc' : isDriverLicense ? '#34d399' : '#38bdf8';

  const cleanNum = documentNumber.replace(/[^a-zA-Z0-9]/g, '').padEnd(9, '<');
  const cleanDob = dateOfBirth.replace(/-/g, '').slice(2) || '950912';
  const sexChar = gender.toLowerCase().startsWith('f') ? 'F' : 'M';

  const safeCountryCode = escapeXml(countryCode);
  const safeCountryName = escapeXml(countryName.toUpperCase());
  const safeDocType = escapeXml(docType.toUpperCase());
  const safeFullName = escapeXml(fullName);
  const safeDocNum = escapeXml(documentNumber);
  const safeDob = escapeXml(dateOfBirth);
  const safeExpiry = escapeXml(expiryDate);
  const caseSuffix = caseNumber ? ` · CASE #${caseNumber}` : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="320" viewBox="0 0 500 320">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradStart}"/>
        <stop offset="50%" stop-color="${bgGradMid}"/>
        <stop offset="100%" stop-color="${bgGradEnd}"/>
      </linearGradient>
      <linearGradient id="chip" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fde68a"/>
        <stop offset="50%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#b45309"/>
      </linearGradient>
      <linearGradient id="portraitBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
      <pattern id="pat" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 0 10 L 20 10 M 10 0 L 10 20" fill="none" stroke="${accentColor}" stroke-width="0.5" opacity="0.14"/>
      </pattern>
      <radialGradient id="holo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
        <stop offset="50%" stop-color="${accentColor}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- Base Card Frame -->
    <rect width="500" height="320" rx="16" fill="url(#bg)" stroke="${borderColor}" stroke-width="2.5"/>
    <rect width="500" height="320" rx="16" fill="url(#pat)"/>

    <!-- Header Strip -->
    <rect x="0" y="0" width="500" height="62" rx="16" fill="#030712" opacity="0.78"/>
    <line x1="0" y1="62" x2="500" y2="62" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
    <rect x="18" y="16" width="36" height="28" rx="4" fill="${borderColor}" fill-opacity="0.25" stroke="${accentColor}" stroke-width="1.2"/>
    <text x="36" y="34" font-family="monospace" font-size="12" font-weight="bold" fill="${accentColor}" text-anchor="middle">${safeCountryCode.slice(0, 2)}</text>

    <text x="64" y="27" font-family="system-ui, sans-serif" font-size="11.5" font-weight="bold" fill="#ffffff" letter-spacing="0.5">ព្រះរាជាណាចក្រកម្ពុជា · ${safeCountryName}</text>
    <text x="64" y="47" font-family="system-ui, sans-serif" font-size="10.5" fill="${accentColor}" font-weight="600">${safeDocType}${escapeXml(caseSuffix)}</text>

    <text x="478" y="26" font-family="monospace" font-size="9" fill="#94a3b8" text-anchor="end">DOCUMENT NO.</text>
    <text x="478" y="47" font-family="monospace" font-size="13" font-weight="bold" fill="${accentColor}" text-anchor="end">${safeDocNum}</text>

    <!-- Portrait Frame with Self-Contained Biometric Avatar Vector -->
    <rect x="24" y="76" width="106" height="138" rx="8" fill="url(#portraitBg)" stroke="${accentColor}" stroke-width="1.5"/>
    <!-- Biometric Portrait Silhouette & Mesh Landmarks -->
    <circle cx="77" cy="122" r="24" fill="#334155" stroke="${accentColor}" stroke-width="1" opacity="0.9"/>
    <path d="M 38 206 C 38 168 116 168 116 206 Z" fill="#334155" stroke="${accentColor}" stroke-width="1" opacity="0.9"/>
    <!-- Facial Feature Mesh Overlay -->
    <circle cx="68" cy="118" r="2.2" fill="${accentColor}" opacity="0.8"/>
    <circle cx="86" cy="118" r="2.2" fill="${accentColor}" opacity="0.8"/>
    <path d="M 77 118 L 77 127 M 70 133 Q 77 138 84 133" fill="none" stroke="${accentColor}" stroke-width="1.2" opacity="0.75"/>
    <rect x="30" y="82" width="94" height="16" rx="3" fill="#020617" opacity="0.65"/>
    <text x="77" y="93" font-family="monospace" font-size="7.5" fill="${accentColor}" text-anchor="middle">ISO/IEC 19794-5</text>

    <!-- Smart e-ID Contact Chip -->
    <rect x="148" y="76" width="34" height="24" rx="4" fill="url(#chip)" stroke="#fde047" stroke-width="0.8"/>
    <line x1="148" y1="84" x2="182" y2="84" stroke="#78350f" stroke-width="0.7" opacity="0.6"/>
    <line x1="148" y1="92" x2="182" y2="92" stroke="#78350f" stroke-width="0.7" opacity="0.6"/>
    <line x1="165" y1="76" x2="165" y2="100" stroke="#78350f" stroke-width="0.7" opacity="0.6"/>

    <!-- Hologram Seal -->
    <circle cx="114" cy="196" r="14" fill="url(#holo)" stroke="${accentColor}" stroke-width="0.6" stroke-dasharray="2,2"/>

    <!-- Data Fields -->
    <text x="194" y="86" font-family="monospace" font-size="8.5" fill="#94a3b8">FULL NAME / ឈ្មោះពេញ</text>
    <text x="194" y="102" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">${safeFullName}</text>

    <text x="148" y="132" font-family="monospace" font-size="8.5" fill="#94a3b8">DATE OF BIRTH</text>
    <text x="148" y="148" font-family="monospace" font-size="12" font-weight="bold" fill="#f1f5f9">${safeDob}</text>

    <text x="275" y="132" font-family="monospace" font-size="8.5" fill="#94a3b8">NATIONALITY</text>
    <text x="275" y="148" font-family="monospace" font-size="12" font-weight="bold" fill="#fde047">${safeCountryCode}</text>

    <text x="390" y="132" font-family="monospace" font-size="8.5" fill="#94a3b8">SEX</text>
    <text x="390" y="148" font-family="monospace" font-size="12" font-weight="bold" fill="#f1f5f9">${sexChar}</text>

    <text x="148" y="178" font-family="monospace" font-size="8.5" fill="#94a3b8">EXPIRY DATE</text>
    <text x="148" y="194" font-family="monospace" font-size="12" fill="#cbd5e1">${safeExpiry}</text>

    <text x="275" y="178" font-family="monospace" font-size="8.5" fill="#94a3b8">TRUST ASSURANCE</text>
    <text x="275" y="194" font-family="monospace" font-size="11" font-weight="bold" fill="#34d399">IAL2 VERIFIED · CHIP</text>

    <!-- MRZ Stripe -->
    <rect x="16" y="228" width="468" height="74" rx="8" fill="#020617" opacity="0.92" stroke="#1e293b" stroke-width="1.2"/>
    <text x="28" y="258" font-family="monospace" font-size="12.5" fill="#34d399" letter-spacing="1.8">I&lt;${safeCountryCode}${escapeXml(cleanNum)}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
    <text x="28" y="284" font-family="monospace" font-size="12.5" fill="#34d399" letter-spacing="1.8">${escapeXml(cleanDob)}4${sexChar}3309128${safeCountryCode}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;2</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
