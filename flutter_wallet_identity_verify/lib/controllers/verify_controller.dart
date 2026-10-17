import 'dart:async';
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
}