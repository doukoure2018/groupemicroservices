import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';
import 'search_results_screen.dart';

class Passenger {
  String fullName;
  String phone;
  String? idNumber;

  Passenger({
    this.fullName = '',
    this.phone = '',
    this.idNumber,
  });
}

class PassengersScreen extends StatefulWidget {
  final TripOffer offer;
  final int passengerCount;
  final VoidCallback? onProceedToPayment;

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
    // Pre-fill first passenger with mock data
    _passengers[0] = Passenger(
      fullName: 'Ibrahima Camara',
      phone: '+224 620 XX XX XX',
    );
    if (widget.passengerCount > 1) {
      _passengers[1] = Passenger(
        fullName: 'Fatoumata Bah',
        phone: '+224 621 XX XX XX',
      );
    }
  }

  int get _totalPrice =>
      widget.offer.price * widget.passengerCount;
  int get _serviceFee => 5000;
  int get _grandTotal => _totalPrice + _serviceFee;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      appBar: AppBar(
        backgroundColor: ColorManager.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: ColorManager.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Informations passagers',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s18,
          ),
        ),
      ),
      body: Column(
        children: [
          // Trip summary banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppPadding.p12),
            color: ColorManager.primarySurface,
            child: Text(
              '${widget.offer.departureCity} → ${widget.offer.arrivalCity} • ${widget.offer.departureTime}',
              style: getMediumStyle(
                color: ColorManager.primary,
                fontSize: FontSize.s14,
              ),
              textAlign: TextAlign.center,
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
                        color: ColorManager.lightGrey,
                        borderRadius: BorderRadius.circular(AppRadius.r16),
                      ),
                      child: Column(
                        children: [
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
                                  color: ColorManager.primary,
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
                    backgroundColor: ColorManager.primary,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'Procéder au paiement',
                    style: getSemiBoldStyle(
                      color: ColorManager.white,
                      fontSize: FontSize.s16,
                    ),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Passager ${index + 1}${isFirst ? ' (Vous)' : ''}',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s16,
          ),
        ),
        const SizedBox(height: AppSize.s12),
        _buildTextField(
          icon: Icons.person,
          hint: 'Nom complet *',
          initialValue: _passengers[index].fullName,
          onChanged: (value) => _passengers[index].fullName = value,
          validator: (value) =>
              value?.isEmpty ?? true ? 'Champ requis' : null,
        ),
        const SizedBox(height: AppSize.s12),
        _buildTextField(
          icon: Icons.phone,
          hint: 'Téléphone *',
          initialValue: _passengers[index].phone,
          onChanged: (value) => _passengers[index].phone = value,
          keyboardType: TextInputType.phone,
          validator: (value) =>
              value?.isEmpty ?? true ? 'Champ requis' : null,
        ),
        if (isFirst) ...[
          const SizedBox(height: AppSize.s12),
          _buildTextField(
            icon: Icons.badge,
            hint: 'N° CNI ou Passeport',
            initialValue: _passengers[index].idNumber ?? '',
            onChanged: (value) => _passengers[index].idNumber = value,
          ),
        ],
        const SizedBox(height: AppSize.s24),
      ],
    );
  }

  Widget _buildTextField({
    required IconData icon,
    required String hint,
    required String initialValue,
    required Function(String) onChanged,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      initialValue: initialValue,
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
      widget.onProceedToPayment?.call();
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );
  }
}
