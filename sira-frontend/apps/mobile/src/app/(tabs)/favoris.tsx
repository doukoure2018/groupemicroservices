import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, RefreshControl } from 'react-native';
import { api } from '../../api';
import { ExigerSession } from '../../auth/exiger-session';
import { CarteBien } from '../../immo/carte-bien';
import { useFavori } from '../../immo/favoris';
import { Bouton, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces } from '../../ui/theme';

/** Les biens mis de côté. La liste vient du serveur : elle suit le compte, pas le téléphone. */
function FavorisEcran() {
    const favori = useFavori('/favoris');
    const liste = useQuery({
        queryKey: ['favoris'],
        queryFn: async () => (await api.immo.clientSide.favoris({ limit: 50 })).data.proprietes ?? []
    });

    if (liste.isPending) return <Chargement texte="Chargement de vos favoris…" />;
    if (liste.isError) {
        return <EtatVide titre="Chargement impossible" texte="Vérifiez votre réseau puis réessayez." action={<Bouton libelle="Réessayer" onPress={() => void liste.refetch()} />} />;
    }

    return (
        <FlatList
            style={base.ecran}
            contentContainerStyle={{ padding: espaces.lg, gap: espaces.md }}
            data={liste.data}
            keyExtractor={(b) => b.proprieteUuid}
            refreshControl={<RefreshControl refreshing={liste.isFetching} onRefresh={() => void liste.refetch()} tintColor={couleurs.vert} />}
            ListEmptyComponent={
                <EtatVide
                    titre="Aucun favori"
                    texte="Touchez le cœur d'une annonce pour la garder ici, sur ce téléphone comme ailleurs."
                    action={<Bouton libelle="Chercher un bien" onPress={() => router.navigate('/(tabs)/biens')} />}
                />
            }
            renderItem={({ item }) => <CarteBien bien={{ ...item, isFavorite: true }} onFavori={favori.basculer} />}
        />
    );
}

/** Les favoris suivent le compte : sans session, la connexion s'ouvre et revient ici. */
export default function Ecran() {
    return (
        <ExigerSession>
            <FavorisEcran />
        </ExigerSession>
    );
}
