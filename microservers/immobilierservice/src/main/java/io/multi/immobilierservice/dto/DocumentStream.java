package io.multi.immobilierservice.dto;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

/** Flux d'un objet MinIO + son content-type, pour le servir en streaming. */
public record DocumentStream(ResponseInputStream<GetObjectResponse> stream, String contentType) {
}
