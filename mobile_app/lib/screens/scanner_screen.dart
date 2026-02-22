import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../presentation/resource/color_manager.dart';
import '../presentation/resource/font_manager.dart';
import '../presentation/resource/styles_manager.dart';
import '../services/billetterie_service.dart';

enum ScanState { scanning, loading, success, error }

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final BilletterieService _billetterieService = BilletterieService();
  final MobileScannerController _scannerController = MobileScannerController();

  ScanState _state = ScanState.scanning;
  Map<String, dynamic>? _validatedBillet;
  String? _errorMessage;
  bool _hasScanned = false;

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_hasScanned) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null || barcode.rawValue == null) return;

    _hasScanned = true;
    final codeBillet = barcode.rawValue!;

    setState(() => _state = ScanState.loading);

    try {
      final billet = await _billetterieService.validateBillet(codeBillet);
      setState(() {
        _validatedBillet = billet;
        _state = ScanState.success;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _state = ScanState.error;
      });
    }
  }

  void _resetScanner() {
    setState(() {
      _state = ScanState.scanning;
      _validatedBillet = null;
      _errorMessage = null;
      _hasScanned = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorManager.background,
      appBar: AppBar(
        backgroundColor: ColorManager.white,
        elevation: 0,
        title: Text(
          'Scanner Billet',
          style: getSemiBoldStyle(
            color: ColorManager.textPrimary,
            fontSize: FontSize.s20,
          ),
        ),
        actions: [
          if (_state == ScanState.scanning)
            IconButton(
              icon: ValueListenableBuilder(
                valueListenable: _scannerController,
                builder: (context, state, child) {
                  return Icon(
                    state.torchState == TorchState.on
                        ? Icons.flash_on
                        : Icons.flash_off,
                    color: ColorManager.textSecondary,
                  );
                },
              ),
              onPressed: () => _scannerController.toggleTorch(),
            ),
        ],
      ),
      body: switch (_state) {
        ScanState.scanning => _buildScanner(),
        ScanState.loading => _buildLoading(),
        ScanState.success => _buildSuccess(),
        ScanState.error => _buildError(),
      },
    );
  }

  Widget _buildScanner() {
    return Column(
      children: [
        Expanded(
          child: Stack(
            alignment: Alignment.center,
            children: [
              MobileScanner(
                controller: _scannerController,
                onDetect: _onDetect,
              ),
              // QR overlay frame
              Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: ColorManager.accent,
                    width: 3,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ],
          ),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          color: ColorManager.white,
          child: Column(
            children: [
              Icon(
                Icons.qr_code_scanner,
                size: 32,
                color: ColorManager.accent,
              ),
              const SizedBox(height: 8),
              Text(
                'Scannez le QR code du billet',
                style: getSemiBoldStyle(
                  color: ColorManager.textPrimary,
                  fontSize: FontSize.s16,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Placez le QR code dans le cadre pour valider le billet',
                style: getRegularStyle(
                  color: ColorManager.textSecondary,
                  fontSize: FontSize.s13,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: ColorManager.accent),
          SizedBox(height: 16),
          Text('Validation en cours...'),
        ],
      ),
    );
  }

  Widget _buildSuccess() {
    final billet = _validatedBillet!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 32),
          // Success icon
          Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
              color: ColorManager.successLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_circle,
              color: ColorManager.success,
              size: 48,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Billet Validé',
            style: getBoldStyle(
              color: ColorManager.success,
              fontSize: FontSize.s24,
            ),
          ),
          const SizedBox(height: 32),

          // Billet details card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: ColorManager.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: ColorManager.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDetailRow(
                  Icons.confirmation_number,
                  'Code Billet',
                  billet['codeBillet'] ?? '',
                ),
                const Divider(height: 24),
                _buildDetailRow(
                  Icons.person,
                  'Passager',
                  billet['nomPassager'] ?? '',
                ),
                if (billet['numeroSiege'] != null) ...[
                  const Divider(height: 24),
                  _buildDetailRow(
                    Icons.event_seat,
                    'Siège',
                    billet['numeroSiege'],
                  ),
                ],
                const Divider(height: 24),
                _buildDetailRow(
                  Icons.info,
                  'Statut',
                  billet['statut'] ?? 'VALIDE',
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Scan another button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _resetScanner,
              icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
              label: Text(
                'Scanner un autre billet',
                style: getSemiBoldStyle(
                  color: ColorManager.white,
                  fontSize: FontSize.s16,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: ColorManager.accent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildError() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 48),
          // Error icon
          Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
              color: ColorManager.errorLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.cancel,
              color: ColorManager.error,
              size: 48,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Validation Échouée',
            style: getBoldStyle(
              color: ColorManager.error,
              fontSize: FontSize.s24,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: ColorManager.errorLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _errorMessage ?? 'Billet invalide ou déjà validé',
              style: getRegularStyle(
                color: ColorManager.error,
                fontSize: FontSize.s14,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 32),

          // Retry button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _resetScanner,
              icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
              label: Text(
                'Réessayer',
                style: getSemiBoldStyle(
                  color: ColorManager.white,
                  fontSize: FontSize.s16,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: ColorManager.accent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: ColorManager.textSecondary),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: getRegularStyle(
                color: ColorManager.textTertiary,
                fontSize: FontSize.s12,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: getSemiBoldStyle(
                color: ColorManager.textPrimary,
                fontSize: FontSize.s16,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
