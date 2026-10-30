import { useQuery } from '@tanstack/react-query';
import type { Commune } from '@sira/core';
import { useMemo } from 'react';
import { api } from '../../api';
import { ReferentielCrud, type ReferentielApi, type ReferentielConfig } from './ReferentielCrud';

const communesApi: ReferentielApi<Commune> = {
    list: async () => (await api.geo.communes()).data.communes ?? [],
    create: async (body) => (await api.geo.createCommune({ villeUuid: body.villeUuid ?? '', libelle: body.libelle ?? '' })).data.commune,
    update: async (uuid, body) => (await api.geo.updateCommune(uuid, { villeUuid: body.villeUuid ?? '', libelle: body.libelle ?? '' })).data.commune,
    setActif: async (uuid, actif) => (await api.geo.setCommuneActif(uuid, actif)).data.commune
};

export function CommunesAdminPage() {
    const villesQuery = useQuery({ queryKey: ['villes-actives'], queryFn: async () => (await api.geo.villesActives()).data.villes ?? [] });
    const villesOptions = useMemo(() => (villesQuery.data ?? []).map((v) => ({ label: `${v.libelle} (${v.regionLibelle})`, value: v.villeUuid })), [villesQuery.data]);

    const config: ReferentielConfig<Commune> = useMemo(
        () => ({
            titre: 'Gestion des Communes',
            sousTitre: 'Gérez les communes rattachées aux villes et préfectures',
            entite: 'commune',
            entitePluriel: 'communes',
            genre: 'f',
            queryKey: 'admin-communes',
            uuidKey: 'communeUuid',
            libelleKey: 'libelle',
            colonnes: [
                { header: 'Libellé', key: 'libelle' },
                { header: 'Ville', key: 'villeLibelle', subKey: 'regionLibelle' },
                { header: 'Date de création', key: 'createdAt', type: 'date' },
                { header: 'Dernière modification', key: 'updatedAt', type: 'date' }
            ],
            champs: [
                { key: 'villeUuid', label: 'Ville', type: 'dropdown', required: true, options: villesOptions, placeholder: 'Sélectionner une ville' },
                { key: 'libelle', label: 'Libellé', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'Ex: Matam' }
            ],
            filtres: [{ placeholder: 'Filtrer par ville', rowKey: 'villeUuid', options: villesOptions }],
            rechercheKeys: ['libelle', 'villeLibelle', 'regionLibelle'],
            // Communes rurales nombreuses par préfecture → saisie en lot
            saisieParLot: true,
            invalider: [['communes-actives'], ['communes']]
        }),
        [villesOptions]
    );

    return <ReferentielCrud config={config} api={communesApi} />;
}
