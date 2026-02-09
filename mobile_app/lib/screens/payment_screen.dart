import 'package:flutter/material.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

enum PaymentMethod {
  orangeMoney,
  mtnMomo,
  creditMoney,
  card,
  pointOfSale,
}

class PaymentMethodInfo {
  final PaymentMethod method;
  final String name;
  final String icon;
  final String fee;
  final Color color;

  PaymentMethodInfo({
    required this.method,
    required this.name,
    required this.icon,
    required this.fee,
    required this.color,
  });
}

class PaymentScreen extends StatefulWidget {
  final int totalAmount;
  final VoidCallback? onPaymentSuccess;

  const PaymentScreen({
    super.key,
    required this.totalAmount,
    this.onPaymentSuccess,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  PaymentMethod _selectedMethod = PaymentMethod.orangeMoney;
  bool _isProcessing = false;

  final List<PaymentMethodInfo> _paymentMethods = [
    PaymentMethodInfo(
      method: PaymentMethod.orangeMoney,
      name: 'Orange Money',
      icon: '🟠',
      fee: '1%',
      color: ColorManager.orangeMoney,
    ),
    PaymentMethodInfo(
      method: PaymentMethod.mtnMomo,
      name: 'MTN MoMo',
      icon: '🟡',
      fee: '1%',
      color: ColorManager.mtnMomo,
    ),
    PaymentMethodInfo(
      method: PaymentMethod.creditMoney,
      name: 'Credit Money',
      icon: '💵',
      fee: '1%',
      color: ColorManager.creditMoney,
    ),
    PaymentMethodInfo(
      method: PaymentMethod.card,
      name: 'Carte bancaire',
      icon: '💳',
      fee: '2%',
      color: ColorManager.info,
    ),
    PaymentMethodInfo(
      method: PaymentMethod.pointOfSale,
      name: 'Point de vente',
      icon: '🏪',
      fee: '0%',
      color: ColorManager.textSecondary,
    ),
  ];

  double get _feePercentage {
    final method = _paymentMethods.firstWhere(
      (m) => m.method == _selectedMethod,
    );
    return double.parse(method.fee.replaceAll('%', '')) / 100;
  }

  int get _fees => (widget.totalAmount * _feePercentage).round();
  int get _grandTotal => widget.totalAmount + _fees;

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
          'Paiement',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s18,
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppPadding.p16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Amount card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppPadding.p20),
                    decoration: BoxDecoration(
                      color: ColorManager.primarySurface,
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'Total à payer',
                          style: getRegularStyle(
                            color: ColorManager.textSecondary,
                            fontSize: FontSize.s14,
                          ),
                        ),
                        const SizedBox(height: AppSize.s8),
                        Text(
                          '${_formatPrice(widget.totalAmount)} GNF',
                          style: getBoldStyle(
                            color: ColorManager.primary,
                            fontSize: 32,
                          ),
                        ),
                        const SizedBox(height: AppSize.s4),
                        Text(
                          '+ frais selon mode de paiement',
                          style: getRegularStyle(
                            color: ColorManager.textSecondary,
                            fontSize: FontSize.s12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSize.s24),

                  // Payment methods title
                  Text(
                    'Choisir un mode de paiement',
                    style: getSemiBoldStyle(
                      color: ColorManager.textPrimary,
                      fontSize: FontSize.s16,
                    ),
                  ),
                  const SizedBox(height: AppSize.s16),

                  // Payment methods list
                  ...(_paymentMethods.map((method) {
                    final isSelected = _selectedMethod == method.method;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppPadding.p12),
                      child: GestureDetector(
                        onTap: () =>
                            setState(() => _selectedMethod = method.method),
                        child: Container(
                          padding: const EdgeInsets.all(AppPadding.p16),
                          decoration: BoxDecoration(
                            color: ColorManager.white,
                            borderRadius: BorderRadius.circular(AppRadius.r16),
                            border: Border.all(
                              color: isSelected
                                  ? ColorManager.primary
                                  : ColorManager.grey1,
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(
                                method.icon,
                                style: const TextStyle(fontSize: 28),
                              ),
                              const SizedBox(width: AppSize.s16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      method.name,
                                      style: getMediumStyle(
                                        color: ColorManager.textPrimary,
                                        fontSize: FontSize.s16,
                                      ),
                                    ),
                                    Text(
                                      'Frais: ${method.fee}',
                                      style: getRegularStyle(
                                        color: ColorManager.textSecondary,
                                        fontSize: FontSize.s12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (isSelected)
                                const Icon(
                                  Icons.check_circle,
                                  color: ColorManager.primary,
                                  size: 24,
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  })),

                  const SizedBox(height: AppSize.s16),

                  // Payment info box
                  _buildPaymentInfoBox(),
                ],
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
                  onPressed: _isProcessing ? null : _handlePayment,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorManager.primary,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    elevation: 0,
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(ColorManager.white),
                          ),
                        )
                      : Text(
                          'Payer maintenant',
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

  Widget _buildPaymentInfoBox() {
    String message = '';
    Color bgColor = ColorManager.infoLight;
    Color textColor = ColorManager.info;

    switch (_selectedMethod) {
      case PaymentMethod.orangeMoney:
        message =
            '📲 Orange Money\nVous recevrez une notification pour confirmer le paiement de ${_formatPrice(_grandTotal)} GNF';
        bgColor = const Color(0xFFFFF7ED);
        textColor = ColorManager.orangeMoney;
        break;
      case PaymentMethod.mtnMomo:
        message =
            '📲 MTN MoMo\nVous recevrez une notification pour confirmer le paiement de ${_formatPrice(_grandTotal)} GNF';
        bgColor = const Color(0xFFFEFCE8);
        textColor = const Color(0xFFCA8A04);
        break;
      case PaymentMethod.creditMoney:
        message =
            '💵 Credit Money\nVous recevrez une notification pour confirmer le paiement de ${_formatPrice(_grandTotal)} GNF';
        bgColor = ColorManager.successLight;
        textColor = ColorManager.success;
        break;
      case PaymentMethod.card:
        message =
            '💳 Carte bancaire\nVous serez redirigé vers une page sécurisée pour effectuer le paiement de ${_formatPrice(_grandTotal)} GNF';
        bgColor = ColorManager.infoLight;
        textColor = ColorManager.info;
        break;
      case PaymentMethod.pointOfSale:
        message =
            '🏪 Point de vente\nRendez-vous dans un point de vente agréé pour effectuer le paiement de ${_formatPrice(_grandTotal)} GNF';
        bgColor = ColorManager.lightGrey;
        textColor = ColorManager.textSecondary;
        break;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppPadding.p16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppRadius.r16),
      ),
      child: Text(
        message,
        style: getRegularStyle(
          color: textColor,
          fontSize: FontSize.s14,
        ),
      ),
    );
  }

  Future<void> _handlePayment() async {
    setState(() => _isProcessing = true);

    // Simulate payment processing
    await Future.delayed(const Duration(seconds: 2));

    setState(() => _isProcessing = false);

    widget.onPaymentSuccess?.call();
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );
  }
}
