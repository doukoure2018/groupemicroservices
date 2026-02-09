import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/strings_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      appBar: AppBar(
        backgroundColor: ColorManager.white,
        elevation: 0,
        title: Text(
          AppStrings.appName,
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s20,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.notifications_outlined,
              color: ColorManager.textSecondary,
            ),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(
              Icons.logout,
              color: ColorManager.error,
            ),
            onPressed: () => _handleLogout(context),
            tooltip: AppStrings.logout,
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.user;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppPadding.p16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // User Profile Card
                Container(
                  width: double.infinity,
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
                  child: Row(
                    children: [
                      // Avatar
                      Container(
                        width: AppSize.s64,
                        height: AppSize.s64,
                        decoration: BoxDecoration(
                          color: ColorManager.white.withOpacity(0.2),
                          shape: BoxShape.circle,
                          image: user?.imageUrl != null
                              ? DecorationImage(
                                  image: NetworkImage(user!.imageUrl!),
                                  fit: BoxFit.cover,
                                )
                              : null,
                        ),
                        child: user?.imageUrl == null
                            ? Center(
                                child: Text(
                                  user?.initials ?? '?',
                                  style: getBoldStyle(
                                    fontSize: FontSize.s24,
                                    color: ColorManager.white,
                                  ),
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: AppSize.s16),
                      // User Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.fullName ?? 'Utilisateur',
                              style: getSemiBoldStyle(
                                fontSize: FontSize.s18,
                                color: ColorManager.white,
                              ),
                            ),
                            const SizedBox(height: AppSize.s4),
                            Text(
                              user?.email ?? '',
                              style: getRegularStyle(
                                fontSize: FontSize.s14,
                                color: ColorManager.white.withOpacity(0.8),
                              ),
                            ),
                            if (user?.authorities.isNotEmpty ?? false) ...[
                              const SizedBox(height: AppSize.s8),
                              Wrap(
                                spacing: AppSize.s4,
                                children: user!.authorities.map((role) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: AppPadding.p8,
                                      vertical: AppPadding.p4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: ColorManager.white.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(AppRadius.r4),
                                    ),
                                    child: Text(
                                      role,
                                      style: getMediumStyle(
                                        fontSize: FontSize.s10,
                                        color: ColorManager.white,
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSize.s28),

                // Welcome message
                Text(
                  '${AppStrings.welcomeBack}!',
                  style: getBoldStyle(
                    fontSize: FontSize.s24,
                    color: ColorManager.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSize.s8),
                Text(
                  'Vous êtes connecté avec succès.',
                  style: getRegularStyle(
                    fontSize: FontSize.s16,
                    color: ColorManager.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSize.s28),

                // Quick Actions
                Text(
                  AppStrings.quickActions,
                  style: getSemiBoldStyle(
                    fontSize: FontSize.s18,
                    color: ColorManager.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSize.s16),

                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  mainAxisSpacing: AppSize.s16,
                  crossAxisSpacing: AppSize.s16,
                  childAspectRatio: 1.2,
                  children: [
                    _buildActionCard(
                      icon: Icons.dashboard_outlined,
                      title: AppStrings.dashboard,
                      color: ColorManager.primary,
                      onTap: () {},
                    ),
                    _buildActionCard(
                      icon: Icons.people_outline,
                      title: AppStrings.members,
                      color: ColorManager.secondary,
                      onTap: () {},
                    ),
                    _buildActionCard(
                      icon: Icons.account_balance_wallet_outlined,
                      title: AppStrings.transactions,
                      color: ColorManager.warning,
                      onTap: () {},
                    ),
                    _buildActionCard(
                      icon: Icons.settings_outlined,
                      title: AppStrings.settings,
                      color: ColorManager.accent,
                      onTap: () {},
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.r16),
      child: Container(
        padding: const EdgeInsets.all(AppPadding.p16),
        decoration: BoxDecoration(
          color: ColorManager.white,
          borderRadius: BorderRadius.circular(AppRadius.r16),
          boxShadow: [
            BoxShadow(
              color: ColorManager.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppPadding.p14),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: AppSize.s28),
            ),
            const SizedBox(height: AppSize.s12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: getMediumStyle(
                fontSize: FontSize.s14,
                color: ColorManager.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.r20),
        ),
        title: Text(
          AppStrings.logoutConfirmTitle,
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s18,
          ),
        ),
        content: Text(
          AppStrings.logoutConfirmMessage,
          style: getRegularStyle(
            color: ColorManager.textSecondary,
            fontSize: FontSize.s14,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              AppStrings.cancel,
              style: getMediumStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s14,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(
              AppStrings.logout,
              style: getMediumStyle(
                color: ColorManager.error,
                fontSize: FontSize.s14,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.logout();
    }
  }
}
