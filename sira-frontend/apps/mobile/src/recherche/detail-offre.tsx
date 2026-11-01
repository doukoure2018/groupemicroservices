import {
    ajouterJours,
    arriveeOffre,
    dureeOffreMinutes,
    estComplete,
    formatDateFr,
    formatDuree,
    formatHeure,
    formatMontant,
    getMontantEffectif,
    jourIso,
    hasPromotion,
    libelleJourCourt,
    libelleVoyageurs,
    typeVehiculeOffre,
    type Offre,
    type Voyageurs
} from '@sira/core';
import { StyleSheet, Text, View } from 'react-native';
import { Bandeau, Bouton, Carte, styles as base } from '../ui/base';
import { FeuilleBasse } from '../ui/feuille';
import { couleurs, espaces, rayons } from '../ui/theme';

/**
 * Le voyage avant de s'engager : chronologie, véhicule, transporteur,
 * conditions, prix. « Continuer » mène à la réservation.
 */
export function DetailOffre({ offre, voyageurs, onFermer, onContinuer }: { offre: Offre | null; voyageurs: Voyageurs; onFermer: () => void; onContinuer: () => void }) {
    const visible = !!offre;
    const o = offre ?? {};
    const arrivee = arriveeOffre(o);
    const duree = dureeOffreMinutes(o);
    const complet = estComplete(o);
    const prix = getMontantEffectif(o);
    const jourDepart = jourIso(o.dateDepart);
    const jourArrivee = jourDepart && arrivee?.lendemain ? ajouterJours(jourDepart, 1) : null;
    const titre = jourDepart ? (jourArrivee ? `${libelleJourCourt(jourDepart)} → ${libelleJourCourt(jourArrivee)}` : libelleJourCourt(jourDepart)) : 'Voyage';
    const vehicule = [typeVehiculeOffre(o), [o.vehiculeMarque, o.vehiculeModele].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
    const places = o.nombrePlacesDisponibles ?? 0;

    return (
        <FeuilleBasse
            visible={visible}
            titre={titre}
            onFermer={onFermer}
            pied={<Bouton libelle={complet ? 'Complet' : 'Continuer'} desactive={complet} onPress={onContinuer} />}
        >
            <Text style={base.attenue}>
                Durée {duree ? formatDuree(duree) : 'non précisée'} · Direct
            </Text>

            <View style={styles.chronologie}>
                <Etape heure={formatHeure(o.heureDepart)} lieu={o.siteDepart} ville={o.villeDepartLibelle} depart />
                <View style={styles.lien} />
                <Etape heure={arrivee?.heure ?? '—'} lieu={o.siteArrivee} ville={o.villeArriveeLibelle} />
            </View>

            {jourArrivee && <Bandeau type="info">Arrivée le {formatDateFr(jourArrivee)}, le lendemain du départ.</Bandeau>}

            <View style={styles.puces}>
                <Puce texte={vehicule} />
                {o.vehiculeClimatise && <Puce texte="Climatisé" />}
                <Puce texte={complet ? 'Complet' : `${places} place${places > 1 ? 's' : ''} disponible${places > 1 ? 's' : ''}`} alerte={complet} />
            </View>

            <Carte style={{ gap: espaces.sm }}>
                {o.userFullName ? <Ligne libelle="Exploité par" valeur={o.userFullName} /> : null}
                {o.pointRendezvous ? <Ligne libelle="Rendez-vous" valeur={o.pointRendezvous} /> : null}
                <Ligne
                    libelle="Annulation"
                    valeur={o.annulationAutorisee === false ? 'Non remboursable' : `Possible jusqu'à ${o.delaiAnnulationHeures ?? 24} h avant le départ`}
                />
                {o.conditions ? <Text style={styles.conditions}>{o.conditions}</Text> : null}
            </Carte>

            <View style={styles.prixLigne}>
                <View>
                    <Text style={base.gras}>Prix par personne</Text>
                    <Text style={base.attenue}>{libelleVoyageurs(voyageurs)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    {hasPromotion(o) && <Text style={styles.prixBarre}>{formatMontant(o.montant, o.devise)}</Text>}
                    <Text style={styles.prix}>{formatMontant(prix, o.devise)}</Text>
                </View>
            </View>
        </FeuilleBasse>
    );
}

function Etape({ heure, lieu, ville, depart }: { heure: string; lieu?: string; ville?: string; depart?: boolean }) {
    return (
        <View style={styles.etape}>
            <View style={[styles.point, depart ? styles.pointPlein : styles.pointVide]} />
            <View style={{ flex: 1 }}>
                <Text style={styles.etapeLieu}>{lieu ?? ville ?? '—'}</Text>
                {ville && lieu ? <Text style={base.attenue}>{ville}</Text> : null}
            </View>
            <Text style={styles.etapeHeure}>{heure}</Text>
        </View>
    );
}

function Puce({ texte, alerte }: { texte: string; alerte?: boolean }) {
    return (
        <View style={[styles.puce, alerte && styles.puceAlerte]}>
            <Text style={[styles.puceTexte, alerte && styles.puceTexteAlerte]}>{texte}</Text>
        </View>
    );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
    return (
        <View style={base.ligne}>
            <Text style={base.attenue}>{libelle}</Text>
            <Text style={[base.gras, { flexShrink: 1, textAlign: 'right' }]}>{valeur}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    chronologie: { paddingVertical: espaces.xs },
    etape: { flexDirection: 'row', alignItems: 'center', gap: espaces.md },
    lien: { width: 2, height: 28, backgroundColor: couleurs.ligne, marginLeft: 7 },
    point: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: couleurs.vert },
    pointPlein: { backgroundColor: couleurs.vert },
    pointVide: { backgroundColor: couleurs.blanc },
    etapeLieu: { fontSize: 17, fontWeight: '700', color: couleurs.encre },
    etapeHeure: { fontSize: 18, fontWeight: '800', color: couleurs.encre },
    puces: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm },
    puce: { borderRadius: rayons.sm, backgroundColor: couleurs.vertPale, paddingHorizontal: espaces.md, paddingVertical: 6 },
    puceAlerte: { backgroundColor: couleurs.dangerPale },
    puceTexte: { color: couleurs.vertFonce, fontWeight: '600', fontSize: 13 },
    puceTexteAlerte: { color: couleurs.danger },
    conditions: { color: couleurs.gris, lineHeight: 20, borderTopWidth: 1, borderTopColor: couleurs.ligne, paddingTop: espaces.sm },
    prixLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaces.md },
    prix: { fontSize: 24, fontWeight: '800', color: couleurs.vert },
    prixBarre: { color: couleurs.gris, textDecorationLine: 'line-through', fontSize: 13 }
});
