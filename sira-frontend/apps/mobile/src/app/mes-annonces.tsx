import { ApiError } from '@sira/api-client';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { formatDateCourte, formatMontant, libellePeriode, libelleStatutAnnonce, type Brouillon, type Propriete } from '@sira/core';
import { router } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { ExigerSession } from '../auth/exiger-session';
import { messageErreur } from '../immo/feuilles-relation';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces, rayons, texte } from '../ui/theme';

/**
 * Tout ce que je publie : les brouillons à reprendre, les annonces et leur
 * état. Chaque état n'offre que les gestes qui ont un sens pour lui ; le
 * serveur refuse les autres de toute façon.
 */
function MesAnnoncesEcran() {
    const queryClient = useQueryClient();
    const [profil, annonces, brouillons] = useQueries({
        queries: [
            {
                queryKey: ['profil-immo'],
                queryFn: async () => {
                    try {
                        return (await api.immo.clientSide.monProfil()).data.profil;
                    } catch (e) {
                        if (e instanceof ApiError && e.status === 404) return null;
                        throw e;
                    }
                }
            },
            {
                queryKey: ['mes-annonces'],
                queryFn: async () => {
                    try {
                        return (await api.immo.proprietes.mesProprietes()).data.proprietes ?? [];
                    } catch (e) {
                        // Pas encore de profil immobilier : le serveur répond 404, et il n'y a simplement rien.
                        if (e instanceof ApiError && e.status === 404) return [];
                        throw e;
                    }
                }
            },
            { queryKey: ['mes-brouillons'], queryFn: async () => (await api.immo.clientSide.brouillons()).data.brouillons ?? [] }
        ]
    });

    const rafraichir = () => {
        void queryClient.invalidateQueries({ queryKey: ['mes-annonces'] });
        void queryClient.invalidateQueries({ queryKey: ['mes-brouillons'] });
        void queryClient.invalidateQueries({ queryKey: ['biens'] });
    };
    const erreur = (e: unknown) => Alert.alert('Action impossible', messageErreur(e, 'Vérifiez votre réseau puis réessayez.'));
    const action = useMutation({
        mutationFn: async ({ uuid, quoi }: { uuid: string; quoi: 'publier' | 'retirer' | 'renouveler' | 'vendu' | 'loue' | 'supprimer' }) => {
            const p = api.immo.proprietes;
            if (quoi === 'publier') return p.publier(uuid);
            if (quoi === 'retirer') return p.retirer(uuid);
            if (quoi === 'renouveler') return p.renouveler(uuid);
            if (quoi === 'vendu') return p.marquerVendu(uuid);
            if (quoi === 'loue') return p.marquerLoue(uuid);
            return p.supprimer(uuid);
        },
        onSuccess: rafraichir,
        onError: erreur
    });
    const supprimerBrouillon = useMutation({ mutationFn: async (uuid: string) => api.immo.clientSide.supprimerBrouillon(uuid), onSuccess: rafraichir, onError: erreur });

    const confirmer = (titre: string, texte: string, faire: () => void, destructif = false) =>
        Alert.alert(titre, texte, [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui', style: destructif ? 'destructive' : 'default', onPress: faire }
        ]);

    function publierNouvelle() {
        if (profil.data === null) router.push('/publier/profil');
        else router.push({ pathname: '/publier/[brouillon]', params: { brouillon: 'nouveau' } });
    }

    if (profil.isPending || annonces.isPending || brouillons.isPending) return <Chargement texte="Chargement de vos annonces…" />;
    if (annonces.isError) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={rafraichir} />} />;
    }

    const listeBrouillons: Brouillon[] = (brouillons.data ?? []).filter((b) => !b.proprieteId);
    const listeAnnonces: Propriete[] = annonces.data ?? [];

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <Bouton libelle="Publier une annonce" onPress={publierNouvelle} />
            {profil.data?.statutVerification === 'EN_ATTENTE' && listeAnnonces.length > 0 && (
                <Bandeau type="info">Votre profil n'est pas encore vérifié : chaque annonce passe par une relecture avant d'être visible. C'est l'affaire de quelques heures.</Bandeau>
            )}

            {listeBrouillons.length > 0 && (
                <>
                    <Text style={base.sectionTitre}>Brouillons</Text>
                    {listeBrouillons.map((b) => (
                        <Carte key={b.brouillonUuid} style={{ gap: espaces.xs }}>
                            <Text style={styles.titre}>{b.donneesJson?.etape4?.titre?.trim() || 'Annonce sans titre'}</Text>
                            <Text style={base.attenue}>
                                Étape {b.etapeActuelle} sur 4{b.derniereModification ? ` · modifié le ${formatDateCourte(b.derniereModification)}` : ''}
                            </Text>
                            <View style={styles.actions}>
                                <Bouton libelle="Reprendre" variante="secondaire" onPress={() => router.push({ pathname: '/publier/[brouillon]', params: { brouillon: b.brouillonUuid } })} style={{ flex: 1 }} />
                                <Bouton libelle="Supprimer" variante="discret" onPress={() => confirmer('Supprimer ce brouillon ?', 'Ce qui a été saisi sera perdu.', () => supprimerBrouillon.mutate(b.brouillonUuid), true)} />
                            </View>
                        </Carte>
                    ))}
                </>
            )}

            <Text style={base.sectionTitre}>Mes annonces</Text>
            {listeAnnonces.length === 0 && listeBrouillons.length === 0 && (
                <EtatVide
                    titre="Aucune annonce"
                    texte={
                        profil.data === null
                            ? 'Publiez votre premier bien : on vous demandera d’abord à quel titre vous publiez, puis quatre étapes et vos photos.'
                            : 'Publiez votre premier bien : quatre étapes, vos photos, et la relecture de SYNERGIA.'
                    }
                />
            )}
            {listeAnnonces.map((a) => (
                <LigneAnnonce key={a.proprieteUuid} annonce={a} enCours={action.isPending} agir={(quoi) => action.mutate({ uuid: a.proprieteUuid, quoi })} confirmer={confirmer} />
            ))}
        </ScrollView>
    );
}

