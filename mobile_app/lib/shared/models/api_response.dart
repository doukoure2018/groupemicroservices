/// Wrapper générique du payload renvoyé par les contrôleurs backend
/// (cf. microservers/immobilierservice/.../domain/Response.java).
///
/// Forme typique :
/// ```json
/// {
///   "time": "...",
///   "code": 200,
///   "path": "/immo/...",
///   "httpStatus": "OK",
///   "message": "...",
///   "data": { ... métier ... }
/// }
/// ```
///
/// Usage : `ApiResponse.fromJson(json, (data) => Propriete.fromJson(data))`.
class ApiResponse<T> {
  final int code;
  final String path;
  final String httpStatus;
  final String? message;
  final T? data;

  const ApiResponse({
    required this.code,
    required this.path,
    required this.httpStatus,
    this.message,
    this.data,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic data)? dataParser,
  ) {
    return ApiResponse<T>(
      code: (json['code'] ?? json['statusCode'] ?? 0) as int,
      path: (json['path'] ?? '') as String,
      httpStatus: (json['httpStatus'] ?? json['status'] ?? '') as String,
      message: json['message'] as String?,
      data: dataParser != null && json['data'] != null ? dataParser(json['data']) : null,
    );
  }
}
