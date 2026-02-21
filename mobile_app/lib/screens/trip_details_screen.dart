import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../models/avis.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/values_manager.dart';
import '../presentation/resource/styles_manager.dart';
import '../services/billetterie_service.dart';
import 'search_results_screen.dart';

class TripDetailsScreen extends StatefulWidget {
  final TripOffer offer;
  final VoidCallback? onBook;

  const TripDetailsScreen({super.key, required this.offer, this.onBook});

  @override
  State<TripDetailsScreen> createState() => _TripDetailsScreenState();
}

class _TripDetailsScreenState extends State<TripDetailsScreen> {
  final BilletterieService _billetterieService = BilletterieService();
  List<Avis> _avisList = [];
  bool _avisLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAvis();
  }

  Future<void> _loadAvis() async {
    try {
      final avis = await _billetterieService.getAvisByOffre(widget.offer.id);
      setState(() {
        _avisList = avis;
        _avisLoading = false;
      });
    } catch (e) {
      debugPrint('Load avis error: $e');
      setState(() => _avisLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final offer = widget.offer;

    return Scaffold(
      backgroundColor: ColorManager.background,
      body: Column(
        children: [
          // Header with trip info
          Container(
            decoration: const BoxDecoration(
              gradient: ColorManager.primaryGradient,
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  // AppBar
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppPadding.p8,
                      vertical: AppPadding.p8,
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(
                            Icons.arrow_back,
                            color: ColorManager.white,
                          ),
                          onPressed: () => Navigator.pop(context),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(
                            Icons.share,
                            color: ColorManager.white,
                          ),
                          onPressed: () => _shareOffer(offer),
                        ),
                      ],
                    ),
                  ),
                  // Trip times
                  Padding(
                    padding: const EdgeInsets.all(AppPadding.p20),
                    child: Row(
                      children: [
                        // Departure
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                offer.departureTime,
                                style: getBoldStyle(
                                  color: ColorManager.white,
                                  fontSize: 32,
                                ),
                              ),
                              Text(
                                offer.departureSite ?? offer.departureCity,
                                style: getRegularStyle(
                                  color: ColorManager.white.withValues(
                                    alpha: 0.8,
                                  ),
                                  fontSize: FontSize.s14,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Duration
                        Column(
                          children: [
                            Text(
                              offer.duration,
                              style: getRegularStyle(
                                color: ColorManager.white.withValues(
                                  alpha: 0.8,
                                ),
                                fontSize: FontSize.s12,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  width: 32,
                                  height: 2,
                                  color: ColorManager.white.withValues(
                                    alpha: 0.5,
                                  ),
                                ),
                                const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 4),
                                  child: Icon(
                                    Icons.directions_bus,
                                    color: ColorManager.white,
                                    size: 20,
                                  ),
                                ),
                                Container(
                                  width: 32,
                                  height: 2,
                                  color: ColorManager.white.withValues(
                                    alpha: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        // Arrival
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                offer.arrivalTime,
                                style: getBoldStyle(
                                  color: ColorManager.white,
                                  fontSize: 32,
                                ),
                              ),
                              Text(
                                offer.arrivalSite ?? offer.arrivalCity,
                                style: getRegularStyle(
                                  color: ColorManager.white.withValues(
                                    alpha: 0.8,
                                  ),
                                  fontSize: FontSize.s14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppPadding.p16),
              child: Column(
                children: [
                  // Vehicle info card
                  _buildInfoCard(
                    title: 'Informations vehicule',
                    icon: Icons.directions_bus,
                    children: [
                      _buildInfoRow('Type', offer.vehicleFullName),
                      if (offer.vehicleRegistration != null)
                        _buildInfoRow(
                          'Immatriculation',
                          offer.vehicleRegistration!,
                        ),
                      _buildInfoRow(
                        'Capacite',
                        offer.totalSeats > 0
                            ? '${offer.totalSeats} places'
                            : '${offer.availableSeats} places disponibles',
                      ),
                      _buildInfoRow(
                        'Climatisation',
                        offer.hasAC ? 'Oui' : 'Non',
                        valueColor: offer.hasAC
                            ? ColorManager.success
                            : ColorManager.error,
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSize.s16),

                  // Driver info card
                  _buildInfoCard(
                    title: 'Chauffeur',
                    icon: Icons.person,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: const BoxDecoration(
                              color: ColorManager.grey1,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.person,
                              color: ColorManager.textSecondary,
                            ),
                          ),
                          const SizedBox(width: AppSize.s12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  offer.driverName ?? 'Non renseigne',
                                  style: getMediumStyle(
                                    color: ColorManager.textPrimary,
                                    fontSize: FontSize.s16,
                                  ),
                                ),
                                if (offer.driverPhone != null)
                                  Text(
                                    offer.driverPhone!,
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
                                Icons.star,
                                color: ColorManager.starRating,
                                size: 18,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                offer.rating.toStringAsFixed(1),
                                style: getMediumStyle(
                                  color: ColorManager.textPrimary,
                                  fontSize: FontSize.s14,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSize.s16),

                  // Meeting point (if available)
                  if (offer.meetingPoint != null) ...[
                    _buildInfoCard(
                      title: 'Point de rendez-vous',
                      icon: Icons.location_on,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.location_on,
                              color: ColorManager.accent,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                offer.meetingPoint!,
                                style: getRegularStyle(
                                  color: ColorManager.textPrimary,
                                  fontSize: FontSize.s14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSize.s16),
                  ],

                  // Avis voyageurs
                  _buildAvisSection(),
                  const SizedBox(height: AppSize.s16),

                  // Conditions card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppPadding.p16),
                    decoration: BoxDecoration(
                      color: ColorManager.warningLight,
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                      border: Border.all(
                        color: ColorManager.warning.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.info_outline,
                              color: ColorManager.accentDark,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Conditions',
                              style: getSemiBoldStyle(
                                color: ColorManager.accentDark,
                                fontSize: FontSize.s16,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSize.s12),
                        if (offer.conditions != null)
                          _buildConditionItem(offer.conditions!)
                        else ...[
                          _buildConditionItem('Bagages inclus (max 20kg)'),
                          _buildConditionItem('Supplement +50 000 GNF au-dela'),
                        ],
                        if (offer.cancellationAllowed)
                          _buildConditionItem(
                            offer.cancellationDeadlineHours != null
                                ? 'Annulation gratuite jusqu\'a ${offer.cancellationDeadlineHours}h avant'
                                : 'Annulation gratuite jusqu\'a 24h avant',
                          )
                        else
                          _buildConditionItem('Annulation non autorisee'),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSize.s16),

                  // Price card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppPadding.p16),
                    decoration: BoxDecoration(
                      color: ColorManager.primarySurface,
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Prix par place',
                          style: getMediumStyle(
                            color: ColorManager.textPrimary,
                            fontSize: FontSize.s16,
                          ),
                        ),
                        Text(
                          '${_formatPrice(offer.price)} GNF',
                          style: getBoldStyle(
                            color: ColorManager.accent,
                            fontSize: FontSize.s24,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSize.s24),
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
                  color: ColorManager.black.withValues(alpha: 0.1),
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
                  onPressed: widget.onBook,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ColorManager.accent,
                    foregroundColor: ColorManager.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.r16),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'Reserver cette offre',
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

  // ========== AVIS SECTION ==========

  Widget _buildAvisSection() {
    return Container(
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
          // Header
          Row(
            children: [
              const Icon(
                Icons.rate_review_outlined,
                color: ColorManager.primary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Avis des voyageurs',
                style: getSemiBoldStyle(
                  color: ColorManager.textPrimary,
                  fontSize: FontSize.s16,
                ),
              ),
              const Spacer(),
              if (!_avisLoading)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: ColorManager.primarySurface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${_avisList.length}',
                    style: getMediumStyle(
                      color: ColorManager.primary,
                      fontSize: FontSize.s12,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSize.s16),

          // Content
          if (_avisLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: ColorManager.primary,
                  ),
                ),
              ),
            )
          else if (_avisList.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  'Aucun avis pour le moment',
                  style: getRegularStyle(
                    color: ColorManager.textTertiary,
                    fontSize: FontSize.s14,
                  ),
                ),
              ),
            )
          else
            Column(
              children: [
                // Average rating summary
                _buildRatingSummary(),
                const Divider(color: ColorManager.grey1, height: 24),
                // Individual reviews (show max 3, with "Voir tout" if more)
                ..._avisList.take(3).map((avis) => _buildAvisItem(avis)),
                if (_avisList.length > 3)
                  GestureDetector(
                    onTap: () => _showAllAvis(context),
                    child: Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        'Voir les ${_avisList.length} avis',
                        style: getMediumStyle(
                          color: ColorManager.primary,
                          fontSize: FontSize.s14,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildRatingSummary() {
    if (_avisList.isEmpty) return const SizedBox.shrink();
    final avg =
        _avisList.map((a) => a.note).reduce((a, b) => a + b) / _avisList.length;

    return Row(
      children: [
        Text(
          avg.toStringAsFixed(1),
          style: getBoldStyle(color: ColorManager.textPrimary, fontSize: 28),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: List.generate(5, (i) {
                return Icon(
                  i < avg.round() ? Icons.star : Icons.star_border,
                  color: ColorManager.starRating,
                  size: 18,
                );
              }),
            ),
            Text(
              '${_avisList.length} avis',
              style: getRegularStyle(
                color: ColorManager.textSecondary,
                fontSize: FontSize.s12,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAvisItem(Avis avis) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // User + stars + date
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(
                  color: ColorManager.grey1,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    avis.userFullName.isNotEmpty
                        ? avis.userFullName[0].toUpperCase()
                        : '?',
                    style: getMediumStyle(
                      color: ColorManager.textSecondary,
                      fontSize: FontSize.s14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      avis.userFullName,
                      style: getMediumStyle(
                        color: ColorManager.textPrimary,
                        fontSize: FontSize.s13,
                      ),
                    ),
                    Row(
                      children: [
                        ...List.generate(5, (i) {
                          return Icon(
                            i < avis.note ? Icons.star : Icons.star_border,
                            color: ColorManager.starRating,
                            size: 14,
                          );
                        }),
                        if (avis.dateFormatted.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Text(
                            avis.dateFormatted,
                            style: getRegularStyle(
                              color: ColorManager.textTertiary,
                              fontSize: FontSize.s11,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Comment
          if (avis.commentaire != null && avis.commentaire!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 40, top: 6),
              child: Text(
                avis.commentaire!,
                style: getRegularStyle(
                  color: ColorManager.textPrimary,
                  fontSize: FontSize.s13,
                ),
              ),
            ),
          // Response from transporter
          if (avis.reponse != null && avis.reponse!.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(left: 40, top: 8),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: ColorManager.primarySurface,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.reply,
                    size: 14,
                    color: ColorManager.primary,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      avis.reponse!,
                      style: getRegularStyle(
                        color: ColorManager.textPrimary,
                        fontSize: FontSize.s12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _showAllAvis(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.7,
          maxChildSize: 0.9,
          minChildSize: 0.4,
          builder: (context, scrollController) {
            return Column(
              children: [
                // Handle
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: ColorManager.grey2,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 8,
                  ),
                  child: Row(
                    children: [
                      Text(
                        'Tous les avis',
                        style: getSemiBoldStyle(
                          color: ColorManager.textPrimary,
                          fontSize: FontSize.s18,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${_avisList.length} avis',
                        style: getRegularStyle(
                          color: ColorManager.textSecondary,
                          fontSize: FontSize.s14,
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(color: ColorManager.grey1),
                Expanded(
                  child: ListView.builder(
                    controller: scrollController,
                    padding: const EdgeInsets.all(20),
                    itemCount: _avisList.length,
                    itemBuilder: (context, index) =>
                        _buildAvisItem(_avisList[index]),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  // ========== SHARE ==========

  String _buildShareText(TripOffer offer) {
    final price = _formatPrice(offer.price);
    final buf = StringBuffer()
      ..writeln('Offre de transport - Billetterie GN')
      ..writeln()
      ..writeln('${offer.departureCity} -> ${offer.arrivalCity}')
      ..writeln(
        'Depart : ${offer.departureTime} | Arrivee : ${offer.arrivalTime} (${offer.duration})',
      )
      ..writeln('Prix : $price GNF / place')
      ..writeln('Places disponibles : ${offer.availableSeats}')
      ..writeln(
        'Vehicule : ${offer.vehicleFullName}${offer.hasAC ? ' (Climatise)' : ''}',
      );
    if (offer.driverName != null) {
      buf.writeln('Chauffeur : ${offer.driverName}');
    }
    if (offer.meetingPoint != null) {
      buf.writeln('Rendez-vous : ${offer.meetingPoint}');
    }
    buf.writeln();
    buf.writeln('Reservez sur Billetterie GN !');
    return buf.toString();
  }

  Future<void> _shareOffer(TripOffer offer) async {
    final content = _buildShareText(offer);

    try {
      final result = await Share.share(
        content,
        subject:
            '${offer.departureCity} -> ${offer.arrivalCity} - Billetterie GN',
      );
      debugPrint('Share result: ${result.status}');
      if (result.status == ShareResultStatus.unavailable) {
        _copyToClipboard(content);
      }
    } catch (e) {
      debugPrint('Share error: $e');
      _copyToClipboard(content);
    }
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Copie dans le presse-papier'),
          backgroundColor: ColorManager.primary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          margin: const EdgeInsets.all(16),
        ),
      );
    }
  }

  // ========== HELPER WIDGETS ==========

  Widget _buildInfoCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
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
          Row(
            children: [
              Icon(icon, color: ColorManager.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                title,
                style: getSemiBoldStyle(
                  color: ColorManager.textPrimary,
                  fontSize: FontSize.s16,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSize.s16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppPadding.p8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: getRegularStyle(
              color: ColorManager.textSecondary,
              fontSize: FontSize.s14,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: getMediumStyle(
                color: valueColor ?? ColorManager.textPrimary,
                fontSize: FontSize.s14,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConditionItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppPadding.p4),
      child: Text(
        '• $text',
        style: getRegularStyle(
          color: ColorManager.accentDark,
          fontSize: FontSize.s14,
        ),
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
