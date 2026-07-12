import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, map } from 'rxjs';

import { QuartierService } from '@/service/quartier.service';
import { CommuneService } from '@/service/commune.service';
import { VilleService } from '@/service/ville.service';
import { IQuartierCreateRequest, IQuartierUpdateRequest } from '@/interface/quartier';
import { ReferentielApi, ReferentielCrudConfig } from '@/interface/referentiel-crud.config';
import { ReferentielCrudComponent } from '../shared/referentiel-crud.component';

/** Écran Quartiers — configuration du CRUD générique de référentiel (T12c). */
@Component({
    selector: 'app-quartiers',
    standalone: true,
    imports: [ReferentielCrudComponent],
    template: `<app-referentiel-crud [config]="config" [api]="api" [options]="options()" />`
})
export class QuartiersComponent implements OnInit {
    private quartierService = inject(QuartierService);
    private communeService = inject(CommuneService);
    private villeService = inject(VilleService);

    options = signal<Record<string, any[]>>({});

    readonly config: ReferentielCrudConfig = {
        titre: 'Gestion des Quartiers',
        sousTitre: 'Gérez les quartiers rattachés aux communes',
        entite: 'quartier',
        entitePluriel: 'quartiers',
        genre: 'm',
        icone: 'pi pi-home',
        uuidKey: 'quartierUuid',
        colonnes: [
            { key: 'libelle', header: 'Libellé', icon: 'pi pi-home' },
            { key: 'communeLibelle', header: 'Commune', subKey: 'villeLibelle' },
            { key: 'createdAt', header: 'Date de création', type: 'date' },
            { key: 'updatedAt', header: 'Dernière modification', type: 'date' }
        ],
        champs: [
            // Champ d'aide : filtre la liste des communes, non envoyé au backend
            { key: 'villeUuid', label: 'Ville (aide à la sélection)', type: 'dropdown', optionsKey: 'villes', optionLabel: 'libelle', optionValue: 'villeUuid', placeholder: 'Toutes les villes', exclu: true },
            { key: 'communeUuid', label: 'Commune', type: 'dropdown', required: true, optionsKey: 'communes', optionLabel: 'libelle', optionValue: 'communeUuid', placeholder: 'Sélectionner une commune', dependsOn: { champ: 'villeUuid', matchKey: 'villeUuid' } },
            { key: 'libelle', label: 'Libellé', type: 'text', required: true, minLength: 2, maxLength: 100, placeholder: 'Ex: Almamya' }
        ],
        filtres: [
            { label: 'Filtrer par ville', rowKey: 'villeUuid', optionsKey: 'villes', optionLabel: 'libelle', optionValue: 'villeUuid' },
            { label: 'Filtrer par commune', rowKey: 'communeUuid', optionsKey: 'communes', optionLabel: 'libelle', optionValue: 'communeUuid', dependsOn: { filtre: 0, matchKey: 'villeUuid' } }
        ],
        rechercheKeys: ['libelle', 'communeLibelle', 'villeLibelle', 'regionLibelle'],
        // Des dizaines de quartiers par commune → saisie en lot
        saisieParLot: true
    };

    readonly api: ReferentielApi = {
        getAll: () => this.quartierService.getAllQuartiers$().pipe(map((r) => r.data.quartiers || [])),
        create: (payload) => this.quartierService.createQuartier$(payload as IQuartierCreateRequest).pipe(map((r) => ({ item: r.data.quartier, message: r.message }))),
        update: (uuid, payload) => this.quartierService.updateQuartier$(uuid, payload as IQuartierUpdateRequest).pipe(map((r) => ({ item: r.data.quartier, message: r.message }))),
        updateStatus: (uuid, actif) => this.quartierService.updateQuartierStatus$(uuid, actif).pipe(map((r) => ({ item: r.data.quartier, message: r.message })))
    };

    ngOnInit(): void {
        forkJoin({
            villes: this.villeService.getActiveVilles$(),
            communes: this.communeService.getActiveCommunes$()
        }).subscribe({
            next: ({ villes, communes }) =>
                this.options.set({
                    villes: villes.data.villes || [],
                    communes: communes.data.communes || []
                })
        });
    }
}
