import re

# Map of fraudSignal code to box_2d [ymin, xmin, ymax, xmax] on a 0-1000 normalized scale
BOX_COORDS = {
    'FS-PHOTO-BOUNDARY-ARTIFACT': [280, 50, 780, 320], # Photo contour on NRIC
    'FS-RASTER-DOB-ALTERATION': [420, 360, 520, 760],   # Visual Zone DOB Field
    'FS-ICAO-MRZ-CHECKSUM-FAIL': [820, 30, 960, 970],   # MRZ Line 2 checksum zone
    'FS-MICROPRINT-FRACTURE': [120, 40, 220, 960],      # Microprint security border line
    'FS-NAME-MISMATCH-VIZ-MRZ': [280, 360, 380, 900],   # Name field on card
    'FS-GUILLOCHE-CLONE-STAMP': [350, 480, 650, 900],   # Guilloche pattern background
    'FS-STATE-SEAL-CHROMATIC': [80, 40, 320, 260],      # National state seal
    'FS-STATIC-DOVID-HOLOGRAM': [300, 320, 720, 440],   # Hologram foil strip
    'FS-EXPIRY-DATE-ALTERATION': [550, 360, 650, 760],  # Expiry date field
    'FS-KERNING-NIK-DISCONTINUITY': [200, 360, 300, 940], # Document number / NIK
    'FS-GHOST-PORTRAIT-BIOMETRIC-MISMATCH': [580, 720, 880, 940], # Secondary ghost portrait
    'FS-OVI-CHROMATIC-FAIL': [100, 750, 320, 950],      # Optically variable ink emblem
    'FS-BARCODE-PAYLOAD-MISMATCH': [680, 60, 920, 940], # PDF417 barcode payload zone
    'FS-DATE-INVERSION-LOGIC': [450, 360, 620, 850],    # Date fields logic
    'FS-SPECIMEN-WATERMARK-ERASED': [250, 250, 750, 750], # Watermark area
    'FS-COMPOSITE-IDENTITY-SPLICE': [150, 50, 400, 450], # Identity header / chip area
    'FS-PHOTO-HALO-ARTIFACT': [260, 60, 760, 340],      # Photo blending halo
    'FS-FONT-FAMILY-SUBSTITUTION': [300, 360, 420, 920], # Font in name field
    'FS-SUBSTRATE-PAPER-FIBER': [80, 80, 920, 920],     # Substrate texture (full card)
    'FS-ISO-COUNTRY-CORRUPTED': [780, 40, 870, 450],    # MRZ Country ISO code
}

with open('src/data/mockScenarios.ts', 'r', encoding='utf-8') as f:
    text = f.read()

for code, box in BOX_COORDS.items():
    pattern = rf"(code:\s*'{code}',[\s\S]*?evidenceZone:\s*'.*?',)"
    def repl(m):
        chunk = m.group(1)
        if 'box_2d:' not in chunk:
            return chunk + f"\n        box_2d: [{box[0]}, {box[1]}, {box[2]}, {box[3]}],"
        return chunk
    text = re.sub(pattern, repl, text)

with open('src/data/mockScenarios.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("Added bounding boxes successfully!")
