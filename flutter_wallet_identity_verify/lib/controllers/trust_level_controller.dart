import 'dart:async';
import 'dart:convert';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../services/storage_service.dart';

class TrustLevelController extends GetxController with WidgetsBindingObserver {
  static TrustLevelController get to => Get.find<TrustLevelController>();

  final StorageService _storage = StorageService();
  final RxString trustLevel = 'TIER_1_BASIC'.obs;
  final RxInt levelNumber = 1.obs;
  Timer? _periodicTimer;

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addObserver(this);
    // Run at app start
    syncNow();
    // Run every 5 minutes
    _periodicTimer = Timer.periodic(const Duration(minutes: 5), (_) => syncNow());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Run on app resume
    if (state == AppLifecycleState.resumed) {
      syncNow();
    }
  }

  /// Refreshes trust level from the server (Trust level is NEVER set locally).
  Future<void> syncNow() async {
    try {
      final didKey = await _storage.readString(StorageService.keyDidKey) ?? 'did:neuralkey:holder';
      final res = await http
          .get(Uri.parse('https://api.neuralkey.ai/api/identity-verify/trust-level?did=$didKey'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        trustLevel.value = (data['trustLevel'] ?? 'TIER_1_BASIC').toString();
        levelNumber.value = (data['levelNumber'] ?? 1) as int;
      }
    } catch (_) {}
  }

  @override
  void onClose() {
    WidgetsBinding.instance.removeObserver(this);
    _periodicTimer?.cancel();
    super.onClose();
  }
}