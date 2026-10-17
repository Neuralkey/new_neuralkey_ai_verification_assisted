import 'dart:ui';
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
}