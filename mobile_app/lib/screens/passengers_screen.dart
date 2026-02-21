import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';
import 'search_results_screen.dart';

class Passenger {
  String nom;
  String prenom;
  String phone;
  String? idNumber;

  Passenger({
    this.nom = '',
    this.prenom = '',
    this.phone = '',
    this.idNumber,
  });

  String get fullName => '$prenom $nom'.trim();
}

class PassengersScreen extends StatefulWidget {
  final TripOffer offer;
  final int passengerCount;
  final void Function(List<Passenger>)? onProceedToPayment;

  const PassengersScreen({
    super.key,
    required this.offer,
    required this.passengerCount,
    this.onProceedToPayment,
  });

  @override
  State<PassengersScreen> createState() => _PassengersScreenState();
}

class _PassengersScreenState extends State<PassengersScreen> {
  late List<Passenger> _passengers;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _passengers = List.generate(
      widget.passengerCount,
      (index) => Passenger(),
    );
  }

  int get _totalPrice => widget.offer.price * widget.passengerCount;
  int get _serviceFee => 5000;
  int get _grandTotal => _totalPrice + _serviceFee;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      body: Column(
        children: [
          // Navy gradient header
          Container(
            decoration: const BoxDecoration(
              gradient: ColorManager.primaryGradient,
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppPadding.p4,
                  vertical: AppPadding.p12,
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: ColorManager.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: AppSize.s8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Informations passagers',
                            style: getSemiBoldStyle(
                              color: ColorManager.white,
                              fontSize: FontSize.s18,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${widget.offer.departureCity} → ${widget.offer.arrivalCity} • ${widget.offer.departureTime}',
                            style: getRegularStyle(
                              color: ColorManager.white.withOpacity(0.8),
                              fontSize: FontSize.s12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Passenger count indicator
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(
              horizontal: AppPadding.p16,
              vertical: AppPadding.p12,
            ),
            color: ColorManager.primarySurface,
            child: Row(
              children: [
                Icon(Icons.people, color: ColorManager.primary, size: 20),
                const SizedBox(width: AppSize.s8),
                Text(
                  '${widget.passengerCount} passager${widget.passengerCount > 1 ? 's' : ''}',
                  style: getMediumStyle(
                    color: ColorManager.primary,
                    fontSize: FontSize.s14,
                  ),
                ),
                const Spacer(),
                Text(
                  'Remplissez les informations ci-dessous',
                  style: getRegularStyle(
                    color: ColorManager.textSecondary,
                    fontSize: FontSize.s12,
                  ),
                ),
              ],
            ),
          ),

          // Form
          Expanded(
            child: Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppPadding.p16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Passenger forms
                    ...List.generate(widget.passengerCount, (index) {
                      return _buildPassengerForm(index);
                    }),

                    // Price summary
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppPadding.p16),
                      decoration: BoxDecoration(
                        color: ColorManager.white,
                        borderRadius: BorderRadius.circular(AppRadius.r16),
                        border: Border.all(color: ColorManager.grey1),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Résumé du prix',
                            style: getSemiBoldStyle(
                              color: ColorManager.textPrimary,
                              fontSize: FontSize.s16,
                            ),
                          ),
                          const SizedBox(height: AppSize.s12),
                          _buildPriceRow(
                            '${widget.passengerCount} place${widget.passengerCount > 1 ? 's' : ''} × ${_formatPrice(widget.offer.price)} GNF',
                            '${_formatPrice(_totalPrice)} GNF',
                          ),
                          const SizedBox(height: AppSize.s8),
                          _buildPriceRow(
                            'Frais de service',
                            '${_formatPrice(_serviceFee)} GNF',
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: AppPadding.p8),
                            child: Divider(),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total à payer',
                                style: getBoldStyle(
                                  color: ColorManager.textPrimary,
                                  fontSize: FontSize.s16,
                                ),
                              ),
                              Text(
                                '${_formatPrice(_grandTotal)} GNF',
                                style: getBoldStyle(
                                  color: ColorManager.accent,
                                  fontSize: FontSize.s18,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSize.s24),
                  ],
                ),
              ),
            ),
          ),

          // Bottom button
          Container(
            padding: const EdgeInsets.all(AppPadding.p16),
            decoration: BoxDecoration(
              color: ColorManager.white,
              boxShadow: [
                BoxShadow(
                  color: ColorManager.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _handleProceed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorManager.accent,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.payment, size: 20),
                      const SizedBox(width: AppSize.s8),
                      Text(
                        'Procéder au paiement • ${_formatPrice(_grandTotal)} GNF',
                        style: getSemiBoldStyle(
                          color: ColorManager.white,
                          fontSize: FontSize.s14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPassengerForm(int index) {
    final isFirst = index == 0;
    return Container(
      margin: const EdgeInsets.only(bottom: AppPadding.p16),
      padding: const EdgeInsets.all(AppPadding.p16),
      decoration: BoxDecoration(
        color: ColorManager.white,
        borderRadius: BorderRadius.circular(AppRadius.r16),
        border: Border.all(color: ColorManager.grey1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: ColorManager.accent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: getBoldStyle(
                      color: ColorManager.accent,
                      fontSize: FontSize.s14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSize.s12),
              Text(
                'Passager ${index + 1}${isFirst ? ' (Vous)' : ''}',
                style: getSemiBoldStyle(
                  color: ColorManager.textPrimary,
                  fontSize: FontSize.s16,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSize.s16),
          _buildTextField(
            icon: Icons.person_outline,
            hint: 'Nom *',
            onChanged: (value) => _passengers[index].nom = value,
            validator: (value) {
              if (value == null || value.trim().isEmpty) return 'Le nom est requis';
              if (value.trim().length < 2) return 'Minimum 2 caractères';
              return null;
            },
          ),
          const SizedBox(height: AppSize.s12),
          _buildTextField(
            icon: Icons.person,
            hint: 'Prénom *',
            onChanged: (value) => _passengers[index].prenom = value,
            validator: (value) {
              if (value == null || value.trim().isEmpty) return 'Le prénom est requis';
              if (value.trim().length < 2) return 'Minimum 2 caractères';
              return null;
            },
          ),
          const SizedBox(height: AppSize.s12),
          _buildPhoneField(index),
          if (isFirst) ...[
            const SizedBox(height: AppSize.s12),
            _buildTextField(
              icon: Icons.badge,
              hint: 'N° CNI ou Passeport (optionnel)',
              onChanged: (value) => _passengers[index].idNumber = value,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPhoneField(int index) {
    return TextFormField(
      onChanged: (value) => _passengers[index].phone = value,
      keyboardType: TextInputType.phone,
      maxLength: 9,
      validator: (value) {
        if (value == null || value.trim().isEmpty) return 'Le téléphone est requis';
        final digits = value.replaceAll(RegExp(r'\s'), '');
        if (digits.length != 9) return 'Le numéro doit contenir 9 chiffres';
        if (!digits.startsWith('6')) return 'Le numéro doit commencer par 6';
        if (!RegExp(r'^\d+$').hasMatch(digits)) return 'Numéro invalide';
        return null;
      },
      decoration: InputDecoration(
        prefixIcon: Container(
          padding: const EdgeInsets.only(left: 16, right: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.phone, color: ColorManager.textTertiary),
              const SizedBox(width: 8),
              Text(
                '+224',
                style: getMediumStyle(
                  color: ColorManager.textPrimary,
                  fontSize: FontSize.s14,
                ),
              ),
              Container(
                width: 1,
                height: 24,
                margin: const EdgeInsets.only(left: 8),
                color: ColorManager.grey1,
              ),
            ],
          ),
        ),
        hintText: '6XX XX XX XX *',
        counterText: '',
        hintStyle: getRegularStyle(
          color: ColorManager.textTertiary,
          fontSize: FontSize.s14,
        ),
        filled: true,
        fillColor: ColorManager.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.grey1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.grey1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.primary),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.error),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppPadding.p16,
          vertical: AppPadding.p16,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required IconData icon,
    required String hint,
    required Function(String) onChanged,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      onChanged: onChanged,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: ColorManager.textTertiary),
        hintText: hint,
        hintStyle: getRegularStyle(
          color: ColorManager.textTertiary,
          fontSize: FontSize.s14,
        ),
        filled: true,
        fillColor: ColorManager.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.grey1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.grey1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.primary),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
          borderSide: const BorderSide(color: ColorManager.error),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppPadding.p16,
          vertical: AppPadding.p16,
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: getRegularStyle(
            color: ColorManager.textSecondary,
            fontSize: FontSize.s14,
          ),
        ),
        Text(
          value,
          style: getRegularStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s14,
          ),
        ),
      ],
    );
  }

  void _handleProceed() {
    if (_formKey.currentState?.validate() ?? false) {
      widget.onProceedToPayment?.call(_passengers);
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );
  }
}
