class User {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? imageUrl;
  final List<String> authorities;

  User({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    this.imageUrl,
    this.authorities = const [],
  });

  String get fullName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    return firstName ?? lastName ?? email;
  }

  bool get isControleur => authorities.any((a) =>
      a.contains('billet:validate') || a.toUpperCase() == 'CONTROLEUR');

  String get initials {
    if (firstName != null && lastName != null) {
      return '${firstName![0]}${lastName![0]}'.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['sub']?.toString() ?? json['user_id']?.toString() ?? '',
      email: json['email'] ?? '',
      firstName: json['given_name'] ?? json['firstName'],
      lastName: json['family_name'] ?? json['lastName'],
      imageUrl: json['picture'] ?? json['image_url'],
      authorities: json['authorities'] != null
          ? (json['authorities'] as String).split(',')
          : [],
    );
  }

  factory User.fromIdToken(Map<String, dynamic> claims) {
    String? lastName;
    if (claims['family_name'] != null) {
      lastName = claims['family_name'];
    } else if (claims['name'] != null) {
      final nameParts = claims['name'].toString().split(' ');
      if (nameParts.length > 1) {
        lastName = nameParts.last;
      }
    }

    return User(
      id: claims['sub']?.toString() ?? '',
      email: claims['email'] ?? claims['preferred_username'] ?? '',
      firstName: claims['given_name'] ?? claims['name']?.toString().split(' ').first,
      lastName: lastName,
      imageUrl: claims['picture'],
      authorities: claims['authorities'] != null
          ? (claims['authorities'] as String).split(',')
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'imageUrl': imageUrl,
      'authorities': authorities,
    };
  }
}
