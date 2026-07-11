import { Component, inject } from '@angular/core';
import { map } from 'rxjs';

import { RegionService } from '@/service/region.service';
import { IRegionCreateRequest, IRegionUpdateRequest } from '@/interface/region';
import { ReferentielApi, ReferentielCrudConfig } from '@/interface/referentiel-crud.config';
import { ReferentielCrudComponent } from '../shared/referentiel-crud.component';

/** Écran Régions — configuration du CRUD générique de référentiel (T12c). */
@Component({
    selector: 'app-regions',
    standalone: true,
    imports: [ReferentielCrudComponent],
    template: `<app-referentiel-crud [config]="config" [api]="api" />`
})
export class RegionsComponent {
    private regionService = inject(RegionService);

    readonly config: ReferentielCrudConfig = {
        titre: 'Gestion des Régions',
        sousTitre: 'Gérez les régions administratives de la plateforme SYNERGIA',
        entite: 'région',
        entitePluriel: 'régions',
        genre: 'f',
        icone: 'pi pi-map-marker',
        uuidKey: 'regionUuid',
        colonnes: [
            { key: 'libelle', header: 'Libellé', icon: 'pi pi-map-marker' },
            { key: 'code', header: 'Code', type: 'badge' },
            { key: 'createdAt', header: 'Date de création', type: 'date' },
            { key: 'updatedAt', header: 'Dernière modification', type: 'date' }
        ],
        champs: [
            { key: 'libelle', label: 'Libellé', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'Ex: Conakry' },
            { key: 'code', label: 'Code', type: 'text', maxLength: 10, placeholder: 'Ex: CKY' }
        ],
        rechercheKeys: ['libelle', 'code']
    };

    readonly api: ReferentielApi = {
        getAll: () => this.regionService.getAllRegions$().pipe(map((r) => r.data.regions || [])),
        create: (payload) => this.regionService.createRegion$(payload as IRegionCreateRequest).pipe(map((r) => ({ item: r.data.region, message: r.message }))),
        update: (uuid, payload) => this.regionService.updateRegion$(uuid, payload as IRegionUpdateRequest).pipe(map((r) => ({ item: r.data.region, message: r.message }))),
        // Le backend attend un body { actif } pour les régions
        updateStatus: (uuid, actif) => this.regionService.updateRegionStatus$(uuid, { actif }).pipe(map((r) => ({ item: r.data.region, message: r.message })))
    };
}
