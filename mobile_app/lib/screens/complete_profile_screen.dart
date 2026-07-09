import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/user_profile.dart';
import '../providers/auth_provider.dart';
import '../services/user_service.dart';
import '../shared/http/api_exception.dart';
import '../shared/theme/app_colors.dart';

/// Écran BLOQUANT post-login : si le profil utilisateur n'a pas de téléphone
/// OU pas d'adresse, on l'oblige à les renseigner avant d'accéder à l'app
/// (notamment les comptes Google, que Google ne fournit pas). Pas de "plus
/// tard". Seule échappatoire : se déconnecter (ne bypasse pas le gate).
class CompleteProfileScreen extends StatefulWidget {
  final UserProfile profile;
  final VoidCallback onCompleted;

  const CompleteProfileScreen({
    super.key,
    required this.profile,
    required this.onCompleted,
  });

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _userService = UserService();

  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    // Pré-remplit si une valeur partielle existe déjà (ex tél fourni au
    // register mais pas l'adresse). On retire le préfixe +224 du tél stocké.
    final existingPhone = (widget.profile.phone ?? '').replaceFirst('+224', '').trim();
    _phoneController = TextEditingController(text: existingPhone);
    _addressController = TextEditingController(text: widget.profile.address ?? '');
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final phone = '+224${_phoneController.text.trim()}';
    try {
      await _userService.updateContact(
        current: widget.profile,
        phone: phone,
        address: _addressController.text.trim(),
      );
      if (!mounted) return;
      widget.onCompleted();
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.message),
        backgroundColor: AppColors.error,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    // canPop: false → impossible de fermer/revenir en arrière (bloquant).
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  Text(
                    'Une dernière étape',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Renseignez votre téléphone et votre adresse pour finaliser '
                    'votre compte et utiliser SIRA Guinée.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.onBackground,
                        ),
                  ),
                  const SizedBox(height: 32),
                  // Téléphone (+224 fixe + 9 chiffres, commence par 6)
                  TextFormField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(9),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'Téléphone',
                      hintText: '6XX XX XX XX',
                      prefixText: '+224 ',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      final s = (v ?? '').trim();
                      if (s.isEmpty) return 'Le téléphone est requis';
                      if (!RegExp(r'^6\d{8}$').hasMatch(s)) {
                        return 'Numéro guinéen invalide (9 chiffres, commence par 6)';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  // Adresse (texte libre requis)
                  TextFormField(
                    controller: _addressController,
                    keyboardType: TextInputType.streetAddress,
                    minLines: 1,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Adresse',
                      hintText: 'Quartier, commune, ville…',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      if ((v ?? '').trim().isEmpty) return 'L\'adresse est requise';
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: FilledButton(
                      onPressed: _saving ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        // Texte/spinner foncés : l'or est trop clair pour du blanc.
                        foregroundColor: AppColors.onSecondary,
                        disabledBackgroundColor:
                            AppColors.secondary.withValues(alpha: 0.6),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: _saving
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2.5, color: AppColors.onSecondary),
                            )
                          : const Text('Continuer',
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Échappatoire (pas un skip) : se déconnecter.
                  Center(
                    child: TextButton(
                      onPressed: _saving
                          ? null
                          : () => context.read<AuthProvider>().logout(),
                      child: const Text('Se déconnecter'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
