/// Formatage des montants en convention FR (espace fine comme séparateur de
/// milliers, virgule pour décimales). Compatible avec ce que le backend
/// renvoie en pratique (GNF sans décimales, EUR/USD avec 2).
///
/// `1500000` GNF → `1 500 000 GNF` (espace fine NARROW NO-BREAK SPACE U+202F)
/// `1500.5` EUR → `1 500,50 €`
class CurrencyFormatter {
  CurrencyFormatter._();

  //   = NARROW NO-BREAK SPACE — espace fine qui ne casse pas en fin de
  // ligne (convention typographique FR pour séparer milliers et devise).
  static const String _sep = ' ';

  static String _formatNumber(num amount, {int decimals = 0}) {
    final fixed = amount.toStringAsFixed(decimals);
    final parts = fixed.split('.');
    final intPart = parts[0];
    final buffer = StringBuffer();
    for (var i = 0; i < intPart.length; i++) {
      if (i > 0 && (intPart.length - i) % 3 == 0) {
        buffer.write(_sep);
      }
      buffer.write(intPart[i]);
    }
    if (parts.length > 1 && decimals > 0) {
      buffer.write(',${parts[1]}');
    }
    return buffer.toString();
  }

  static String gnf(num amount) => '${_formatNumber(amount)}${_sep}GNF';
  static String eur(num amount) => '${_formatNumber(amount, decimals: 2)}$_sep€';
  static String usd(num amount) => '${_formatNumber(amount, decimals: 2)}$_sep\$';

  /// Dispatcher par code devise (GNF/EUR/USD). Devise inconnue → format avec
  /// 2 décimales et code en suffixe.
  static String format(num amount, String currency) {
    switch (currency.toUpperCase()) {
      case 'GNF':
        return gnf(amount);
      case 'EUR':
        return eur(amount);
      case 'USD':
        return usd(amount);
      default:
        return '${_formatNumber(amount, decimals: 2)}$_sep${currency.toUpperCase()}';
    }
  }
}
