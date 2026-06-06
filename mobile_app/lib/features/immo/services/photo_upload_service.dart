import 'dart:io';

import 'package:dio/dio.dart';

import '../../../shared/http/api_client.dart';
import '../../../shared/http/api_exception.dart';
import '../models/photo.dart';

/// Service d'upload des photos vers MinIO via le backend immobilier.
///
/// Utilise `Dio.FormData.fromMap` pour le multipart — Dio ajoute automatiquement
/// le boundary correct et le Content-Type `multipart/form-data`. Le header
/// `Content-Type: application/json` de [ApiClient] est écrasé pour cette
/// requête uniquement (option `contentType` du Dio.post).
///
/// JWT obligatoire — backend requiert que l'utilisateur soit propriétaire
/// de la `Propriete` cible (sinon 403). Donc en 15.2e-1, le test runtime de
/// l'upload n'est PAS possible avec user 9 / d7716ca9 (owner ≠) — testé en
/// 15.2e-3 avec la propriété créée par le wizard.
class PhotoUploadService {
  final ApiClient _api;

  PhotoUploadService({ApiClient? api}) : _api = api ?? ApiClient();

  /// `POST /immo/proprietes/{uuid}/photos` (multipart/form-data, field "file").
  ///
  /// [onProgress] reçoit la progression 0.0 → 1.0 si fourni (utile pour la
  /// barre globale "Photo N / M" en 15.2e-4).
  Future<Photo> uploadPhoto(
    String proprieteUuid,
    File file, {
    void Function(double progress)? onProgress,
  }) async {
    final filename = file.path.split('/').last;
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: filename),
    });

    try {
      final response = await _api.dio.post(
        '/immo/proprietes/$proprieteUuid/photos',
        data: formData,
        options: Options(
          // Dio gère lui-même le Content-Type multipart avec FormData ;
          // on lève l'override JSON de l'ApiClient.
          contentType: 'multipart/form-data',
        ),
        onSendProgress: onProgress == null
            ? null
            : (sent, total) {
                if (total > 0) onProgress(sent / total);
              },
      );
      final data = response.data['data'] as Map<String, dynamic>;
      return Photo.fromJson(data['photo'] as Map<String, dynamic>);
    } on DioException catch (e) {
      // L'appel bypass ApiClient.post() (on utilise _api.dio.post directement
      // pour le multipart) donc ApiClient._mapError() n'est pas invoqué.
      // On mappe ici les erreurs réseau spécifiques upload avec un message
      // contextualisé. Cf BaseOptions.sendTimeout=60s côté ApiClient.
      if (e.type == DioExceptionType.sendTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.connectionError) {
        throw const NetworkException(
          'Upload trop long, vérifiez votre connexion et réessayez.',
        );
      }
      rethrow;
    }
  }
}
