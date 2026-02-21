import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/commande.dart';
import '../services/billetterie_service.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';

class MyTripsScreen extends StatefulWidget {
  final Function(Commande)? onViewTickets;
  final Function(Commande)? onContact;

  const MyTripsScreen({super.key, this.onViewTickets, this.onContact});

  @override
  State<MyTripsScreen> createState() => _MyTripsScreenState();
}

class _MyTripsScreenState extends State<MyTripsScreen> {
  final BilletterieService _billetterieService = BilletterieService();
  int _selectedTab = 0; // 0=À venir, 1=Passés, 2=Annulés
  bool _isLoading = true;
  String? _errorMessage;
  List<Commande> _activeCommandes = [];
  List<Commande> _pastCommandes = [];
  List<Commande> _cancelledCommandes = [];

  @override
  void initState() {
    super.initState();
    _loadCommandes();
  }

  Future<void> _loadCommandes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final commandes = await _billetterieService.getMesCommandes();
      if (!mounted) return;
      setState(() {
        _activeCommandes = commandes.where((c) => c.isActive).toList();
        _pastCommandes = commandes.where((c) => c.isPast).toList();
        _cancelledCommandes = commandes.where((c) => c.isCancelled).toList();
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage =
            'Impossible de charger vos voyages. V\u00e9rifiez votre connexion.';
        _isLoading = false;
      });
    }
  }

  Future<void> _annulerCommande(Commande commande) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Annuler la commande'),
        content: Text(
          'Voulez-vous vraiment annuler la commande ${commande.numeroCommande} ?\n\n'
          '${commande.villeDepartLibelle} \u2192 ${commande.villeArriveeLibelle}\n'
          '${commande.nombrePlaces} billet${commande.nombrePlaces > 1 ? 's' : ''}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Non'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Oui, annuler',
              style: TextStyle(color: ColorManager.error),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      await _billetterieService.annulerCommande(commande.commandeUuid);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Commande annul\u00e9e avec succ\u00e8s'),
          backgroundColor: ColorManager.success,
        ),
      );
      _loadCommandes();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: ${e.toString()}'),
          backgroundColor: ColorManager.error,
        ),
      );
    }
  }

  Future<void> _callChauffeur(Commande commande) async {
    final phone = commande.contactChauffeur;
    if (phone == null || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Num\u00e9ro du chauffeur non disponible'),
          backgroundColor: ColorManager.warning,
        ),
      );
      return;
    }

    final driverName = commande.nomChauffeur ?? 'Chauffeur';
    final action = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Contacter $driverName'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (commande.vehiculeImmatriculation != null &&
                commande.vehiculeImmatriculation!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(
                      Icons.directions_car,
                      size: 18,
                      color: ColorManager.textTertiary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      commande.vehiculeImmatriculation!,
                      style: getRegularStyle(
                        color: ColorManager.textSecondary,
                        fontSize: FontSize.s14,
                      ),
                    ),
                  ],
                ),
              ),
            Row(
              children: [
                const Icon(
                  Icons.phone,
                  size: 18,
                  color: ColorManager.textTertiary,
                ),
                const SizedBox(width: 8),
                Text(
                  phone,
                  style: getMediumStyle(
                    color: ColorManager.textPrimary,
                    fontSize: FontSize.s16,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context, 'call'),
            icon: const Icon(Icons.phone, size: 18),
            label: const Text('Appeler'),
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorManager.success,
              foregroundColor: ColorManager.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );

    if (action == 'call') {
      final uri = Uri.parse('tel:$phone');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  String _formattedDate(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';

  String _formatPrice(double price) {
    return price.toInt().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]} ',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      appBar: AppBar(
        backgroundColor: ColorManager.white,
        elevation: 0,
        title: Text(
          'Mes Voyages',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s20,
          ),
        ),
      ),
      body: RefreshIndicator(
        color: ColorManager.primary,
        onRefresh: _loadCommandes,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: ColorManager.primary),
      );
    }

    if (_errorMessage != null) {
      return _buildErrorState();
    }

    final List<Commande> commandes;
    switch (_selectedTab) {
      case 1:
        commandes = _pastCommandes;
        break;
      case 2:
        commandes = _cancelledCommandes;
        break;
      default:
        commandes = _activeCommandes;
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppPadding.p16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tab buttons
          Row(
            children: [
              _buildTabButton(0, '\u00c0 venir', _activeCommandes.length),
              const SizedBox(width: AppSize.s8),
              _buildTabButton(1, 'Pass\u00e9s', _pastCommandes.length),
              const SizedBox(width: AppSize.s8),
              _buildTabButton(2, 'Annul\u00e9s', _cancelledCommandes.length),
            ],
          ),
          const SizedBox(height: AppSize.s20),

          if (commandes.isEmpty)
            _buildEmptyState()
          else
            ...commandes.map((c) => _buildCommandeCard(c)),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 48,
              color: ColorManager.textTertiary,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: getRegularStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s14,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadCommandes,
              style: ElevatedButton.styleFrom(
                backgroundColor: ColorManager.accent,
                foregroundColor: ColorManager.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                ),
              ),
              child: const Text('R\u00e9essayer'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    String subtitle;
    IconData icon;

    switch (_selectedTab) {
      case 1:
        icon = Icons.history;
        message = 'Aucun voyage pass\u00e9';
        subtitle = 'Vos voyages termin\u00e9s appara\u00eetront ici';
        break;
      case 2:
        icon = Icons.cancel_outlined;
        message = 'Aucune annulation';
        subtitle = 'Vos commandes annul\u00e9es appara\u00eetront ici';
        break;
      default:
        icon = Icons.confirmation_number_outlined;
        message = 'Aucun voyage \u00e0 venir';
        subtitle = 'R\u00e9servez un billet pour commencer';
    }

    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 60),
        child: Column(
          children: [
            Icon(icon, size: 56, color: ColorManager.textTertiary),
            const SizedBox(height: 16),
            Text(
              message,
              style: getMediumStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s16,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: getRegularStyle(
                color: ColorManager.textTertiary,
                fontSize: FontSize.s14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String label, int count) {
    final isActive = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppPadding.p14,
          vertical: AppPadding.p10,
        ),
        decoration: BoxDecoration(
          color: isActive ? ColorManager.primary : ColorManager.lightGrey,
          borderRadius: BorderRadius.circular(AppRadius.r20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: getMediumStyle(
                color: isActive
                    ? ColorManager.white
                    : ColorManager.textSecondary,
                fontSize: FontSize.s13,
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: isActive
                      ? ColorManager.white.withValues(alpha: 0.25)
                      : ColorManager.grey2,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: getMediumStyle(
                    color: isActive
                        ? ColorManager.white
                        : ColorManager.textTertiary,
                    fontSize: FontSize.s11,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCommandeCard(Commande commande) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppPadding.p16),
      decoration: BoxDecoration(
        color: ColorManager.white,
        borderRadius: BorderRadius.circular(AppRadius.r16),
        border: Border.all(color: ColorManager.grey1),
        boxShadow: [
          BoxShadow(
            color: ColorManager.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppPadding.p16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and order number
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatusBadge(commande.statut),
                Text(
                  commande.numeroCommande,
                  style: getRegularStyle(
                    color: ColorManager.textSecondary,
                    fontSize: FontSize.s12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSize.s12),

            // Route
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${commande.villeDepartLibelle} \u2192 ${commande.villeArriveeLibelle}',
                        style: getBoldStyle(
                          color: ColorManager.textPrimary,
                          fontSize: FontSize.s18,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today_outlined,
                            size: 14,
                            color: ColorManager.textTertiary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${_formattedDate(commande.dateDepart)} \u00e0 ${commande.heureDepart}',
                            style: getRegularStyle(
                              color: ColorManager.textSecondary,
                              fontSize: FontSize.s14,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '${commande.nombrePlaces} billet${commande.nombrePlaces > 1 ? 's' : ''}',
                      style: getBoldStyle(
                        color: ColorManager.primary,
                        fontSize: FontSize.s16,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_formatPrice(commande.montantPaye)} ${commande.devise}',
                      style: getRegularStyle(
                        color: ColorManager.textTertiary,
                        fontSize: FontSize.s12,
                      ),
                    ),
                  ],
                ),
              ],
            ),

            // Meeting point
            if (commande.siteDepart != null &&
                commande.siteDepart!.isNotEmpty) ...[
              const SizedBox(height: AppSize.s12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(AppPadding.p10),
                decoration: BoxDecoration(
                  color: ColorManager.warningLight,
                  borderRadius: BorderRadius.circular(AppRadius.r8),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.location_on,
                      size: 16,
                      color: ColorManager.accentDark,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        commande.siteDepart!,
                        style: getMediumStyle(
                          color: ColorManager.accentDark,
                          fontSize: FontSize.s12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: AppSize.s16),

            // Action buttons
            _buildActionButtons(commande),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(Commande commande) {
    if (commande.isCancelled) {
      // Cancelled tab: only show details
      return Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => widget.onContact?.call(commande),
              icon: const Icon(Icons.info_outline, size: 18),
              label: Text(
                'D\u00e9tails',
                style: getMediumStyle(
                  color: ColorManager.textSecondary,
                  fontSize: FontSize.s14,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: ColorManager.textSecondary,
                side: const BorderSide(color: ColorManager.grey1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      );
    }

    if (commande.isActive) {
      // Active tab: view tickets, contact chauffeur, cancel
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: commande.billets.isEmpty
                      ? null
                      : () => widget.onViewTickets?.call(commande),
                  icon: const Icon(
                    Icons.confirmation_number_outlined,
                    size: 18,
                  ),
                  label: Text(
                    'Voir billets',
                    style: getMediumStyle(
                      color: ColorManager.white,
                      fontSize: FontSize.s14,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorManager.primary,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(width: AppSize.s8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _callChauffeur(commande),
                  icon: const Icon(Icons.phone, size: 18),
                  label: Text(
                    'Chauffeur',
                    style: getMediumStyle(
                      color: ColorManager.white,
                      fontSize: FontSize.s14,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorManager.success,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSize.s8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _annulerCommande(commande),
              icon: const Icon(
                Icons.cancel_outlined,
                size: 18,
                color: ColorManager.error,
              ),
              label: Text(
                'Annuler la commande',
                style: getMediumStyle(
                  color: ColorManager.error,
                  fontSize: FontSize.s14,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: ColorManager.error,
                side: const BorderSide(color: ColorManager.error),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.r12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      );
    }

    // Past tab: view tickets + details
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: commande.billets.isEmpty
                ? null
                : () => widget.onViewTickets?.call(commande),
            icon: const Icon(Icons.confirmation_number_outlined, size: 18),
            label: Text(
              'Voir billets',
              style: getMediumStyle(
                color: ColorManager.white,
                fontSize: FontSize.s14,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorManager.primary,
              foregroundColor: ColorManager.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.r12),
              ),
              padding: const EdgeInsets.symmetric(vertical: 12),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(width: AppSize.s12),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => widget.onContact?.call(commande),
            icon: const Icon(Icons.info_outline, size: 18),
            label: Text(
              'D\u00e9tails',
              style: getMediumStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s14,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: ColorManager.textSecondary,
              side: const BorderSide(color: ColorManager.grey1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.r12),
              ),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String statut) {
    String label;
    Color bgColor;
    Color textColor;

    switch (statut) {
      case 'CONFIRMEE':
        label = 'CONFIRM\u00c9';
        bgColor = ColorManager.successLight;
        textColor = ColorManager.success;
        break;
      case 'PAYEE':
        label = 'PAY\u00c9';
        bgColor = ColorManager.infoLight;
        textColor = ColorManager.info;
        break;
      case 'EN_ATTENTE':
        label = 'EN ATTENTE';
        bgColor = ColorManager.warningLight;
        textColor = ColorManager.warning;
        break;
      case 'UTILISEE':
        label = 'TERMIN\u00c9';
        bgColor = ColorManager.lightGrey;
        textColor = ColorManager.textSecondary;
        break;
      case 'ANNULEE':
        label = 'ANNUL\u00c9';
        bgColor = ColorManager.errorLight;
        textColor = ColorManager.error;
        break;
      case 'REMBOURSEE':
        label = 'REMBOURS\u00c9';
        bgColor = ColorManager.lightGrey;
        textColor = ColorManager.textSecondary;
        break;
      default:
        label = statut;
        bgColor = ColorManager.lightGrey;
        textColor = ColorManager.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppPadding.p8,
        vertical: AppPadding.p4,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppRadius.r4),
      ),
      child: Text(
        label,
        style: getMediumStyle(color: textColor, fontSize: FontSize.s10),
      ),
    );
  }
}
