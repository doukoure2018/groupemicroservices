import { Component, OnInit, inject, signal } from '@angular/core';
import { map } from 'rxjs';

import { VilleService } from '@/service/ville.service';
import { RegionService } from '@/service/region.service';
import { IVilleCreateRequest, IVilleUpdateRequest } from '@/interface/ville';
import { ReferentielApi, ReferentielCrudConfig } from '@/interface/referentiel-crud.config';
import { ReferentielCrudComponent } from '../shared/referentiel-crud.component';

/** Écran Villes/Préfectures — configuration du CRUD générique de référentiel (T12c). */
@Component({
    selector: 'app-villes',
    standalone: true,
    imports: [ReferentielCrudComponent],
    template: `<app-referentiel-crud [config]="config" [api]="api" [options]="options()" />`
})
export class VillesComponent implements OnInit {
    private villeService = inject(VilleService);
    private regionService = inject(RegionService);

    options = signal<Record<string, any[]>>({});

    readonly config: ReferentielCrudConfig = {
        titre: 'Villes / Préfectures',
        sousTitre: 'Gérez les villes et préfectures rattachées aux régions',
        entite: 'ville',
        entitePluriel: 'villes',
        genre: 'f',
        icone: 'pi pi-building',
        uuidKey: 'villeUuid',
        colonnes: [
            { key: 'libelle', header: 'Libellé', icon: 'pi pi-building' },
            { key: 'regionLibelle', header: 'Région' },
            { key: 'codePostal', header: 'Code postal', type: 'badge' },
            { key: 'createdAt', header: 'Date de création', type: 'date' }
        ],
        champs: [
            { key: 'regionUuid', label: 'Région', type: 'dropdown', required: true, optionsKey: 'regions', optionLabel: 'libelle', optionValue: 'regionUuid', placeholder: 'Sélectionner une région' },
            { key: 'libelle', label: 'Libellé', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'Ex: Kindia' },
            { key: 'codePostal', label: 'Code postal', type: 'text', maxLength: 10, placeholder: 'Ex: 001' }
        ],
        filtres: [{ label: 'Filtrer par région', rowKey: 'regionUuid', optionsKey: 'regions', optionLabel: 'libelle', optionValue: 'regionUuid' }],
        rechercheKeys: ['libelle', 'codePostal', 'regionLibelle']
    };

    readonly api: ReferentielApi = {
        getAll: () => this.villeService.getAllVilles$().pipe(map((r) => r.data.villes || [])),
        create: (payload) => this.villeService.createVille$(payload as IVilleCreateRequest).pipe(map((r) => ({ item: r.data.ville, message: r.message }))),
        update: (uuid, payload) => this.villeService.updateVille$(uuid, payload as IVilleUpdateRequest).pipe(map((r) => ({ item: r.data.ville, message: r.message }))),
        updateStatus: (uuid, actif) => this.villeService.updateVilleStatus$(uuid, actif).pipe(map((r) => ({ item: r.data.ville, message: r.message })))
    };

    ngOnInit(): void {
        this.regionService.getActiveRegions$().subscribe({
            next: (response) => this.options.set({ regions: response.data.regions || [] })
        });
    }
}
