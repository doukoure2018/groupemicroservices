import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import 'primereact/resources/themes/lara-light-green/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './styles.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            retry: 1
        }
    }
});

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PrimeReactProvider>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </PrimeReactProvider>
    </StrictMode>
);
