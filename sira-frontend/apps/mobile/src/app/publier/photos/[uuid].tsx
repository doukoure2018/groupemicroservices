import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { libelleStatutAnnonce, type Photo } from '@sira/core';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../../api';
import { ExigerSession } from '../../../auth/exiger-session';
import { messageErreur } from '../../../immo/feuilles-relation';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../../ui/base';
import { couleurs, espaces, rayons, texte, zoomMax } from '../../../ui/theme';

/** Le serveur en accepte douze par bien. */
const PHOTOS_MAX = 12;

/**
 * Les photos d'une annonce, puis sa publication. Une annonce peut se publier
 * sans photo, mais on le déconseille : c'est ce que les visiteurs regardent
 * en premier. L'écran sert aussi plus tard, pour compléter une annonce en
 * ligne.
 */
function PhotosEcran() {
    const { uuid } = useLocalSearchParams<{ uuid: string }>();
    const queryClient = useQueryClient();
    const [envoi, setEnvoi] = useState<{ fait: number; total: number } | null>(null);
    const [erreur, setErreur] = useState<string | null>(null);

    const bien = useQuery({ queryKey: ['bien', uuid], queryFn: async () => (await api.immo.proprietes.byUuid(uuid)).data.propriete, enabled: !!uuid });
    const photos = useQuery({ queryKey: ['photos', uuid], queryFn: async () => (await api.immo.proprietes.photos(uuid)).data.photos ?? [], enabled: !!uuid });

    const rafraichir = () => {
        void queryClient.invalidateQueries({ queryKey: ['photos', uuid] });
        void queryClient.invalidateQueries({ queryKey: ['bien', uuid] });
        void queryClient.invalidateQueries({ queryKey: ['mes-annonces'] });
    };

    async function envoyer(fichiers: { uri: string; nom?: string | null; type?: string | null }[]) {
        setErreur(null);
        const place = PHOTOS_MAX - (photos.data?.length ?? 0);
        const retenus = fichiers.slice(0, Math.max(0, place));
        if (retenus.length === 0) {
            setErreur(`Douze photos au plus par annonce.`);
            return;
        }
        setEnvoi({ fait: 0, total: retenus.length });
        for (let i = 0; i < retenus.length; i++) {
            const f = retenus[i]!;
            const corps = new FormData();
            // React Native envoie un fichier local sous cette forme ; le serveur lit le champ « file ».
            corps.append('file', { uri: f.uri, name: f.nom ?? `photo-${Date.now()}-${i}.jpg`, type: f.type ?? 'image/jpeg' } as unknown as Blob);
            try {
                await api.immo.proprietes.uploadPhoto(uuid, corps);
            } catch (e) {
                setErreur(messageErreur(e, `La photo ${i + 1} n'a pas pu être envoyée. Vérifiez votre réseau puis réessayez.`));
                break;
            }
            setEnvoi({ fait: i + 1, total: retenus.length });
        }
        setEnvoi(null);
        rafraichir();
    }

    async function choisirDansGalerie() {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setErreur("Sans accès à vos photos, l'application ne peut pas les envoyer. Vous pouvez l'autoriser dans les réglages du téléphone.");
            return;
        }
        const place = PHOTOS_MAX - (photos.data?.length ?? 0);
        const resultat = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: Math.max(1, place), quality: 0.7 });
        if (resultat.canceled) return;
        await envoyer(resultat.assets.map((a) => ({ uri: a.uri, nom: a.fileName, type: a.mimeType })));
    }

    async function prendreUnePhoto() {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            setErreur("Sans accès à l'appareil photo, impossible de photographier le bien. Vous pouvez l'autoriser dans les réglages du téléphone.");
            return;
        }
        const resultat = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (resultat.canceled) return;
        await envoyer(resultat.assets.map((a) => ({ uri: a.uri, nom: a.fileName, type: a.mimeType })));
    }

    const couverture = useMutation({ mutationFn: async (photoUuid: string) => api.immo.proprietes.definirCouverture(photoUuid), onSuccess: rafraichir, onError: (e) => setErreur(messageErreur(e, "La couverture n'a pas pu être changée.")) });
    const suppression = useMutation({ mutationFn: async (photoUuid: string) => api.immo.proprietes.supprimerPhoto(photoUuid), onSuccess: rafraichir, onError: (e) => setErreur(messageErreur(e, "La photo n'a pas pu être supprimée.")) });
    const publication = useMutation({
        mutationFn: async () => (await api.immo.proprietes.publier(uuid)).data.propriete,
        onSuccess: (p) => {
            rafraichir();
            const relue = p.statut === 'EN_ATTENTE_VALIDATION';
            Alert.alert(
                relue ? 'Annonce envoyée' : 'Annonce publiée',
                relue ? 'Une personne de SYNERGIA la relit avant de la rendre visible. Vous serez prévenu.' : 'Elle est visible dans la recherche dès maintenant.',
                [{ text: 'Mes annonces', onPress: () => router.replace('/mes-annonces') }]
            );
        },
        onError: (e) => setErreur(messageErreur(e, "La publication a échoué. Vérifiez votre réseau puis réessayez."))
    });

    function gestes(photo: Photo) {
        Alert.alert('Cette photo', undefined, [
            ...(photo.estCouverture ? [] : [{ text: 'En faire la couverture', onPress: () => couverture.mutate(photo.photoUuid) }]),
            { text: 'Supprimer', style: 'destructive' as const, onPress: () => suppression.mutate(photo.photoUuid) },
            { text: 'Annuler', style: 'cancel' as const }
        ]);
    }

    if (bien.isPending || photos.isPending) return <Chargement texte="Chargement de l'annonce…" />;
    if (bien.isError || !bien.data) return <EtatVide titre="Annonce introuvable" action={<Bouton libelle="Mes annonces" onPress={() => router.replace('/mes-annonces')} />} />;

    const p = bien.data;
    const liste = photos.data ?? [];
    const largeur = (Dimensions.get('window').width - espaces.lg * 2 - espaces.sm * 2) / 3;
    const publiable = p.statut === 'BROUILLON' || p.statut === 'RETIRE' || p.statut === 'EN_ATTENTE_VALIDATION';

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <View style={{ gap: espaces.xs }}>
                <Text style={base.attenue}>{libelleStatutAnnonce(p.statut)}</Text>
                <Text maxFontSizeMultiplier={zoomMax} style={base.titre}>
                    {p.titre}
                </Text>
            </View>

            <Carte style={{ gap: espaces.md }}>
                <Text style={base.sectionTitre}>
                    {liste.length} photo{liste.length > 1 ? 's' : ''} sur {PHOTOS_MAX}
                </Text>
                {liste.length > 0 ? (
                    <View style={styles.grille}>
                        {liste.map((photo) => (
                            <Pressable key={photo.photoUuid} accessibilityRole="button" accessibilityLabel={photo.estCouverture ? 'Photo de couverture' : 'Photo'} onPress={() => gestes(photo)} style={{ width: largeur, height: largeur }}>
                                <Image source={{ uri: photo.urlThumbnail || photo.url }} style={styles.vignette} accessibilityIgnoresInvertColors />
                                {photo.estCouverture && <Text style={styles.badgeCouverture}>Couverture</Text>}
                            </Pressable>
                        ))}
                    </View>
                ) : (
                    <Text style={base.sousTitre}>Une annonce avec photos reçoit bien plus de contacts. Quelques photos nettes, de jour, suffisent : la façade, le salon, une chambre, la cuisine.</Text>
                )}
                {envoi && <Bandeau type="info">Envoi de la photo {envoi.fait + 1} sur {envoi.total}…</Bandeau>}
                <View style={styles.rangee}>
                    <Bouton libelle="Choisir des photos" variante="secondaire" onPress={() => void choisirDansGalerie()} desactive={!!envoi || liste.length >= PHOTOS_MAX} style={{ flex: 1 }} />
                    <Bouton libelle="Prendre une photo" variante="secondaire" onPress={() => void prendreUnePhoto()} desactive={!!envoi || liste.length >= PHOTOS_MAX} style={{ flex: 1 }} />
                </View>
                {liste.length > 0 && <Text style={base.attenue}>Touchez une photo pour en faire la couverture ou la supprimer.</Text>}
            </Carte>

            {erreur && <Bandeau type="erreur">{erreur}</Bandeau>}

            {publiable ? (
                <>
                    <Bouton libelle={p.statut === 'EN_ATTENTE_VALIDATION' ? 'Terminer' : "Publier l'annonce"} onPress={() => (p.statut === 'EN_ATTENTE_VALIDATION' ? router.replace('/mes-annonces') : publication.mutate())} enCours={publication.isPending} desactive={!!envoi} />
                    <Bouton libelle="Plus tard" variante="discret" onPress={() => router.replace('/mes-annonces')} />
                </>
            ) : (
                <Bouton libelle="Terminer" onPress={() => router.replace('/mes-annonces')} />
            )}
        </ScrollView>
    );
}

export default function Ecran() {
    return (
        <ExigerSession>
            <PhotosEcran />
        </ExigerSession>
    );
}

const styles = StyleSheet.create({
    grille: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm },
    vignette: { width: '100%', height: '100%', borderRadius: rayons.md, backgroundColor: couleurs.vertPale },
    badgeCouverture: { ...texte.mention, position: 'absolute', left: 6, bottom: 6, color: couleurs.blanc, backgroundColor: 'rgba(29,39,33,0.7)', borderRadius: rayons.sm, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden' },
    rangee: { flexDirection: 'row', gap: espaces.sm }
});