function LigneAnnonce({
    annonce: a,
    enCours,
    agir,
    confirmer
}: {
    annonce: Propriete;
    enCours: boolean;
    agir: (quoi: 'publier' | 'retirer' | 'renouveler' | 'vendu' | 'loue' | 'supprimer') => void;
    confirmer: (titre: string, texte: string, faire: () => void, destructif?: boolean) => void;
}) {
    const photo = a.photoCouverture?.urlThumbnail ?? a.photos?.[0]?.urlThumbnail;
    const periode = libellePeriode(a.periode);
    const location = a.typeAnnonce === 'LOCATION';
    const statut = a.statut;
    const publiee = statut === 'PUBLIE';
    const photosEcran = () => router.push({ pathname: '/publier/photos/[uuid]', params: { uuid: a.proprieteUuid } });

    return (
        <Carte style={{ gap: espaces.sm }}>
            <Pressable
                accessibilityRole={publiee ? 'button' : undefined}
                disabled={!publiee}
                onPress={() => router.push({ pathname: '/bien/[uuid]', params: { uuid: a.proprieteUuid } })}
                style={styles.entete}
            >
                {photo ? <Image source={{ uri: photo }} style={styles.photo} accessibilityIgnoresInvertColors /> : <View style={[styles.photo, styles.photoVide]}><Text style={styles.photoVideTexte}>Sans photo</Text></View>}
                <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.statut, publiee ? styles.statutVert : statut === 'REJETE' ? styles.statutRouge : styles.statutGris]}>{libelleStatutAnnonce(statut)}</Text>
                    <Text style={styles.titre} numberOfLines={2}>
                        {a.titre}
                    </Text>
                    <Text style={styles.prix}>
                        {a.prixSurDemande ? 'Prix sur demande' : formatMontant(a.prix, a.devise)}
                        {periode && !a.prixSurDemande ? <Text style={base.attenue}> {periode}</Text> : null}
                    </Text>
                    <Text style={base.attenue}>
                        {a.nombreVues ?? 0} vue{(a.nombreVues ?? 0) > 1 ? 's' : ''} · {a.nombreContacts ?? 0} contact{(a.nombreContacts ?? 0) > 1 ? 's' : ''} · {a.photos?.length ?? 0} photo{(a.photos?.length ?? 0) > 1 ? 's' : ''}
                    </Text>
                </View>
            </Pressable>
            {statut === 'REJETE' && !!a.motifRejet && <Bandeau type="erreur">Refusée : {a.motifRejet}</Bandeau>}

            <View style={styles.actions}>
                {statut === 'BROUILLON' && <Bouton libelle="Photos et publication" onPress={photosEcran} style={{ flex: 1 }} />}
                {statut === 'PUBLIE' && (
                    <>
                        <Bouton libelle={location ? 'Marquer louée' : 'Marquer vendue'} variante="secondaire" onPress={() => confirmer(location ? 'Marquer louée ?' : 'Marquer vendue ?', "L'annonce quitte la recherche.", () => agir(location ? 'loue' : 'vendu'))} style={{ flex: 1 }} />
                        <Bouton libelle="Photos" variante="discret" onPress={photosEcran} />
                        <Bouton libelle="Retirer" variante="discret" onPress={() => confirmer('Retirer cette annonce ?', 'Vous pourrez la republier plus tard.', () => agir('retirer'))} />
                    </>
                )}
                {statut === 'EN_ATTENTE_VALIDATION' && (
                    <>
                        <Bouton libelle="Photos" variante="secondaire" onPress={photosEcran} style={{ flex: 1 }} />
                        <Bouton libelle="Retirer" variante="discret" onPress={() => confirmer('Retirer cette annonce ?', 'Elle ne sera pas relue.', () => agir('retirer'))} />
                    </>
                )}
                {statut === 'RETIRE' && (
                    <>
                        <Bouton libelle="Republier" onPress={() => agir('publier')} style={{ flex: 1 }} enCours={enCours} />
                        <Bouton libelle="Supprimer" variante="discret" onPress={() => confirmer('Supprimer cette annonce ?', 'Définitif.', () => agir('supprimer'), true)} />
                    </>
                )}
                {statut === 'EXPIRE' && <Bouton libelle="Renouveler" onPress={() => agir('renouveler')} style={{ flex: 1 }} enCours={enCours} />}
                {(statut === 'REJETE' || statut === 'VENDU' || statut === 'LOUE') && (
                    <Bouton libelle="Supprimer" variante="discret" onPress={() => confirmer('Supprimer cette annonce ?', 'Définitif.', () => agir('supprimer'), true)} />
                )}
            </View>
        </Carte>
    );
}

export default function Ecran() {
    return (
        <ExigerSession>
            <MesAnnoncesEcran />
        </ExigerSession>
    );
}

const styles = StyleSheet.create({
    entete: { flexDirection: 'row', gap: espaces.md, alignItems: 'flex-start' },
    photo: { width: 84, height: 84, borderRadius: rayons.md, backgroundColor: couleurs.vertPale },
    photoVide: { alignItems: 'center', justifyContent: 'center' },
    photoVideTexte: { ...texte.mention, color: couleurs.gris },
    statut: { ...texte.mention, alignSelf: 'flex-start', borderRadius: rayons.sm, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    statutVert: { backgroundColor: couleurs.vertPale, color: couleurs.vertFonce },
    statutGris: { backgroundColor: couleurs.fond, color: couleurs.gris },
    statutRouge: { backgroundColor: couleurs.dangerPale, color: couleurs.danger },
    titre: { ...texte.appuye, color: couleurs.encre },
    prix: { ...texte.prix, color: couleurs.vert },
    actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espaces.sm }
});
