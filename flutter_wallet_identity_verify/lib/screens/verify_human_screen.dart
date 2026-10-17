import 'dart:async';
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
      final outPath = '${docsDir.path}/liveness_$actionName.jpg';

      // Take still photo -> liveness_<action>.jpg in documents dir (retry once after 200 ms)
      XFile? photo;
      try {
        photo = await _cameraController!.takePicture();
      } catch (_) {
        await Future.delayed(const Duration(milliseconds: 200));
        photo = await _cameraController!.takePicture();
      }

      await File(photo.path).copy(outPath);
      await _storage.writeString('liveness_$actionName', outPath);

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
        middleText: 'Mean confidence (${(meanScore * 100).toStringAsFixed(1)}%) was below 85%. Please try again.',
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
                        'Confidence: ${(_liveConfidence * 100).toStringAsFixed(0)}%',
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
                      'Challenge ${_currentIndex + 1}/4: ${challenge.name}',
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
}