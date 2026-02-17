import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../presentation/resource/color_manager.dart';
import '../providers/auth_provider.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  bool _showLogin = true;
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _rememberMe = false;
  bool _acceptTerms = false;

  // Login controllers
  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();

  // Register controllers
  final _registerFirstNameController = TextEditingController();
  final _registerLastNameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerPhoneController = TextEditingController();
  final _registerPasswordController = TextEditingController();

  final _loginFormKey = GlobalKey<FormState>();
  final _registerFormKey = GlobalKey<FormState>();

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  @override
  void dispose() {
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _registerFirstNameController.dispose();
    _registerLastNameController.dispose();
    _registerEmailController.dispose();
    _registerPhoneController.dispose();
    _registerPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_loginFormKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.loginWithCredentials(
      _loginEmailController.text.trim(),
      _loginPasswordController.text,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (!success && authProvider.errorMessage != null) {
        _showError(authProvider.errorMessage!);
        authProvider.resetToUnauthenticated();
      }
    }
  }

  Future<void> _handleRegister() async {
    if (!_registerFormKey.currentState!.validate()) return;

    if (!_acceptTerms) {
      _showError('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();
    final message = await authProvider.register(
      firstName: _registerFirstNameController.text.trim(),
      lastName: _registerLastNameController.text.trim(),
      email: _registerEmailController.text.trim(),
      password: _registerPasswordController.text,
      phone: _registerPhoneController.text.trim().isEmpty
          ? null
          : _registerPhoneController.text.trim(),
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (message != null) {
        _showSuccess(message);
        // Switch to login form after successful registration
        setState(() {
          _showLogin = true;
          _loginEmailController.text = _registerEmailController.text;
        });
        _registerFirstNameController.clear();
        _registerLastNameController.clear();
        _registerEmailController.clear();
        _registerPhoneController.clear();
        _registerPasswordController.clear();
        _acceptTerms = false;
      } else if (authProvider.errorMessage != null) {
        _showError(authProvider.errorMessage!);
      }
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);

    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        // User cancelled
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        if (mounted) {
          setState(() => _isLoading = false);
          _showError('Impossible de récupérer le token Google');
        }
        return;
      }

      if (mounted) {
        final authProvider = context.read<AuthProvider>();
        final success = await authProvider.loginWithGoogle(idToken);

        if (mounted) {
          setState(() => _isLoading = false);
          if (!success && authProvider.errorMessage != null) {
            _showError(authProvider.errorMessage!);
            authProvider.resetToUnauthenticated();
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        _showError('Erreur de connexion Google');
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: ColorManager.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: ColorManager.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
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
                  // Logo row
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          gradient: ColorManager.accentGradient,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.directions_bus,
                          color: ColorManager.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'BilletterieGN',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: ColorManager.white,
                        ),
                      ),
                    ],
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
    return Form(
      key: _loginFormKey,
      child: Column(
        children: [
          const SizedBox(height: 16),
          _buildTextField(
            controller: _loginEmailController,
            icon: Icons.email_outlined,
            label: 'Adresse Email',
            hint: 'exemple@email.com',
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'L\'email est requis';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                  .hasMatch(value.trim())) {
                return 'Email invalide';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _loginPasswordController,
            icon: Icons.lock_outline,
            label: 'Mot de passe',
            hint: 'Votre mot de passe',
            isPassword: true,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Le mot de passe est requis';
              }
              return null;
            },
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
                      value: _rememberMe,
                      onChanged: (value) {
                        setState(() => _rememberMe = value ?? false);
                      },
                      activeColor: ColorManager.accent,
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
                    color: ColorManager.accent,
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
              onPressed: _isLoading ? null : _handleLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: ColorManager.accent,
                foregroundColor: ColorManager.white,
                disabledBackgroundColor: ColorManager.accent.withOpacity(0.6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: ColorManager.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : const Text(
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
          // Google sign-in button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: OutlinedButton.icon(
              onPressed: _isLoading ? null : _handleGoogleSignIn,
              icon: const Text(
                'G',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
              label: const Text(
                'Continuer avec Google',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: ColorManager.textPrimary,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: ColorManager.inputBorder),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
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
                onTap: _isLoading
                    ? null
                    : () => setState(() => _showLogin = false),
                child: const Text(
                  'Créer un compte',
                  style: TextStyle(
                    color: ColorManager.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterForm() {
    return Form(
      key: _registerFormKey,
      child: Column(
        children: [
          const SizedBox(height: 16),
          _buildTextField(
            controller: _registerLastNameController,
            icon: Icons.person_outline,
            label: 'Nom',
            hint: 'Camara',
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le nom est requis';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _registerFirstNameController,
            icon: Icons.person_outline,
            label: 'Prénom',
            hint: 'Ibrahima',
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Le prénom est requis';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _registerEmailController,
            icon: Icons.email_outlined,
            label: 'Adresse Email',
            hint: 'exemple@email.com',
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'L\'email est requis';
              }
              if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$')
                  .hasMatch(value.trim())) {
                return 'Email invalide';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _registerPhoneController,
            icon: Icons.phone_outlined,
            label: 'Téléphone (optionnel)',
            hint: '+224 6XX XX XX XX',
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _registerPasswordController,
            icon: Icons.lock_outline,
            label: 'Mot de passe',
            hint: 'Minimum 8 caractères',
            isPassword: true,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Le mot de passe est requis';
              }
              if (value.length < 8) {
                return 'Minimum 8 caractères';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          // Terms checkbox
          Row(
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: Checkbox(
                  value: _acceptTerms,
                  onChanged: (value) {
                    setState(() => _acceptTerms = value ?? false);
                  },
                  activeColor: ColorManager.accent,
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
                        style: TextStyle(color: ColorManager.accent),
                      ),
                      TextSpan(text: ' et les '),
                      TextSpan(
                        text: "Conditions d'utilisation",
                        style: TextStyle(color: ColorManager.accent),
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
              onPressed: _isLoading ? null : _handleRegister,
              style: ElevatedButton.styleFrom(
                backgroundColor: ColorManager.accent,
                foregroundColor: ColorManager.white,
                disabledBackgroundColor: ColorManager.accent.withOpacity(0.6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: ColorManager.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : const Text(
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
          // Google sign-in button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: OutlinedButton.icon(
              onPressed: _isLoading ? null : _handleGoogleSignIn,
              icon: const Text(
                'G',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
              label: const Text(
                'Continuer avec Google',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: ColorManager.textPrimary,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: ColorManager.inputBorder),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
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
                onTap:
                    _isLoading ? null : () => setState(() => _showLogin = true),
                child: const Text(
                  'Connexion',
                  style: TextStyle(
                    color: ColorManager.accent,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required IconData icon,
    required String label,
    required String hint,
    bool isPassword = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
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
        TextFormField(
          controller: controller,
          obscureText: isPassword ? _obscurePassword : false,
          keyboardType: keyboardType,
          validator: validator,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: ColorManager.textTertiary),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: ColorManager.textTertiary,
                    ),
                    onPressed: () {
                      setState(() => _obscurePassword = !_obscurePassword);
                    },
                  )
                : null,
            hintText: hint,
            hintStyle: const TextStyle(color: ColorManager.textTertiary),
            filled: true,
            fillColor: ColorManager.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: ColorManager.inputBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: ColorManager.inputBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  const BorderSide(color: ColorManager.accent, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: ColorManager.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  const BorderSide(color: ColorManager.error, width: 1.5),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
          ),
        ),
      ],
    );
  }
}
