import { ApiError } from '@sira/api-client';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { Bandeau, Bouton, Carte, Champ, EtatVide, styles as base } from '../ui/base';
import { espaces } from '../ui/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Envoi du courriel de réinitialisation. Le lien qu'il contient ouvre une page
 * du site où se saisit le nouveau mot de passe ; l'application n'a ensuite
 * qu'à se reconnecter avec. Le serveur répond de la même façon que l'adresse
 * existe ou non, pour ne pas révéler quels comptes existent.
 */
export default function MotDePasseOublie() {
    const [email, setEmail] = useState('');
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const valide = EMAIL_RE.test(email.trim());

    async function soumettre() {
        setErreur(null);
        setEnCours(true);
        try {
            const res = await api.users.resetPassword(email.trim());
            setMessage(res.message || 'Si un compte existe pour cette adresse, un courriel de réinitialisation vient de partir.');
        } catch (e) {
            setErreur(e instanceof ApiError ? e.message : "L'envoi a échoué. Vérifiez votre réseau puis réessayez.");
        } finally {
            setEnCours(false);
        }
    }

    if (message) {
        return (
            <View style={base.ecran}>
                <EtatVide
                    titre="Courriel envoyé"
                    texte={`${message} Suivez le lien pour choisir un nouveau mot de passe, puis revenez vous connecter ici.`}
                    action={<Bouton libelle="Retour à la connexion" onPress={() => router.replace('/connexion')} />}
                />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={base.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <View>
                    <Text style={base.titre}>Mot de passe oublié</Text>
                    <Text style={base.sousTitre}>Indiquez l'email de votre compte. Vous recevrez un lien pour en choisir un nouveau.</Text>
                </View>
                <Carte>
                    <Champ
                        libelle="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        autoCorrect={false}
                        spellCheck={false}
                        textContentType="emailAddress"
                        placeholder="nom@email.com"
                        onSubmitEditing={() => valide && void soumettre()}
                    />
                    {erreur && <Bandeau type="erreur">{erreur}</Bandeau>}
                    <Bouton libelle="Envoyer le lien" onPress={() => void soumettre()} desactive={!valide} enCours={enCours} style={{ marginTop: espaces.md }} />
                </Carte>
                <Bouton libelle="Retour à la connexion" variante="discret" onPress={() => router.replace('/connexion')} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
