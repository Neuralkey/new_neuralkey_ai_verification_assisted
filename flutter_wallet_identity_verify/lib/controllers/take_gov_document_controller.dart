import 'dart:io';
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
      'Place the ${currentSide.value} of your ${documentType.value} in the frame';

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
      tempCropFile = File('${tempDir.path}/crop_${DateTime.now().millisecondsSinceEpoch}.jpg');
      await tempCropFile.writeAsBytes(img.encodeJpg(cropped, quality: 85), flush: true);

      final recognized = await _textRecognizer.processImage(
        InputImage.fromFilePath(tempCropFile.path),
      );

      if (!validateOcrText(recognized.text)) {
        Get.snackbar(
          'Invalid Document',
          'Could not verify ${documentType.value} (${currentSide.value}). Please align inside the frame.',
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
      final frontFile = File('${docsDir.path}/gov_doc_front.jpg');
      await frontFile.writeAsBytes(_frontCompressedBytes!, flush: true);
      await _excludeFromCloudBackup(frontFile.path);
      await _storage.writeString(StorageService.keyGovDocFrontPath, frontFile.path);

      if (requiresBackSide && _backCompressedBytes != null) {
        final backFile = File('${docsDir.path}/gov_doc_back.jpg');
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
}