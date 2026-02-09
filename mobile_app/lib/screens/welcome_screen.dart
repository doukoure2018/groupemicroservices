import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';

class WelcomeScreen extends StatefulWidget {
  final VoidCallback onLogin;
  final VoidCallback onRegister;
  final VoidCallback? onContinueWithoutAccount;

  const WelcomeScreen({
    super.key,
    required this.onLogin,
    required this.onRegister,
    this.onContinueWithoutAccount,
  });

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  bool _showLogin = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header with teal background
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              decoration: const BoxDecoration(
                color: ColorManager.primary,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Back button placeholder
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: ColorManager.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.arrow_back,
                      color: ColorManager.white,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    _showLogin ? 'Bienvenue' : 'Commencer',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: ColorManager.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _showLogin
                        ? 'Connectez-vous pour continuer'
                        : 'Créez votre compte',
                    style: TextStyle(
                      fontSize: 16,
                      color: ColorManager.white.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),

            // Form content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _showLogin ? _buildLoginForm() : _buildRegisterForm(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      children: [
        const SizedBox(height: 16),
        // Email field
        _buildTextField(
          icon: Icons.email_outlined,
          label: 'Adresse Email',
          hint: 'exemple@email.com',
        ),
        const SizedBox(height: 16),
        // Password field
        _buildTextField(
          icon: Icons.lock_outline,
          label: 'Mot de passe',
          hint: '••••••••',
          isPassword: true,
        ),
        const SizedBox(height: 16),
        // Remember me & Forgot password
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: Checkbox(
                    value: false,
                    onChanged: (value) {},
                    activeColor: ColorManager.primary,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Se souvenir de moi',
                  style: TextStyle(
                    color: ColorManager.textSecondary,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
            TextButton(
              onPressed: () {},
              child: const Text(
                'Mot de passe oublié?',
                style: TextStyle(
                  color: ColorManager.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        // Login button
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: widget.onLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorManager.primary,
              foregroundColor: ColorManager.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Connexion',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        // Or continue with
        Row(
          children: [
            const Expanded(child: Divider(color: ColorManager.grey1)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Ou continuer avec',
                style: TextStyle(
                  color: ColorManager.textSecondary,
                  fontSize: 14,
                ),
              ),
            ),
            const Expanded(child: Divider(color: ColorManager.grey1)),
          ],
        ),
        const SizedBox(height: 24),
        // Social buttons
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildSocialButton('G', Colors.red),
            const SizedBox(width: 16),
            _buildSocialButton('f', const Color(0xFF1877F2)),
            const SizedBox(width: 16),
            _buildSocialButton('', Colors.black, icon: Icons.apple),
          ],
        ),
        const SizedBox(height: 32),
        // Register link
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Pas de compte? ',
              style: TextStyle(color: ColorManager.textSecondary),
            ),
            GestureDetector(
              onTap: () => setState(() => _showLogin = false),
              child: const Text(
                'Créer un compte',
                style: TextStyle(
                  color: ColorManager.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRegisterForm() {
    return Column(
      children: [
        const SizedBox(height: 16),
        // Full name field
        _buildTextField(
          icon: Icons.person_outline,
          label: 'Nom complet',
          hint: 'Ibrahima Camara',
        ),
        const SizedBox(height: 16),
        // Email field
        _buildTextField(
          icon: Icons.email_outlined,
          label: 'Adresse Email',
          hint: 'exemple@email.com',
        ),
        const SizedBox(height: 16),
        // Phone field
        _buildTextField(
          icon: Icons.phone_outlined,
          label: 'Téléphone',
          hint: '+224 6XX XX XX XX',
        ),
        const SizedBox(height: 16),
        // Password field
        _buildTextField(
          icon: Icons.lock_outline,
          label: 'Mot de passe',
          hint: '••••••••',
          isPassword: true,
        ),
        const SizedBox(height: 16),
        // Terms checkbox
        Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: Checkbox(
                value: false,
                onChanged: (value) {},
                activeColor: ColorManager.primary,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: RichText(
                text: const TextSpan(
                  style: TextStyle(
                    color: ColorManager.textSecondary,
                    fontSize: 14,
                  ),
                  children: [
                    TextSpan(text: "J'accepte la "),
                    TextSpan(
                      text: 'Politique de confidentialité',
                      style: TextStyle(color: ColorManager.primary),
                    ),
                    TextSpan(text: ' et les '),
                    TextSpan(
                      text: "Conditions d'utilisation",
                      style: TextStyle(color: ColorManager.primary),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        // Register button
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: widget.onRegister,
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorManager.primary,
              foregroundColor: ColorManager.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: const Text(
              'Créer mon compte',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        // Or continue with
        Row(
          children: [
            const Expanded(child: Divider(color: ColorManager.grey1)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Ou continuer avec',
                style: TextStyle(
                  color: ColorManager.textSecondary,
                  fontSize: 14,
                ),
              ),
            ),
            const Expanded(child: Divider(color: ColorManager.grey1)),
          ],
        ),
        const SizedBox(height: 24),
        // Social buttons
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildSocialButton('G', Colors.red),
            const SizedBox(width: 16),
            _buildSocialButton('f', const Color(0xFF1877F2)),
            const SizedBox(width: 16),
            _buildSocialButton('', Colors.black, icon: Icons.apple),
          ],
        ),
        const SizedBox(height: 32),
        // Login link
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Déjà un compte? ',
              style: TextStyle(color: ColorManager.textSecondary),
            ),
            GestureDetector(
              onTap: () => setState(() => _showLogin = true),
              child: const Text(
                'Connexion',
                style: TextStyle(
                  color: ColorManager.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTextField({
    required IconData icon,
    required String label,
    required String hint,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: ColorManager.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: ColorManager.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ColorManager.inputBorder),
          ),
          child: TextField(
            obscureText: isPassword,
            decoration: InputDecoration(
              prefixIcon: Icon(icon, color: ColorManager.textTertiary),
              suffixIcon: isPassword
                  ? const Icon(Icons.visibility_off_outlined,
                      color: ColorManager.textTertiary)
                  : null,
              hintText: hint,
              hintStyle: const TextStyle(color: ColorManager.textTertiary),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSocialButton(String text, Color color, {IconData? icon}) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: ColorManager.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ColorManager.inputBorder),
      ),
      child: Center(
        child: icon != null
            ? Icon(icon, color: color, size: 28)
            : Text(
                text,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
      ),
    );
  }
}
