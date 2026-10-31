import { AuthHttpError } from '@sira/auth';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/contexte';
import { config } from '../config';
import { Bandeau, Bouton, Champ, styles as base } from '../ui/base';
import { couleurs, espaces } from '../ui/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Connexion() {
    const { login } = useAuth();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [enCours, setEnCours] = useState(false);
    const [erreur, setErreur] = useState<string | null>(null);

    const valide = EMAIL_RE.test(email.trim()) && motDePasse.length >= 8;

    async function soumettre() {
        setErreur(null);
        setEnCours(true);
        try {
            await login(email.trim(), motDePasse);
            router.replace('/(tabs)');
        } catch (e) {
            // 401 ou 403 : identifiants refusés ou compte non activé. Le reste
            // est un problème de réseau, qu'il ne faut pas faire passer pour une
            // erreur de mot de passe.
            if (e instanceof AuthHttpError) {
                // Le serveur dit déjà en français pourquoi il refuse (compte non
                // activé, verrouillé, identifiants) : autant le laisser parler.
                setErreur(e.serverMessage || (e.status === 403 ? 'Compte non activé ou verrouillé.' : 'Email ou mot de passe incorrect.'));
            } else {
                setErreur('Connexion impossible pour le moment. Vérifiez votre réseau puis réessayez.');
            }
        } finally {
            setEnCours(false);
        }
    }

    return (
        <KeyboardAvoidingView style={base.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={[styles.page, { paddingTop: insets.top + espaces.xxl }]} keyboardShouldPersistTaps="handled">
                <View style={styles.entete}>
                    <Text style={styles.marque}>SYNERGIA</Text>
                    <Text style={styles.devise}>IMMO · TRANS · GUINÉE</Text>
                    {config.nom === 'test' && <Text style={styles.badgeTest}>Environnement de test</Text>}
                </View>

                <View style={styles.carte}>
                    <Text style={base.titre}>Connexion</Text>
                    <Text style={[base.sousTitre, { marginBottom: espaces.lg }]}>Retrouvez vos réservations et vos billets.</Text>

                    <Champ
                        libelle="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        placeholder="nom@email.com"
                    />
                    <Champ
                        libelle="Mot de passe"
                        value={motDePasse}
                        onChangeText={setMotDePasse}
                        secureTextEntry
                        autoComplete="password"
                        textContentType="password"
                        placeholder="au moins 8 caractères"
                        onSubmitEditing={() => valide && void soumettre()}
                    />

                    {erreur && <Bandeau type="erreur">{erreur}</Bandeau>}

                    <Bouton libelle="Se connecter" onPress={() => void soumettre()} desactive={!valide} enCours={enCours} style={{ marginTop: espaces.lg }} />

                    <Text style={styles.pied}>
                        Pas encore de compte ? L'inscription se fait sur {config.siteWeb.replace('https://', '')}, puis vous vous connectez ici.
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    page: { flexGrow: 1, padding: espaces.lg, backgroundColor: couleurs.vert },
    entete: { alignItems: 'center', marginBottom: espaces.xl },
    marque: { color: couleurs.blanc, fontSize: 32, fontWeight: '800', letterSpacing: 2 },
    devise: { color: '#cfe3d6', letterSpacing: 3, fontSize: 12, marginTop: espaces.xs },
    badgeTest: { marginTop: espaces.md, color: couleurs.vertFonce, backgroundColor: couleurs.or, paddingHorizontal: espaces.md, paddingVertical: 4, borderRadius: 999, fontWeight: '700', fontSize: 12 },
    carte: { backgroundColor: couleurs.blanc, borderRadius: 20, padding: espaces.xl },
    pied: { color: couleurs.gris, marginTop: espaces.xl, lineHeight: 20, textAlign: 'center' }
});
