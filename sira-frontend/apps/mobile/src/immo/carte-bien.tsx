import { formatMontant, libellePeriode, resumeBien, type Propriete } from '@sira/core';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { couleurs, espaces, rayons, texte } from '../ui/theme';

/**
 * Un bien dans une liste : la photo, ce qu'il est, ce qu'il coûte, où il est.
 * Le cœur se touche sans ouvrir la fiche ; tout le reste y mène.
 */
export function CarteBien({ bien, onFavori }: { bien: Propriete; onFavori: (uuid: string, favori: boolean) => void }) {
    const photo = bien.photoCouverture?.urlThumbnail ?? bien.photoCouverture?.url ?? bien.photos?.[0]?.urlThumbnail ?? bien.photos?.[0]?.url;
    const location = bien.typeAnnonce === 'LOCATION';
    const periode = libellePeriode(bien.periode);
    const resume = resumeBien(bien);
    const favori = bien.isFavorite === true;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${bien.titre}, ${bien.prixSurDemande ? 'prix sur demande' : formatMontant(bien.prix, bien.devise)}`}
            onPress={() => router.push({ pathname: '/bien/[uuid]', params: { uuid: bien.proprieteUuid } })}
            style={({ pressed }) => [styles.carte, pressed && { opacity: 0.9 }]}
        >
            <View>
                {photo ? (
                    <Image source={{ uri: photo }} style={styles.photo} accessibilityIgnoresInvertColors />
                ) : (
                    <View style={[styles.photo, styles.photoVide]}>
                        <Text style={styles.photoVideTexte}>Pas de photo</Text>
                    </View>
                )}
                {bien.photos?.length > 1 && <Text style={styles.compteur}>{bien.photos.length} photos</Text>}
            </View>

            <View style={styles.corps}>
                <View style={styles.entete}>
                    <Text style={[styles.badge, location ? styles.badgeLocation : styles.badgeVente]}>{location ? 'Location' : 'Vente'}</Text>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        accessibilityState={{ selected: favori }}
                        hitSlop={10}
                        onPress={() => onFavori(bien.proprieteUuid, favori)}
                    >
                        <Text style={[styles.coeur, favori && styles.coeurPlein]}>{favori ? '♥' : '♡'}</Text>
                    </Pressable>
                </View>
                <Text style={styles.titre} numberOfLines={2}>
                    {bien.titre}
                </Text>
                {!!resume && <Text style={styles.resume}>{resume}</Text>}
                <Text style={styles.prix}>
                    {bien.prixSurDemande ? 'Prix sur demande' : formatMontant(bien.prix, bien.devise)}
                    {periode && !bien.prixSurDemande ? <Text style={styles.periode}> {periode}</Text> : null}
                </Text>
                {!!bien.adresseComplete && (
                    <Text style={styles.adresse} numberOfLines={1}>
                        {bien.adresseComplete}
                    </Text>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    carte: { flexDirection: 'row', gap: espaces.md, backgroundColor: couleurs.blanc, borderRadius: rayons.lg, borderWidth: 1, borderColor: couleurs.ligne, padding: espaces.md },
    photo: { width: 112, height: 112, borderRadius: rayons.md, backgroundColor: couleurs.vertPale },
    photoVide: { alignItems: 'center', justifyContent: 'center', padding: espaces.sm },
    photoVideTexte: { ...texte.mention, color: couleurs.gris, textAlign: 'center' },
    compteur: { ...texte.mention, position: 'absolute', left: 6, bottom: 6, color: couleurs.blanc, backgroundColor: 'rgba(29,39,33,0.65)', borderRadius: rayons.sm, paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden' },
    corps: { flex: 1, gap: 2 },
    entete: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: espaces.sm },
    badge: { ...texte.mention, borderRadius: rayons.sm, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    badgeLocation: { backgroundColor: couleurs.alertePale, color: couleurs.alerte },
    badgeVente: { backgroundColor: couleurs.vertPale, color: couleurs.vertFonce },
    coeur: { fontSize: 22, lineHeight: 24, color: couleurs.gris },
    coeurPlein: { color: couleurs.danger },
    titre: { ...texte.appuye, color: couleurs.encre },
    resume: { ...texte.secondaire, color: couleurs.gris },
    prix: { ...texte.prix, color: couleurs.vert, marginTop: 2 },
    periode: { ...texte.mention, fontWeight: '400', color: couleurs.gris },
    adresse: { ...texte.mention, color: couleurs.gris }
});
