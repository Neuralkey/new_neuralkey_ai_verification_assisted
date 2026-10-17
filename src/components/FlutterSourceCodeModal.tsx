import React, { useState } from 'react';
import { X, Copy, Check, Code, FileText } from 'lucide-react';

interface FlutterSourceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FLUTTER_FILES: Record<
  string,
  { filename: string; path: string; code: string; desc: string }
> = {
  pubspec: {
    filename: 'pubspec.yaml',
    path: 'pubspec.yaml',
    desc: 'Flutter dependencies: GetX, flutter_secure_storage, camera, ML Kit OCR & Face Detection, cryptography, image',
    code: `name: neuralkey_did_wallet
description: "Neuralkey DID Wallet - Identity Verify (IAL2 upgrade) Flutter Feature"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  get: ^4.6.6
  flutter_secure_storage: ^9.2.2
  camera: ^0.11.0+2
  google_mlkit_text_recognition: ^0.14.0
  google_mlkit_face_detection: ^0.12.0
  cryptography: ^2.7.2
  image: ^4.2.0
  local_auth: ^2.3.0
  http: ^1.2.0
  intl: ^0.19.0
  path_provider: ^2.1.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true`,
  },

  main: {
    filename: 'main.dart',
    path: 'lib/main.dart',
    desc: 'Entry point initializing TrustLevelController & GetX route table (/verify, /profile, /take_gov_document, /scan_verify, /home)',
    code: `import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'controllers/trust_level_controller.dart';
import 'controllers/verify_controller.dart';
import 'controllers/profile_controller.dart';
import 'controllers/take_gov_document_controller.dart';
import 'screens/verify_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/take_gov_document_screen.dart';
import 'screens/verify_human_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Register TrustLevelController (runs syncNow at app start, on resume & every 5 min)
  Get.put(TrustLevelController(), permanent: true);
  Get.put(VerifyController());
  runApp(const NeuralkeyWalletApp());
}

class NeuralkeyWalletApp extends StatelessWidget {
  const NeuralkeyWalletApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'Neuralkey DID Wallet',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF020617),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF38BDF8),
          secondary: Color(0xFF69F0AE),
          surface: Color(0xFF0F172A),
        ),
      ),
      initialRoute: '/verify',
      getPages: [
        GetPage(name: '/home', page: () => const HomeScreen()),
        GetPage(name: '/verify', page: () => const VerifyScreen()),
        GetPage(
          name: '/profile',
          page: () => const ProfileScreen(),
          binding: BindingsBuilder(() {
            Get.lazyPut<ProfileController>(() => ProfileController());
          }),
        ),
        GetPage(
          name: '/take_gov_document',
          page: () => const TakeGovDocumentScreen(),
          binding: BindingsBuilder(() {
            Get.lazyPut<TakeGovDocumentController>(() => TakeGovDocumentController());
          }),
        ),
        GetPage(
          name: '/scan_verify',
          page: () => const VerifyHumanScreen(),
        ),
      ],
    );
  }
}`,
  },

  storageService: {
    filename: 'storage_service.dart',
    path: 'lib/services/storage_service.dart',
    desc: 'flutter_secure_storage persistence for step flags, individual profile keys, document/liveness paths, V2 VC, and audit logs',
    code: `import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  // Step completion flags
  static const keyUserUpdatedProfile = 'userUpdatedProfile';
  static const keyGovDocDone = 'govDocDone';
  static const keyFaceScanDone = 'faceScanDone';

  // Step 1 Profile keys (each value stored under its own key)
  static const keyFirstName = 'firstName';
  static const keyLastName = 'lastName';
  static const keyFullName = 'fullName';
  static const keyEmail = 'email';
  static const keyDocumentType = 'documentType';
  static const keyGender = 'gender';
  static const keyDocumentNumber = 'documentNumber';
  static const keyCountry = 'country';
  static const keyStateProvince = 'stateProvince';
  static const keyCity = 'city';
  static const keyDateOfBirth = 'dateOfBirth';
  static const keyDocumentExpiry = 'documentExpiry';

  // Step 2 Government Document image paths
  static const keyGovDocFrontPath = 'govDocFrontPath';
  static const keyGovDocBackPath = 'govDocBackPath';

  // Step 3 Liveness still photo paths & profile selfie
  static const keyLivenessLookLeft = 'liveness_lookLeft';
  static const keyLivenessLookRight = 'liveness_lookRight';
  static const keyLivenessSmile = 'liveness_smile';
  static const keyLivenessBlink = 'liveness_blink';
  static const keyProfileSelfiePath = 'profileSelfiePath';

  // Wallet credentials & session
  static const keyDidKey = 'didKey';
  static const keyEd25519PrivateKeySeed = 'ed25519PrivateKeySeed';
  static const keyBiometricSessionExpiry = 'biometricSessionExpiry';
  static const keyV2VerifiableCredential = 'v2VerifiableCredential';
  static const keyAuditLog = 'auditLog';

  Future<void> writeBool(String key, bool value) async {
    await _storage.write(key: key, value: value ? 'true' : 'false');
  }

  Future<bool> readBool(String key) async {
    final val = await _storage.read(key: key);
    return val == 'true';
  }

  Future<void> writeString(String key, String value) async =>
      await _storage.write(key: key, value: value);

  Future<String?> readString(String key) async =>
      await _storage.read(key: key);

  /// Appends an audit-log event (piiUpdated, livenessCheckSuccess, livenessCheckFailure, identityVerificationSubmitted)
  Future<void> writeAuditEvent(String eventName, Map<String, dynamic> details) async {
    final existingRaw = await _storage.read(key: keyAuditLog);
    List<dynamic> logs = [];
    if (existingRaw != null && existingRaw.isNotEmpty) {
      try {
        logs = jsonDecode(existingRaw) as List<dynamic>;
      } catch (_) {}
    }
    logs.insert(0, {
      'event': eventName,
      'timestamp': DateTime.now().toIso8601String(),
      ...details,
    });
    await _storage.write(key: keyAuditLog, value: jsonEncode(logs));
  }
}`,
  },

  cryptoService: {
    filename: 'crypto_service.dart',
    path: 'lib/services/crypto_service.dart',
    desc: 'ECIES per-item encryption (X25519 + HKDF-SHA256 info "x25519-aesgcm" + AES-256-GCM 12B IV, >=36B text padding, SPKI PEM) & Ed25519 signing',
    code: `import 'dart:convert';
import 'dart:typed_data';
import 'package:cryptography/cryptography.dart';

class EciesEnvelope {
  final String ephemeralPublicKey; // SPKI PEM
  final String iv;                 // base64 (12 bytes)
  final String ciphertext;         // base64
  final String authTag;            // base64 (16 bytes)

  EciesEnvelope({
    required this.ephemeralPublicKey,
    required this.iv,
    required this.ciphertext,
    required this.authTag,
  });

  Map<String, dynamic> toJson() => {
    'ephemeralPublicKey': ephemeralPublicKey,
    'iv': iv,
    'ciphertext': ciphertext,
    'authTag': authTag,
  };
}

class CryptoService {
  final _x25519 = X25519();
  final _ed25519 = Ed25519();
  final _aesGcm = AesGcm.with256Bits(nonceLength: 12);
  final _hkdf = Hkdf(hmac: Hmac.sha256(), outputLength: 32);

  // ASN.1 DER prefix for X25519 SubjectPublicKeyInfo (OID 1.3.101.110)
  static const List<int> _x25519SpkiPrefix = [
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00,
  ];

  /// Parses issuer X25519 public key (accepts PEM/SPKI DER base64 or raw base64url; takes the last 32 bytes).
  SimplePublicKey parseIssuerX25519PublicKey(String rawKeyString) {
    final cleaned = rawKeyString
        .replaceAll('-----BEGIN PUBLIC KEY-----', '')
        .replaceAll('-----END PUBLIC KEY-----', '')
        .replaceAll(RegExp(r'\\s+'), '');

    Uint8List decoded;
    try {
      decoded = base64Decode(base64.normalize(cleaned));
    } catch (_) {
      decoded = base64Url.decode(base64Url.normalize(cleaned));
    }

    final last32 = decoded.length > 32
        ? decoded.sublist(decoded.length - 32)
        : decoded;
    return SimplePublicKey(last32, type: KeyPairType.x25519);
  }

  /// Formats a raw 32-byte X25519 public key as SPKI PEM.
  String _encodeSpkiPem(List<int> raw32Bytes) {
    final der = Uint8List.fromList([..._x25519SpkiPrefix, ...raw32Bytes]);
    final b64 = base64Encode(der);
    return '-----BEGIN PUBLIC KEY-----\\n\$b64\\n-----END PUBLIC KEY-----';
  }

  /// ECIES-encrypts raw bytes with the issuer X25519 public key:
  /// ephemeral X25519 keypair -> ECDH -> HKDF-SHA256 (salt empty, info "x25519-aesgcm", 32 bytes)
  /// -> AES-256-GCM with 12-byte random IV.
  Future<EciesEnvelope> encryptBytes(
    Uint8List plaintextBytes,
    SimplePublicKey issuerPublicKey,
  ) async {
    final ephemeralKeyPair = await _x25519.newKeyPair();
    final ephemeralPublicKey = await ephemeralKeyPair.extractPublicKey();

    final sharedSecret = await _x25519.sharedSecretKey(
      keyPair: ephemeralKeyPair,
      remotePublicKey: issuerPublicKey,
    );

    final derivedAesKey = await _hkdf.deriveKey(
      secretKey: sharedSecret,
      nonce: const <int>[], // empty salt
      info: utf8.encode('x25519-aesgcm'),
    );

    final secretBox = await _aesGcm.encrypt(
      plaintextBytes,
      secretKey: derivedAesKey,
    );

    return EciesEnvelope(
      ephemeralPublicKey: _encodeSpkiPem(ephemeralPublicKey.bytes),
      iv: base64Encode(secretBox.nonce),
      ciphertext: base64Encode(secretBox.cipherText),
      authTag: base64Encode(secretBox.mac.bytes),
    );
  }

  /// Text fields are right-padded with spaces to >= 36 bytes before encryption.
  Future<EciesEnvelope> encryptTextField(
    String value,
    SimplePublicKey issuerPublicKey,
  ) async {
    var bytes = utf8.encode(value);
    if (bytes.length < 36) {
      final padded = value.padRight(36, ' ');
      bytes = utf8.encode(padded);
    }
    return encryptBytes(Uint8List.fromList(bytes), issuerPublicKey);
  }

  /// Signs the access token as nonce with the wallet Ed25519 private key.
  Future<String> signTokenNonce(String accessToken, List<int>? privateKeySeed) async {
    final keyPair = privateKeySeed != null && privateKeySeed.length == 32
        ? await _ed25519.newKeyPairFromSeed(privateKeySeed)
        : await _ed25519.newKeyPair();
    final signature = await _ed25519.sign(
      utf8.encode(accessToken),
      keyPair: keyPair,
    );
    return base64UrlEncode(signature.bytes);
  }
}`,
  },

  verifyService: {
    filename: 'verify_service.dart',
    path: 'lib/services/verify_service.dart',
    desc: 'VerifyService.submit(): per-item ECIES payload builder, credential-offer -> token -> submit-govdocuments -> V2 VC issuance',
    code: `import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import 'crypto_service.dart';
import 'storage_service.dart';

abstract class IVerifyService {
  Future<Map<String, dynamic>> submit({
    required File frontDocFile,
    File? backDocFile,
  });
}

/// Offline mock issuer service: generates X25519 keypair locally, accepts any
/// payload, and returns a mock IAL2 VC after 1.5 s delay.
class MockIssuerService implements IVerifyService {
  final StorageService _storage = StorageService();

  @override
  Future<Map<String, dynamic>> submit({
    required File frontDocFile,
    File? backDocFile,
  }) async {
    await Future.delayed(const Duration(milliseconds: 1500));
    final fakeVc = {
      'type': ['VerifiableCredential', 'IAL2Credential'],
      'issuer': 'did:mock',
      'credentialSubject': {
        'trustLevel': 'IAL2',
      },
    };
    await _storage.writeString(
      StorageService.keyV2VerifiableCredential,
      jsonEncode(fakeVc),
    );
    await _storage.writeAuditEvent('identityVerificationSubmitted', {
      'status': 'success',
      'assuranceLevel': 'IAL2',
      'issuer': 'did:mock',
    });
    return {
      'status': 'verified',
      'verifiableCredential': fakeVc,
    };
  }
}

class VerifyService implements IVerifyService {
  final StorageService _storage = StorageService();
  final CryptoService _crypto = CryptoService();

  static const String baseUrl = 'https://api.neuralkey.ai/api/identity-verify';

  /// Compresses a liveness photo before ECIES encryption (max side 1200 px, JPEG q70).
  Future<Uint8List> _compressImageFile(File file) async {
    final raw = await file.readAsBytes();
    final decoded = img.decodeImage(raw);
    if (decoded == null) return raw;
    img.Image resized = decoded;
    if (decoded.width > 1200 || decoded.height > 1200) {
      resized = decoded.width >= decoded.height
          ? img.copyResize(decoded, width: 1200)
          : img.copyResize(decoded, height: 1200);
    }
    return Uint8List.fromList(img.encodeJpg(resized, quality: 70));
  }

  /// Runs the complete IAL2 submission pipeline:
  /// 1. Check internet + server reachability.
  /// 2. GET issuer X25519 public key (take last 32 bytes).
  /// 3. ECIES-encrypt each item separately (pad text >= 36 bytes).
  /// 4. Build payload { documentType, govDocument, liveness, pii }.
  /// 5. POST credential-offer -> preAuthCode; POST token -> accessToken;
  ///    POST submit-govdocuments (Bearer token) + Ed25519 signed token nonce.
  /// 6. Store returned V2 VC in secure storage, log identityVerificationSubmitted, re-cache doc images.
  Future<Map<String, dynamic>> submit({
    required File frontDocFile,
    File? backDocFile,
  }) async {
    // Check internet + server reachability
    final pubKeyRes = await http
        .get(Uri.parse('\$baseUrl/server-pubkey'))
        .timeout(const Duration(seconds: 15));
    if (pubKeyRes.statusCode != 200) {
      throw const SocketException('Server unreachable');
    }

    final pubKeyBody = jsonDecode(pubKeyRes.body);
    final rawIssuerKey = (pubKeyBody['publicKeyPem'] ??
            pubKeyBody['serverPublicKey'] ??
            pubKeyBody['rawBase64Url'])
        .toString();
    final issuerKey = _crypto.parseIssuerX25519PublicKey(rawIssuerKey);

    // Read profile fields from secure storage
    final documentType = await _storage.readString(StorageService.keyDocumentType) ?? 'ID Card';
    final fullName = await _storage.readString(StorageService.keyFullName) ?? '';
    final email = await _storage.readString(StorageService.keyEmail) ?? '';
    final gender = await _storage.readString(StorageService.keyGender) ?? '';
    final documentNumber = await _storage.readString(StorageService.keyDocumentNumber) ?? '';
    final country = await _storage.readString(StorageService.keyCountry) ?? 'Cambodia';
    final dob = await _storage.readString(StorageService.keyDateOfBirth) ?? '';
    final documentExpiry = await _storage.readString(StorageService.keyDocumentExpiry) ?? '';
    final currentCity = await _storage.readString(StorageService.keyCity) ?? '';

    // Read & compress liveness photos
    final leftPath = await _storage.readString(StorageService.keyLivenessLookLeft) ?? '';
    final rightPath = await _storage.readString(StorageService.keyLivenessLookRight) ?? '';
    final smilePath = await _storage.readString(StorageService.keyLivenessSmile) ?? '';
    final blinkPath = await _storage.readString(StorageService.keyLivenessBlink) ?? '';

    final frontBytes = await frontDocFile.readAsBytes();
    final leftBytes = await _compressImageFile(File(leftPath));
    final rightBytes = await _compressImageFile(File(rightPath));
    final smileBytes = await _compressImageFile(File(smilePath));
    final blinkBytes = await _compressImageFile(File(blinkPath));

    // Encrypt govDocument items (backImage = enc("") if not ID Card)
    final encFront = await _crypto.encryptBytes(frontBytes, issuerKey);
    final EciesEnvelope encBack = (documentType == 'ID Card' && backDocFile != null && backDocFile.existsSync())
        ? await _crypto.encryptBytes(await backDocFile.readAsBytes(), issuerKey)
        : await _crypto.encryptTextField('', issuerKey);

    // Encrypt liveness items
    final encLeft = await _crypto.encryptBytes(leftBytes, issuerKey);
    final encRight = await _crypto.encryptBytes(rightBytes, issuerKey);
    final encSmile = await _crypto.encryptBytes(smileBytes, issuerKey);
    final encBlink = await _crypto.encryptBytes(blinkBytes, issuerKey);

    // Encrypt PII text fields (each right-padded with spaces to >= 36 bytes)
    final encFullName = await _crypto.encryptTextField(fullName, issuerKey);
    final encEmail = await _crypto.encryptTextField(email, issuerKey);
    final encGender = await _crypto.encryptTextField(gender, issuerKey);
    final encDocNum = await _crypto.encryptTextField(documentNumber, issuerKey);
    final encCountry = await _crypto.encryptTextField(country, issuerKey);
    final encDob = await _crypto.encryptTextField(dob, issuerKey);
    final encExpiry = await _crypto.encryptTextField(documentExpiry, issuerKey);
    final encCity = await _crypto.encryptTextField(currentCity, issuerKey);

    final payload = {
      'documentType': documentType,
      'govDocument': {
        'frontImage': encFront.toJson(),
        'backImage': encBack.toJson(),
      },
      'liveness': {
        'left': encLeft.toJson(),
        'right': encRight.toJson(),
        'smile': encSmile.toJson(),
        'blink': encBlink.toJson(),
      },
      'pii': {
        'fullName': encFullName.toJson(),
        'email': encEmail.toJson(),
        'gender': encGender.toJson(),
        'documentNumber': encDocNum.toJson(),
        'country': encCountry.toJson(),
        'dob': encDob.toJson(),
        'documentExpiry': encExpiry.toJson(),
        'currentCity': encCity.toJson(),
      },
    };

    // Step 5a: POST credential-offer (username, didKey) -> preAuthCode
    final didKey = await _storage.readString(StorageService.keyDidKey) ?? 'did:neuralkey:holder';
    final offerRes = await http
        .post(
          Uri.parse('\$baseUrl/credential-offer'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'username': email, 'didKey': didKey}),
        )
        .timeout(const Duration(seconds: 20));
    final preAuthCode = jsonDecode(offerRes.body)['preAuthorizedCode'] as String;

    // Step 5b: POST token (preAuthorizedCode) -> access token
    final tokenRes = await http
        .post(
          Uri.parse('\$baseUrl/token'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'preAuthorizedCode': preAuthCode}),
        )
        .timeout(const Duration(seconds: 20));
    final accessToken = jsonDecode(tokenRes.body)['access_token'] as String;

    // Step 5c: Sign token as nonce with wallet Ed25519 private key & POST submit-govdocuments
    final signedNonce = await _crypto.signTokenNonce(accessToken, null);
    final submitRes = await http
        .post(
          Uri.parse('\$baseUrl/submit-govdocuments'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer \$accessToken',
          },
          body: jsonEncode({
            'applicantDid': didKey,
            'payload': payload,
            'signedTokenNonce': signedNonce,
          }),
        )
        .timeout(const Duration(seconds: 30));

    if (submitRes.statusCode != 200) {
      throw Exception(submitRes.body);
    }

    final responseJson = jsonDecode(submitRes.body) as Map<String, dynamic>;
    final v2Vc = responseJson['verifiableCredential'];

    // Step 6: Store returned V2 VC in secure storage, log audit event, re-cache doc images locally
    if (v2Vc != null) {
      await _storage.writeString(
        StorageService.keyV2VerifiableCredential,
        jsonEncode(v2Vc),
      );
    }

    await _storage.writeAuditEvent('identityVerificationSubmitted', {
      'status': 'success',
      'assuranceLevel': 'IAL2',
    });

    // Re-cache document images locally
    final docsDir = await getApplicationDocumentsDirectory();
    final cachedFront = File('\${docsDir.path}/gov_doc_front.jpg');
    if (cachedFront.path != frontDocFile.path) {
      await cachedFront.writeAsBytes(frontBytes, flush: true);
    }

    return responseJson;
  }
}`,
  },

  trustLevelController: {
    filename: 'trust_level_controller.dart',
    path: 'lib/controllers/trust_level_controller.dart',
    desc: 'TrustLevelController.syncNow(): server-authoritative trust sync at app start, on resume, and every 5 minutes',
    code: `import 'dart:async';
import 'dart:convert';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../services/storage_service.dart';

class TrustLevelController extends GetxController with WidgetsBindingObserver {
  static TrustLevelController get to => Get.find<TrustLevelController>();

  final StorageService _storage = StorageService();
  final RxString trustLevel = 'TIER_1_BASIC'.obs;
  final RxInt levelNumber = 1.obs;
  Timer? _periodicTimer;

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addObserver(this);
    // Run at app start
    syncNow();
    // Run every 5 minutes
    _periodicTimer = Timer.periodic(const Duration(minutes: 5), (_) => syncNow());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Run on app resume
    if (state == AppLifecycleState.resumed) {
      syncNow();
    }
  }

  /// Refreshes trust level from the server (Trust level is NEVER set locally).
  Future<void> syncNow() async {
    try {
      final didKey = await _storage.readString(StorageService.keyDidKey) ?? 'did:neuralkey:holder';
      final res = await http
          .get(Uri.parse('https://api.neuralkey.ai/api/identity-verify/trust-level?did=\$didKey'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        trustLevel.value = (data['trustLevel'] ?? 'TIER_1_BASIC').toString();
        levelNumber.value = (data['levelNumber'] ?? 1) as int;
      }
    } catch (_) {}
  }

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    _periodicTimer?.cancel();
    super.onClose();
  }
}`,
  },

  verifyController: {
    filename: 'verify_controller.dart',
    path: 'lib/controllers/verify_controller.dart',
    desc: 'VerifyController.verify(): biometric check, disk doc reload, VerifyService.submit(), error mapping & TrustLevelController.syncNow()',
    code: `import 'dart:async';
import 'dart:io';
import 'package:get/get.dart';
import 'package:local_auth/local_auth.dart';
import '../services/storage_service.dart';
import '../services/verify_service.dart';
import 'trust_level_controller.dart';

class VerifyController extends GetxController {
  final StorageService _storage = StorageService();
  final VerifyService _verifyService = VerifyService();
  final LocalAuthentication _localAuth = LocalAuthentication();

  final RxBool userUpdatedProfile = false.obs;
  final RxBool govDocDone = false.obs;
  final RxBool faceScanDone = false.obs;
  final RxBool isVerifying = false.obs;
  final RxString pendingError = ''.obs;
  /// Debug toggle: switch between offline MockIssuerService and live API endpoints
  final RxBool useMockIssuer = false.obs;

  bool get all3Done =>
      userUpdatedProfile.value && govDocDone.value && faceScanDone.value;

  @override
  void onInit() {
    super.onInit();
    reloadStepFlags();
  }

  /// Re-reads all 3 step flags from flutter_secure_storage.
  Future<void> reloadStepFlags() async {
    userUpdatedProfile.value =
        await _storage.readBool(StorageService.keyUserUpdatedProfile);
    govDocDone.value = await _storage.readBool(StorageService.keyGovDocDone);
    faceScanDone.value = await _storage.readBool(StorageService.keyFaceScanDone);
  }

  Future<bool> _ensureBiometricSession() async {
    final expiryStr = await _storage.readString(StorageService.keyBiometricSessionExpiry);
    final now = DateTime.now();
    if (expiryStr != null) {
      final expiry = DateTime.tryParse(expiryStr);
      if (expiry != null && expiry.isAfter(now)) {
        return true;
      }
    }
    try {
      final didAuth = await _localAuth.authenticate(
        localizedReason: 'Authenticate with biometrics or PIN to submit IAL2 verification',
      );
      if (didAuth) {
        await _storage.writeString(
          StorageService.keyBiometricSessionExpiry,
          now.add(const Duration(minutes: 15)).toIso8601String(),
        );
      }
      return didAuth;
    } catch (_) {
      return false;
    }
  }

  /// Executes the full submission pipeline on tap of "Verify identity".
  Future<void> verify() async {
    if (!all3Done || isVerifying.value) return;
    pendingError.value = '';

    // 1. If biometric session expired, ask for biometric/PIN; abort with "Authentication Required" if declined.
    final authenticated = await _ensureBiometricSession();
    if (!authenticated) {
      pendingError.value = 'Authentication Required';
      await _storage.writeAuditEvent('identityVerificationFailed', {
        'reason': 'Authentication Required',
      });
      return;
    }

    isVerifying.value = true;

    try {
      // 2. Reload document images from disk (if missing -> warn "Document Not Found", reset govDocDone)
      final docType = await _storage.readString(StorageService.keyDocumentType) ?? 'ID Card';
      final frontPath = await _storage.readString(StorageService.keyGovDocFrontPath);
      final backPath = await _storage.readString(StorageService.keyGovDocBackPath);

      final frontFile = frontPath != null ? File(frontPath) : null;
      final backFile = backPath != null ? File(backPath) : null;

      final missingFront = frontFile == null || !frontFile.existsSync();
      final missingBack = docType == 'ID Card' && (backFile == null || !backFile.existsSync());

      if (missingFront || missingBack) {
        isVerifying.value = false;
        govDocDone.value = false;
        await _storage.writeBool(StorageService.keyGovDocDone, false);
        Get.snackbar(
          'Document Not Found',
          'Please recapture your government ID document.',
          snackPosition: SnackPosition.BOTTOM,
        );
        return;
      }

      // 3. Run submission pipeline (MockIssuerService if offline debug toggle, else VerifyService)
      final IVerifyService service = useMockIssuer.value ? MockIssuerService() : _verifyService;
      await service.submit(
        frontDocFile: frontFile,
        backDocFile: backFile,
      );

      isVerifying.value = false;

      // 4. On success: alert "Identity verified successfully.", force trust-level sync, wait 1 s, navigate offAll to /home
      Get.defaultDialog(
        title: 'Verified',
        middleText: 'Identity verified successfully.',
        barrierDismissible: false,
      );

      await TrustLevelController.to.syncNow();
      await Future.delayed(const Duration(seconds: 1));
      Get.offAllNamed('/home');
    } on SocketException {
      pendingError.value = 'Connection Lost';
      await _storage.writeAuditEvent('identityVerificationFailed', {
        'reason': 'Connection Lost',
      });
    } on TimeoutException {
      pendingError.value = 'Request Timeout';
      await _storage.writeAuditEvent('identityVerificationFailed', {
        'reason': 'Request Timeout',
      });
    } catch (e) {
      final msg = e.toString().toLowerCase();
      if (msg.contains('too large')) {
        pendingError.value = 'Send image failed';
      } else {
        pendingError.value = e.toString();
      }
      await _storage.writeAuditEvent('identityVerificationFailed', {
        'reason': pendingError.value,
      });
    } finally {
      isVerifying.value = false;
    }
  }
}`,
  },

  verifyScreen: {
    filename: 'verify_screen.dart',
    path: 'lib/screens/verify_screen.dart',
    desc: 'VerifyScreen: dark glass-morphism UI, saves faceScanDone = true only when /scan_verify returns true',
    code: `import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/verify_controller.dart';
import '../services/storage_service.dart';

class VerifyScreen extends GetView<VerifyController> {
  const VerifyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Get.back(),
        ),
      ),
      body: Obx(() {
        if (controller.isVerifying.value) {
          return _buildFullScreenLoading();
        }

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildHeroCard(),
                const SizedBox(height: 24),
                _buildStepRow(
                  pill: '01',
                  label: 'Complete your profile',
                  desc: 'Profile, FullName, DOB, Age, Contact',
                  isDone: controller.userUpdatedProfile.value,
                  route: '/profile',
                ),
                const SizedBox(height: 12),
                _buildStepRow(
                  pill: '02',
                  label: 'Valid Government ID',
                  desc: "Passport, national ID or driver's licence",
                  isDone: controller.govDocDone.value,
                  route: '/take_gov_document',
                ),
                const SizedBox(height: 12),
                _buildStepRow(
                  pill: '03',
                  label: 'Scan Face',
                  desc: 'Live selfie verify human',
                  isDone: controller.faceScanDone.value,
                  route: '/scan_verify',
                ),
                const Spacer(),
                if (controller.all3Done) _buildNoticeBox(),
                if (controller.pendingError.value.isNotEmpty) _buildErrorBox(),
                const SizedBox(height: 16),
                _buildVerifyButton(),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildHeroCard() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A).withOpacity(0.75),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF7CF6FF).withOpacity(0.25)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF7CF6FF), Color(0xFF9B7BFF)],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.verified_user_outlined, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [Color(0xFFABE1E6), Color(0xFF8E7DA1)],
                      ).createShader(bounds),
                      child: const Text(
                        'Identity Verify',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'To reach Trust Level 2, we need to verify your government ID and confirm you are a real person.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8), height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepRow({
    required String pill,
    required String label,
    required String desc,
    required bool isDone,
    required String route,
  }) {
    return GestureDetector(
      onTap: () async {
        final result = await Get.toNamed(route);
        // VerifyScreen saves faceScanDone = true only when the result from /scan_verify is true
        if (route == '/scan_verify' && result == true) {
          await StorageService().writeBool(StorageService.keyFaceScanDone, true);
        }
        await controller.reloadStepFlags();
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A).withOpacity(0.6),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDone ? Colors.greenAccent.withOpacity(0.4) : const Color(0xFF334155),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.greenAccent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: Colors.greenAccent.withOpacity(0.3)),
                  ),
                  child: Text(
                    pill,
                    style: const TextStyle(
                      color: Colors.greenAccent,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                      const SizedBox(height: 2),
                      Text(desc, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                    ],
                  ),
                ),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: isDone ? Colors.greenAccent.withOpacity(0.15) : null,
                    gradient: isDone
                        ? null
                        : const LinearGradient(
                            colors: [Color(0xFF7CF6FF), Color(0xFF9B7BFF)],
                          ),
                    border: isDone ? Border.all(color: Colors.greenAccent) : null,
                  ),
                  child: Icon(
                    isDone ? Icons.check_circle : Icons.chevron_right,
                    color: isDone ? Colors.greenAccent : Colors.white,
                    size: 22,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNoticeBox() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF38BDF8).withOpacity(0.3)),
      ),
      child: const Text(
        'All 3 steps are complete. Your data will be sent to the server to verify you are a real person, then permanently deleted from the server once verification finishes.',
        style: TextStyle(fontSize: 11.5, color: Color(0xFFCBD5E1), height: 1.4),
      ),
    );
  }

  Widget _buildErrorBox() {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF450A0A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.redAccent.withOpacity(0.4)),
      ),
      child: Text(
        controller.pendingError.value,
        style: const TextStyle(fontSize: 12, color: Colors.redAccent),
      ),
    );
  }

  Widget _buildVerifyButton() {
    return Opacity(
      opacity: controller.all3Done ? 1.0 : 0.35,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF2563EB),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        onPressed: controller.all3Done ? () => controller.verify() : null,
        child: const Text(
          'Verify identity',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildFullScreenLoading() {
    return const Scaffold(
      backgroundColor: Color(0xFF020617),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Color(0xFF7CF6FF)),
            SizedBox(height: 20),
            Text(
              'Verifying Identity',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}`,
  },

  profileController: {
    filename: 'profile_controller.dart',
    path: 'lib/controllers/profile_controller.dart',
    desc: 'Step 01 GetX Controller: per-type regex validation, prefill from storage, per-field write & piiUpdated audit log',
    code: `import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../services/storage_service.dart';
import 'verify_controller.dart';

class ProfileController extends GetxController {
  final StorageService _storage = StorageService();

  final firstNameCtrl = TextEditingController();
  final lastNameCtrl = TextEditingController();
  final emailCtrl = TextEditingController();
  final documentNumberCtrl = TextEditingController();
  final cityCtrl = TextEditingController();
  final dobCtrl = TextEditingController();
  final docExpiryCtrl = TextEditingController();

  final RxString firstName = ''.obs;
  final RxString lastName = ''.obs;
  final RxString email = ''.obs;
  final RxString documentType = 'ID Card'.obs;
  final RxString gender = ''.obs;
  final RxString documentNumber = ''.obs;
  final RxString country = 'Cambodia'.obs;
  final RxString stateProvince = ''.obs;
  final RxString city = ''.obs;
  final RxString dateOfBirth = ''.obs;
  final RxString documentExpiry = ''.obs;

  String get fullName => '\${firstName.value.trim()} \${lastName.value.trim()}'.trim();

  static const List<String> documentTypes = ['ID Card', 'Passport', 'Driver License'];
  static const List<String> genders = ['Male', 'Female', 'Other'];
  static const List<String> cambodiaProvinces = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Preah Sihanouk', 'Kampong Cham',
    'Kandal', 'Kampot', 'Takeo', 'Banteay Meanchey', 'Prey Veng', 'Svay Rieng',
    'Kratie', 'Koh Kong', 'Ratanakiri', 'Mondulkiri', 'Kep', 'Pailin',
    'Oddar Meanchey', 'Preah Vihear', 'Stung Treng', 'Kampong Chhnang',
    'Kampong Speu', 'Kampong Thom', 'Pursat', 'Tbong Khmum',
  ];

  static final RegExp _idCardRegex = RegExp(r'^(\\d{9,}|\\d{9,}\\(\\d{2}\\))\$');
  static final RegExp _passportRegex = RegExp(r'^[A-Z]\\d{8}\$');
  static final RegExp _driverLicenseRegex = RegExp(r'^[A-Z]\\.[A-Z]{2}\\.\\d{8}\$');
  static final RegExp _emailRegex = RegExp(r'^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}\$');
  static final RegExp _dateRegex = RegExp(r'^\\d{4}-\\d{2}-\\d{2}\$');

  String get documentNumberHint {
    switch (documentType.value) {
      case 'Passport':
        return 'e.g. N12345678';
      case 'Driver License':
        return 'e.g. B.PP.12345678';
      case 'ID Card':
      default:
        return 'e.g. 123456789 or 123456789(01)';
    }
  }

  bool isValidDocumentNumber(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return false;
    switch (documentType.value) {
      case 'Passport':
        return _passportRegex.hasMatch(trimmed);
      case 'Driver License':
        return _driverLicenseRegex.hasMatch(trimmed);
      case 'ID Card':
      default:
        return _idCardRegex.hasMatch(trimmed);
    }
  }

  bool isValidEmail(String value) => _emailRegex.hasMatch(value.trim());

  List<String> get missingFields {
    final List<String> missing = [];
    if (firstName.value.trim().isEmpty) missing.add('First Name');
    if (lastName.value.trim().isEmpty) missing.add('Last Name');
    if (email.value.trim().isEmpty || !isValidEmail(email.value)) missing.add('Email Address');
    if (!documentTypes.contains(documentType.value)) missing.add('Document Type');
    if (!genders.contains(gender.value)) missing.add('Gender');
    if (!isValidDocumentNumber(documentNumber.value)) missing.add('Document Number');
    if (country.value != 'Cambodia') missing.add('Country');
    if (!_dateRegex.hasMatch(dateOfBirth.value.trim())) missing.add('Date of Birth');
    if (!_dateRegex.hasMatch(documentExpiry.value.trim())) missing.add('Document Expiry');
    return missing;
  }

  bool get canSubmit => missingFields.isEmpty;

  @override
  void onInit() {
    super.onInit();
    firstNameCtrl.addListener(() => firstName.value = firstNameCtrl.text);
    lastNameCtrl.addListener(() => lastName.value = lastNameCtrl.text);
    emailCtrl.addListener(() => email.value = emailCtrl.text);
    documentNumberCtrl.addListener(() => documentNumber.value = documentNumberCtrl.text);
    cityCtrl.addListener(() => city.value = cityCtrl.text);
    dobCtrl.addListener(() => dateOfBirth.value = dobCtrl.text);
    docExpiryCtrl.addListener(() => documentExpiry.value = docExpiryCtrl.text);
    prefillFromSecureStorage();
  }

  Future<void> prefillFromSecureStorage() async {
    firstNameCtrl.text = await _storage.readString(StorageService.keyFirstName) ?? '';
    lastNameCtrl.text = await _storage.readString(StorageService.keyLastName) ?? '';
    emailCtrl.text = await _storage.readString(StorageService.keyEmail) ?? '';
    final savedDocType = await _storage.readString(StorageService.keyDocumentType) ?? 'ID Card';
    documentType.value = documentTypes.contains(savedDocType) ? savedDocType : 'ID Card';
    final savedGender = await _storage.readString(StorageService.keyGender) ?? '';
    gender.value = genders.contains(savedGender) ? savedGender : '';
    documentNumberCtrl.text = await _storage.readString(StorageService.keyDocumentNumber) ?? '';
    country.value = 'Cambodia';
    stateProvince.value = await _storage.readString(StorageService.keyStateProvince) ?? '';
    cityCtrl.text = await _storage.readString(StorageService.keyCity) ?? '';
    dobCtrl.text = await _storage.readString(StorageService.keyDateOfBirth) ?? '';
    docExpiryCtrl.text = await _storage.readString(StorageService.keyDocumentExpiry) ?? '';
  }

  Future<void> submitProfile() async {
    final missing = missingFields;
    if (missing.isNotEmpty) {
      await Get.defaultDialog(
        title: 'Required Fields',
        middleText: missing.join('\\n'),
        textConfirm: 'OK',
        onConfirm: () => Get.back(),
      );
      return;
    }

    await _storage.writeString(StorageService.keyFirstName, firstName.value.trim());
    await _storage.writeString(StorageService.keyLastName, lastName.value.trim());
    await _storage.writeString(StorageService.keyFullName, fullName);
    await _storage.writeString(StorageService.keyEmail, email.value.trim());
    await _storage.writeString(StorageService.keyDocumentType, documentType.value);
    await _storage.writeString(StorageService.keyGender, gender.value);
    await _storage.writeString(StorageService.keyDocumentNumber, documentNumber.value.trim());
    await _storage.writeString(StorageService.keyCountry, 'Cambodia');
    await _storage.writeString(StorageService.keyStateProvince, stateProvince.value);
    await _storage.writeString(StorageService.keyCity, city.value.trim());
    await _storage.writeString(StorageService.keyDateOfBirth, dateOfBirth.value.trim());
    await _storage.writeString(StorageService.keyDocumentExpiry, documentExpiry.value.trim());

    await _storage.writeBool(StorageService.keyUserUpdatedProfile, true);
    await _storage.writeAuditEvent('piiUpdated', {'fullName': fullName});

    if (Get.isRegistered<VerifyController>()) {
      await Get.find<VerifyController>().reloadStepFlags();
    }

    Get.back();
    Get.snackbar('Profile Saved', 'Your profile details have been saved.');
  }
}`,
  },

  profileScreen: {
    filename: 'profile_screen.dart',
    path: 'lib/screens/profile_screen.dart',
    desc: 'Step 01 UI bound to ProfileController (GetX)',
    code: `import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../controllers/profile_controller.dart';

class ProfileScreen extends GetView<ProfileController> {
  const ProfileScreen({super.key});

  Future<void> _pickDate(BuildContext context, TextEditingController ctrl, {required bool isExpiry}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: isExpiry ? now.add(const Duration(days: 1825)) : DateTime(1995, 9, 12),
      firstDate: isExpiry ? now : DateTime(1920),
      lastDate: isExpiry ? DateTime(2060) : now,
    );
    if (picked != null) {
      ctrl.text = DateFormat('yyyy-MM-dd').format(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(title: const Text('Complete your profile'), backgroundColor: Colors.transparent),
      body: SafeArea(
        child: Obx(
          () => SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(controller: controller.firstNameCtrl, decoration: const InputDecoration(labelText: 'First Name *')),
                const SizedBox(height: 12),
                TextField(controller: controller.lastNameCtrl, decoration: const InputDecoration(labelText: 'Last Name *')),
                const SizedBox(height: 12),
                TextField(controller: controller.emailCtrl, decoration: const InputDecoration(labelText: 'Email Address *')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: controller.documentType.value,
                  items: ProfileController.documentTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                  onChanged: (v) => v != null ? controller.documentType.value = v : null,
                  decoration: const InputDecoration(labelText: 'Document Type *'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: controller.gender.value.isEmpty ? null : controller.gender.value,
                  items: ProfileController.genders.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                  onChanged: (v) => v != null ? controller.gender.value = v : null,
                  decoration: const InputDecoration(labelText: 'Gender *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller.documentNumberCtrl,
                  decoration: InputDecoration(
                    labelText: 'Document Number *',
                    hintText: controller.documentNumberHint,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(initialValue: 'Cambodia', enabled: false, decoration: const InputDecoration(labelText: 'Country')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: controller.stateProvince.value.isEmpty ? null : controller.stateProvince.value,
                  items: ProfileController.cambodiaProvinces.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                  onChanged: (v) => controller.stateProvince.value = v ?? '',
                  decoration: const InputDecoration(labelText: 'State / Province (Optional)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller.dobCtrl,
                  readOnly: true,
                  onTap: () => _pickDate(context, controller.dobCtrl, isExpiry: false),
                  decoration: const InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD) *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller.docExpiryCtrl,
                  readOnly: true,
                  onTap: () => _pickDate(context, controller.docExpiryCtrl, isExpiry: true),
                  decoration: const InputDecoration(labelText: 'Document Expiry (YYYY-MM-DD) *'),
                ),
                const SizedBox(height: 24),
                Opacity(
                  opacity: controller.canSubmit ? 1.0 : 0.4,
                  child: ElevatedButton(
                    onPressed: () => controller.submitProfile(),
                    child: const Text('Save Profile'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}`,
  },

  takeGovDocumentController: {
    filename: 'take_gov_document_controller.dart',
    path: 'lib/controllers/take_gov_document_controller.dart',
    desc: 'Step 02 GetX Controller: BACK camera, 85%x55% crop (JPEG q85), ML Kit OCR upper-case validation, 1200px q70 compression & backup exclusion',
    code: `import 'dart:io';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';
import '../services/storage_service.dart';
import 'verify_controller.dart';

class TakeGovDocumentController extends GetxController {
  final StorageService _storage = StorageService();
  final TextRecognizer _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

  CameraController? cameraController;
  final RxBool isCameraInitialized = false.obs;
  final RxBool isTorchOn = false.obs;
  final RxBool isProcessing = false.obs;
  final RxString documentType = 'ID Card'.obs;
  final RxString currentSide = 'FRONT'.obs; // "FRONT" | "BACK"

  Uint8List? _frontCompressedBytes;
  Uint8List? _backCompressedBytes;

  bool get requiresBackSide => documentType.value == 'ID Card';

  String get instructionText =>
      'Place the \${currentSide.value} of your \${documentType.value} in the frame';

  @override
  void onInit() {
    super.onInit();
    _loadDocTypeAndInitCamera();
  }

  Future<void> _loadDocTypeAndInitCamera() async {
    final savedType = await _storage.readString(StorageService.keyDocumentType);
    if (savedType != null && savedType.isNotEmpty) {
      documentType.value = savedType;
    }

    final cameras = await availableCameras();
    final backCamera = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => cameras.first,
    );

    cameraController = CameraController(
      backCamera,
      ResolutionPreset.high,
      enableAudio: false,
    );
    await cameraController!.initialize();
    isCameraInitialized.value = true;
  }

  Future<void> toggleTorch() async {
    if (cameraController == null || !isCameraInitialized.value) return;
    isTorchOn.value = !isTorchOn.value;
    await cameraController!.setFlashMode(
      isTorchOn.value ? FlashMode.torch : FlashMode.off,
    );
  }

  /// Validates upper-cased OCR text against per-document rules:
  /// - ID Card FRONT : contains IDKHM | IDKH | "IDENTITY CARD" | "CARTE D'IDENTITE"
  /// - ID Card BACK  : contains IDKHM | "KINGDOM OF CAMBODIA" | KINGDOM | CAMBODIA | "KHMER IDENTITY CARD"
  /// - Passport      : contains PASSPORT | PASSEPORT | P<KHM | "KINGDOM OF CAMBODIA"
  /// - Driver License: contains "DRIVING LICENSE" | "PERMIS DE CONDUIRE" | "SPECIAL CONDITIONS"
  bool validateOcrText(String rawText) {
    final upper = rawText.toUpperCase();
    if (documentType.value == 'ID Card') {
      if (currentSide.value == 'FRONT') {
        return upper.contains('IDKHM') ||
            upper.contains('IDKH') ||
            upper.contains('IDENTITY CARD') ||
            upper.contains("CARTE D'IDENTITE");
      } else {
        return upper.contains('IDKHM') ||
            upper.contains('KINGDOM OF CAMBODIA') ||
            upper.contains('KINGDOM') ||
            upper.contains('CAMBODIA') ||
            upper.contains('KHMER IDENTITY CARD');
      }
    } else if (documentType.value == 'Passport') {
      return upper.contains('PASSPORT') ||
          upper.contains('PASSEPORT') ||
          upper.contains('P<KHM') ||
          upper.contains('KINGDOM OF CAMBODIA');
    } else if (documentType.value == 'Driver License') {
      return upper.contains('DRIVING LICENSE') ||
          upper.contains('PERMIS DE CONDUIRE') ||
          upper.contains('SPECIAL CONDITIONS');
    }
    return false;
  }

  /// Captures picture, turns torch off, crops to 85%w x 55%w frame (JPEG q85),
  /// validates with ML Kit OCR, compresses accepted crop (max 1200px, JPEG q70),
  /// deletes temp file, and saves gov_doc_front.jpg / gov_doc_back.jpg when complete.
  Future<void> captureFrame(Size screenSize) async {
    if (cameraController == null || !isCameraInitialized.value || isProcessing.value) return;
    isProcessing.value = true;

    File? tempCropFile;
    try {
      final XFile shot = await cameraController!.takePicture();
      // Turn torch off immediately after taking picture
      if (isTorchOn.value) {
        isTorchOn.value = false;
        await cameraController!.setFlashMode(FlashMode.off);
      }

      final rawBytes = await File(shot.path).readAsBytes();
      final decoded = img.decodeImage(rawBytes);
      if (decoded == null) return;

      // Scale centered capture frame (width = 85% of screen width, height = 55% of screen width) to image pixels
      final double frameW = screenSize.width * 0.85;
      final double frameH = screenSize.width * 0.55;
      final double frameLeft = (screenSize.width - frameW) / 2.0;
      final double frameTop = (screenSize.height - frameH) / 2.0;

      final double scaleX = decoded.width / screenSize.width;
      final double scaleY = decoded.height / screenSize.height;

      final int cropX = (frameLeft * scaleX).round().clamp(0, decoded.width - 1);
      final int cropY = (frameTop * scaleY).round().clamp(0, decoded.height - 1);
      final int cropW = (frameW * scaleX).round().clamp(1, decoded.width - cropX);
      final int cropH = (frameH * scaleY).round().clamp(1, decoded.height - cropY);

      final img.Image cropped = img.copyCrop(
        decoded,
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
      );

      // Save cropped image as temp JPEG q85 for ML Kit OCR
      final tempDir = await getTemporaryDirectory();
      tempCropFile = File('\${tempDir.path}/crop_\${DateTime.now().millisecondsSinceEpoch}.jpg');
      await tempCropFile.writeAsBytes(img.encodeJpg(cropped, quality: 85), flush: true);

      final recognized = await _textRecognizer.processImage(
        InputImage.fromFilePath(tempCropFile.path),
      );

      if (!validateOcrText(recognized.text)) {
        Get.snackbar(
          'Invalid Document',
          'Could not verify \${documentType.value} (\${currentSide.value}). Please align inside the frame.',
          snackPosition: SnackPosition.BOTTOM,
        );
        return;
      }

      // Compress accepted image (max side 1200 px, JPEG q70), delete temp file, keep bytes
      img.Image resized = cropped;
      if (cropped.width > 1200 || cropped.height > 1200) {
        resized = cropped.width >= cropped.height
            ? img.copyResize(cropped, width: 1200)
            : img.copyResize(cropped, height: 1200);
      }
      final compressedBytes = Uint8List.fromList(img.encodeJpg(resized, quality: 70));

      if (await tempCropFile.exists()) {
        await tempCropFile.delete();
      }
      if (await File(shot.path).exists()) {
        await File(shot.path).delete();
      }

      if (currentSide.value == 'FRONT') {
        _frontCompressedBytes = compressedBytes;
        if (requiresBackSide) {
          currentSide.value = 'BACK';
          Get.snackbar(
            'Front Scanned',
            'Front scanned. Please scan BACK side.',
            snackPosition: SnackPosition.BOTTOM,
          );
          return;
        }
      } else {
        _backCompressedBytes = compressedBytes;
      }

      // Write gov_doc_front.jpg / gov_doc_back.jpg to app documents dir (exclude from iCloud/Drive backup)
      final docsDir = await getApplicationDocumentsDirectory();
      final frontFile = File('\${docsDir.path}/gov_doc_front.jpg');
      await frontFile.writeAsBytes(_frontCompressedBytes!, flush: true);
      await _excludeFromCloudBackup(frontFile.path);
      await _storage.writeString(StorageService.keyGovDocFrontPath, frontFile.path);

      if (requiresBackSide && _backCompressedBytes != null) {
        final backFile = File('\${docsDir.path}/gov_doc_back.jpg');
        await backFile.writeAsBytes(_backCompressedBytes!, flush: true);
        await _excludeFromCloudBackup(backFile.path);
        await _storage.writeString(StorageService.keyGovDocBackPath, backFile.path);
      }

      await _storage.writeBool(StorageService.keyGovDocDone, true);
      if (Get.isRegistered<VerifyController>()) {
        await Get.find<VerifyController>().reloadStepFlags();
      }

      Get.back();
      Get.snackbar('Document Captured', 'Government ID verified and saved.');
    } finally {
      if (tempCropFile != null && await tempCropFile.exists()) {
        await tempCropFile.delete();
      }
      isProcessing.value = false;
    }
  }

  Future<void> _excludeFromCloudBackup(String filePath) async {
    const channel = MethodChannel('kh.neuralkey.wallet/backup_exclusion');
    try {
      await channel.invokeMethod('excludeFromBackup', {'path': filePath});
    } catch (_) {}
  }

  @override
  void onClose() {
    cameraController?.dispose();
    _textRecognizer.close();
    super.onClose();
  }
}`,
  },

  takeGovDocumentScreen: {
    filename: 'take_gov_document_screen.dart',
    path: 'lib/screens/take_gov_document_screen.dart',
    desc: 'Step 02 Screen: full-screen BACK camera, 85%x55% dimmed cutout overlay, FRONT->BACK pills, torch toggle & 72x72 shutter',
    code: `import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/take_gov_document_controller.dart';

class TakeGovDocumentScreen extends GetView<TakeGovDocumentController> {
  const TakeGovDocumentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenSize = MediaQuery.of(context).size;
    final frameW = screenSize.width * 0.85;
    final frameH = screenSize.width * 0.55;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Obx(() {
        if (!controller.isCameraInitialized.value || controller.cameraController == null) {
          return const Center(child: CircularProgressIndicator());
        }

        return Stack(
          fit: StackFit.expand,
          children: [
            // Full-screen BACK camera preview
            CameraPreview(controller.cameraController!),

            // Dim everything outside the centered 85%w x 55%w capture frame
            ColorFiltered(
              colorFilter: ColorFilter.mode(
                Colors.black.withOpacity(0.68),
                BlendMode.srcOut,
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      color: Colors.black,
                      backgroundBlendMode: BlendMode.dstOut,
                    ),
                  ),
                  Center(
                    child: Container(
                      width: frameW,
                      height: frameH,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Frame border
            Center(
              child: Container(
                width: frameW,
                height: frameH,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF7CF6FF), width: 2.5),
                ),
              ),
            ),

            // Header pills "FRONT" -> "BACK" (BACK pill only for ID Card) + instruction text
            SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
                          onPressed: () => Get.back(),
                        ),
                        Row(
                          children: [
                            _buildSidePill('FRONT', controller.currentSide.value == 'FRONT'),
                            if (controller.requiresBackSide) ...[
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 6),
                                child: Icon(Icons.arrow_forward, size: 14, color: Colors.white54),
                              ),
                              _buildSidePill('BACK', controller.currentSide.value == 'BACK'),
                            ],
                          ],
                        ),
                        IconButton(
                          icon: Icon(
                            controller.isTorchOn.value ? Icons.flash_on : Icons.flash_off,
                            color: controller.isTorchOn.value ? Colors.amber : Colors.white,
                          ),
                          onPressed: controller.toggleTorch,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      controller.instructionText,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ),
                  const Spacer(),
                  // 72x72 Shutter Button
                  Padding(
                    padding: const EdgeInsets.only(bottom: 32),
                    child: GestureDetector(
                      onTap: () => controller.captureFrame(screenSize),
                      child: Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 4),
                          color: Colors.white24,
                        ),
                        child: const Center(
                          child: Icon(Icons.camera_alt, color: Colors.white, size: 30),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildSidePill(String label, bool active) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: active ? Colors.greenAccent.withOpacity(0.2) : Colors.white10,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: active ? Colors.greenAccent : Colors.white24),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: active ? Colors.greenAccent : Colors.white60,
          fontWeight: FontWeight.bold,
          fontSize: 11,
        ),
      ),
    );
  }
}`,
  },

  verifyHumanScreen: {
    filename: 'verify_human_screen.dart',
    path: 'lib/screens/verify_human_screen.dart',
    desc: 'Step 03 Active Liveness: FRONT camera stream, NV21/bgra8888, lookLeft->lookRight->smile->blink, neutral check, 30% fill-light & 300ms dispose',
    code: `import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:path_provider/path_provider.dart';
import '../services/storage_service.dart';

enum LivenessChallenge { lookLeft, lookRight, smile, blink }

class VerifyHumanScreen extends StatefulWidget {
  const VerifyHumanScreen({super.key});

  @override
  State<VerifyHumanScreen> createState() => _VerifyHumanScreenState();
}

class _VerifyHumanScreenState extends State<VerifyHumanScreen>
    with SingleTickerProviderStateMixin {
  final StorageService _storage = StorageService();
  CameraController? _cameraController;
  late final FaceDetector _faceDetector;
  late final AnimationController _pulseController;

  static const List<LivenessChallenge> _challenges = [
    LivenessChallenge.lookLeft,
    LivenessChallenge.lookRight,
    LivenessChallenge.smile,
    LivenessChallenge.blink,
  ];

  int _currentIndex = 0;
  bool _awaitingNeutral = false;
  bool _faceDetected = false;
  bool _fillLightOn = false;
  bool _isBusyFrame = false;
  bool _isTakingPhoto = false;
  bool _retriedIosCamera = false;
  double _liveConfidence = 0.0;
  final Map<LivenessChallenge, double> _scores = {};

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableContours: true,
        enableClassification: true,
        minFaceSize: 0.15,
        performanceMode: FaceDetectorMode.accurate,
      ),
    );
    _initFrontCamera();
  }

  Future<void> _initFrontCamera() async {
    try {
      final cameras = await availableCameras();
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      _cameraController = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: Platform.isAndroid
            ? ImageFormatGroup.yuv420
            : ImageFormatGroup.bgra8888,
      );
      await _cameraController!.initialize();
      await _cameraController!.startImageStream(_processCameraImage);
      if (mounted) setState(() {});
    } catch (_) {
      // On camera failure: retry once on iOS after 1 s, otherwise pop(false) after first frame
      if (Platform.isIOS && !_retriedIosCamera) {
        _retriedIosCamera = true;
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) await _initFrontCamera();
      } else {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) Get.back(result: false);
        });
      }
    }
  }

  /// Converts Android YUV_420_888 planes into packed NV21 bytes.
  Uint8List _yuv420ToNv21(CameraImage image) {
    final width = image.width;
    final height = image.height;
    final yPlane = image.planes[0];
    final uPlane = image.planes[1];
    final vPlane = image.planes[2];

    final nv21 = Uint8List(width * height + (width * height ~/ 2));
    int idY = 0;
    for (int row = 0; row < height; row++) {
      final rowOffset = row * yPlane.bytesPerRow;
      nv21.setRange(idY, idY + width, yPlane.bytes, rowOffset);
      idY += width;
    }

    int idUV = width * height;
    final uvRowStride = vPlane.bytesPerRow;
    final uvPixelStride = vPlane.bytesPerPixel ?? 1;
    for (int row = 0; row < height ~/ 2; row++) {
      for (int col = 0; col < width ~/ 2; col++) {
        final offset = row * uvRowStride + col * uvPixelStride;
        nv21[idUV++] = vPlane.bytes[offset];
        nv21[idUV++] = uPlane.bytes[offset];
      }
    }
    return nv21;
  }

  InputImage? _buildInputImage(CameraImage image) {
    final cam = _cameraController!.description;
    if (Platform.isAndroid) {
      final nv21Bytes = _yuv420ToNv21(image);
      final rotation = InputImageRotationValue.fromRawValue(cam.sensorOrientation) ??
          InputImageRotation.rotation270deg;
      return InputImage.fromBytes(
        bytes: nv21Bytes,
        metadata: InputImageMetadata(
          size: Size(image.width.toDouble(), image.height.toDouble()),
          rotation: rotation,
          format: InputImageFormat.nv21,
          bytesPerRow: image.width,
        ),
      );
    } else {
      // iOS: bgra8888, rotation 0
      return InputImage.fromBytes(
        bytes: image.planes.first.bytes,
        metadata: InputImageMetadata(
          size: Size(image.width.toDouble(), image.height.toDouble()),
          rotation: InputImageRotation.rotation0deg,
          format: InputImageFormat.bgra8888,
          bytesPerRow: image.planes.first.bytesPerRow,
        ),
      );
    }
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isBusyFrame || _isTakingPhoto || !mounted) return;
    _isBusyFrame = true;

    try {
      final inputImage = _buildInputImage(image);
      if (inputImage == null) return;
      final faces = await _faceDetector.processImage(inputImage);

      if (faces.isEmpty) {
        if (mounted) setState(() => _faceDetected = false);
        return;
      }

      final face = faces.first;
      final rawYaw = face.headEulerAngleY ?? 0.0;
      // iOS: invert headEulerAngleY (mirrored frames)
      final correctedYaw = Platform.isIOS ? -rawYaw : rawYaw;
      final smile = face.smilingProbability ?? 0.0;
      final leftOpen = face.leftEyeOpenProbability ?? 1.0;
      final rightOpen = face.rightEyeOpenProbability ?? 1.0;
      final avgEyeClosed = ((1.0 - leftOpen) + (1.0 - rightOpen)) / 2.0;

      // Neutral check: smile < 0.15, both eyes open > 0.75, |yaw| < 12 deg
      final isNeutral = smile < 0.15 &&
          leftOpen > 0.75 &&
          rightOpen > 0.75 &&
          correctedYaw.abs() < 12.0;

      if (_awaitingNeutral) {
        if (isNeutral && mounted) {
          setState(() {
            _awaitingNeutral = false;
            _currentIndex++;
          });
        }
        return;
      }

      final challenge = _challenges[_currentIndex];
      double actionScore = 0.0;
      bool passed = false;

      switch (challenge) {
        case LivenessChallenge.lookLeft:
          actionScore = (correctedYaw / 35.0).clamp(0.0, 1.0);
          passed = correctedYaw > 15.0;
          break;
        case LivenessChallenge.lookRight:
          actionScore = (-correctedYaw / 35.0).clamp(0.0, 1.0);
          passed = correctedYaw < -15.0;
          break;
        case LivenessChallenge.smile:
          actionScore = smile.clamp(0.0, 1.0);
          passed = smile >= 0.65;
          break;
        case LivenessChallenge.blink:
          actionScore = avgEyeClosed.clamp(0.0, 1.0);
          passed = avgEyeClosed >= 0.75;
          break;
      }

      if (mounted) {
        setState(() {
          _faceDetected = true;
          _liveConfidence = actionScore;
        });
      }

      if (passed) {
        await _onChallengeCompleted(challenge, actionScore);
      }
    } finally {
      _isBusyFrame = false;
    }
  }

  Future<void> _onChallengeCompleted(LivenessChallenge challenge, double score) async {
    _isTakingPhoto = true;
    try {
      _scores[challenge] = score;
      final docsDir = await getApplicationDocumentsDirectory();
      final actionName = challenge.name;
      final outPath = '\${docsDir.path}/liveness_\$actionName.jpg';

      // Take still photo -> liveness_<action>.jpg in documents dir (retry once after 200 ms)
      XFile? photo;
      try {
        photo = await _cameraController!.takePicture();
      } catch (_) {
        await Future.delayed(const Duration(milliseconds: 200));
        photo = await _cameraController!.takePicture();
      }

      await File(photo.path).copy(outPath);
      await _storage.writeString('liveness_\$actionName', outPath);

      if (_currentIndex < _challenges.length - 1) {
        if (mounted) setState(() => _awaitingNeutral = true);
      } else {
        // Final (blink) photo is also saved as the profile selfie
        await _storage.writeString(StorageService.keyProfileSelfiePath, outPath);
        await _evaluateOverallScore();
      }
    } finally {
      _isTakingPhoto = false;
    }
  }

  Future<void> _evaluateOverallScore() async {
    final total = _scores.values.fold<double>(0.0, (a, b) => a + b);
    final meanScore = total / _challenges.length;

    if (meanScore >= 0.85) {
      await _storage.writeAuditEvent('livenessCheckSuccess', {
        'meanScore': meanScore,
      });
      if (mounted) Get.back(result: true);
    } else {
      await _storage.writeAuditEvent('livenessCheckFailure', {
        'meanScore': meanScore,
      });
      await Get.defaultDialog(
        title: 'Liveness Check Failed',
        middleText: 'Mean confidence (\${(meanScore * 100).toStringAsFixed(1)}%) was below 85%. Please try again.',
        textConfirm: 'Retry',
        onConfirm: () => Get.back(),
      );
      if (mounted) {
        setState(() {
          _scores.clear();
          _currentIndex = 0;
          _awaitingNeutral = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    final cam = _cameraController;
    final det = _faceDetector;
    // Dispose detector + camera 300 ms after dispose()
    Future.delayed(const Duration(milliseconds: 300), () async {
      await cam?.dispose();
      await det.close();
    });
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final challenge = _challenges[_currentIndex];
    final isTurnStep = challenge == LivenessChallenge.lookLeft ||
        challenge == LivenessChallenge.lookRight;

    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      body: Stack(
        fit: StackFit.expand,
        children: [
          if (_cameraController != null && _cameraController!.value.isInitialized)
            CameraPreview(_cameraController!),

          // Screen fill-light toggle (30% white overlay) instead of a flash
          if (_fillLightOn)
            IgnorePointer(
              child: Container(color: Colors.white.withOpacity(0.30)),
            ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Top HUD: "REC" and "IAL2 VERIFICATION" + Fill-light button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.fiber_manual_record, color: Colors.redAccent, size: 14),
                          SizedBox(width: 4),
                          Text('REC', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                          SizedBox(width: 12),
                          Text('IAL2 VERIFICATION', style: TextStyle(color: Color(0xFF7CF6FF), fontWeight: FontWeight.bold)),
                        ],
                      ),
                      IconButton(
                        icon: Icon(Icons.wb_sunny, color: _fillLightOn ? Colors.amber : Colors.white70),
                        onPressed: () => setState(() => _fillLightOn = !_fillLightOn),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Progress bar (index / 4)
                  LinearProgressIndicator(
                    value: _currentIndex / 4.0,
                    backgroundColor: Colors.white12,
                    color: Colors.greenAccent,
                  ),
                  const SizedBox(height: 12),
                  // "Face Detected / No Face Detected" chip & live "Confidence" meter
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Chip(
                        label: Text(_faceDetected ? 'Face Detected' : 'No Face Detected'),
                      ),
                      Text(
                        'Confidence: \${(_liveConfidence * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Circular head-pose guide ring for turn steps OR pulsing corner-bracket frame for smile/blink
                  if (isTurnStep)
                    Container(
                      width: 240,
                      height: 240,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF7CF6FF), width: 3),
                      ),
                    )
                  else
                    ScaleTransition(
                      scale: Tween<double>(begin: 0.96, end: 1.04).animate(_pulseController),
                      child: Container(
                        width: 230,
                        height: 230,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.greenAccent, width: 3),
                        ),
                      ),
                    ),
                  const Spacer(),
                  if (_awaitingNeutral)
                    const Text(
                      'Return to neutral position',
                      style: TextStyle(color: Colors.amberAccent, fontSize: 16, fontWeight: FontWeight.bold),
                    )
                  else
                    Text(
                      'Challenge \${_currentIndex + 1}/4: \${challenge.name}',
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}`,
  },

  homeScreen: {
    filename: 'home_screen.dart',
    path: 'lib/screens/home_screen.dart',
    desc: 'Wallet HomeScreen displaying server-synced TrustLevelController state & V2 Verifiable Credential',
    code: `import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/trust_level_controller.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final trustCtrl = TrustLevelController.to;
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(title: const Text('Neuralkey DID Wallet'), backgroundColor: Colors.transparent),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Obx(
            () => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.greenAccent.withOpacity(0.5)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Trust Level: \${trustCtrl.trustLevel.value}',
                        style: const TextStyle(color: Colors.greenAccent, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Synced from server via TrustLevelController.syncNow()',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                OutlinedButton(
                  onPressed: () => Get.toNamed('/verify'),
                  child: const Text('Back to Identity Verify (/verify)'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}`,
  },
};

export const FlutterSourceCodeModal: React.FC<FlutterSourceCodeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileKey, setSelectedFileKey] = useState<string>('takeGovDocumentController');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeFile = FLUTTER_FILES[selectedFileKey] || FLUTTER_FILES.pubspec;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Code className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Flutter Prototype Source Code — "Identity Verify" (IAL2 Upgrade)
              </h3>
              <p className="text-xs text-slate-400">
                GetX · flutter_secure_storage · camera · google_mlkit_text_recognition ·
                google_mlkit_face_detection · cryptography (ECIES)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File Explorer + Code Viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar File Tree */}
          <div className="w-68 bg-slate-950 border-r border-slate-800 p-3 overflow-y-auto space-y-1 shrink-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 pb-2 font-bold">
              Flutter Project Files (12)
            </div>
            {Object.entries(FLUTTER_FILES).map(([key, file]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedFileKey(key)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  selectedFileKey === key
                    ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 font-bold'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <div className="truncate">
                  <div className="truncate">{file.filename}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{file.path}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Code Pane */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#070b14]">
            <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-300">{activeFile.path}</span>
                <p className="text-[11px] text-slate-400">{activeFile.desc}</p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>

            <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-slate-200 leading-relaxed">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
