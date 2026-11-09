import { useQuery } from '@tanstack/react-query';
import { formatMontant, libellePeriode, resumeBien, type Photo, type Propriete } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { useFavori } from '../../immo/favoris';
import { FeuilleContact, FeuilleSignalement, FeuilleVisite } from '../../immo/feuilles-relation';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces, rayons, texte, zoomMax } from '../../ui/theme';

type Feuille = 'contact' | 'visite' | 'signalement';

/**
 * La fiche d'un bien : ce qu'on voit avant de se décider, puis ce qu'on fait.
 * Elle se consulte sans compte ; le cœur, le contact, la visite et le
 * signalement demandent à s'identifier, et la connexion ramène ici.
 */
export default function FicheBien() {
    const { uuid } = useLocalSearchParams<{ uuid: string }>();
    const { user } = useAuth();
    const favori = useFavori(`/bien/${uuid}`);
    const [feuille, setFeuille] = useState<Feuille | null>(null);
    const [confirmation, setConfirmation] = useState<string | null>(null);

    function ouvrir(f: Feuille) {
        if (!user) {
            router.push({ pathname: '/connexion', params: { suite: `/bien/${uuid}` } });
            return;
        }
        setConfirmation(null);
        setFeuille(f);
    }

    const bien = useQuery({
        queryKey: ['bien', uuid],
        queryFn: async () => (await api.immo.proprietes.byUuid(uuid)).data,
        enabled: !!uuid
    });

    if (bien.isPending) return <Chargement texte="Chargement du bien…" />;
    if (bien.isError || !bien.data?.propriete) {
        return <EtatVide titre="Bien introuvable" texte="L'annonce a peut-être été retirée." action={<Bouton libelle="Réessayer" onPress={() => void bien.refetch()} />} />;
    }

    const p: Propriete = bien.data.propriete;
    const location = p.typeAnnonce === 'LOCATION';
    const periode = libellePeriode(p.periode);
    const estFavori = p.isFavorite === true;
    const retire = p.statut && p.statut !== 'PUBLIE';

    return (
        <>
        <ScrollView style={base.ecran} contentContainerStyle={{ paddingBottom: espaces.xxl }}>
            <Galerie photos={p.photos ?? []} />

            <View style={styles.contenu}>
                {retire ? <Bandeau type="alerte">Cette annonce n'est plus publiée.</Bandeau> : null}
                {confirmation ? <Bandeau type="succes">{confirmation}</Bandeau> : null}

                <View style={base.ligne}>
                    <Text style={[styles.badge, location ? styles.badgeLocation : styles.badgeVente]}>{location ? 'Location' : 'Vente'}</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        accessibilityState={{ selected: estFavori }}
                        hitSlop={10}
                        onPress={() => favori.basculer(p.proprieteUuid, estFavori)}
                        style={styles.boutonCoeur}
                    >
                        <Text style={[styles.coeur, estFavori && styles.coeurPlein]}>{estFavori ? '♥' : '♡'}</Text>
                    </Pressable>
                </View>

                <Text maxFontSizeMultiplier={zoomMax} style={base.titre}>
                    {p.titre}
                </Text>
                <Text style={styles.prix}>
                    {p.prixSurDemande ? 'Prix sur demande' : formatMontant(p.prix, p.devise)}
                    {periode && !p.prixSurDemande ? <Text style={styles.periode}> {periode}</Text> : null}
                </Text>
                {p.prixNegociable ? <Text style={base.attenue}>Prix négociable.</Text> : null}

                {!!resumeBien(p) && (
                    <Carte style={{ gap: espaces.sm }}>
                        <Text style={base.sectionTitre}>Le bien</Text>
                        <Text style={base.sousTitre}>{resumeBien(p)}</Text>
                        <Rangs
                            lignes={[
                                p.typeBien?.libelle ? { libelle: 'Type', valeur: p.typeBien.libelle } : null,
                                p.etageSituation != null ? { libelle: 'Étage', valeur: String(p.etageSituation) } : null,
                                p.anneeConstruction ? { libelle: 'Année de construction', valeur: String(p.anneeConstruction) } : null,
                                location && p.moisCaution ? { libelle: 'Caution', valeur: `${p.moisCaution} mois` } : null,
                                location && p.moisAvance ? { libelle: 'Avance', valeur: `${p.moisAvance} mois` } : null
                            ]}
                        />
                    </Carte>
                )}

                {!!p.description && (
                    <Carte style={{ gap: espaces.sm }}>
                        <Text style={base.sectionTitre}>Description</Text>
                        <Text style={base.sousTitre}>{p.description}</Text>
                    </Carte>
                )}

                {p.commodites?.length > 0 && (
                    <Carte style={{ gap: espaces.sm }}>
                        <Text style={base.sectionTitre}>Commodités</Text>
                        <View style={styles.puces}>
                            {p.commodites.map((c) => (
                                <Text key={c.code} style={styles.puce}>
                                    {c.libelle}
                                </Text>
                            ))}
                        </View>
                    </Carte>
                )}

                {!!p.adresseComplete && (
                    <Carte style={{ gap: espaces.sm }}>
                        <Text style={base.sectionTitre}>Où</Text>
                        <Text style={base.sousTitre}>{p.adresseComplete}</Text>
                        {p.latitude != null && p.longitude != null && (
                            <Bouton
                                libelle="Ouvrir dans les cartes"
                                variante="secondaire"
                                onPress={() => {
                                    const cible = `geo:${p.latitude},${p.longitude}?q=${p.latitude},${p.longitude}(${encodeURIComponent(p.titre)})`;
                                    void Linking.openURL(cible).catch(() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=17/${p.latitude}/${p.longitude}`));
                                }}
                            />
                        )}
                    </Carte>
                )}

                <Carte style={{ gap: espaces.sm }}>
                    <Text style={base.sectionTitre}>Qui publie</Text>
                    <Text style={base.gras}>{p.nomContactPublic || 'Particulier'}</Text>
                    <Text style={base.attenue}>
                        {p.nombreVues ?? 0} vue{(p.nombreVues ?? 0) > 1 ? 's' : ''} · {p.nombreFavoris ?? 0} favori{(p.nombreFavoris ?? 0) > 1 ? 's' : ''}
                    </Text>
                    {!!p.reference && <Text style={base.attenue}>Référence {p.reference}</Text>}
                </Carte>

                {!retire && (
                    <View style={{ gap: espaces.sm }}>
                        <Bouton libelle="Demander une visite" onPress={() => ouvrir('visite')} />
                        <Bouton libelle="Contacter" variante="secondaire" onPress={() => ouvrir('contact')} />
                    </View>
                )}
                <Bouton libelle="Signaler cette annonce" variante="discret" onPress={() => ouvrir('signalement')} />
            </View>
        </ScrollView>

        <FeuilleContact visible={feuille === 'contact'} proprieteUuid={p.proprieteUuid} onFermer={() => setFeuille(null)} onEnvoye={(m) => { setFeuille(null); setConfirmation(m); }} />
        <FeuilleVisite visible={feuille === 'visite'} proprieteUuid={p.proprieteUuid} onFermer={() => setFeuille(null)} onEnvoye={(m) => { setFeuille(null); setConfirmation(m); }} />
        <FeuilleSignalement visible={feuille === 'signalement'} proprieteUuid={p.proprieteUuid} onFermer={() => setFeuille(null)} onEnvoye={(m) => { setFeuille(null); setConfirmation(m); }} />
        </>
    );
}

function Rangs({ lignes }: { lignes: ({ libelle: string; valeur: string } | null)[] }) {
    const utiles = lignes.filter((l): l is { libelle: string; valeur: string } => l !== null);
    if (utiles.length === 0) return null;
    return (
        <View style={{ gap: espaces.xs }}>
            {utiles.map((l) => (
                <View key={l.libelle} style={base.ligne}>
                    <Text style={base.attenue}>{l.libelle}</Text>
                    <Text style={base.gras}>{l.valeur}</Text>
                </View>
            ))}
        </View>
    );
}

/** Les photos, une par écran, avec le rang affiché : « 2 / 7 ». */
function Galerie({ photos }: { photos: Photo[] }) {
    const largeur = Dimensions.get('window').width;
    const [index, setIndex] = useState(0);

    if (photos.length === 0) {
        return (
            <View style={[styles.galerieVide, { width: largeur, height: largeur * 0.72 }]}>
                <Text style={base.attenue}>Aucune photo</Text>
            </View>
        );
    }

    return (
        <View>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / largeur))}
            >
                {photos.map((photo) => (
                    <Image key={photo.photoUuid} source={{ uri: photo.url }} style={{ width: largeur, height: largeur * 0.72 }} accessibilityIgnoresInvertColors />
                ))}
            </ScrollView>
            {photos.length > 1 && (
                <Text style={styles.rang}>
                    {index + 1} / {photos.length}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    contenu: { padding: espaces.lg, gap: espaces.md },
    galerieVide: { backgroundColor: couleurs.vertPale, alignItems: 'center', justifyContent: 'center' },
    rang: { ...texte.mention, position: 'absolute', right: espaces.md, bottom: espaces.md, color: couleurs.blanc, backgroundColor: 'rgba(29,39,33,0.65)', borderRadius: rayons.sm, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    badge: { ...texte.mention, borderRadius: rayons.sm, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    badgeLocation: { backgroundColor: couleurs.alertePale, color: couleurs.alerte },
    badgeVente: { backgroundColor: couleurs.vertPale, color: couleurs.vertFonce },
    boutonCoeur: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    coeur: { fontSize: 26, lineHeight: 28, color: couleurs.gris },
    coeurPlein: { color: couleurs.danger },
    prix: { ...texte.chiffre, color: couleurs.vert },
    periode: { ...texte.secondaire, color: couleurs.gris },
    puces: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm },
    puce: { ...texte.libelle, color: couleurs.vertFonce, backgroundColor: couleurs.vertPale, borderRadius: rayons.sm, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden' }
});
