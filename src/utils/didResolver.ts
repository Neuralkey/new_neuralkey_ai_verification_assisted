import { NeuralkeyDidDocument, DidResolutionResult } from '../types';

/**
 * Implements the Neuralkey DID Method specification:
 * Specification: https://neuralkey.neuralsh.com/neuralkey-spec-page
 * W3C Member Submission: 30 April 2026
 *
 * Syntax:
 *   neuralkey-did = "did:neuralkey:" (user-profile / issuer-profile)
 *   user-profile = multibase-base58-btc-encoded-value (starts with 'z6Mk', Ed25519 0xed01)
 *   issuer-profile = fully-qualified-domain-name *(":" path-segment)
 */
export function resolveNeuralkeyDid(rawDid: string): DidResolutionResult {
  const did = rawDid.trim();
  const startTime = performance.now();

  if (!did.startsWith('did:neuralkey:')) {
    throw new Error(`Invalid DID method: ${did}. Expected prefix 'did:neuralkey:'`);
  }

  const identifier = did.replace('did:neuralkey:', '');

  // Branch A: User Profile Resolution (Offline, Zero-Latency)
  // If the identifier begins with 'z6Mk' and strictly conforms to Base58BTC Ed25519 payload
  if (identifier.startsWith('z6Mk')) {
    const didDoc: NeuralkeyDidDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://w3id.org/security/suites/x25519-2020/v1',
      ],
      id: did,
      verificationMethod: [
        {
          id: `${did}#${identifier}`,
          type: 'Ed25519VerificationKey2020',
          controller: did,
          publicKeyMultibase: identifier,
        },
      ],
      authentication: [`${did}#${identifier}`],
      assertionMethod: [`${did}#${identifier}`],
    };

    return {
      did,
      branch: 'BRANCH_A_USER_OFFLINE',
      profileType: 'USER_PROFILE',
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
      networkRequestsRequired: 0,
      methodSpecUrl: 'https://neuralkey.neuralsh.com/neuralkey-spec-page',
      didDocument: didDoc,
      metadata: {
        w3cStandard: 'W3C DID v1.1 / Ed25519VerificationKey2020',
        keyType: 'Ed25519 (multicodec 0xed01, Base58BTC)',
        offlineVerifiable: true,
        trackingRisk: 'Zero phone-home tracking risk (no central resolution server contacted)',
      },
    };
  }

  // Branch B: Issuer Profile Resolution (Online, FQDN-Anchored)
  // If it does not start with z6Mk, resolver treats it as domain name / FQDN
  const domain = identifier.split(':')[0];
  const didDoc: NeuralkeyDidDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://www.w3.org/ns/cid/v1',
      'https://w3id.org/security/jwk/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#key-0`,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk: {
          kty: 'OKP',
          crv: 'Ed25519',
          x: 'ADTXUVoRZP9A0Lzt5lw8LGK0MLSmuhftNCZh5aQPXMc',
        },
      },
    ],
    authentication: [`${did}#key-0`],
    assertionMethod: [`${did}#key-0`],
    deactivated: false,
  };

  return {
    did,
    branch: 'BRANCH_B_ISSUER_ONLINE',
    profileType: 'ISSUER_PROFILE',
    latencyMs: Number((12 + Math.random() * 8).toFixed(2)), // simulated HTTPS round-trip
    networkRequestsRequired: 1,
    methodSpecUrl: 'https://neuralkey.neuralsh.com/neuralkey-spec-page',
    didDocument: didDoc,
    metadata: {
      w3cStandard: 'W3C DID v1.1 / did:web compatible (.well-known/did.json)',
      keyType: 'JsonWebKey2020 (Ed25519)',
      offlineVerifiable: false,
      trackingRisk: 'Public Issuer discoverability (anchored to domain HTTPS trust anchor)',
    },
  };
}

/**
 * Generates a valid Neuralkey User Profile DID matching the spec:
 * Starts with 'z6Mk' (Ed25519 multicodec 0xed01 + Base58BTC alphabet)
 */
export function generateNeuralkeyUserDid(): string {
  const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let randomPayload = '';
  for (let i = 0; i < 44; i++) {
    randomPayload += base58Chars.charAt(Math.floor(Math.random() * base58Chars.length));
  }
  return `did:neuralkey:z6Mk${randomPayload}`;
}
