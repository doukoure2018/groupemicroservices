import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Propriete } from '@sira/core';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth/contexte';

/** Une page de résultats telle que la recherche la renvoie. */
interface PageBiens {
    proprietes: Propriete[];
    total: number;
    limit: number;
    offset: number;
    tri?: string;
}
interface CacheRecherche {
    pages: PageBiens[];
    pageParams: unknown[];
}

/**
 * Le cœur d'une annonce. Sans compte, la connexion s'ouvre et ramène ici : on
 * ne garde pas un favori « en attente », il serait perdu au premier incident.
 * Avec compte, le cœur suit le doigt et le serveur ne fait que confirmer.
 */
export function useFavori(retour: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const bascule = useMutation({
        mutationFn: async ({ uuid, favori }: { uuid: string; favori: boolean }) =>
            favori ? api.immo.clientSide.removeFavori(uuid) : api.immo.clientSide.addFavori(uuid),
        onMutate: ({ uuid, favori }) => {
            const marquer = (liste: Propriete[]) => liste.map((p) => (p.proprieteUuid === uuid ? { ...p, isFavorite: !favori } : p));
            // Toutes les listes de résultats affichant ce bien changent d'un coup.
            queryClient.setQueriesData<CacheRecherche>({ queryKey: ['biens'] }, (ancien) =>
                ancien ? { ...ancien, pages: ancien.pages.map((page) => ({ ...page, proprietes: marquer(page.proprietes) })) } : ancien
            );
            queryClient.setQueryData<Propriete[]>(['favoris'], (ancien) => (ancien ? ancien.filter((p) => p.proprieteUuid !== uuid || !favori) : ancien));
            queryClient.setQueryData<{ propriete: Propriete }>(['bien', uuid], (ancien) =>
                ancien ? { propriete: { ...ancien.propriete, isFavorite: !favori } } : ancien
            );
        },
        onError: () => {
            // Le serveur refuse par exemple qu'on mette sa propre annonce de côté.
            // Le cœur revient à sa place par l'invalidation ; reste à dire pourquoi.
            Alert.alert('Favori impossible', "Cette annonce n'a pas pu être mise de côté. C'est le cas, entre autres, d'une annonce que vous avez publiée vous-même.");
        },
        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ['biens'] });
            void queryClient.invalidateQueries({ queryKey: ['favoris'] });
        }
    });

    return {
        connecte: !!user,
        basculer: (uuid: string, favori: boolean) => {
            if (!user) {
                router.push({ pathname: '/connexion', params: { suite: retour } });
                return;
            }
            bascule.mutate({ uuid, favori });
        }
    };
}
