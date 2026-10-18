/**
 * ICAO Doc 9303 Machine Readable Zone (MRZ) Validator & Checksum Engine
 * Implements standard 7-3-1 weighting modulo 10 check digit algorithms for TD1, TD2, and TD3 travel documents.
 */

const ICAO_WEIGHTS = [7, 3, 1];

export function calculateIcaoCheckDigit(input: string): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input[i].toUpperCase();
    let val = 0;
    if (char >= '0' && char <= '9') {
      val = parseInt(char, 10);
    } else if (char >= 'A' && char <= 'Z') {
      val = char.charCodeAt(0) - 55; // A = 10, Z = 35
    } else if (char === '<') {
      val = 0;
    }
    const weight = ICAO_WEIGHTS[i % 3];
    sum += val * weight;
  }
  return sum % 10;
}

export function verifyIcaoCheckDigit(input: string, expectedDigit: string | number): boolean {
  const expected = typeof expectedDigit === 'number' ? expectedDigit : parseInt(expectedDigit, 10);
  if (isNaN(expected)) return false;
  return calculateIcaoCheckDigit(input) === expected;
}

export interface ParsedMrz {
  rawLines: string[];
  documentType: string;
  issuingState: string;
  documentNumber: string;
  docNumberCheckValid: boolean;
  dateOfBirth: string; // YYYY-MM-DD
  dobCheckValid: boolean;
  expiryDate: string; // YYYY-MM-DD
  expiryCheckValid: boolean;
  sex: string;
  holderName: string;
  compositeCheckValid: boolean;
  checksumValid: boolean;
  discrepancies: string[];
}

