import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./auth.component').then((c) => c.AuthComponent),
        children: [
            { path: 'error', loadComponent: () => import('./error').then((c) => c.Error) },
            { path: 'error2', loadComponent: () => import('./error2').then((c) => c.Error2) },
            { path: 'access', loadComponent: () => import('./accessdenied').then((c) => c.AccessDenied) },
            { path: 'access2', loadComponent: () => import('./accessdenied2').then((c) => c.AccessDenied2) },
            { path: 'login', loadComponent: () => import('./login').then((c) => c.Login) },
            { path: 'login2', loadComponent: () => import('./login2').then((c) => c.Login2) },
            { path: 'forgotpassword', loadComponent: () => import('./forgotpassword/forgotpassword.component').then((c) => c.ForgotpasswordComponent) },
            { path: 'register', loadComponent: () => import('./register/register.component').then((c) => c.RegisterComponent) },
            { path: 'newpassword', loadComponent: () => import('./newpassword').then((c) => c.NewPassword) },
            { path: 'verify/account', loadComponent: () => import('./verifyaccount/verifyaccount.component').then((c) => c.VerifyaccountComponent) },
            { path: 'verify/password', loadComponent: () => import('./verifypassword/verifypassword.component').then((c) => c.VerifypasswordComponent) },
            { path: 'lockscreen', loadComponent: () => import('./lockscreen').then((c) => c.LockScreen) },
            { path: '**', redirectTo: '/notfound' }
        ]
    }
] as Routes;
