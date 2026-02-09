class AuthTokens {
  final String accessToken;
  final String? refreshToken;
  final String? idToken;
  final DateTime? accessTokenExpirationDateTime;

  AuthTokens({
    required this.accessToken,
    this.refreshToken,
    this.idToken,
    this.accessTokenExpirationDateTime,
  });

  bool get isAccessTokenExpired {
    if (accessTokenExpirationDateTime == null) return false;
    return DateTime.now().isAfter(accessTokenExpirationDateTime!);
  }

  bool get needsRefresh {
    if (accessTokenExpirationDateTime == null) return false;
    // Refresh if token expires in less than 5 minutes
    return DateTime.now().add(const Duration(minutes: 5)).isAfter(accessTokenExpirationDateTime!);
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'idToken': idToken,
      'accessTokenExpirationDateTime': accessTokenExpirationDateTime?.toIso8601String(),
    };
  }

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['accessToken'],
      refreshToken: json['refreshToken'],
      idToken: json['idToken'],
      accessTokenExpirationDateTime: json['accessTokenExpirationDateTime'] != null
          ? DateTime.parse(json['accessTokenExpirationDateTime'])
          : null,
    );
  }
}
