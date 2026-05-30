import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../models/contact_create_request.dart';
import '../services/contact_service.dart';

/// Bottom sheet "Contacter le vendeur" sur la fiche propriété (15.2d-3).
///
/// Renvoie via Navigator.pop :
///   - `true` si POST 201 réussi (le caller affiche un SnackBar succès)
///   - `null` si dismiss / cancel
///
/// Sur AppException, affiche un encart d'erreur INLINE dans la sheet sans
/// fermer ni rebuild les TextFormField — la saisie (controllers en State) est
/// **préservée** pour que l'utilisateur n'ait pas à retaper son message après
/// un timeout réseau ou une 5xx.
class ContacterSheet extends StatefulWidget {
  final String proprieteUuid;
  final String titreFiche;

  const ContacterSheet({
    super.key,
    required this.proprieteUuid,
    required this.titreFiche,
  });

  @override
  State<ContacterSheet> createState() => _ContacterSheetState();
}

class _ContacterSheetState extends State<ContacterSheet> {
  final _service = ContactService();
  final _formKey = GlobalKey<FormState>();

  // Controllers en State — JAMAIS recréés entre rebuilds. C'est la garantie
  // que la saisie reste intacte si POST échoue et qu'on re-affiche la sheet
  // avec _errorMessage non-null.
  final _messageController = TextEditingController();
  String _typeDemande = 'INFO';

  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      await _service.creer(
        widget.proprieteUuid,
        ContactCreateRequest(
          message: _messageController.text.trim(),
          typeDemande: _typeDemande,
        ),
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _errorMessage = e.message;
        // _messageController.text NON touché — saisie préservée.
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 8,
        // Compense le clavier — la sheet remonte au-dessus.
        bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Contacter le vendeur', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              widget.titreFiche,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _typeDemande,
              decoration: const InputDecoration(
                labelText: 'Type de demande',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'INFO', child: Text('Demande d\'information')),
                DropdownMenuItem(value: 'VISITE', child: Text('Demande de visite')),
                DropdownMenuItem(value: 'OFFRE', child: Text('Faire une offre')),
              ],
              onChanged: _loading ? null : (v) => setState(() => _typeDemande = v ?? 'INFO'),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _messageController,
              maxLines: 4,
              maxLength: 2000,
              enabled: !_loading,
              decoration: const InputDecoration(
                labelText: 'Message',
                hintText: 'Bonjour, je suis intéressé(e) par votre annonce…',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Message requis';
                return null;
              },
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              _InlineError(
                message: _errorMessage!,
                onDismiss: () => setState(() => _errorMessage = null),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _loading ? null : _handleSubmit,
              icon: _loading
                  ? const SizedBox(
                      width: 18, height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.send_outlined),
              label: const Text('Envoyer'),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            ),
          ],
        ),
      ),
    );
  }
}

/// Encart d'erreur INLINE (réutilisé par VisiteSheet). Le bouton X reset
/// uniquement `_errorMessage` côté caller — il NE touche PAS aux controllers.
class _InlineError extends StatelessWidget {
  final String message;
  final VoidCallback onDismiss;
  const _InlineError({required this.message, required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.error.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: AppColors.error, fontSize: 13),
            ),
          ),
          GestureDetector(
            onTap: onDismiss,
            child: const Icon(Icons.close, color: AppColors.error, size: 18),
          ),
        ],
      ),
    );
  }
}
