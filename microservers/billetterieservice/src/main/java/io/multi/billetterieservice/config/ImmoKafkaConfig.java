package io.multi.billetterieservice.config;

import io.multi.billetterieservice.event.immo.ImmoNotification;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.boot.autoconfigure.kafka.KafkaProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Consommation des événements immobiliers. Le producteur écrit son propre
 * nom de classe dans l'en-tête de type ; on l'ignore et on désérialise vers
 * {@link ImmoNotification}, sinon le message serait rejeté comme « paquet
 * non autorisé ». Groupe de consommateurs distinct de celui du serveur de
 * courriels : chacun reçoit tous les événements.
 */
@Configuration
public class ImmoKafkaConfig {

    public static final String GROUPE = "billetterie-immo-push";

    @Bean
    public ConsumerFactory<String, ImmoNotification> immoConsumerFactory(KafkaProperties proprietes) {
        Map<String, Object> config = new HashMap<>(proprietes.buildConsumerProperties(null));
        config.put(ConsumerConfig.GROUP_ID_CONFIG, GROUPE);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        JsonDeserializer<ImmoNotification> valeur = new JsonDeserializer<>(ImmoNotification.class, false);
        valeur.addTrustedPackages("*");
        return new DefaultKafkaConsumerFactory<>(config, new StringDeserializer(), valeur);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, ImmoNotification> immoKafkaListenerContainerFactory(
            ConsumerFactory<String, ImmoNotification> immoConsumerFactory) {
        var fabrique = new ConcurrentKafkaListenerContainerFactory<String, ImmoNotification>();
        fabrique.setConsumerFactory(immoConsumerFactory);
        return fabrique;
    }
}
