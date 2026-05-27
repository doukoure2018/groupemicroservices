package io.multi.immobilierservice.service;

import io.multi.immobilierservice.dto.ProprieteSearchCriteria;
import io.multi.immobilierservice.dto.SearchResult;

public interface RechercheService {

    /**
     * Recherche multi-critères + spatiale. Enrichit chaque propriété avec
     * sa photo de couverture et ses commodités. Renvoie aussi le count total
     * avant pagination pour le rendu paginé côté client.
     */
    SearchResult rechercher(ProprieteSearchCriteria criteria);
}
