import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../auth/contexte';
import { config } from '../../config';
import { Bouton, Carte, styles as base } from '../../ui/base';
import { espaces } from '../../ui/theme';

export default function Profil() {
    const { user, logout } = useAuth();
    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <View>
                <Text style={base.titre}>
                    {user?.firstName} {user?.lastName}
                </Text>
                <Text style={base.sousTitre}>{user?.email}</Text>
            </View>
            <Carte style={{ gap: espaces.sm }}>
                <Ligne libelle="Téléphone" valeur={user?.phone ?? 'Non renseigné'} />
                <Ligne libelle="Environnement" valeur={config.nom === 'prod' ? 'Production' : 'Test'} />
            </Carte>
            <Bouton
                libelle="Se déconnecter"
                variante="secondaire"
                onPress={() => {
                    void logout().then(() => router.replace('/connexion'));
                }}
            />
        </ScrollView>
    );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
    return (
        <View style={base.ligne}>
            <Text style={base.attenue}>{libelle}</Text>
            <Text style={base.gras}>{valeur}</Text>
        </View>
    );
}
