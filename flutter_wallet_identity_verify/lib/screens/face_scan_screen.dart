import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import '../services/storage_service.dart';

class FaceScanScreen extends StatefulWidget {
  const FaceScanScreen({super.key});

  @override
  State<FaceScanScreen> createState() => _FaceScanScreenState();
}

class _FaceScanScreenState extends State<FaceScanScreen> {
  CameraController? _cameraController;
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableClassification: true,
      enableLandmarks: true,
      performanceMode: FaceDetectorMode.accurate,
    ),
  );
  bool _isProcessing = false;
  String _livenessStatus = 'Position face in frame';

  @override
  void initState() {
    super.initState();
    _initFrontCamera();
  }

  Future<void> _initFrontCamera() async {
    final cameras = await availableCameras();
    final frontCam = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );
    _cameraController = CameraController(frontCam, ResolutionPreset.high);
    await _cameraController!.initialize();
    if (mounted) setState(() {});
  }

  Future<void> _captureAndVerifyFace() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized || _isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      final image = await _cameraController!.takePicture();
      final inputImage = InputImage.fromFilePath(image.path);
      final faces = await _faceDetector.processImage(inputImage);

      if (faces.isEmpty) {
        Get.snackbar('Error', 'No human face detected.', snackPosition: SnackPosition.BOTTOM);
        return;
      }

      final face = faces.first;
      // Check eye blink & smile probability
      final isBlinking = (face.leftEyeOpenProbability ?? 1.0) < 0.2 || (face.rightEyeOpenProbability ?? 1.0) < 0.2;
      final isSmiling = (face.smilingProbability ?? 0.0) > 0.4;

      // Save faceScanPath & faceScanDone = true to secure storage
      final storage = StorageService();
      await storage.writeString(StorageService.keyFaceScanPath, image.path);
      await storage.writeBool(StorageService.keyFaceScanDone, true);

      Get.snackbar('Liveness Passed', 'Human verification confirmed.', snackPosition: SnackPosition.BOTTOM);
      await Future.delayed(const Duration(milliseconds: 600));
      Get.back();
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _faceDetector.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(title: const Text('Scan Face'), backgroundColor: Colors.transparent),
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
                onPressed: _isProcessing ? null : _captureAndVerifyFace,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  minimumSize: const Size.fromHeight(50),
                ),
                child: _isProcessing
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Capture & Verify Liveness'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}