package io.multi.immobilierservice.repository;

import io.multi.immobilierservice.domain.AdminAction;

public interface AdminActionRepository {

    /**
     * Persiste une action admin (audit log). Doit être appelé dans la même
     * transaction que l'UPDATE statut Propriete pour rollback cohérent en cas
     * d'échec (cf hook dans {@code ProprieteServiceImpl#valider/rejeter}).
     */
    AdminAction save(AdminAction action);
}
