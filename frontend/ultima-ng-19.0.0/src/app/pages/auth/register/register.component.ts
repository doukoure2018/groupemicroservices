import { AppConfigurator } from '@/layout/components/app.configurator';
import { StorageService } from '@/service/storage.service';
import { UserService } from '@/service/user.service';

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Ripple } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-register',
    imports: [ButtonModule, RouterModule, FormsModule, InputText, Ripple, AppConfigurator, InputGroupModule, InputGroupAddonModule, InputNumberModule, MessageModule, ToastModule],
    templateUrl: './register.component.html',
    providers: [MessageService]
})
export class RegisterComponent {
    state = signal<{ loading: boolean; message: string | undefined; error: string | any }>({
        loading: false,
        message: undefined,
        error: undefined
    });

    private router = inject(Router);
    private destroyRef = inject(DestroyRef);
    private storage = inject(StorageService);
    private userService = inject(UserService);
    private messageService = inject(MessageService);

    value1: string = '';

    value2: string = '';

    ngOnInit(): void {
        console.log(this.storage.getRedirectUrl());
        if (this.userService.isAuthenticated() && !this.userService.isTokenExpired()) {
            this.storage.getRedirectUrl() ? this.router.navigate([this.storage.getRedirectUrl()]) : this.router.navigate([['/dashboard']]);
            return;
        }
    }

    closeMessage = () => this.state.set({ loading: false, message: undefined, error: undefined });

    register = (form: NgForm) => {
        this.state.set({ loading: true, message: undefined, error: undefined });
        console.log('form', form.value);
        this.userService
            .register$(form.value)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.state.set({ loading: false, message: response.message, error: undefined });

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: response.message
                    });
                },
                error: (error) => {
                    this.state.set({ loading: false, message: undefined, error });
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error
                    });
                },
                complete: () => form.reset()
            });
    };

    displayToast = this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'this is an error message'
    });

    backToLogin() {
        this.router.navigate(['/auth/login']);
    }
}
