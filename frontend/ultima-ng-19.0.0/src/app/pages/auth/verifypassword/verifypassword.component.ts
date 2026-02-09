import { AppConfigurator } from '@/layout/components/app.configurator';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber, InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { Ripple } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { IResponse } from '@/interface/response';
import { UserService } from '@/service/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, EMPTY, Observer, delay } from 'rxjs';

@Component({
    selector: 'app-verifypassword',
    imports: [ButtonModule, RouterModule, FormsModule, AppConfigurator, ToastModule, MessageModule, ProgressBarModule, ProgressSpinnerModule, InputTextModule, InputGroupModule, InputGroupAddonModule, InputNumberModule],
    templateUrl: './verifypassword.component.html',
    providers: [MessageService]
})
export class VerifypasswordComponent {
    state = signal<{ success?: boolean; token?: string; mode: 'verify' | 'reset'; userUuid?: string; loading: boolean; message: string | undefined; error: string | any }>({
        mode: 'verify',
        success: false,
        loading: false,
        message: undefined,
        error: undefined
    });
    private destroyRef = inject(DestroyRef);
    private userService = inject(UserService);
    private messageService = inject(MessageService);
    private activatedRouter = inject(ActivatedRoute);

    ngOnInit(): void {
        console.log('Verification in action');
        this.activatedRouter.queryParamMap
            .pipe(
                switchMap((params: ParamMap) => {
                    const token = params.get('token');
                    if (token) {
                        this.state.set({ token, mode: 'verify', loading: true, message: undefined, error: undefined, success: false });
                        return this.userService.verifyPasswordToken$(token);
                    } else {
                        this.state.set({ mode: 'verify', success: false, loading: false, message: undefined, error: 'Invalide Link. Please try again' });
                        return EMPTY;
                    }
                }),
                //delay(5 * 3000),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(this.verifySubscriber);
    }

    closeMessage = () => this.state.update((state) => ({ ...state, message: undefined, error: undefined }));

    createNewPassword = (form: NgForm) => {
        console.log('form', form.value);
        this.userService
            .createNewPassword$(form.value)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.state.update((state) => ({ ...state, success: true, loading: false, message: response.message, error: undefined }));
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: response.message
                    });
                },
                error: (error) => {
                    this.state.update((state) => ({ ...state, success: false, loading: false, message: undefined, error: error }));
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error
                    });
                },
                complete: () => {}
            });
    };
    /**
     *  this will execute when the method verifyAccountToken$(token) has been executed
     */
    private verifySubscriber: Observer<any> = {
        next: (response: IResponse) => {
            this.state.update((state) => ({ ...state, loading: false, mode: 'reset', userUuid: response.data.user?.userUuid, message: `${response.message} for ${response.data.user?.email}`, error: undefined }));

            this.messageService.add({
                severity: 'success',
                summary: 'Verification Account',
                detail: 'Link has been verified'
            });
        },
        error: (error: string) => {
            this.state.set({ mode: 'verify', loading: false, message: undefined, error });
            this.messageService.add({
                severity: 'error',
                summary: 'Verification Password',
                detail: error
            });
        },
        complete: () => {}
    };
}
