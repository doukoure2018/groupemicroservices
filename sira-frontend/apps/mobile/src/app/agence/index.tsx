import { ApiError } from '@sira/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { STATUTS_AGENCE, type AgenceOnboarding, type AgenceOnboardingRequest, type Commune, type Region } from '@sira/core';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { ExigerAgence } from '../../auth/exiger-agence';
import { messageErreur } from '../../immo/feuilles-relation';
import { Bandeau, Bouton, Carte, ChampChoix, Chargement, styles as base } from '../../ui/base';
import { FeuilleBasse } from '../../ui/feuille';
import { ChampSaisie, Option } from '../../ui/formulaire';
import { couleurs, espaces, rayons, texte, zoomMax } from '../../ui/theme';

/** Le serveur accepte dix mégaoctets ; au-delà, inutile d'essayer. */
const TAILLE_MAX_OCTETS = 10 * 1024 * 1024;

const VIDE: Formulaire = { nom: '', raisonSociale: '', numeroRegistre: '', adresse: '', email: '', telephone: '', telephoneWhatsapp: '', description: '' };
interface Formulaire {
    nom: string;
    raisonSociale: string;
    numeroRegistre: string;
    adresse: string;
    email: string;
    telephone: string;
    telephoneWhatsapp: string;
    description: string;
}

/**
 * Le dossier de l'agence, le même que sur le site : les informations, le
 * document RCCM photographié depuis le téléphone, puis la soumission à la
 * conformité. Pendant l'examen et une fois vérifiée, le dossier se lit mais
 * ne se modifie plus ; le serveur le refuserait de toute façon.
 */
