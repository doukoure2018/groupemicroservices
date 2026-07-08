import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../config/app_config.dart';
import '../presentation/resource/color_manager.dart';
import '../providers/auth_provider.dart';

// Palette SYNERGIA — vert forêt (titres + CTA) + or (accent).
const _kSarcelle = Color(0xFF16451F);       // titres principaux (vert forêt)
const _kCorail = Color(0xFF16451F);         // CTA plein (vert forêt)
const _kTextSecondary = Color(0xFF6B7280);  // texte secondaire gris doux
const _kFieldBg = Color(0xFFF4F5F7);        // fond champ gris très clair
const _kFieldBorder = _kSarcelle;           // bordure focus vert
const _kTitleColor = _kSarcelle;            // titres = vert forêt (alias)

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
  final _registerAddressController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  final _registerConfirmPasswordController = TextEditingController();

  final _loginFormKey = GlobalKey<FormState>();
  final _registerFormKey = GlobalKey<FormState>();

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    // Web Client ID "SIRA Guinée Web" — sert à obtenir un idToken dont l'aud
    // == ce client, vérifié côté backend (POST /api/auth/google). Ce n'est PAS
    // le iOS Client ID (lui est dans ios/Runner/Info.plist > GIDClientID).
    serverClientId:
        '421665850163-70gvngsk2g8frt4g6vlhrs2tl40aemoe.apps.googleusercontent.com',
  );

  @override
  void dispose() {
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _registerFirstNameController.dispose();
    _registerLastNameController.dispose();
    _registerEmailController.dispose();
    _registerPhoneController.dispose();
    _registerAddressController.dispose();
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
      // Format aligné sur le gate (CompleteProfileScreen) : +224 + 9 chiffres.
      phone: '+224${_registerPhoneController.text.trim()}',
      address: _registerAddressController.text.trim(),
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
        _registerAddressController.clear();
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
          const Spacer(flex: 2),
          // Embl\u00e8me SYNERGIA + wordmark horizontal (le logo porte le nom de
          // marque \u2192 pas de titre texte, juste le slogan en dessous).
          Image.asset(
            'assets/images/synergia-emblem-512x512.png',
            height: 150,
            fit: BoxFit.contain,
          ),
          const SizedBox(height: 16),
          Image.asset(
            'assets/images/synergia-logo-660x120.png',
            width: 240,
            fit: BoxFit.contain,
          ),
          const SizedBox(height: 24),
          const Text(
            'Trouvez votre maison.\nVendez la v\u00f4tre.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: _kTextSecondary,
              height: 1.4,
            ),
          ),
          const Spacer(flex: 3),
          // Buttons
          Row(
            children: [
              // Connexion — CTA plein corail.
              Expanded(
                child: SizedBox(
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () => setState(() => _currentView = 1),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _kCorail,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Connexion',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              // Inscription — secondaire outline corail.
              Expanded(
                child: SizedBox(
                  height: 54,
                  child: OutlinedButton(
                    onPressed: () => setState(() => _currentView = 2),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _kCorail,
                      side: const BorderSide(color: _kCorail, width: 1.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Inscription',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
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
              'Bon retour parmi nous !',
              style: TextStyle(
                fontSize: 16,
                color: _kTextSecondary,
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
                  foregroundColor: _kCorail,
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
                  backgroundColor: _kCorail,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: _kCorail.withValues(alpha: 0.6),
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
                          color: Colors.white,
                          strokeWidth: 2.5,
                        ),
                      )
                    : const Text(
                        'Se connecter',
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
              child: RichText(
                text: const TextSpan(
                  style: TextStyle(fontSize: 14, color: _kTextSecondary),
                  children: [
                    TextSpan(text: 'Pas encore de compte ? '),
                    TextSpan(
                      text: 'Cr\u00e9er un compte',
                      style: TextStyle(
                        color: _kCorail,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 36),
            // Or continue with
            Row(
              children: [
                const Expanded(child: Divider(color: Color(0xFFE0E0E0))),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    'Ou continuer avec',
                    style: TextStyle(fontSize: 13, color: _kTextSecondary),
                  ),
                ),
                const Expanded(child: Divider(color: Color(0xFFE0E0E0))),
              ],
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
              'Rejoignez SIRA Guin\u00e9e pour publier et trouver',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: _kTextSecondary,
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
            // T\u00e9l\u00e9phone (+224 + 9 chiffres, commence par 6) \u2014 requis.
            // M\u00eames r\u00e8gles que le gate CompleteProfileScreen ; le +224 est ajout\u00e9
            // \u00e0 l'envoi (_handleRegister). Profil ainsi complet \u2192 plus de gate.
            _buildField(
              controller: _registerPhoneController,
              hint: 'T\u00e9l\u00e9phone (6XXXXXXXX)',
              keyboardType: TextInputType.phone,
              validator: (value) {
                final v = value?.trim() ?? '';
                if (v.isEmpty) return 'Le t\u00e9l\u00e9phone est requis';
                if (!RegExp(r'^6\d{8}$').hasMatch(v)) {
                  return 'Num\u00e9ro invalide (9 chiffres, commence par 6)';
                }
                return null;
              },
            ),
            const SizedBox(height: 14),
            // Adresse \u2014 requise, max 100 car. (colonne users.address VARCHAR(100)).
            _buildField(
              controller: _registerAddressController,
              hint: 'Adresse',
              validator: (value) {
                final v = value?.trim() ?? '';
                if (v.isEmpty) return 'L\'adresse est requise';
                if (v.length > 100) return 'Adresse trop longue (100 max)';
                return null;
              },
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
                  backgroundColor: _kCorail,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: _kCorail.withValues(alpha: 0.6),
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
                          color: Colors.white,
                          strokeWidth: 2.5,
                        ),
                      )
                    : const Text(
                        'S\'inscrire',
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
              child: RichText(
                text: const TextSpan(
                  style: TextStyle(fontSize: 14, color: _kTextSecondary),
                  children: [
                    TextSpan(text: 'D\u00e9j\u00e0 un compte ? '),
                    TextSpan(
                      text: 'Se connecter',
                      style: TextStyle(
                        color: _kCorail,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            // Or continue with
            Row(
              children: [
                const Expanded(child: Divider(color: Color(0xFFE0E0E0))),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    'Ou continuer avec',
                    style: TextStyle(fontSize: 13, color: _kTextSecondary),
                  ),
                ),
                const Expanded(child: Divider(color: Color(0xFFE0E0E0))),
              ],
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
    // Bouton Google caché en MVP (cf AppConfig.enableGoogleSignIn).
    // Le backend OAuth Google est désactivé (__GOOGLE_DISABLED__) et iOS
    // n'a qu'un GIDClientID placeholder qui ferait crash le sign-in flow.
    if (!AppConfig.enableGoogleSignIn) return const SizedBox.shrink();
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
