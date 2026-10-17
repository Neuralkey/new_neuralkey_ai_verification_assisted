import 'dart:convert';
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
}