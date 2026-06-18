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

  /// Génère le PDF d'un billet, aligné sur le look de l'écran Billet mobile.
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

    // Polices intégrées (pas de réseau, accents FR supportés)
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
                // Header
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
                      pw.Text('SIRA Guinée',
                          style: pw.TextStyle(
                            font: fontBold,
                            color: PdfColors.white,
                            fontSize: 22,
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

                // Accent line
                pw.Container(
                    width: double.infinity, height: 3, color: _accentColor),

                // Route band (Départ -> Arrivée + date/heure)
                pw.Padding(
                  padding:
                      const pw.EdgeInsets.fromLTRB(20, 16, 20, 0),
                  child: _routeBand(departure, destination, date, time, font,
                      fontBold),
                ),

                // Code + QR
                pw.Padding(
                  padding: const pw.EdgeInsets.fromLTRB(20, 14, 20, 14),
                  child: pw.Column(
                    children: [
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
                              fontSize: 20,
                              letterSpacing: 2,
                            )),
                      ),
                      pw.SizedBox(height: 16),
                      pw.Container(
                        padding: const pw.EdgeInsets.all(8),
                        decoration: pw.BoxDecoration(
                          border:
                              pw.Border.all(color: PdfColors.grey300, width: 1),
                          borderRadius: pw.BorderRadius.circular(10),
                        ),
                        child: qrCode,
                      ),
                      pw.SizedBox(height: 6),
                      pw.Text("Presentez ce QR code a l'embarquement",
                          style: labelStyle.copyWith(fontSize: 9)),
                    ],
                  ),
                ),

                // Perforation (tear line, pleine largeur)
                pw.Row(
                  children: List.generate(
                    40,
                    (i) => pw.Expanded(
                      child: pw.Container(
                        height: 1,
                        color: i.isEven ? PdfColors.grey300 : PdfColors.white,
                      ),
                    ),
                  ),
                ),

                // Stub : détails + statut
                pw.Padding(
                  padding: const pw.EdgeInsets.all(20),
                  child: pw.Column(
                    children: [
                      _pdfRow('Passager', billet.nomPassager, labelStyle,
                          boldStyle),
                      if (billet.numeroSiege != null &&
                          billet.numeroSiege!.isNotEmpty)
                        _pdfRow('Siege', billet.numeroSiege!, labelStyle,
                            boldStyle),
                      if (vehiclePlate.isNotEmpty)
                        _pdfRow(
                            'Vehicule', vehiclePlate, labelStyle, boldStyle),
                      if (driverName.isNotEmpty)
                        _pdfRow('Chauffeur', driverName, labelStyle, boldStyle),

                      // Status badge
                      pw.SizedBox(height: 4),
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

                      // Meeting point
                      if (meetingPoint.isNotEmpty) ...[
                        pw.SizedBox(height: 14),
                        pw.Container(
                          width: double.infinity,
                          padding: const pw.EdgeInsets.all(10),
                          decoration: pw.BoxDecoration(
                            color: _warningBg,
                            borderRadius: pw.BorderRadius.circular(6),
                          ),
                          child: pw.Text('Point de RDV : $meetingPoint',
                              style: baseStyle.copyWith(color: _warningText)),
                        ),
                      ],
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

  /// Bandeau Départ -> Arrivée (points colorés + ligne) avec chip date/heure.
  static pw.Widget _routeBand(String departure, String destination,
      String date, String time, pw.Font font, pw.Font fontBold) {
    final cityStyle =
        pw.TextStyle(font: fontBold, color: _primaryColor, fontSize: 15);
    final tagStyle =
        pw.TextStyle(font: font, color: PdfColors.grey500, fontSize: 9);
    return pw.Column(
      children: [
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(departure, style: cityStyle, maxLines: 1),
                  pw.Text('Depart', style: tagStyle),
                ],
              ),
            ),
            pw.Padding(
              padding: const pw.EdgeInsets.symmetric(horizontal: 8),
              child: pw.Container(
                width: 46,
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    _dot(_primaryColor),
                    pw.Expanded(
                      child: pw.Container(
                          height: 1, color: PdfColors.grey400),
                    ),
                    _dot(_accentColor),
                  ],
                ),
              ),
            ),
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(destination,
                      style: cityStyle,
                      maxLines: 1,
                      textAlign: pw.TextAlign.right),
                  pw.Text('Arrivee', style: tagStyle),
                ],
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 10),
        pw.Container(
          padding:
              const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: pw.BoxDecoration(
            color: _surfaceBg,
            borderRadius: pw.BorderRadius.circular(20),
          ),
          child: pw.Text('$date . $time',
              style: pw.TextStyle(
                  font: fontBold, color: _primaryColor, fontSize: 11)),
        ),
      ],
    );
  }

  static pw.Widget _dot(PdfColor color) => pw.Container(
        width: 5,
        height: 5,
        decoration: pw.BoxDecoration(color: color, shape: pw.BoxShape.circle),
      );

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
