import 'package:camera/camera.dart';
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
}