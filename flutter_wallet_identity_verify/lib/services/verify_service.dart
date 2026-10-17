import 'dart:async';
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
        .get(Uri.parse('$baseUrl/server-pubkey'))
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
          Uri.parse('$baseUrl/credential-offer'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'username': email, 'didKey': didKey}),
        )
        .timeout(const Duration(seconds: 20));
    final preAuthCode = jsonDecode(offerRes.body)['preAuthorizedCode'] as String;

    // Step 5b: POST token (preAuthorizedCode) -> access token
    final tokenRes = await http
        .post(
          Uri.parse('$baseUrl/token'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'preAuthorizedCode': preAuthCode}),
        )
        .timeout(const Duration(seconds: 20));
    final accessToken = jsonDecode(tokenRes.body)['access_token'] as String;

    // Step 5c: Sign token as nonce with wallet Ed25519 private key & POST submit-govdocuments
    final signedNonce = await _crypto.signTokenNonce(accessToken, null);
    final submitRes = await http
        .post(
          Uri.parse('$baseUrl/submit-govdocuments'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $accessToken',
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
    final cachedFront = File('${docsDir.path}/gov_doc_front.jpg');
    if (cachedFront.path != frontDocFile.path) {
      await cachedFront.writeAsBytes(frontBytes, flush: true);
    }

    return responseJson;
  }
}