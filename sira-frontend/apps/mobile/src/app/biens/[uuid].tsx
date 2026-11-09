import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Le site nomme la fiche d'un bien `/biens/{uuid}` ; l'application `/bien/{uuid}`.
 * Les liens des courriels, des SMS et des notifications portent l'adresse du
 * site : quand Android les confie à l'application, on arrive ici, et on passe
 * la main à la fiche.
 */
export default function RedirectionBien() {
    const { uuid } = useLocalSearchParams<{ uuid: string }>();
    return <Redirect href={{ pathname: '/bien/[uuid]', params: { uuid } }} />;
}
