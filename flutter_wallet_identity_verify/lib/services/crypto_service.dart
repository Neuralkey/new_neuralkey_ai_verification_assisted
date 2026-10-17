import 'dart:convert';
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
        .replaceAll(RegExp(r'\s+'), '');

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
    return '-----BEGIN PUBLIC KEY-----\n$b64\n-----END PUBLIC KEY-----';
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
}