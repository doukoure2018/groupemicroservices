import { AppConfigurator } from '@/layout/components/app.configurator';
import { UserService } from '@/service/user.service';
import { getFormData } from '@/utils/fileutils';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-forgotpassword',
    imports: [InputText, ButtonModule, RippleModule, RouterModule, InputGroup, InputGroupAddon, AppConfigurator, FormsModule, MessageModule, ToastModule],
    templateUrl: './forgotpassword.component.html',
    providers: [MessageService]
})
export class ForgotpasswordComponent {
    state = signal<{ loading: boolean; message: string | undefined; error: string | any }>({
        loading: false,
        message: undefined,
        error: undefined
    });

    private router = inject(Router);
    private destroyRef = inject(DestroyRef);
    private userService = inject(UserService);

    private messageService = inject(MessageService);

    ngOnInit(): void {}

    closeMessage = () => this.state.set({ loading: false, message: undefined, error: undefined });

    resetPassword = (form: NgForm) => {
        this.state.set({ loading: true, message: undefined, error: undefined });
        console.log('form', form.value.email);
        this.userService
            .resetPassword$(getFormData(form.value, []))
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

    backToLogin() {
        this.router.navigate(['/auth/login']);
    }
}
