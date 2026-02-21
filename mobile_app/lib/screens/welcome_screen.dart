import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../presentation/resource/color_manager.dart';
import '../providers/auth_provider.dart';

// Peach background matching template
const _kBgColor = Color(0xFFFDE8D8);
const _kFieldBg = Color(0xFFFFF0E8);
const _kFieldBorder = Color(0xFFE8805A);
const _kTitleColor = Color(0xFFE8622A);

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  // 0 = welcome, 1 = login, 2 = register
  int _currentView = 0;
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  // Login controllers
  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();

  // Register controllers
  final _registerFirstNameController = TextEditingController();
  final _registerLastNameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerPhoneController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  final _registerConfirmPasswordController = TextEditingController();

  final _loginFormKey = GlobalKey<FormState>();
  final _registerFormKey = GlobalKey<FormState>();

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId:
        '421665850163-7uh8sdk3fbtkpam6rq61u653i78p1n5o.apps.googleusercontent.com',
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
    _registerConfirmPasswordController.dispose();
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
        setState(() {
          _currentView = 1;
          _loginEmailController.text = _registerEmailController.text;
        });
        _registerFirstNameController.clear();
        _registerLastNameController.clear();
        _registerEmailController.clear();
        _registerPhoneController.clear();
        _registerPasswordController.clear();
        _registerConfirmPasswordController.clear();
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
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        if (mounted) {
          setState(() => _isLoading = false);
          _showError('Impossible de r\u00e9cup\u00e9rer le token Google');
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
      debugPrint('Google Sign-In error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        _showError('Erreur Google: ${e.toString()}');
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
      backgroundColor: ColorManager.white,
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _currentView == 0
              ? _buildWelcomeView()
              : _currentView == 1
              ? _buildLoginView()
              : _buildRegisterView(),
        ),
      ),
    );
  }

  // ─── ECRAN 1 : WELCOME ───────────────────────────────────

  Widget _buildWelcomeView() {
    return Padding(
      key: const ValueKey('welcome'),
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        children: [
          const Spacer(flex: 1),
          // Card with illustration
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: _kBgColor,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              children: [
                // Illustration placeholder using icons
                SizedBox(
                  height: 180,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Bus/transport illustration
                      Icon(
                        Icons.directions_bus_rounded,
                        size: 100,
                        color: _kTitleColor.withValues(alpha: 0.15),
                      ),
                      Positioned(
                        bottom: 0,
                        child: Container(
                          width: 120,
                          height: 4,
                          decoration: BoxDecoration(
                            color: _kTitleColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      // Person icon
                      Positioned(
                        top: 20,
                        child: Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                _kTitleColor.withValues(alpha: 0.2),
                                _kTitleColor.withValues(alpha: 0.05),
                              ],
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.person_rounded,
                            size: 40,
                            color: _kTitleColor,
                          ),
                        ),
                      ),
                      // Decorative elements
                      Positioned(
                        right: 20,
                        bottom: 20,
                        child: Icon(
                          Icons.local_florist_rounded,
                          size: 40,
                          color: _kTitleColor.withValues(alpha: 0.3),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
          // Title
          const Text(
            'Voyagez en toute\ns\u00e9r\u00e9nit\u00e9',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: _kTitleColor,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'R\u00e9servez vos billets de transport\nen quelques clics partout en Guin\u00e9e',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF8B7B74),
              height: 1.5,
            ),
          ),
          const Spacer(flex: 2),
          // Buttons
          Row(
            children: [
              // Login button (filled)
              Expanded(
                child: SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () => setState(() => _currentView = 1),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _kTitleColor,
                      foregroundColor: ColorManager.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
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
              ),
              const SizedBox(width: 16),
              // Register button (text)
              Expanded(
                child: SizedBox(
                  height: 52,
                  child: TextButton(
                    onPressed: () => setState(() => _currentView = 2),
                    style: TextButton.styleFrom(
                      foregroundColor: ColorManager.textPrimary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    child: const Text(
                      'Inscription',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // ─── ECRAN 2 : LOGIN ─────────────────────────────────────

  Widget _buildLoginView() {
    return SingleChildScrollView(
      key: const ValueKey('login'),
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Form(
        key: _loginFormKey,
        child: Column(
          children: [
            const SizedBox(height: 60),
            const Text(
              'Connexion',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: _kTitleColor,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Content de vous revoir !',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: Color(0xFF333333),
              ),
            ),
            const SizedBox(height: 40),
            // Email
            _buildField(
              controller: _loginEmailController,
              hint: 'Email',
              keyboardType: TextInputType.emailAddress,
              highlighted: true,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'L\'email est requis';
                }
                if (!RegExp(
                  r'^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$',
                ).hasMatch(value.trim())) {
                  return 'Email invalide';
                }
                return null;
              },
            ),
            const SizedBox(height: 18),
            // Password
            _buildField(
              controller: _loginPasswordController,
              hint: 'Mot de passe',
              isPassword: true,
              obscure: _obscurePassword,
              onToggle: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Le mot de passe est requis';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            // Forgot password
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  foregroundColor: _kTitleColor,
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Mot de passe oubli\u00e9 ?',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(height: 28),
            // Sign in button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _kTitleColor,
                  foregroundColor: ColorManager.white,
                  disabledBackgroundColor: _kTitleColor.withValues(alpha: 0.6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
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
            const SizedBox(height: 28),
            // Create account link
            GestureDetector(
              onTap: _isLoading ? null : () => setState(() => _currentView = 2),
              child: const Text(
                'Cr\u00e9er un nouveau compte',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF333333),
                ),
              ),
            ),
            const SizedBox(height: 36),
            // Or continue with
            const Text(
              'Ou continuer avec',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _kTitleColor,
              ),
            ),
            const SizedBox(height: 22),
            // Social icons
            _buildSocialRow(),
            const SizedBox(height: 32),
            // Back to welcome
            TextButton.icon(
              onPressed: () => setState(() => _currentView = 0),
              icon: const Icon(Icons.arrow_back_ios, size: 14),
              label: const Text('Retour'),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFFAA9E99),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  // ─── ECRAN 3 : REGISTER ──────────────────────────────────

  Widget _buildRegisterView() {
    return SingleChildScrollView(
      key: const ValueKey('register'),
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Form(
        key: _registerFormKey,
        child: Column(
          children: [
            const SizedBox(height: 50),
            const Text(
              'Cr\u00e9er un compte',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: _kTitleColor,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Inscrivez-vous pour r\u00e9server\nvos billets de transport',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF8B7B74),
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            // Nom
            _buildField(
              controller: _registerLastNameController,
              hint: 'Nom',
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Le nom est requis';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            // Prenom
            _buildField(
              controller: _registerFirstNameController,
              hint: 'Pr\u00e9nom',
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Le pr\u00e9nom est requis';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            // Email
            _buildField(
              controller: _registerEmailController,
              hint: 'Email',
              highlighted: true,
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'L\'email est requis';
                }
                if (!RegExp(
                  r'^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$',
                ).hasMatch(value.trim())) {
                  return 'Email invalide';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            // Phone
            _buildField(
              controller: _registerPhoneController,
              hint: 'T\u00e9l\u00e9phone (optionnel)',
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 14),
            // Password
            _buildField(
              controller: _registerPasswordController,
              hint: 'Mot de passe',
              isPassword: true,
              obscure: _obscurePassword,
              onToggle: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Le mot de passe est requis';
                }
                if (value.length < 8) {
                  return 'Minimum 8 caract\u00e8res';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            // Confirm password
            _buildField(
              controller: _registerConfirmPasswordController,
              hint: 'Confirmer mot de passe',
              isPassword: true,
              obscure: _obscureConfirm,
              onToggle: () =>
                  setState(() => _obscureConfirm = !_obscureConfirm),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Confirmez le mot de passe';
                }
                if (value != _registerPasswordController.text) {
                  return 'Les mots de passe ne correspondent pas';
                }
                return null;
              },
            ),
            const SizedBox(height: 28),
            // Sign up button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleRegister,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _kTitleColor,
                  foregroundColor: ColorManager.white,
                  disabledBackgroundColor: _kTitleColor.withValues(alpha: 0.6),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
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
                        'Inscription',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 24),
            // Already have account
            GestureDetector(
              onTap: _isLoading ? null : () => setState(() => _currentView = 1),
              child: const Text(
                'D\u00e9j\u00e0 un compte ?',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF333333),
                ),
              ),
            ),
            const SizedBox(height: 32),
            // Or continue with
            const Text(
              'Ou continuer avec',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _kTitleColor,
              ),
            ),
            const SizedBox(height: 22),
            // Social icons
            _buildSocialRow(),
            const SizedBox(height: 32),
            // Back to welcome
            TextButton.icon(
              onPressed: () => setState(() => _currentView = 0),
              icon: const Icon(Icons.arrow_back_ios, size: 14),
              label: const Text('Retour'),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFFAA9E99),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  // ─── SHARED WIDGETS ──────────────────────────────────────

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    bool isPassword = false,
    bool obscure = true,
    bool highlighted = false,
    VoidCallback? onToggle,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword ? obscure : false,
      keyboardType: keyboardType,
      validator: validator,
      style: const TextStyle(fontSize: 15, color: Color(0xFF333333)),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFFAA9E99), fontSize: 15),
        suffixIcon: isPassword
            ? IconButton(
                icon: Icon(
                  obscure
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  color: const Color(0xFFAA9E99),
                  size: 20,
                ),
                onPressed: onToggle,
              )
            : null,
        filled: true,
        fillColor: _kFieldBg,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 16,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: highlighted
              ? const BorderSide(color: _kFieldBorder, width: 1.2)
              : BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: highlighted
              ? const BorderSide(color: _kFieldBorder, width: 1.2)
              : BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: _kFieldBorder, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ColorManager.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: ColorManager.error, width: 1.5),
        ),
      ),
    );
  }

  Widget _buildSocialRow() {
    return _buildSocialIcon(
      onTap: _isLoading ? null : _handleGoogleSignIn,
      child: SvgPicture.asset('assets/icons/google.svg', width: 24, height: 24),
    );
  }

  Widget _buildSocialIcon({
    required VoidCallback? onTap,
    required Widget child,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: ColorManager.white,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFE0D6D0), width: 1),
        ),
        child: Center(child: child),
      ),
    );
  }
}
