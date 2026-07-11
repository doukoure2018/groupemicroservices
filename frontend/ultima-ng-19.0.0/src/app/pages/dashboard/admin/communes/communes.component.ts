import { Component, OnInit, inject, signal } from '@angular/core';
import { map } from 'rxjs';

import { CommuneService } from '@/service/commune.service';
import { VilleService } from '@/service/ville.service';
import { ICommuneCreateRequest, ICommuneUpdateRequest } from '@/interface/commune';
import { ReferentielApi, ReferentielCrudConfig } from '@/interface/referentiel-crud.config';
import { ReferentielCrudComponent } from '../shared/referentiel-crud.component';

/** Écran Communes — configuration du CRUD générique de référentiel (T12c). */
@Component({
    selector: 'app-communes',
    standalone: true,
    imports: [ReferentielCrudComponent],
    template: `<app-referentiel-crud [config]="config" [api]="api" [options]="options()" />`
})
export class CommunesComponent implements OnInit {
    private communeService = inject(CommuneService);
    private villeService = inject(VilleService);

    options = signal<Record<string, any[]>>({});

    readonly config: ReferentielCrudConfig = {
        titre: 'Gestion des Communes',
        sousTitre: 'Gérez les communes rattachées aux villes et préfectures',
        entite: 'commune',
        entitePluriel: 'communes',
        genre: 'f',
        icone: 'pi pi-map-marker',
        uuidKey: 'communeUuid',
        colonnes: [
            { key: 'libelle', header: 'Libellé', icon: 'pi pi-map-marker' },
            { key: 'villeLibelle', header: 'Ville', subKey: 'regionLibelle' },
            { key: 'createdAt', header: 'Date de création', type: 'date' },
            { key: 'updatedAt', header: 'Dernière modification', type: 'date' }
        ],
        champs: [
            { key: 'villeUuid', label: 'Ville', type: 'dropdown', required: true, optionsKey: 'villes', optionLabel: 'libelle', optionValue: 'villeUuid', placeholder: 'Sélectionner une ville' },
            { key: 'libelle', label: 'Libellé', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'Ex: Matam' }
        ],
        filtres: [{ label: 'Filtrer par ville', rowKey: 'villeUuid', optionsKey: 'villes', optionLabel: 'libelle', optionValue: 'villeUuid' }],
        rechercheKeys: ['libelle', 'villeLibelle', 'regionLibelle']
    };

    readonly api: ReferentielApi = {
        getAll: () => this.communeService.getAllCommunes$().pipe(map((r) => r.data.communes || [])),
        create: (payload) => this.communeService.createCommune$(payload as ICommuneCreateRequest).pipe(map((r) => ({ item: r.data.commune, message: r.message }))),
        update: (uuid, payload) => this.communeService.updateCommune$(uuid, payload as ICommuneUpdateRequest).pipe(map((r) => ({ item: r.data.commune, message: r.message }))),
        updateStatus: (uuid, actif) => this.communeService.updateCommuneStatus$(uuid, actif).pipe(map((r) => ({ item: r.data.commune, message: r.message })))
    };

    ngOnInit(): void {
        this.villeService.getActiveVilles$().subscribe({
            next: (response) => this.options.set({ villes: response.data.villes || [] })
        });
    }
}
