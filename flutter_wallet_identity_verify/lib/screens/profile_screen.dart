import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../controllers/profile_controller.dart';

class ProfileScreen extends GetView<ProfileController> {
  const ProfileScreen({super.key});

  Future<void> _pickDate(BuildContext context, TextEditingController ctrl, {required bool isExpiry}) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: isExpiry ? now.add(const Duration(days: 1825)) : DateTime(1995, 9, 12),
      firstDate: isExpiry ? now : DateTime(1920),
      lastDate: isExpiry ? DateTime(2060) : now,
    );
    if (picked != null) {
      ctrl.text = DateFormat('yyyy-MM-dd').format(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF020617),
      appBar: AppBar(title: const Text('Complete your profile'), backgroundColor: Colors.transparent),
      body: SafeArea(
        child: Obx(
          () => SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(controller: controller.firstNameCtrl, decoration: const InputDecoration(labelText: 'First Name *')),
                const SizedBox(height: 12),
                TextField(controller: controller.lastNameCtrl, decoration: const InputDecoration(labelText: 'Last Name *')),
                const SizedBox(height: 12),
                TextField(controller: controller.emailCtrl, decoration: const InputDecoration(labelText: 'Email Address *')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: controller.documentType.value,
                  items: ProfileController.documentTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                  onChanged: (v) => v != null ? controller.documentType.value = v : null,
                  decoration: const InputDecoration(labelText: 'Document Type *'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: controller.gender.value.isEmpty ? null : controller.gender.value,
                  items: ProfileController.genders.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                  onChanged: (v) => v != null ? controller.gender.value = v : null,
                  decoration: const InputDecoration(labelText: 'Gender *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller.documentNumberCtrl,
                  decoration: InputDecoration(
                    labelText: 'Document Number *',
                    hintText: controller.documentNumberHint,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(initialValue: 'Cambodia', enabled: false, decoration: const InputDecoration(labelText: 'Country')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: controller.stateProvince.value.isEmpty ? null : controller.stateProvince.value,
                  items: ProfileController.cambodiaProvinces.map((p) => DropdownMenuItem(value: p, child: Text(p))).toList(),
                  onChanged: (v) => controller.stateProvince.value = v ?? '',
                  decoration: const InputDecoration(labelText: 'State / Province (Optional)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller.dobCtrl,
                  readOnly: true,
                  onTap: () => _pickDate(context, controller.dobCtrl, isExpiry: false),
                  decoration: const InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD) *'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: controller.docExpiryCtrl,
                  readOnly: true,
                  onTap: () => _pickDate(context, controller.docExpiryCtrl, isExpiry: true),
                  decoration: const InputDecoration(labelText: 'Document Expiry (YYYY-MM-DD) *'),
                ),
                const SizedBox(height: 24),
                Opacity(
                  opacity: controller.canSubmit ? 1.0 : 0.4,
                  child: ElevatedButton(
                    onPressed: () => controller.submitProfile(),
                    child: const Text('Save Profile'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}