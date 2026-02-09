import { Routes } from '@angular/router';
import { AppLayout } from '@/layout/components/app.layout';
import { AuthGuard } from '@/service/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('@/pages/home/home.component').then((c) => c.HomeComponent)
    },
    {
        path: '',
        component: AppLayout,
        canActivate: [AuthGuard], // Add AuthGuard to protect these routes
        children: [
            {
                path: '',
                redirectTo: '/dashboards',
                pathMatch: 'full'
            },
            {
                path: 'dashboards',
                data: { breadcrumb: 'Dashboard' },
                loadChildren: () => import('@/pages/dashboard/dashboard.routes')
            },
            {
                path: 'uikit',
                data: { breadcrumb: 'UI Kit' },
                loadChildren: () => import('@/pages/uikit/uikit.routes')
            },
            {
                path: 'documentation',
                data: { breadcrumb: 'Documentation' },
                loadComponent: () => import('@/pages/documentation/documentation').then((c) => c.Documentation)
            },
            {
                path: 'pages',
                data: { breadcrumb: 'Pages' },
                loadChildren: () => import('@/pages/pages.routes')
            },
            {
                path: 'apps',
                data: { breadcrumb: 'Apps' },
                loadChildren: () => import('./app/apps/apps.routes')
            },
            {
                path: 'ecommerce',
                data: { breadcrumb: 'E-Commerce' },
                loadChildren: () => import('@/pages/ecommerce/ecommerce.routes')
            },
            {
                path: 'blocks',
                data: { breadcrumb: 'Prime Blocks' },
                loadChildren: () => import('@/pages/blocks/blocks.routes')
            },
            {
                path: 'profile',
                data: { breadcrumb: 'User Management' },
                loadChildren: () => import('@/pages/usermanagement/usermanagement.routes')
            }
        ]
    },
    { path: '', loadComponent: () => import('@/pages/home/home.component').then((c) => c.HomeComponent) },
    { path: 'auth', loadChildren: () => import('@/pages/auth/auth.routes') },
    {
        path: 'landing',
        loadComponent: () => import('@/pages/landing/landing').then((c) => c.Landing)
    },
    {
        path: 'notfound',
        loadComponent: () => import('@/pages/notfound/notfound').then((c) => c.Notfound)
    },
    { path: '**', redirectTo: '/notfound' }
];
