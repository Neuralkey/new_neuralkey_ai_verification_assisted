import re

with open('src/data/mockScenarios.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Clean documentType in tampered profiles
replacements = [
    ("documentType: 'Singapore NRIC (Tampered: AI Diffusion Face)',",
     "documentType: 'Singapore National Registration ID (Pink NRIC)',\n  benchmarkGroundTruth: 'Tampered: Photo alteration around facial contour',"),
    ("documentType: 'Paspor Indonesia (Tampered: Altered DOB)',",
     "documentType: 'Paspor Republik Indonesia',\n  benchmarkGroundTruth: 'Tampered: Date of birth digit raster modification',"),
    ("documentType: 'Philippines Passport (Tampered: MRZ Checksum Fail)',",
     "documentType: 'Republic of the Philippines Passport',\n  benchmarkGroundTruth: 'Tampered: ICAO 9303 MRZ check digit checksum failure',"),
    ("documentType: 'Thailand Driver\\'s License (Tampered: Microprint Fractured)',",
     "documentType: 'Thailand Driver\\'s License (MPWT)',\n  benchmarkGroundTruth: 'Tampered: Microprint border line discontinuity',"),
    ("documentType: 'Cambodia National ID (Tampered: Name Mismatch)',",
     "documentType: 'Cambodia National ID Smart Card',\n  benchmarkGroundTruth: 'Tampered: Printed name vs MRZ line discrepancy',"),
    ("documentType: 'Malaysia MyKad (Tampered: Clone Stamp Pattern)',",
     "documentType: 'Malaysia MyKad National Identity Smart Card',\n  benchmarkGroundTruth: 'Tampered: Repetitive clone stamp in guilloche pattern',"),
    ("documentType: 'Vietnam CCCD (Tampered: Forged State Seal)',",
     "documentType: 'Vietnam CCCD Chip Card (Căn cước công dân)',\n  benchmarkGroundTruth: 'Tampered: State emblem chromatic variation',"),
    ("documentType: 'Thailand ID Card (Tampered: Static Hologram)',",
     "documentType: 'Thai National ID Card (บัตรประจำตัวประชาชน)',\n  benchmarkGroundTruth: 'Tampered: Static non-diffractive holographic foil',"),
    ("documentType: 'Philippines PhilSys (Tampered: Altered Expiration)',",
     "documentType: 'Philippines PhilSys National ID (PhilID)',\n  benchmarkGroundTruth: 'Tampered: Expiration date pixel interpolation',"),
    ("documentType: 'Indonesia e-KTP (Tampered: Kerning Baseline Injection)',",
     "documentType: 'Indonesia e-KTP (Kartu Tanda Penduduk)',\n  benchmarkGroundTruth: 'Tampered: Document number kerning baseline irregularity',"),
    ("documentType: 'Singapore Passport (Tampered: Ghost Portrait Mismatch)',",
     "documentType: 'Republic of Singapore Biometric Passport',\n  benchmarkGroundTruth: 'Tampered: Primary photo differs from secondary ghost portrait',"),
    ("documentType: 'Lao Passport (Tampered: OVI Ink Zero Shift)',",
     "documentType: 'Lao People\\'s Democratic Republic Passport',\n  benchmarkGroundTruth: 'Tampered: Security emblem lacks optical variable chromatic shift',"),
    ("documentType: 'Brunei Smart IC (Tampered: Barcode Payload Discrepancy)',",
     "documentType: 'Brunei Darussalam Smart Identity Card',\n  benchmarkGroundTruth: 'Tampered: PDF417 2D barcode payload identity mismatch',"),
    ("documentType: 'Myanmar NRC (Tampered: Date Inversion Logic Flaw)',",
     "documentType: 'Myanmar National Registration Card (NRC)',\n  benchmarkGroundTruth: 'Tampered: Issue date chronologically postdates expiration',"),
    ("documentType: 'Cambodia Passport (Tampered: Erased SPECIMEN Watermark)',",
     "documentType: 'Kingdom of Cambodia e-Passport',\n  benchmarkGroundTruth: 'Tampered: Erased specimen watermark artifact',"),
    ("documentType: 'Malaysia MyKad (Tampered: Synthetic Composite ID)',",
     "documentType: 'Malaysia MyKad National Identity Smart Card',\n  benchmarkGroundTruth: 'Tampered: Composite identity elements from external source',"),
    ("documentType: 'Vietnam Passport (Tampered: GAN Blending Edge Halo)',",
     "documentType: 'Socialist Republic of Vietnam Passport',\n  benchmarkGroundTruth: 'Tampered: Photo edge boundary halo artifact',"),
    ("documentType: 'Thailand ID Card (Tampered: Font Substitution)',",
     "documentType: 'Thai National ID Card (บัตรประจำตัวประชาชน)',\n  benchmarkGroundTruth: 'Tampered: Typographic font family mismatch in name field',"),
    ("documentType: 'Indonesia e-KTP (Tampered: Inkjet Paper Substrate)',",
     "documentType: 'Indonesia e-KTP (Kartu Tanda Penduduk)',\n  benchmarkGroundTruth: 'Tampered: Surface substrate texture indicates paper rather than polycarbonate',"),
    ("documentType: 'Philippines Passport (Tampered: Corrupted Country ISO)',",
     "documentType: 'Republic of the Philippines Passport',\n  benchmarkGroundTruth: 'Tampered: Invalid non-standard 3-letter country code in MRZ',"),
]

for old, new in replacements:
    content = content.replace(old, new)

# 2. Clean up analysis extractedVisualZone.documentType
analysis_doc_cleanups = [
    ("documentType: 'Singapore NRIC (Tampered: Deepfake Face)'", "documentType: 'Singapore National Registration ID (Pink NRIC)'"),
    ("documentType: 'Paspor Indonesia (Tampered: DOB)'", "documentType: 'Paspor Republik Indonesia'"),
    ("documentType: 'Philippines Passport (Tampered: MRZ Checksum)'", "documentType: 'Republic of the Philippines Passport'"),
    ("documentType: 'Thailand Driver\\'s License (Tampered: Microprint)'", "documentType: 'Thailand Driver\\'s License (MPWT)'"),
    ("documentType: 'Cambodia National ID (Tampered: Name)'", "documentType: 'Cambodia National ID Smart Card'"),
    ("documentType: 'Malaysia MyKad (Tampered: Pattern)'", "documentType: 'Malaysia MyKad National Identity Smart Card'"),
    ("documentType: 'Vietnam CCCD (Tampered: Seal)'", "documentType: 'Vietnam CCCD Chip Card'"),
    ("documentType: 'Thailand ID Card (Tampered: Hologram)'", "documentType: 'Thai National ID Card'"),
    ("documentType: 'Philippines PhilSys (Tampered: Expiry)'", "documentType: 'Philippines PhilSys National ID'"),
    ("documentType: 'Indonesia e-KTP (Tampered: Kerning)'", "documentType: 'Indonesia e-KTP'"),
    ("documentType: 'Singapore Passport (Tampered: Ghost)'", "documentType: 'Republic of Singapore Biometric Passport'"),
    ("documentType: 'Lao Passport (Tampered: OVI)'", "documentType: 'Lao People\\'s Democratic Republic Passport'"),
    ("documentType: 'Brunei Smart IC (Tampered: Barcode)'", "documentType: 'Brunei Darussalam Smart Identity Card'"),
    ("documentType: 'Myanmar NRC (Tampered: Date Logic)'", "documentType: 'Myanmar National Registration Card (NRC)'"),
    ("documentType: 'Cambodia Passport (Tampered: Specimen)'", "documentType: 'Kingdom of Cambodia e-Passport'"),
    ("documentType: 'Malaysia MyKad (Tampered: Composite)'", "documentType: 'Malaysia MyKad National Identity Smart Card'"),
    ("documentType: 'Vietnam Passport (Tampered: GAN Face)'", "documentType: 'Socialist Republic of Vietnam Passport'"),
    ("documentType: 'Thailand ID Card (Tampered: Font)'", "documentType: 'Thai National ID Card'"),
    ("documentType: 'Indonesia e-KTP (Tampered: Substrate)'", "documentType: 'Indonesia e-KTP'"),
    ("documentType: 'Philippines Passport (Tampered: Corrupted ISO)'", "documentType: 'Republic of the Philippines Passport'"),
]

for old, new in analysis_doc_cleanups:
    content = content.replace(old, new)

# 3. Clean buzzwords and liveness claims (UI-06)
buzzword_cleanups = [
    ("Synthetic Generative Diffusion Face Swap", "Photo Alteration & Boundary Splice"),
    ("AI diffusion boundary detected around facial contour. Frequency domain analysis confirms synthetic GAN generation.",
     "Discontinuity detected around facial portrait contour edge and skin tone gradient."),
    ("High-confidence AI deepfake facial insertion detected on Singapore NRIC.",
     "Facial portrait replacement and boundary irregularity detected on identity card."),
    ("Biometric Face Liveness", "Photo & Identity Consistency"),
    ("Synthetic diffusion boundary detected around earlobe and collarline.",
     "Edge boundary anomaly detected around earlobe and collarline."),
    ("Security border microtext line fractured at 1200 DPI scan; secondary digital text layer injected over state coat.",
     "Security border microtext line fractured under sensor scan; secondary digital text layer overlay detected."),
    ("GAN-Generated Face Blending Edge Halo", "Photo Blending Edge Halo Artifact"),
    ("Neural style-transfer halo detected around earlobe and collarline; facial frequency spectrum reveals AI generation.",
     "Edge blending halo detected around earlobe and collarline; facial contour exhibits digital splicing."),
    ("GAN synthesis border halo.", "Photo edge blending border halo."),
    ("FS-GAN-FACE-HALO-ARTIFACT", "FS-PHOTO-HALO-ARTIFACT"),
    ("FS-AI-DEEPFAKE-BOUNDARY", "FS-PHOTO-BOUNDARY-ARTIFACT"),
    ("Zero-Knowledge Proofs enabled", "Cryptographic Ed25519 signatures"),
    ("Accepted by Apex Global Bank", "Compatible with W3C VC standards"),
]

for old, new in buzzword_cleanups:
    content = content.replace(old, new)

with open('src/data/mockScenarios.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleaned mockScenarios.ts successfully!")
