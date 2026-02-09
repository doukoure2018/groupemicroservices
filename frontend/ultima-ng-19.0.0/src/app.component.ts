import { UserService } from '@/service/user.service';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent {
    private router = inject(Router);
    private userService = inject(UserService);

    ngOnInit() {
        // Handle routing for authenticated users
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            // If user is authenticated and trying to access auth pages or root, redirect to dashboard
            if (this.userService.isAuthenticated() && !this.userService.isTokenExpired()) {
                const currentUrl = this.router.url.split('?')[0]; // Remove query params

                // If user is on the root path, redirect to dashboard
                if (currentUrl === '/') {
                    this.router.navigate(['/dashboards']);
                }
            }
        });
    }
}
