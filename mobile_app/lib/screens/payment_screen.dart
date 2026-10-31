import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';
import '../services/billetterie_service.dart';
import 'passengers_screen.dart';
import 'search_results_screen.dart';

enum PaymentMethod {
  orangeMoney,
  mtnMomo,
  creditMoney,
  card,
  pointOfSale,
}

extension PaymentMethodCode on PaymentMethod {
  String get code {
    switch (this) {
      case PaymentMethod.orangeMoney:
        return 'OM';
      case PaymentMethod.mtnMomo:
        return 'MOMO';
      case PaymentMethod.creditMoney:
        return 'CM';
      case PaymentMethod.card:
        return 'CB';
      case PaymentMethod.pointOfSale:
        return 'CASH';
    }
  }
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
  final TripOffer offer;
  final int totalAmount;
  final List<Passenger>? passengers;
  final void Function(Map<String, dynamic> commande)? onPaymentSuccess;

  const PaymentScreen({
    super.key,
    required this.offer,
    required this.totalAmount,
    this.passengers,
    this.onPaymentSuccess,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen>
    with WidgetsBindingObserver {
  PaymentMethod _selectedMethod = PaymentMethod.orangeMoney;
  bool _isProcessing = false;
  final BilletterieService _billetterieService = BilletterieService();

  // ---- Paiement en ligne -------------------------------------------------
  // Quand le serveur renvoie une adresse de paiement, la commande attend les
  // fonds et les billets ne sont pas encore utilisables. Le client règle chez
  // le prestataire, dans le navigateur, puis revient ici : on interroge alors
  // l'état du paiement jusqu'à ce qu'il soit tranché. Chaque interrogation fait
  // vérifier le paiement auprès du prestataire côté serveur, ce qui confirme la
  // commande même si la notification serveur à serveur s'est perdue.
  Map<String, dynamic>? _commandeEnAttente;
  String? _urlPaiement;
  Timer? _sondage;
  int _tentatives = 0;
  bool _verificationEnCours = false;
  bool _attenteExpiree = false;

  /// Toutes les trois secondes, pendant une minute trente. Au-delà le client
  /// mérite une réponse franche plutôt qu'un sablier perpétuel.
  static const Duration _intervalleSondage = Duration(seconds: 3);
  static const int _tentativesMax = 30;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    _sondage?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Retour du navigateur : vérifier tout de suite plutôt qu'attendre le tour.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _commandeEnAttente != null) {
      _verifierPaiement();
    }
  }

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
          onPressed: _isProcessing ? null : () => Navigator.pop(context),
        ),
        title: Text(
          'Paiement',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s18,
          ),
        ),
      ),
      body: _commandeEnAttente != null
          ? _buildAttentePaiement()
          : Column(
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
                        onTap: _isProcessing
                            ? null
                            : () =>
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
                          'Payer maintenant • ${_formatPrice(_grandTotal)} GNF',
                          style: getSemiBoldStyle(
                            color: ColorManager.white,
                            fontSize: FontSize.s14,
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

    try {
      // Préparer les passagers
      final passagers = widget.passengers?.map((p) => {
        'nom': p.nom,
        'prenom': p.prenom,
        'telephone': '+224${p.phone.replaceAll(RegExp(r'\s'), '')}',
        if (p.idNumber != null && p.idNumber!.isNotEmpty)
          'pieceIdentite': p.idNumber!,
      }).toList() ?? [];

      // Appel API
      final commande = await _billetterieService.createCommande(
        offreUuid: widget.offer.id,
        passagers: passagers.map((p) =>
          p.map((k, v) => MapEntry(k, v.toString()))
        ).toList(),
        modeReglementCode: _selectedMethod.code,
        montantTotal: widget.totalAmount,
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);

      // Paiement en ligne : la commande attend les fonds, c'est le prestataire
      // qui prend la main. Hors ligne (espèces au départ), rien ne change : la
      // commande est déjà confirmée.
      final url = commande['urlPaiement']?.toString();
      if (url != null && url.isNotEmpty) {
        await _lancerPaiementEnLigne(commande, url);
        return;
      }

      // Succès
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Commande ${commande['numeroCommande']} créée avec succès !',
          ),
          backgroundColor: ColorManager.success,
          duration: const Duration(seconds: 2),
        ),
      );

      widget.onPaymentSuccess?.call(commande);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);

      String errorMessage = 'Une erreur est survenue. Veuillez r\u00e9essayer.';

      if (e is DioException && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map) {
          // Backend Response format: { "message": "...", "code": 400 }
          // or GlobalExceptionHandler format: { "error": "..." }
          errorMessage = data['message'] ?? data['error'] ?? errorMessage;
        }
      } else if (e is Exception) {
        errorMessage = e.toString().replaceAll('Exception: ', '');
      }

      _showErrorDialog(errorMessage);
    }
  }

  // ---- Paiement en ligne -------------------------------------------------

  Future<void> _lancerPaiementEnLigne(
      Map<String, dynamic> commande, String url) async {
    setState(() {
      _commandeEnAttente = commande;
      _urlPaiement = url;
      _tentatives = 0;
      _attenteExpiree = false;
    });
    await _ouvrirPageDePaiement();
    _demarrerSondage();
  }

  /// Navigateur externe plutôt qu'une vue intégrée : les applications Orange
  /// Money et MTN s'enchaînent depuis la page du prestataire, ce qu'une vue
  /// embarquée bloque souvent.
  Future<void> _ouvrirPageDePaiement() async {
    final uri = Uri.tryParse(_urlPaiement ?? '');
    if (uri == null) return;
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      _showErrorDialog(
        "Impossible d'ouvrir la page de paiement. Réessayez depuis « Mes voyages ».",
      );
    }
  }

  void _demarrerSondage() {
    _sondage?.cancel();
    _sondage = Timer.periodic(_intervalleSondage, (_) => _verifierPaiement());
  }

  Future<void> _verifierPaiement() async {
    final commande = _commandeEnAttente;
    if (commande == null || _verificationEnCours || !mounted) return;
    final reference = commande['referencePaiement']?.toString();
    if (reference == null || reference.isEmpty) return;

    _verificationEnCours = true;
    try {
      final maj = await _billetterieService.getEtatPaiement(reference);
      if (!mounted) return;
      final statut = maj['statut']?.toString();

      if (statut == 'CONFIRMEE' || statut == 'PAYEE') {
        _sondage?.cancel();
        setState(() => _commandeEnAttente = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Paiement reçu, commande ${maj['numeroCommande']} confirmée !'),
            backgroundColor: ColorManager.success,
            duration: const Duration(seconds: 2),
          ),
        );
        widget.onPaymentSuccess?.call(maj);
        return;
      }

      if (statut == 'ANNULEE') {
        _sondage?.cancel();
        setState(() => _commandeEnAttente = null);
        _showErrorDialog(
          "Le paiement n'a pas abouti : la réservation a été annulée et les places "
          "remises en vente. Vous n'avez pas été débité.",
        );
        return;
      }

      // Toujours en attente.
      _tentatives++;
      if (_tentatives >= _tentativesMax) {
        _sondage?.cancel();
        setState(() => _attenteExpiree = true);
      }
    } catch (_) {
      // Réseau ou serveur indisponible : le tour suivant réessaiera. Si le
      // client a payé, la commande sera confirmée de toute façon côté serveur.
      _tentatives++;
    } finally {
      _verificationEnCours = false;
    }
  }

  void _relancerSondage() {
    setState(() {
      _tentatives = 0;
      _attenteExpiree = false;
    });
    _verifierPaiement();
    _demarrerSondage();
  }

  /// Remplace le formulaire pendant que le règlement est entre les mains du
  /// prestataire : il n'y a plus rien à choisir, seulement à attendre ou agir.
  Widget _buildAttentePaiement() {
    final nomMethode = _paymentMethods
        .firstWhere((m) => m.method == _selectedMethod)
        .name;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!_attenteExpiree)
            const Center(
              child: SizedBox(
                width: 48,
                height: 48,
                child: CircularProgressIndicator(strokeWidth: 3),
              ),
            )
          else
            Icon(Icons.schedule, size: 56, color: ColorManager.warning),
          const SizedBox(height: 24),
          Text(
            _attenteExpiree
                ? 'Paiement toujours en attente'
                : 'Paiement en cours chez $nomMethode',
            textAlign: TextAlign.center,
            style: getSemiBoldStyle(
              color: ColorManager.textPrimary,
              fontSize: FontSize.s18,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _attenteExpiree
                ? "Votre opérateur n'a pas encore répondu. Si le règlement aboutit, "
                  "votre réservation sera confirmée automatiquement et vous "
                  "recevrez un email. Vous pouvez suivre son statut dans « Mes voyages »."
                : 'Terminez le règlement dans la page qui vient de s\'ouvrir, puis '
                  'revenez ici : vos billets apparaîtront dès que le paiement est confirmé.',
            textAlign: TextAlign.center,
            style: getRegularStyle(
              color: ColorManager.textSecondary,
              fontSize: FontSize.s14,
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: _attenteExpiree ? _relancerSondage : _verifierPaiement,
            icon: const Icon(Icons.refresh),
            label: Text(_attenteExpiree ? 'Vérifier encore' : "J'ai payé, vérifier"),
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorManager.primary,
              foregroundColor: ColorManager.white,
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.r16),
              ),
              elevation: 0,
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _ouvrirPageDePaiement,
            icon: const Icon(Icons.open_in_new),
            label: const Text('Rouvrir la page de paiement'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.r16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.r16),
        ),
        icon: const Icon(
          Icons.error_outline,
          color: ColorManager.error,
          size: 48,
        ),
        title: Text(
          '\u00c9chec du paiement',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s18,
          ),
        ),
        content: Text(
          message,
          style: getRegularStyle(
            color: ColorManager.textSecondary,
            fontSize: FontSize.s14,
          ),
          textAlign: TextAlign.center,
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: ColorManager.primary,
                foregroundColor: ColorManager.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                ),
                elevation: 0,
              ),
              child: const Text('Compris'),
            ),
          ),
        ],
      ),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );
  }
}
