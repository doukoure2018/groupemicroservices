import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/billet.dart';

class TicketPdfService {
  static const _primaryColor = PdfColor.fromInt(0xFF1E3A5F);
  static const _accentColor = PdfColor.fromInt(0xFFF97316);
  static const _warningBg = PdfColor.fromInt(0xFFFEF3C7);
  static const _warningText = PdfColor.fromInt(0xFF92400E);
  static const _successColor = PdfColor.fromInt(0xFF10B981);
  static const _surfaceBg = PdfColor.fromInt(0xFFF5F7FA);

  /// Generates a PDF for a single ticket using Google Fonts for Unicode support.
  static Future<Uint8List> generateTicketPdf({
    required Billet billet,
    required String departure,
    required String destination,
    required String date,
    required String time,
    String vehiclePlate = '',
    String driverName = '',
    String meetingPoint = '',
  }) async {
    final doc = pw.Document();

    // Use built-in fonts (no network required, supports French accents)
    final font = pw.Font.helvetica();
    final fontBold = pw.Font.helveticaBold();

    final baseStyle = pw.TextStyle(font: font, fontSize: 11);
    final boldStyle = pw.TextStyle(font: fontBold, fontSize: 11);
    final labelStyle = baseStyle.copyWith(color: PdfColors.grey600);

    final qrCode = pw.BarcodeWidget(
      data: billet.qrContent,
      barcode: pw.Barcode.qrCode(),
      width: 120,
      height: 120,
    );

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a5,
        margin: const pw.EdgeInsets.all(24),
        build: (pw.Context context) {
          return pw.Container(
            decoration: pw.BoxDecoration(
              border: pw.Border.all(color: _primaryColor, width: 1.5),
              borderRadius: pw.BorderRadius.circular(12),
            ),
            child: pw.Column(
              children: [
                // Header - gradient-like effect with primary color
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.symmetric(
                      vertical: 16, horizontal: 12),
                  decoration: pw.BoxDecoration(
                    color: _primaryColor,
                    borderRadius: const pw.BorderRadius.only(
                      topLeft: pw.Radius.circular(10),
                      topRight: pw.Radius.circular(10),
                    ),
                  ),
                  child: pw.Column(
                    children: [
                      pw.Text('YIGUI',
                          style: pw.TextStyle(
                            font: fontBold,
                            color: PdfColors.white,
                            fontSize: 24,
                          )),
                      pw.SizedBox(height: 4),
                      pw.Text('BILLET ELECTRONIQUE',
                          style: pw.TextStyle(
                            font: font,
                            color: PdfColors.white,
                            fontSize: 11,
                            letterSpacing: 2,
                          )),
                    ],
                  ),
                ),

                // Accent line under header
                pw.Container(
                  width: double.infinity,
                  height: 3,
                  color: _accentColor,
                ),

                // Content
                pw.Padding(
                  padding: const pw.EdgeInsets.all(20),
                  child: pw.Column(
                    children: [
                      // Ticket code
                      pw.Text('Code billet', style: labelStyle),
                      pw.SizedBox(height: 4),
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: pw.BoxDecoration(
                          color: _surfaceBg,
                          borderRadius: pw.BorderRadius.circular(8),
                        ),
                        child: pw.Text(billet.codeBillet,
                            style: pw.TextStyle(
                              font: fontBold,
                              color: _primaryColor,
                              fontSize: 22,
                              letterSpacing: 2,
                            )),
                      ),
                      pw.SizedBox(height: 18),

                      // QR Code
                      qrCode,
                      pw.SizedBox(height: 18),

                      // Dashed divider
                      pw.Container(
                        width: double.infinity,
                        child: pw.Row(
                          children: List.generate(
                            40,
                            (i) => pw.Expanded(
                              child: pw.Container(
                                height: 1,
                                color: i.isEven
                                    ? PdfColors.grey300
                                    : PdfColors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                      pw.SizedBox(height: 14),

                      // Details
                      _pdfRow('Passager', billet.nomPassager, labelStyle,
                          boldStyle),
                      _pdfRow('Trajet', '$departure - $destination',
                          labelStyle, boldStyle),
                      _pdfRow(
                          'Date & Heure', '$date - $time', labelStyle, boldStyle),
                      if (vehiclePlate.isNotEmpty)
                        _pdfRow(
                            'Vehicule', vehiclePlate, labelStyle, boldStyle),
                      if (driverName.isNotEmpty)
                        _pdfRow(
                            'Chauffeur', driverName, labelStyle, boldStyle),

                      // Status badge
                      pw.SizedBox(height: 8),
                      pw.Row(
                        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                        children: [
                          pw.Text('Statut', style: labelStyle),
                          pw.Container(
                            padding: const pw.EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: pw.BoxDecoration(
                              color: const PdfColor.fromInt(0xFFD1FAE5),
                              borderRadius: pw.BorderRadius.circular(4),
                            ),
                            child: pw.Text(billet.statut,
                                style: boldStyle.copyWith(
                                  color: _successColor,
                                  fontSize: 10,
                                )),
                          ),
                        ],
                      ),
                      pw.SizedBox(height: 14),

                      // Meeting point
                      if (meetingPoint.isNotEmpty)
                        pw.Container(
                          width: double.infinity,
                          padding: const pw.EdgeInsets.all(10),
                          decoration: pw.BoxDecoration(
                            color: _warningBg,
                            borderRadius: pw.BorderRadius.circular(6),
                          ),
                          child: pw.Text('Point de RDV : $meetingPoint',
                              style: baseStyle.copyWith(
                                color: _warningText,
                              )),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    return doc.save();
  }

  static pw.Widget _pdfRow(
    String label,
    String value,
    pw.TextStyle labelStyle,
    pw.TextStyle boldStyle,
  ) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 8),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: labelStyle),
          pw.Text(value, style: boldStyle),
        ],
      ),
    );
  }

  /// Share the PDF via system share sheet.
  static Future<void> sharePdf(Uint8List pdfBytes, String fileName) async {
    await Printing.sharePdf(bytes: pdfBytes, filename: fileName);
  }

  /// Open print preview / download dialog.
  static Future<void> printPdf(Uint8List pdfBytes) async {
    await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdfBytes);
  }
}
