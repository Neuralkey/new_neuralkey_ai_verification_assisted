export interface VisualZoneData {
  fullName: string;
  documentNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  issueDate: string;
  nationality: string;
  sex: string;
  issuingCountry: string;
  documentType: string;
}

export interface MrzZoneData {
  rawLines: string[];
  documentType: string;
  issuingState: string;
  documentNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  checksumValid: boolean;
  discrepanciesFound: string[];
}

export interface BiometricAnalysis {
  faceMatchScore: number;
  faceMatchStatus: 'MATCH' | 'MISMATCH' | 'INCONCLUSIVE';
  livenessConfidence: number;
  notes: string;
}

export interface ConsistencyCheck {
  rule: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
}

export interface FraudSignal {
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  explanation: string;
  evidenceZone: string;
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
}

export interface RiskAssessment {
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedAction: 'APPROVE' | 'ESCALATE' | 'REJECT';
  executiveSummary: string;
  recommendationReason: string;
  triageModel?: string; // 'gemini-3.8-flash'
  escalationModel?: string; // 'gemini-pro'
}

export interface SpecialistAgentExecution {
  agentName: string;
  agentId: string;
  role: string;
  status: 'COMPLETED' | 'RUNNING' | 'ESCALATED';
  durationMs: number;
  toolCalls: Array<{
    toolName: string;
    input: string;
    output: string;
    status: 'SUCCESS' | 'FLAG_RAISED';
  }>;
  summary: string;
}

export interface ForensicAnalysis {
  extractedVisualZone: VisualZoneData;
  extractedMrzZone: MrzZoneData;
  biometricAnalysis: BiometricAnalysis;
  consistencyChecks: ConsistencyCheck[];
  fraudSignals: FraudSignal[];
  riskAssessment: RiskAssessment;
  adkAgents?: SpecialistAgentExecution[];
}

export interface ApplicantProfile {
  id: string;
  did: string;
  didType?: string; // 'self-certifying DID (resolvable offline, zero ledger lock-in)'
  fullName: string;
  dateOfBirth: string;
  documentNumber: string;
  nationality: string;
  documentType: string;
  submittedAt: string;
  avatarUrl: string;
  documentSvgOrUrl: string;
  selfieUrl: string;
  expectedOutcome: 'APPROVE' | 'REJECT' | 'ESCALATE';
  scenarioTag: string;
  scenarioDescription: string;
  benchmarkGroundTruth?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  trustLevel?: 'TIER_0_UNVERIFIED' | 'TIER_1_BASIC' | 'TIER_3_IAL3_VERIFIED';
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
    registry: string;
  };
  issuanceDate: string;
  credentialSubject: {
    id: string;
    name: string;
    kycStatus: string;
    riskScoreAtIssuance: number;
    assuranceLevel: string;
    trustLevel: string; // 'NEURALKEY_UPGRADED_LEVEL_3'
    verifiedAttributes: {
      documentType: string;
      documentNumberHash: string;
      dateOfBirthVerified: boolean;
      livenessVerified: boolean;
    };
  };
  evidence: Array<{
    type: string;
    model: string;
    agentFramework: string; // 'Google ADK'
    checksConducted: string[];
    reviewerDecision: string;
    reviewerId: string;
    reviewTimestamp: string;
  }>;
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws: string;
  };
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  applicantDid: string;
  applicantName: string;
  reviewerId: string;
  action: 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'ANALYSIS_COMPLETED';
  riskScore: number;
  riskLevel: string;
  geminiModel: string;
  notes: string;
  flagsCount: number;
  prevHash: string;
  recordHash: string;
}

export interface NeuralkeyDidDocument {
  '@context': string[];
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
    publicKeyJwk?: {
      kty: string;
      crv: string;
      x: string;
    };
  }>;
  authentication: string[];
  assertionMethod: string[];
  deactivated?: boolean;
}

export interface DidResolutionResult {
  did: string;
  branch: 'BRANCH_A_USER_OFFLINE' | 'BRANCH_B_ISSUER_ONLINE';
  profileType: 'USER_PROFILE' | 'ISSUER_PROFILE';
  latencyMs: number;
  networkRequestsRequired: number;
  methodSpecUrl: string;
  didDocument: NeuralkeyDidDocument;
  metadata: {
    w3cStandard: string;
    keyType: string;
    offlineVerifiable: boolean;
    trackingRisk: string;
  };
}

export interface GroundTruthLabel {
  id: string;
  fullName: string;
  documentNumber: string;
  dateOfBirth: string;
  expiryDate: string;
  nationality: string;
  isTampered: boolean;
  tamperCategory?: string;
  tamperExplanation?: string;
  expectedOutcome: 'APPROVE' | 'REJECT' | 'ESCALATE';
}

export interface BenchmarkMetrics {
  totalCards: number;
  totalFields: number;
  correctFieldsCount: number;
  fieldExtractionAccuracy: number; // e.g. 198 / 200 = 0.99
  tamperedCardsTotal: number;
  tamperedCardsFlagged: number; // e.g. 20 / 20 = 1.0
  genuineCardsTotal: number;
  genuineCardsWronglyFlagged: number; // e.g. 0 / 20 = 0.0
  medianAnalysisTimeSeconds: number; // e.g. 1.18
  manualReviewTimePerCaseSeconds: number; // e.g. 270
  assistantReviewTimePerCaseSeconds: number; // e.g. 18
  timeSavedPercentage: number; // e.g. 93.3%
}
