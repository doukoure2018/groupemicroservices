import { ApiError } from '@sira/api-client';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { config } from '../config';
import { Bandeau, Bouton, Champ, EtatVide, styles as base } from '../ui/base';
import { couleurs, espaces } from '../ui/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Le serveur d'autorisation refuse en dessous, et l'adresse plafonne à 100 en base. */
const MDP_MIN = 8;
const ADRESSE_MAX = 100;

interface Formulaire {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
    motDePasse: string;
    confirmation: string;
}

const VIDE: Formulaire = { prenom: '', nom: '', email: '', telephone: '', adresse: '', motDePasse: '', confirmation: '' };

function erreurChamp(champ: keyof Formulaire, f: Formulaire): string | null {
    switch (champ) {
        case 'prenom':
            return f.prenom.trim() ? null : 'Le prénom est requis';
        case 'nom':
            return f.nom.trim() ? null : 'Le nom est requis';
        case 'email':
            if (!f.email.trim()) return "L'email est requis";
            return EMAIL_RE.test(f.email.trim()) ? null : "Format d'email invalide";
        case 'adresse':
            if (!f.adresse.trim()) return "L'adresse est requise";
            return f.adresse.trim().length <= ADRESSE_MAX ? null : `Adresse trop longue (${ADRESSE_MAX} caractères max)`;
        case 'motDePasse':
            if (!f.motDePasse) return 'Le mot de passe est requis';
            return f.motDePasse.length >= MDP_MIN ? null : `Mot de passe trop court (min. ${MDP_MIN} caractères)`;
        case 'confirmation':
            return f.confirmation === f.motDePasse ? null : 'Les deux mots de passe ne correspondent pas';
        default:
            return null;
    }
}

const CHAMPS: (keyof Formulaire)[] = ['prenom', 'nom', 'email', 'adresse', 'motDePasse', 'confirmation'];

/**
 * Inscription d'un particulier, par le serveur d'autorisation, le même chemin
 * que le web. Les agences immobilières s'inscrivent sur le site : leur dossier
 * de conformité et leur espace de travail n'existent que là.
 *
 * Le compte naît désactivé ; le courriel d'activation mène à une page du site
 * qui valide le compte. Tant que ce lien n'est pas suivi, la connexion est
 * refusée, et c'est le serveur qui le dit.
 */
export default function Inscription() {
    const [form, setForm] = useState<Formulaire>(VIDE);
    const [touche, setTouche] = useState<Partial<Record<keyof Formulaire, boolean>>>({});
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const valide = CHAMPS.every((c) => !erreurChamp(c, form));
    const maj = (champ: keyof Formulaire) => (valeur: string) => setForm((f) => ({ ...f, [champ]: valeur }));
    const toucher = (champ: keyof Formulaire) => () => setTouche((t) => ({ ...t, [champ]: true }));
    const msg = (champ: keyof Formulaire) => (touche[champ] ? erreurChamp(champ, form) : null);

    async function soumettre() {
        setErreur(null);
        setEnCours(true);
        try {
            const res = await api.users.registerParticulier({
                firstName: form.prenom.trim(),
                lastName: form.nom.trim(),
                email: form.email.trim(),
                address: form.adresse.trim(),
                phone: form.telephone.trim() || undefined,
                password: form.motDePasse
            });
            setMessage(res.message || 'Compte créé. Vérifiez votre email pour activer votre compte.');
        } catch (e) {
            // Le serveur sait dire pourquoi, par exemple une adresse déjà utilisée.
            setErreur(e instanceof ApiError ? e.message : "L'inscription a échoué. Vérifiez votre réseau puis réessayez.");
        } finally {
            setEnCours(false);
        }
    }

    if (message) {
        return (
            <View style={base.ecran}>
                <EtatVide
                    titre="Compte créé"
                    texte={`${message} Le lien d'activation ouvre une page du site, puis vous pourrez vous connecter ici avec votre email et votre mot de passe.`}
                    action={<Bouton libelle="Aller à la connexion" onPress={() => router.replace('/connexion')} />}
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={base.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <View>
                    <Text style={base.titre}>Créer un compte</Text>
                    <Text style={base.sousTitre}>Rejoignez SYNERGIA : voyages et immobilier en Guinée.</Text>
                </View>

                <View style={styles.carte}>
                    <View style={styles.duo}>
                        <View style={{ flex: 1 }}>
                            <Champ libelle="Prénom *" value={form.prenom} onChangeText={maj('prenom')} onBlur={toucher('prenom')} erreur={msg('prenom')} autoCapitalize="words" placeholder="Ex. : Amadou" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Champ libelle="Nom *" value={form.nom} onChangeText={maj('nom')} onBlur={toucher('nom')} erreur={msg('nom')} autoCapitalize="words" placeholder="Ex. : Diallo" />
                        </View>
                    </View>
                    <Champ
                        libelle="Email *"
                        value={form.email}
                        onChangeText={maj('email')}
                        onBlur={toucher('email')}
                        erreur={msg('email')}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        placeholder="nom@email.com"
                    />
                    <Champ libelle="Téléphone" value={form.telephone} onChangeText={maj('telephone')} keyboardType="phone-pad" autoComplete="tel" placeholder="+224 6XX XX XX XX" />
                    <Champ
                        libelle="Adresse *"
                        value={form.adresse}
                        onChangeText={maj('adresse')}
                        onBlur={toucher('adresse')}
                        erreur={msg('adresse')}
                        maxLength={ADRESSE_MAX}
                        autoComplete="street-address"
                        placeholder="Ex. : Kaloum, Conakry"
                    />
                    <Champ
                        libelle="Mot de passe *"
                        value={form.motDePasse}
                        onChangeText={maj('motDePasse')}
                        onBlur={toucher('motDePasse')}
                        erreur={msg('motDePasse')}
                        secureTextEntry
                        autoComplete="new-password"
                        textContentType="newPassword"
                        placeholder={`au moins ${MDP_MIN} caractères`}
                    />
                    <Champ
                        libelle="Confirmer le mot de passe *"
                        value={form.confirmation}
                        onChangeText={maj('confirmation')}
                        onBlur={toucher('confirmation')}
                        erreur={msg('confirmation')}
                        secureTextEntry
                        autoComplete="new-password"
                        textContentType="newPassword"
                        onSubmitEditing={() => valide && void soumettre()}
                    />

                    {erreur && <Bandeau type="erreur">{erreur}</Bandeau>}

                    <Bouton libelle="S'inscrire" onPress={() => void soumettre()} desactive={!valide} enCours={enCours} style={{ marginTop: espaces.md }} />
                </View>

                <Bandeau type="info">Vous représentez une agence immobilière ? L'inscription se fait sur {config.siteWeb.replace('https://', '')}, où vous complétez ensuite votre dossier.</Bandeau>

                <Bouton libelle="J'ai déjà un compte" variante="discret" onPress={() => router.replace('/connexion')} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    carte: { backgroundColor: couleurs.blanc, borderRadius: 20, padding: espaces.xl, borderWidth: 1, borderColor: couleurs.ligne },
    duo: { flexDirection: 'row', gap: espaces.md }
});
