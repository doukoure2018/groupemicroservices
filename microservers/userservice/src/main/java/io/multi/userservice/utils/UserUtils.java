package io.multi.userservice.utils;


import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import org.apache.kafka.common.errors.ApiException;

import java.util.UUID;
import java.util.function.Function;
import java.util.function.Supplier;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;
import static io.multi.userservice.constant.Constants.GET_ARRAYS_LLC;
import static org.apache.commons.lang.RandomStringUtils.randomNumeric;

public class UserUtils {

    public static Supplier<String> randomUUUID = () -> UUID.randomUUID().toString();

    public static Supplier<String> memberId = () -> randomNumeric(4) + "-" + randomNumeric(2) + "-" + randomNumeric(4);

    public static Function<String, QrData> qrDataFunction = qrCodeSecret -> new QrData.Builder()
            .issuer(GET_ARRAYS_LLC)
            .label(GET_ARRAYS_LLC)
            .secret(qrCodeSecret)
            .algorithm(HashingAlgorithm.SHA1)
            .digits(6)
            .period(30)
            .build();

    public static Function<String, String> qrCodeImageUri = qrCodeSecret -> {
        try {
            var data = qrDataFunction.apply(qrCodeSecret);
            var generator = new ZxingPngQrGenerator();
            var imageData = generator.generate(data);
            return getDataUriForImage(imageData, generator.getImageMimeType());
        } catch (QrGenerationException exception) {
            throw new ApiException(exception.getMessage());
        }
    };

    public static Supplier<String> qrCodeSecret = () -> new DefaultSecretGenerator().generate();
}
