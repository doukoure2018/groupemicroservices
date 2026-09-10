import { useQuery } from '@tanstack/react-query';
import type { Ville } from '@sira/core';
import { useMemo } from 'react';
import { api } from '../../api';
import { ReferentielCrud, type ReferentielApi, type ReferentielConfig } from './ReferentielCrud';

const villesApi: ReferentielApi<Ville> = {
    list: async () => (await api.geo.villes()).data.villes ?? [],
    create: async (body) => (await api.geo.createVille({ regionUuid: body.regionUuid ?? '', libelle: body.libelle ?? '', codePostal: body.codePostal })).data.ville,
    update: async (uuid, body) => (await api.geo.updateVille(uuid, { regionUuid: body.regionUuid ?? '', libelle: body.libelle ?? '', codePostal: body.codePostal })).data.ville,
    setActif: async (uuid, actif) => (await api.geo.setVilleActif(uuid, actif)).data.ville
};

export function VillesAdminPage() {
    const regionsQuery = useQuery({ queryKey: ['regions-actives'], queryFn: async () => (await api.geo.regionsActives()).data.regions ?? [] });
    const regionsOptions = useMemo(() => (regionsQuery.data ?? []).map((r) => ({ label: r.libelle, value: r.regionUuid })), [regionsQuery.data]);

    const config: ReferentielConfig<Ville> = useMemo(
        () => ({
            titre: 'Villes / Préfectures',
            sousTitre: 'Gérez les villes et préfectures rattachées aux régions',
            entite: 'ville',
            entitePluriel: 'villes',
            genre: 'f',
            queryKey: 'admin-villes',
            uuidKey: 'villeUuid',
            libelleKey: 'libelle',
            colonnes: [
                { header: 'Libellé', key: 'libelle' },
                { header: 'Région', key: 'regionLibelle' },
                { header: 'Code postal', key: 'codePostal', type: 'badge' },
                { header: 'Date de création', key: 'createdAt', type: 'date' }
            ],
            champs: [
                { key: 'regionUuid', label: 'Région', type: 'dropdown', required: true, options: regionsOptions, placeholder: 'Sélectionner une région' },
                { key: 'libelle', label: 'Libellé', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'Ex: Kindia' },
                { key: 'codePostal', label: 'Code postal', type: 'text', maxLength: 10, placeholder: 'Ex: 001' }
            ],
            filtres: [{ placeholder: 'Filtrer par région', rowKey: 'regionUuid', options: regionsOptions }],
            rechercheKeys: ['libelle', 'codePostal', 'regionLibelle'],
            invalider: [['villes-actives'], ['villes']]
        }),
        [regionsOptions]
    );

    return <ReferentielCrud config={config} api={villesApi} />;
}
