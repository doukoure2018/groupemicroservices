import 'dart:io';

import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';

/// Service de persistance des photos pickées AVANT upload MinIO (15.2e-3).
///
/// Stratégie option (b) validée : on copie le fichier source (galerie/caméra)
/// vers `ApplicationDocumentsDirectory/wizard_photos/` pour qu'il survive au
/// kill app et à la reprise du brouillon. Le path source `XFile.path` pointe
/// vers `/tmp` ou un cache OS qui peut être nettoyé à tout moment.
///
/// Cleanup :
///   - À la suppression UI d'une photo : [deletePhoto] (best-effort).
///   - Au DELETE brouillon abandonné (15.2e-4) : iterate sur photos et delete.
///   - Après upload réussi en 15.2e-4 : cleanup post-publication.
///
/// Garbage collector dette (à implémenter plus tard) : crawler `wizard_photos/`
/// au démarrage et delete les orphelins (pas référencés par un brouillon).
class LocalPhotoStorageService {
  static const String _subdir = 'wizard_photos';

  /// Copie le fichier de [xfile] (path système provisoire) vers un emplacement
  /// permanent dans `ApplicationDocumentsDirectory/wizard_photos/`.
  ///
  /// Retourne le path absolu permanent — à stocker tel quel dans
  /// [LocalPhoto.path] et persistable en `brouillon.donneesJson.photos`.
  Future<String> copyToAppDocs(XFile xfile) async {
    final docs = await getApplicationDocumentsDirectory();
    final dir = Directory('${docs.path}/$_subdir');
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    final ext = _extractExtension(xfile.path);
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final destPath = '${dir.path}/$timestamp$ext';
    final src = File(xfile.path);
    await src.copy(destPath);
    return destPath;
  }

  /// Supprime un fichier persisté. Best-effort : silencieux si déjà absent.
  Future<void> deletePhoto(String path) async {
    try {
      final file = File(path);
      if (await file.exists()) await file.delete();
    } catch (_) {
      // best-effort — pas de remontée d'erreur, l'orphelin sera nettoyé
      // par un GC futur si besoin.
    }
  }

  /// Vérifie qu'un path persisté pointe encore vers un fichier existant.
  /// Utilisé à la reprise brouillon pour filtrer d'éventuels disparus
  /// (théoriquement aucun en option b, mais défensif).
  Future<bool> exists(String path) async {
    return File(path).exists();
  }

  String _extractExtension(String filename) {
    final i = filename.lastIndexOf('.');
    if (i <= 0 || i == filename.length - 1) return '.jpg';
    return filename.substring(i).toLowerCase();
  }
}
