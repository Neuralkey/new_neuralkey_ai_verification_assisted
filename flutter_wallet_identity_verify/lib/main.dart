import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'controllers/trust_level_controller.dart';
import 'controllers/verify_controller.dart';
import 'controllers/profile_controller.dart';
import 'controllers/take_gov_document_controller.dart';
import 'screens/verify_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/take_gov_document_screen.dart';
import 'screens/verify_human_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Register TrustLevelController (runs syncNow at app start, on resume & every 5 min)
  Get.put(TrustLevelController(), permanent: true);
  Get.put(VerifyController());
  runApp(const NeuralkeyWalletApp());
}

class NeuralkeyWalletApp extends StatelessWidget {
  const NeuralkeyWalletApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'Neuralkey DID Wallet',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF020617),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF38BDF8),
          secondary: Color(0xFF69F0AE),
          surface: Color(0xFF0F172A),
        ),
      ),
      initialRoute: '/verify',
      getPages: [
        GetPage(name: '/home', page: () => const HomeScreen()),
        GetPage(name: '/verify', page: () => const VerifyScreen()),
        GetPage(
          name: '/profile',
          page: () => const ProfileScreen(),
          binding: BindingsBuilder(() {
            Get.lazyPut<ProfileController>(() => ProfileController());
          }),
        ),
        GetPage(
          name: '/take_gov_document',
          page: () => const TakeGovDocumentScreen(),
          binding: BindingsBuilder(() {
            Get.lazyPut<TakeGovDocumentController>(() => TakeGovDocumentController());
          }),
        ),
        GetPage(
          name: '/scan_verify',
          page: () => const VerifyHumanScreen(),
        ),
      ],
    );
  }
}