import { useQuery } from '@tanstack/react-query';
import type { Quartier } from '@sira/core';
import { useMemo } from 'react';
import { api } from '../../api';
import { ReferentielCrud, type ReferentielApi, type ReferentielConfig } from './ReferentielCrud';

const quartiersApi: ReferentielApi<Quartier> = {
    list: async () => (await api.geo.quartiers()).data.quartiers ?? [],
    create: async (body) => (await api.geo.createQuartier({ communeUuid: body.communeUuid ?? '', libelle: body.libelle ?? '' })).data.quartier,
    update: async (uuid, body) => (await api.geo.updateQuartier(uuid, { communeUuid: body.communeUuid ?? '', libelle: body.libelle ?? '' })).data.quartier,
    setActif: async (uuid, actif) => (await api.geo.setQuartierActif(uuid, actif)).data.quartier
};

export function QuartiersAdminPage() {
    const villesQuery = useQuery({ queryKey: ['villes-actives'], queryFn: async () => (await api.geo.villesActives()).data.villes ?? [] });
    const communesQuery = useQuery({ queryKey: ['communes-actives'], queryFn: async () => (await api.geo.communesActives()).data.communes ?? [] });

    const villesOptions = useMemo(() => (villesQuery.data ?? []).map((v) => ({ label: v.libelle, value: v.villeUuid })), [villesQuery.data]);
    // `villeUuid` porté par chaque option : c'est la clé de cascade ville → commune.
    const communesOptions = useMemo(
        () => (communesQuery.data ?? []).map((c) => ({ label: `${c.libelle} (${c.villeLibelle})`, value: c.communeUuid, villeUuid: c.villeUuid })),
        [communesQuery.data]
    );

    const config: ReferentielConfig<Quartier> = useMemo(
        () => ({
            titre: 'Gestion des Quartiers',
            sousTitre: 'Gérez les quartiers rattachés aux communes',
            entite: 'quartier',
            entitePluriel: 'quartiers',
            genre: 'm',
            queryKey: 'admin-quartiers',
            uuidKey: 'quartierUuid',
            libelleKey: 'libelle',
            colonnes: [
                { header: 'Libellé', key: 'libelle' },
                { header: 'Commune', key: 'communeLibelle', subKey: 'villeLibelle' },
                { header: 'Date de création', key: 'createdAt', type: 'date' },
                { header: 'Dernière modification', key: 'updatedAt', type: 'date' }
            ],
            champs: [
                { key: 'villeUuid', label: 'Ville (aide à la sélection)', type: 'dropdown', options: villesOptions, placeholder: 'Toutes les villes', exclu: true },
                {
                    key: 'communeUuid',
                    label: 'Commune',
                    type: 'dropdown',
                    required: true,
                    options: communesOptions,
                    placeholder: 'Sélectionner une commune',
                    dependsOn: { champ: 'villeUuid', matchKey: 'villeUuid' }
                },
                { key: 'libelle', label: 'Libellé', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'Ex: Almamya' }
            ],
            filtres: [
                { placeholder: 'Filtrer par ville', rowKey: 'villeUuid', options: villesOptions },
                { placeholder: 'Filtrer par commune', rowKey: 'communeUuid', options: communesOptions, dependsOn: { filtre: 0, matchKey: 'villeUuid' } }
            ],
            rechercheKeys: ['libelle', 'communeLibelle', 'villeLibelle', 'regionLibelle'],
            // Des dizaines de quartiers par commune → saisie en lot
            saisieParLot: true,
            invalider: [['quartiers-actifs'], ['quartiers']]
        }),
        [villesOptions, communesOptions]
    );

    return <ReferentielCrud config={config} api={quartiersApi} />;
}
