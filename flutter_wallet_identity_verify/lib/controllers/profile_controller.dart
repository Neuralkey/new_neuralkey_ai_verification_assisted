import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../services/storage_service.dart';
import 'verify_controller.dart';

class ProfileController extends GetxController {
  final StorageService _storage = StorageService();

  final firstNameCtrl = TextEditingController();
  final lastNameCtrl = TextEditingController();
  final emailCtrl = TextEditingController();
  final documentNumberCtrl = TextEditingController();
  final cityCtrl = TextEditingController();
  final dobCtrl = TextEditingController();
  final docExpiryCtrl = TextEditingController();

  final RxString firstName = ''.obs;
  final RxString lastName = ''.obs;
  final RxString email = ''.obs;
  final RxString documentType = 'ID Card'.obs;
  final RxString gender = ''.obs;
  final RxString documentNumber = ''.obs;
  final RxString country = 'Cambodia'.obs;
  final RxString stateProvince = ''.obs;
  final RxString city = ''.obs;
  final RxString dateOfBirth = ''.obs;
  final RxString documentExpiry = ''.obs;

  String get fullName => '${firstName.value.trim()} ${lastName.value.trim()}'.trim();

  static const List<String> documentTypes = ['ID Card', 'Passport', 'Driver License'];
  static const List<String> genders = ['Male', 'Female', 'Other'];
  static const List<String> cambodiaProvinces = [
    'Phnom Penh', 'Siem Reap', 'Battambang', 'Preah Sihanouk', 'Kampong Cham',
    'Kandal', 'Kampot', 'Takeo', 'Banteay Meanchey', 'Prey Veng', 'Svay Rieng',
    'Kratie', 'Koh Kong', 'Ratanakiri', 'Mondulkiri', 'Kep', 'Pailin',
    'Oddar Meanchey', 'Preah Vihear', 'Stung Treng', 'Kampong Chhnang',
    'Kampong Speu', 'Kampong Thom', 'Pursat', 'Tbong Khmum',
  ];

  static final RegExp _idCardRegex = RegExp(r'^(\d{9,}|\d{9,}\(\d{2}\))$');
  static final RegExp _passportRegex = RegExp(r'^[A-Z]\d{8}$');
  static final RegExp _driverLicenseRegex = RegExp(r'^[A-Z]\.[A-Z]{2}\.\d{8}$');
  static final RegExp _emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
  static final RegExp _dateRegex = RegExp(r'^\d{4}-\d{2}-\d{2}$');

  String get documentNumberHint {
    switch (documentType.value) {
      case 'Passport':
        return 'e.g. N12345678';
      case 'Driver License':
        return 'e.g. B.PP.12345678';
      case 'ID Card':
      default:
        return 'e.g. 123456789 or 123456789(01)';
    }
  }

  bool isValidDocumentNumber(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return false;
    switch (documentType.value) {
      case 'Passport':
        return _passportRegex.hasMatch(trimmed);
      case 'Driver License':
        return _driverLicenseRegex.hasMatch(trimmed);
      case 'ID Card':
      default:
        return _idCardRegex.hasMatch(trimmed);
    }
  }

  bool isValidEmail(String value) => _emailRegex.hasMatch(value.trim());

  List<String> get missingFields {
    final List<String> missing = [];
    if (firstName.value.trim().isEmpty) missing.add('First Name');
    if (lastName.value.trim().isEmpty) missing.add('Last Name');
    if (email.value.trim().isEmpty || !isValidEmail(email.value)) missing.add('Email Address');
    if (!documentTypes.contains(documentType.value)) missing.add('Document Type');
    if (!genders.contains(gender.value)) missing.add('Gender');
    if (!isValidDocumentNumber(documentNumber.value)) missing.add('Document Number');
    if (country.value != 'Cambodia') missing.add('Country');
    if (!_dateRegex.hasMatch(dateOfBirth.value.trim())) missing.add('Date of Birth');
    if (!_dateRegex.hasMatch(documentExpiry.value.trim())) missing.add('Document Expiry');
    return missing;
  }

  bool get canSubmit => missingFields.isEmpty;

  @override
  void onInit() {
    super.onInit();
    firstNameCtrl.addListener(() => firstName.value = firstNameCtrl.text);
    lastNameCtrl.addListener(() => lastName.value = lastNameCtrl.text);
    emailCtrl.addListener(() => email.value = emailCtrl.text);
    documentNumberCtrl.addListener(() => documentNumber.value = documentNumberCtrl.text);
    cityCtrl.addListener(() => city.value = cityCtrl.text);
    dobCtrl.addListener(() => dateOfBirth.value = dobCtrl.text);
    docExpiryCtrl.addListener(() => documentExpiry.value = docExpiryCtrl.text);
    prefillFromSecureStorage();
  }

  Future<void> prefillFromSecureStorage() async {
    firstNameCtrl.text = await _storage.readString(StorageService.keyFirstName) ?? '';
    lastNameCtrl.text = await _storage.readString(StorageService.keyLastName) ?? '';
    emailCtrl.text = await _storage.readString(StorageService.keyEmail) ?? '';
    final savedDocType = await _storage.readString(StorageService.keyDocumentType) ?? 'ID Card';
    documentType.value = documentTypes.contains(savedDocType) ? savedDocType : 'ID Card';
    final savedGender = await _storage.readString(StorageService.keyGender) ?? '';
    gender.value = genders.contains(savedGender) ? savedGender : '';
    documentNumberCtrl.text = await _storage.readString(StorageService.keyDocumentNumber) ?? '';
    country.value = 'Cambodia';
    stateProvince.value = await _storage.readString(StorageService.keyStateProvince) ?? '';
    cityCtrl.text = await _storage.readString(StorageService.keyCity) ?? '';
    dobCtrl.text = await _storage.readString(StorageService.keyDateOfBirth) ?? '';
    docExpiryCtrl.text = await _storage.readString(StorageService.keyDocumentExpiry) ?? '';
  }

  Future<void> submitProfile() async {
    final missing = missingFields;
    if (missing.isNotEmpty) {
      await Get.defaultDialog(
        title: 'Required Fields',
        middleText: missing.join('\n'),
        textConfirm: 'OK',
        onConfirm: () => Get.back(),
      );
      return;
    }

    await _storage.writeString(StorageService.keyFirstName, firstName.value.trim());
    await _storage.writeString(StorageService.keyLastName, lastName.value.trim());
    await _storage.writeString(StorageService.keyFullName, fullName);
    await _storage.writeString(StorageService.keyEmail, email.value.trim());
    await _storage.writeString(StorageService.keyDocumentType, documentType.value);
    await _storage.writeString(StorageService.keyGender, gender.value);
    await _storage.writeString(StorageService.keyDocumentNumber, documentNumber.value.trim());
    await _storage.writeString(StorageService.keyCountry, 'Cambodia');
    await _storage.writeString(StorageService.keyStateProvince, stateProvince.value);
    await _storage.writeString(StorageService.keyCity, city.value.trim());
    await _storage.writeString(StorageService.keyDateOfBirth, dateOfBirth.value.trim());
    await _storage.writeString(StorageService.keyDocumentExpiry, documentExpiry.value.trim());

    await _storage.writeBool(StorageService.keyUserUpdatedProfile, true);
    await _storage.writeAuditEvent('piiUpdated', {'fullName': fullName});

    if (Get.isRegistered<VerifyController>()) {
      await Get.find<VerifyController>().reloadStepFlags();
    }

    Get.back();
    Get.snackbar('Profile Saved', 'Your profile details have been saved.');
  }
}