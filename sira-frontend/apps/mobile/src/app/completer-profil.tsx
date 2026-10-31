import { ApiError } from '@sira/api-client';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth/contexte';
import { Bandeau, Bouton, Carte, Champ, styles as base } from '../ui/base';
import { espaces } from '../ui/theme';

const ADRESSE_MAX = 100;

/**
 * Un compte créé par Google n'a ni téléphone ni adresse. L'adresse est
 * exigée pour tout compte, comme à l'inscription par email ; le téléphone
 * reste facultatif, les coordonnées des passagers étant saisies à chaque
 * réservation.
 */
export default function CompleterProfil() {
    const { user, rafraichirProfil, logout } = useAuth();
    const [telephone, setTelephone] = useState(user?.phone ?? '');
    const [adresse, setAdresse] = useState(user?.address ?? '');
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const adresseValide = adresse.trim().length > 0 && adresse.trim().length <= ADRESSE_MAX;

    async function enregistrer() {
        if (!user) return;
        setErreur(null);
        setEnCours(true);
        try {
            // Le serveur attend le profil entier : on renvoie l'identité telle
            // quelle et on ne change que ce qui manque.
            await api.users.updateProfile({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: telephone.trim() || undefined,
                address: adresse.trim()
            });
            await rafraichirProfil();
            router.replace('/(tabs)');
        } catch (e) {
            setErreur(e instanceof ApiError ? e.message : "L'enregistrement a échoué. Vérifiez votre réseau puis réessayez.");
        } finally {
            setEnCours(false);
        }
    }

    return (
        <KeyboardAvoidingView style={base.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <View>
                    <Text style={base.titre}>Bienvenue {user?.firstName}</Text>
                    <Text style={base.sousTitre}>Encore une étape : votre adresse, et un téléphone si vous le souhaitez.</Text>
                </View>
                <Carte>
                    <Champ
                        libelle="Adresse *"
                        value={adresse}
                        onChangeText={setAdresse}
                        maxLength={ADRESSE_MAX}
                        autoComplete="street-address"
                        placeholder="Ex. : Kaloum, Conakry"
                        erreur={adresse.length > 0 && !adresseValide ? `Adresse trop longue (${ADRESSE_MAX} caractères max)` : null}
                    />
                    <Champ libelle="Téléphone" value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" autoComplete="tel" placeholder="+224 6XX XX XX XX" />
                    {erreur && <Bandeau type="erreur">{erreur}</Bandeau>}
                    <Bouton libelle="Continuer" onPress={() => void enregistrer()} desactive={!adresseValide} enCours={enCours} style={{ marginTop: espaces.md }} />
                </Carte>
                <Bouton
                    libelle="Se déconnecter"
                    variante="discret"
                    onPress={() => {
                        void logout().then(() => router.replace('/connexion'));
                    }}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