function MonAgenceEcran() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<Formulaire>(VIDE);
    const [region, setRegion] = useState<Region | null>(null);
    const [commune, setCommune] = useState<Commune | null>(null);
    const [feuille, setFeuille] = useState<'region' | 'commune' | null>(null);
    const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null);
    const [envoi, setEnvoi] = useState(false);

    const agence = useQuery({
        queryKey: ['agence-onboarding'],
        queryFn: async () => {
            try {
                return (await api.immo.agences.onboardingMe()).data.agence ?? null;
            } catch (e) {
                if (e instanceof ApiError && e.status === 404) return null;
                throw e;
            }
        }
    });
    const regions = useQuery({ queryKey: ['regions'], queryFn: async () => (await api.geo.regions()).data.regions ?? [] });
    const communes = useQuery({ queryKey: ['communes'], queryFn: async () => (await api.geo.communes()).data.communes ?? [] });

    // Le formulaire part de ce que le serveur connaît déjà.
    useEffect(() => {
        const a = agence.data;
        if (!a) return;
        setForm({
            nom: a.nom ?? '',
            raisonSociale: a.raisonSociale ?? '',
            numeroRegistre: a.numeroRegistre ?? '',
            adresse: a.adresse ?? '',
            email: a.email ?? '',
            telephone: a.telephone ?? '',
            telephoneWhatsapp: a.telephoneWhatsapp ?? '',
            description: a.description ?? ''
        });
    }, [agence.data]);
    useEffect(() => {
        const a = agence.data;
        if (!a) return;
        if (a.regionId && regions.data) setRegion(regions.data.find((r) => r.regionId === a.regionId) ?? null);
        if (a.communeId && communes.data) setCommune(communes.data.find((c) => c.communeId === a.communeId) ?? null);
    }, [agence.data, regions.data, communes.data]);

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: ['agence-onboarding'] });
    const enregistrer = useMutation({
        mutationFn: async () => {
            const corps: AgenceOnboardingRequest = {
                nom: form.nom.trim(),
                raisonSociale: form.raisonSociale.trim() || undefined,
                numeroRegistre: form.numeroRegistre.trim(),
                adresse: form.adresse.trim(),
                communeId: commune!.communeId,
                regionId: region!.regionId,
                email: form.email.trim(),
                telephone: form.telephone.trim(),
                telephoneWhatsapp: form.telephoneWhatsapp.trim() || undefined,
                description: form.description.trim() || undefined
            };
            return (await api.immo.agences.onboardingUpdate(corps)).data.agence;
        },
        onSuccess: () => {
            rafraichir();
            setMessage({ type: 'succes', texte: 'Informations enregistrées.' });
        },
        onError: (e) => setMessage({ type: 'erreur', texte: messageErreur(e, "L'enregistrement a échoué. Vérifiez votre réseau puis réessayez.") })
    });
    const soumettre = useMutation({
        mutationFn: async () => (await api.immo.agences.onboardingSoumettre()).data.agence,
        onSuccess: () => {
            rafraichir();
            setMessage({ type: 'succes', texte: 'Dossier soumis. La conformité SYNERGIA l’examine et vous prévient par courriel.' });
        },
        onError: (e) => setMessage({ type: 'erreur', texte: messageErreur(e, "La soumission a échoué. Vérifiez votre réseau puis réessayez.") })
    });

    async function envoyerRccm(depuis: 'galerie' | 'appareil') {
        setMessage(null);
        const permission = depuis === 'galerie' ? await ImagePicker.requestMediaLibraryPermissionsAsync() : await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            setMessage({ type: 'erreur', texte: depuis === 'galerie' ? "Sans accès à vos photos, le document ne peut pas être envoyé." : "Sans accès à l'appareil photo, le document ne peut pas être photographié." });
            return;
        }
        const resultat = depuis === 'galerie' ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }) : await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (resultat.canceled || !resultat.assets[0]) return;
        const f = resultat.assets[0];
        if (f.fileSize && f.fileSize > TAILLE_MAX_OCTETS) {
            setMessage({ type: 'erreur', texte: 'Le fichier dépasse dix mégaoctets. Reprenez la photo en plus petit.' });
            return;
        }
        const corps = new FormData();
        corps.append('file', { uri: f.uri, name: f.fileName ?? 'rccm.jpg', type: f.mimeType ?? 'image/jpeg' } as unknown as Blob);
        setEnvoi(true);
        try {
            await api.immo.agences.onboardingUploadRccm(corps);
            rafraichir();
            setMessage({ type: 'succes', texte: 'Document RCCM envoyé.' });
        } catch (e) {
            setMessage({ type: 'erreur', texte: messageErreur(e, "Le document n'a pas pu être envoyé. Vérifiez votre réseau puis réessayez.") });
        } finally {
            setEnvoi(false);
        }
    }

    if (agence.isPending) return <Chargement texte="Chargement du dossier…" />;

    const a: AgenceOnboarding | null = agence.data ?? null;
    const statut = (a?.statutVerification as string | undefined) ?? 'PROFIL_INCOMPLET';
    const libelleStatut = STATUTS_AGENCE.find((s) => s.value === statut)?.label ?? statut;
    const verrouille = statut === 'EN_VALIDATION' || statut === 'VERIFIE';
    const formulaireValide = form.nom.trim() && form.numeroRegistre.trim() && form.adresse.trim() && form.email.trim() && form.telephone.trim().length >= 8 && !!region && !!commune;

    const manquants: string[] = [];
    if (!a) manquants.push("enregistrez d'abord les informations de l'agence");
    else {
        if (!a.numeroRegistre) manquants.push('le RCCM ou le NIF');
        if (!a.adresse) manquants.push("l'adresse");
        if (!a.communeId) manquants.push('la commune');
        if (!a.regionId) manquants.push('la région');
        if (!a.email) manquants.push("l'email professionnel");
        if (!a.telephone) manquants.push('le téléphone');
        if (!a.documentsKycUrl) manquants.push('le document RCCM');
    }
    const peutSoumettre = manquants.length === 0 && !verrouille;

    return (
        <>
            <ScrollView style={base.ecran} contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <Carte style={{ gap: espaces.xs }}>
                    <Text style={[styles.statut, statut === 'VERIFIE' ? styles.statutVert : statut === 'REJETE' ? styles.statutRouge : styles.statutGris]}>{libelleStatut}</Text>
                    <Text maxFontSizeMultiplier={zoomMax} style={base.titre}>
                        {a?.nom?.trim() || 'Votre agence'}
                    </Text>
                    <Text style={base.sousTitre}>
                        {statut === 'VERIFIE'
                            ? 'Agence vérifiée : vos annonces sont publiées sans relecture et vous voyez les demandes clients de votre zone.'
                            : statut === 'EN_VALIDATION'
                              ? "Dossier en cours d'examen par la conformité. Il ne se modifie plus en attendant la décision."
                              : statut === 'REJETE'
                                ? `Dossier refusé${a?.motifRejet ? ` : ${a.motifRejet}` : ''}. Corrigez puis soumettez-le de nouveau.`
                                : 'Renseignez le dossier, envoyez le document RCCM, puis soumettez-le à la conformité.'}
                    </Text>
                </Carte>

                <Carte style={{ gap: espaces.sm }}>
                    <Text style={base.sectionTitre}>L'agence</Text>
                    <ChampSaisie libelle="Nom de l'agence" valeur={form.nom} onChange={(v) => setForm({ ...form, nom: v })} attendu="Tel qu'il apparaît aux clients" longueurMax={150} />
                    <ChampSaisie libelle="Raison sociale" valeur={form.raisonSociale} onChange={(v) => setForm({ ...form, raisonSociale: v })} attendu="Facultatif" longueurMax={200} />
                    <ChampSaisie libelle="RCCM ou NIF" valeur={form.numeroRegistre} onChange={(v) => setForm({ ...form, numeroRegistre: v })} attendu="Numéro du registre" longueurMax={50} />
                    <ChampChoix libelle="Région" valeur={region?.libelle} vide="Choisir" onPress={() => !verrouille && setFeuille('region')} />
                    <ChampChoix libelle="Commune" valeur={commune ? `${commune.libelle} (${commune.villeLibelle})` : undefined} vide={region ? 'Choisir' : "D'abord la région"} onPress={() => !verrouille && region && setFeuille('commune')} />
                    <ChampSaisie libelle="Adresse" valeur={form.adresse} onChange={(v) => setForm({ ...form, adresse: v })} attendu="Quartier, rue, repère" longueurMax={300} />
                    <ChampSaisie libelle="Email professionnel" valeur={form.email} onChange={(v) => setForm({ ...form, email: v })} attendu="contact@agence.gn" longueurMax={150} />
                    <ChampSaisie libelle="Téléphone" valeur={form.telephone} onChange={(v) => setForm({ ...form, telephone: v })} attendu="+224 6XX XX XX XX" clavier="telephone" longueurMax={20} />
                    <ChampSaisie libelle="WhatsApp" valeur={form.telephoneWhatsapp} onChange={(v) => setForm({ ...form, telephoneWhatsapp: v })} attendu="Facultatif" clavier="telephone" longueurMax={20} />
                    <ChampSaisie libelle="Présentation" valeur={form.description} onChange={(v) => setForm({ ...form, description: v })} attendu="Facultatif. Vos quartiers, vos spécialités…" multiligne longueurMax={2000} />
                    {!verrouille && <Bouton libelle="Enregistrer" onPress={() => enregistrer.mutate()} desactive={!formulaireValide} enCours={enregistrer.isPending} />}
                </Carte>

                <Carte style={{ gap: espaces.sm }}>
                    <Text style={base.sectionTitre}>Document RCCM</Text>
                    {a?.documentsKycUrl ? <Bandeau type="succes">Document envoyé.</Bandeau> : <Text style={base.attenue}>Une photo nette du registre suffit. Dix mégaoctets au plus ; pour un PDF, passez par le site.</Text>}
                    {!verrouille && (
                        <View style={styles.rangee}>
                            <Bouton libelle="Photographier" variante="secondaire" onPress={() => void envoyerRccm('appareil')} desactive={!a || envoi} enCours={envoi} style={{ flex: 1 }} />
                            <Bouton libelle="Choisir une image" variante="secondaire" onPress={() => void envoyerRccm('galerie')} desactive={!a || envoi} style={{ flex: 1 }} />
                        </View>
                    )}
                    {!a && !verrouille && <Text style={base.attenue}>Enregistrez d'abord les informations de l'agence.</Text>}
                </Carte>

                {message && <Bandeau type={message.type}>{message.texte}</Bandeau>}
                {!verrouille && manquants.length > 0 && <Bandeau type="alerte">Pour soumettre, il manque {manquants.join(', ')}.</Bandeau>}
                {!verrouille && <Bouton libelle="Soumettre à la conformité" onPress={() => soumettre.mutate()} desactive={!peutSoumettre} enCours={soumettre.isPending} />}
                {statut === 'VERIFIE' && <Bouton libelle="Voir les demandes clients" onPress={() => router.push('/agence/demandes')} />}
            </ScrollView>

            <FeuilleBasse visible={feuille === 'region'} titre="Région" onFermer={() => setFeuille(null)}>
                {regions.isPending && <Text style={base.attenue}>Chargement…</Text>}
                {(regions.data ?? []).map((r) => (
                    <Option key={r.regionUuid} libelle={r.libelle} actif={region?.regionUuid === r.regionUuid} onPress={() => { setRegion(r); if (commune && commune.regionUuid !== r.regionUuid) setCommune(null); setFeuille(null); }} />
                ))}
            </FeuilleBasse>
            <FeuilleBasse visible={feuille === 'commune'} titre="Commune" onFermer={() => setFeuille(null)}>
                {communes.isPending && <Text style={base.attenue}>Chargement…</Text>}
                {(communes.data ?? []).filter((c) => !region || c.regionUuid === region.regionUuid).map((c) => (
                    <Option key={c.communeUuid} libelle={`${c.libelle} · ${c.villeLibelle}`} actif={commune?.communeUuid === c.communeUuid} onPress={() => { setCommune(c); setFeuille(null); }} />
                ))}
            </FeuilleBasse>
        </>
    );
}

export default function Ecran() {
    return (
        <ExigerAgence>
            <MonAgenceEcran />
        </ExigerAgence>
    );
}

const styles = StyleSheet.create({
    statut: { ...texte.mention, alignSelf: 'flex-start', borderRadius: rayons.sm, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
    statutVert: { backgroundColor: couleurs.vertPale, color: couleurs.vertFonce },
    statutGris: { backgroundColor: couleurs.fond, color: couleurs.gris },
    statutRouge: { backgroundColor: couleurs.dangerPale, color: couleurs.danger },
    rangee: { flexDirection: 'row', gap: espaces.sm }
});
