import type { Region } from '@sira/core';
import { api } from '../../api';
import { ReferentielCrud, type ReferentielApi, type ReferentielConfig } from './ReferentielCrud';

const config: ReferentielConfig<Region> = {
    titre: 'Gestion des Régions',
    sousTitre: 'Gérez les régions administratives de la plateforme SYNERGIA',
    entite: 'région',
    entitePluriel: 'régions',
    genre: 'f',
    queryKey: 'admin-regions',
    uuidKey: 'regionUuid',
    libelleKey: 'libelle',
    colonnes: [
        { header: 'Libellé', key: 'libelle' },
        { header: 'Code', key: 'code', type: 'badge' },
        { header: 'Date de création', key: 'createdAt', type: 'date' },
        { header: 'Dernière modification', key: 'updatedAt', type: 'date' }
    ],
    champs: [
        { key: 'libelle', label: 'Libellé', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'Ex: Conakry' },
        { key: 'code', label: 'Code', type: 'text', maxLength: 10, placeholder: 'Ex: CKY' }
    ],
    rechercheKeys: ['libelle', 'code'],
    invalider: [['regions-actives']]
};

const regionsApi: ReferentielApi<Region> = {
    list: async () => (await api.geo.regions()).data.regions ?? [],
    create: async (body) => (await api.geo.createRegion({ libelle: body.libelle ?? '', code: body.code })).data.region,
    update: async (uuid, body) => (await api.geo.updateRegion(uuid, { libelle: body.libelle ?? '', code: body.code })).data.region,
    setActif: async (uuid, actif) => (await api.geo.setRegionActif(uuid, actif)).data.region
};

export function RegionsAdminPage() {
    return <ReferentielCrud config={config} api={regionsApi} />;
}
