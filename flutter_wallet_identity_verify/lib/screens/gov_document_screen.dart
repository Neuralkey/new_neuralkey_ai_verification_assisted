import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../services/storage_service.dart';

class GovDocumentScreen extends StatefulWidget {
  const GovDocumentScreen({super.key});

  @override
  State<GovDocumentScreen> createState() => _GovDocumentScreenState();
}

class _GovDocumentScreenState extends State<GovDocumentScreen> {
  CameraController? _cameraController;
  final TextRecognizer _textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
  bool _isProcessing = false;
  String _detectedText = '';

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    if (cameras.isNotEmpty) {
      _cameraController = CameraController(cameras.first, ResolutionPreset.high);
      await _cameraController!.initialize();
      if (mounted) setState(() {});
    }
  }

  Future<void> _captureAndOcr() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized || _isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      final image = await _cameraController!.takePicture();
      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);

      setState(() => _detectedText = recognizedText.text);

      // Write document path & govDocDone = true to secure storage
      final storage = StorageService();
      await storage.writeString(StorageService.keyGovDocPath, image.path);
      await storage.writeBool(StorageService.keyGovDocDone, true);

      Get.snackbar('OCR Verified', 'Document details successfully extracted.', snackPosition: SnackPosition.BOTTOM);
      await Future.delayed(const Duration(milliseconds: 600));
      Get.back();
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(title: const Text('Valid Government ID'), backgroundColor: Colors.transparent),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _cameraController == null || !_cameraController!.value.isInitialized
                  ? const Center(child: CircularProgressIndicator())
                  : CameraPreview(_cameraController!),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: _isProcessing ? null : _captureAndOcr,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  minimumSize: const Size.fromHeight(50),
                ),
                child: _isProcessing
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Capture & Run ML Kit OCR'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}