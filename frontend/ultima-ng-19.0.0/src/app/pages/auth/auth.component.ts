import { Topbar } from '@/pages/landing/components/topbar';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-auth',
    imports: [RouterOutlet, Topbar],
    templateUrl: './auth.component.html'
})
export class AuthComponent {}