export function parseAndVerifyMrzLines(lines: string[]): ParsedMrz {
  const cleanLines = lines.map((l) => l.trim().toUpperCase().replace(/\s+/g, ''));
  const discrepancies: string[] = [];

  if (cleanLines.length === 0) {
    return {
      rawLines: [],
      documentType: 'UNKNOWN',
      issuingState: 'UNKNOWN',
      documentNumber: '',
      docNumberCheckValid: false,
      dateOfBirth: '',
      dobCheckValid: false,
      expiryDate: '',
      expiryCheckValid: false,
      sex: 'UNKNOWN',
      holderName: '',
      compositeCheckValid: false,
      checksumValid: false,
      discrepancies: ['No MRZ lines present on document'],
    };
  }

  // TD3 (Passports: 2 lines of 44 chars) or TD1 (ID Cards: 3 lines of 30 chars) or TD2 (2 lines of 36 chars)
  const isTd3 = cleanLines.length >= 2 && cleanLines[0].length >= 40;
  const isTd1 = cleanLines.length >= 3 && cleanLines[0].length <= 32;

  let docType = 'ID';
  let issuingState = 'KHM';
  let documentNumber = '';
  let docNumberCheckValid = true;
  let dateOfBirth = '';
  let dobCheckValid = true;
  let expiryDate = '';
  let expiryCheckValid = true;
  let sex = 'M';
  let holderName = '';
  let compositeCheckValid = true;

  if (isTd3) {
    // Line 1: P<KHM<<SOK<<CHANDARA<<<<<<<<<<<<<<<<<<<<<<<<<<<
    const line1 = cleanLines[0];
    const line2 = cleanLines[1];

    docType = line1.slice(0, 2).replace(/</g, '');
    issuingState = line1.slice(2, 5).replace(/</g, '');

    // Names in line 1: Surname<<Given Names
    const namePart = line1.slice(5).replace(/<+$/, '');
    const nameTokens = namePart.split('<<').map((t) => t.replace(/</g, ' ').trim());
    holderName = nameTokens.join(' ').trim();

    // Line 2: N021948574KHM9307044M3307048<<<<<<<<<<<<<<02
    documentNumber = line2.slice(0, 9).replace(/</g, '');
    const docCheckDigit = line2[9];
    docNumberCheckValid = verifyIcaoCheckDigit(line2.slice(0, 9), docCheckDigit);
    if (!docNumberCheckValid) {
      discrepancies.push(
        `Document Number MRZ check digit invalid: expected ${calculateIcaoCheckDigit(line2.slice(0, 9))}, got ${docCheckDigit}`
      );
    }

    const rawDob = line2.slice(13, 19); // YYMMDD
    const dobCheckDigit = line2[19];
    dobCheckValid = verifyIcaoCheckDigit(rawDob, dobCheckDigit);
    if (!dobCheckValid) {
      discrepancies.push(`DOB MRZ check digit invalid: expected ${calculateIcaoCheckDigit(rawDob)}, got ${dobCheckDigit}`);
    }
    const birthYear = parseInt(rawDob.slice(0, 2), 10);
    const fullYear = birthYear > 40 ? 1900 + birthYear : 2000 + birthYear;
    dateOfBirth = `${fullYear}-${rawDob.slice(2, 4)}-${rawDob.slice(4, 6)}`;

    sex = line2[20] === 'F' ? 'F' : 'M';

    const rawExp = line2.slice(21, 27); // YYMMDD
    const expCheckDigit = line2[27];
    expiryCheckValid = verifyIcaoCheckDigit(rawExp, expCheckDigit);
    if (!expiryCheckValid) {
      discrepancies.push(`Expiry MRZ check digit invalid: expected ${calculateIcaoCheckDigit(rawExp)}, got ${expCheckDigit}`);
    }
    const expYear = 2000 + parseInt(rawExp.slice(0, 2), 10);
    expiryDate = `${expYear}-${rawExp.slice(2, 4)}-${rawExp.slice(4, 6)}`;
  } else {
    // TD1 or TD2 fallback
    const line1 = cleanLines[0];
    const line2 = cleanLines[1] || '';

    docType = line1.slice(0, 2).replace(/</g, '') || 'I';
    issuingState = line1.slice(2, 5).replace(/</g, '') || 'KHM';
    documentNumber = line1.slice(5, 14).replace(/</g, '');
    const docCheck = line1[14];
    if (docCheck && /[0-9]/.test(docCheck)) {
      docNumberCheckValid = verifyIcaoCheckDigit(line1.slice(5, 14), docCheck);
    }

    if (line2.length >= 7) {
      const rawDob = line2.slice(0, 6);
      const dobCheck = line2[6];
      if (dobCheck && /[0-9]/.test(dobCheck)) {
        dobCheckValid = verifyIcaoCheckDigit(rawDob, dobCheck);
      }
      const birthYear = parseInt(rawDob.slice(0, 2), 10);
      const fullYear = !isNaN(birthYear) ? (birthYear > 40 ? 1900 + birthYear : 2000 + birthYear) : 1995;
      dateOfBirth = `${fullYear}-${rawDob.slice(2, 4) || '01'}-${rawDob.slice(4, 6) || '01'}`;
    }

    if (line2.length >= 15) {
      sex = line2[7] === 'F' ? 'F' : 'M';
      const rawExp = line2.slice(8, 14);
      const expCheck = line2[14];
      if (expCheck && /[0-9]/.test(expCheck)) {
        expiryCheckValid = verifyIcaoCheckDigit(rawExp, expCheck);
      }
      const expYear = 2000 + parseInt(rawExp.slice(0, 2) || '30', 10);
      expiryDate = `${expYear}-${rawExp.slice(2, 4) || '01'}-${rawExp.slice(4, 6) || '01'}`;
    }
  }

  // Validate ISO 3166-1 alpha-3 code
  const VALID_ASEAN_ISO = ['KHM', 'SGP', 'MYS', 'THA', 'IDN', 'VNM', 'PHL', 'LAO', 'MMR', 'BRN'];
  if (issuingState && !VALID_ASEAN_ISO.includes(issuingState)) {
    discrepancies.push(
      `Issuing country code "${issuingState}" is invalid or non-standard ISO 3166-1 (expected compliant 3-letter code, e.g. PHL instead of PHI)`
    );
  }

  compositeCheckValid = docNumberCheckValid && dobCheckValid && expiryCheckValid;
  const checksumValid = compositeCheckValid && discrepancies.length === 0;

  return {
    rawLines: cleanLines,
    documentType: docType,
    issuingState,
    documentNumber,
    docNumberCheckValid,
    dateOfBirth,
    dobCheckValid,
    expiryDate,
    expiryCheckValid,
    sex,
    holderName,
    compositeCheckValid,
    checksumValid,
    discrepancies,
  };
}
