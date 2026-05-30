import 'package:flutter/material.dart';

import '../../../shared/http/api_exception.dart';
import '../../../shared/theme/app_colors.dart';
import '../models/visite_create_request.dart';
import '../services/visite_service.dart';

/// Bottom sheet "Demander une visite" sur la fiche propriété (15.2d-3).
///
/// Champs :
///   - dateVisite (required) : DatePicker bloqué à futureOrPresent (firstDate=now)
///     et lastDate = now + 90 jours (planification raisonnable, configurable plus tard).
///   - heureVisite (optionnel) : TimePicker — si null, n'est PAS envoyé au backend
///     (le DTO l'omet, cohérent avec @Size(max=1000)).
///   - notesVisiteur (optionnel) : TextField multi-line, 1000 chars max.
///
/// Mêmes garanties que [ContacterSheet] : controllers en State, sur AppException
/// l'encart d'erreur s'affiche INLINE et la saisie est préservée.
class VisiteSheet extends StatefulWidget {
  final String proprieteUuid;
  final String titreFiche;

  const VisiteSheet({
    super.key,
    required this.proprieteUuid,
    required this.titreFiche,
  });

  @override
  State<VisiteSheet> createState() => _VisiteSheetState();
}

class _VisiteSheetState extends State<VisiteSheet> {
  final _service = VisiteService();
  final _formKey = GlobalKey<FormState>();

  final _notesController = TextEditingController();
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;

  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? now.add(const Duration(days: 1)),
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 90)),
    );
    if (picked != null && mounted) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime ?? const TimeOfDay(hour: 14, minute: 0),
    );
    if (picked != null && mounted) {
      setState(() => _selectedTime = picked);
    }
  }

  String _formatDate(DateTime d) {
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  String _formatTime(TimeOfDay t) {
    return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }

  String? _timeForBackend() {
    if (_selectedTime == null) return null;
    return '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}:00';
  }

  Future<void> _handleSubmit() async {
    // Validate champs auto + check manuel sur _selectedDate (TextField readonly
    // n'a pas de validator standard — on le check séparément).
    if (_selectedDate == null) {
      setState(() => _errorMessage = 'Date de visite requise');
      return;
    }
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      await _service.demander(
        widget.proprieteUuid,
        VisiteCreateRequest(
          dateVisite: _selectedDate!,
          heureVisite: _timeForBackend(),
          notesVisiteur: _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
        ),
      );
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on AppException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _errorMessage = e.message;
        // _notesController et pickers PRÉSERVÉS.
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
        bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Demander une visite', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(
              widget.titreFiche,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _loading ? null : _pickDate,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: 'Date de visite *',
                  border: const OutlineInputBorder(),
                  suffixIcon: const Icon(Icons.calendar_today_outlined),
                  errorText: (_errorMessage != null && _selectedDate == null) ? 'Date requise' : null,
                ),
                child: Text(
                  _selectedDate != null ? _formatDate(_selectedDate!) : 'Sélectionner une date',
                  style: TextStyle(
                    color: _selectedDate != null ? null : AppColors.onBackground,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: _loading ? null : _pickTime,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'Heure (optionnel)',
                  border: OutlineInputBorder(),
                  suffixIcon: Icon(Icons.access_time_outlined),
                ),
                child: Text(
                  _selectedTime != null ? _formatTime(_selectedTime!) : 'Sélectionner une heure',
                  style: TextStyle(
                    color: _selectedTime != null ? null : AppColors.onBackground,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesController,
              maxLines: 3,
              maxLength: 1000,
              enabled: !_loading,
              decoration: const InputDecoration(
                labelText: 'Notes (optionnel)',
                hintText: 'Disponibilités, précisions…',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Container(
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
                        _errorMessage!,
                        style: const TextStyle(color: AppColors.error, fontSize: 13),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _errorMessage = null),
                      child: const Icon(Icons.close, color: AppColors.error, size: 18),
                    ),
                  ],
                ),
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
                  : const Icon(Icons.event_available_outlined),
              label: const Text('Demander visite'),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            ),
          ],
        ),
      ),
    );
  }
}
