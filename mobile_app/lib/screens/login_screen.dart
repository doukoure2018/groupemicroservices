import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/strings_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppPadding.p24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Container(
                  padding: const EdgeInsets.all(AppPadding.p20),
                  decoration: BoxDecoration(
                    gradient: ColorManager.cardGradient,
                    borderRadius: BorderRadius.circular(AppRadius.r20),
                    boxShadow: [
                      BoxShadow(
                        color: ColorManager.primary.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.account_balance,
                    size: AppSize.s56,
                    color: ColorManager.white,
                  ),
                ),
                const SizedBox(height: AppSize.s24),

                // Title
                Text(
                  AppStrings.appName,
                  style: getBoldStyle(
                    color: ColorManager.textPrimary,
                    fontSize: FontSize.s28,
                  ),
                ),
                const SizedBox(height: AppSize.s8),
                Text(
                  AppStrings.welcomeBack,
                  style: getRegularStyle(
                    color: ColorManager.textSecondary,
                    fontSize: FontSize.s16,
                  ),
                ),
                const SizedBox(height: AppSize.s48),

                // Login Card
                Container(
                  padding: const EdgeInsets.all(AppPadding.p24),
                  decoration: BoxDecoration(
                    color: ColorManager.white,
                    borderRadius: BorderRadius.circular(AppRadius.r20),
                    boxShadow: [
                      BoxShadow(
                        color: ColorManager.black.withOpacity(0.05),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Consumer<AuthProvider>(
                    builder: (context, authProvider, child) {
                      return Column(
                        children: [
                          // Error message
                          if (authProvider.errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.all(AppPadding.p12),
                              decoration: BoxDecoration(
                                color: ColorManager.errorLight,
                                borderRadius: BorderRadius.circular(AppRadius.r12),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.error_outline,
                                    color: ColorManager.error,
                                    size: AppSize.s20,
                                  ),
                                  const SizedBox(width: AppSize.s8),
                                  Expanded(
                                    child: Text(
                                      authProvider.errorMessage!,
                                      style: getRegularStyle(
                                        color: ColorManager.error,
                                        fontSize: FontSize.s14,
                                      ),
                                    ),
                                  ),
                                  GestureDetector(
                                    onTap: () => authProvider.clearError(),
                                    child: const Icon(
                                      Icons.close,
                                      color: ColorManager.error,
                                      size: AppSize.s18,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: AppSize.s20),
                          ],

                          // Login Button
                          SizedBox(
                            width: double.infinity,
                            height: AppSize.s56,
                            child: ElevatedButton(
                              onPressed: authProvider.status == AuthStatus.loading
                                  ? null
                                  : () => _handleLogin(context),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: ColorManager.primary,
                                foregroundColor: ColorManager.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(AppRadius.r12),
                                ),
                                elevation: 0,
                              ),
                              child: authProvider.status == AuthStatus.loading
                                  ? const SizedBox(
                                      height: AppSize.s24,
                                      width: AppSize.s24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          ColorManager.white,
                                        ),
                                      ),
                                    )
                                  : Text(
                                      AppStrings.signIn,
                                      style: getSemiBoldStyle(
                                        color: ColorManager.white,
                                        fontSize: FontSize.s16,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: AppSize.s20),

                          // Divider
                          Row(
                            children: [
                              const Expanded(
                                child: Divider(color: ColorManager.grey1),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: AppPadding.p16,
                                ),
                                child: Text(
                                  'ou',
                                  style: getRegularStyle(
                                    color: ColorManager.textTertiary,
                                    fontSize: FontSize.s14,
                                  ),
                                ),
                              ),
                              const Expanded(
                                child: Divider(color: ColorManager.grey1),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppSize.s20),

                          // Info text
                          Text(
                            AppStrings.dontHaveAccount,
                            style: getRegularStyle(
                              color: ColorManager.textSecondary,
                              fontSize: FontSize.s14,
                            ),
                          ),
                          const SizedBox(height: AppSize.s8),
                          Text(
                            'Cliquez sur "Se Connecter" pour vous inscrire ou vous connecter via notre portail sécurisé.',
                            textAlign: TextAlign.center,
                            style: getRegularStyle(
                              color: ColorManager.textTertiary,
                              fontSize: FontSize.s12,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                const SizedBox(height: AppSize.s32),

                // Footer
                Text(
                  AppStrings.poweredBy,
                  style: getRegularStyle(
                    color: ColorManager.textTertiary,
                    fontSize: FontSize.s12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.login();
  }
}
