import { Redirect } from 'expo-router';

/**
 * L'application s'ouvre sur la recherche, avec ou sans compte. La session,
 * si elle existe dans le trousseau, se relit pendant que les onglets s'ouvrent.
 */
export default function Index() {
    return <Redirect href="/(tabs)" />;
}
