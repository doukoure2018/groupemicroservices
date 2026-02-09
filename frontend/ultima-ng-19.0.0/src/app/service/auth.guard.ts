import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from './user.service';

export const AuthGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const userService = inject(UserService);

    if (userService.isAuthenticated() && !userService.isTokenExpired()) {
        // User is authenticated and token is valid
        return true;
    }

    // User is not authenticated or token expired
    // Redirect to the root path (which will show the home component)
    router.navigate(['']);
    return false;
};
