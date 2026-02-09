import { IResponse } from '@/interface/response';
import { AppConfigurator } from '@/layout/components/app.configurator';
import { UserService } from '@/service/user.service';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { EMPTY, Observer, switchMap } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-verifyaccount',
    imports: [ButtonModule, RouterModule, FormsModule, AppConfigurator, InputGroupModule, InputGroupAddonModule, InputNumberModule, MessageModule, ToastModule, ProgressSpinnerModule, RouterLink],
    templateUrl: './verifyaccount.component.html',
    providers: [MessageService]
})
export class VerifyaccountComponent {
    state = signal<{ loading: boolean; message: string | undefined; error: string | any }>({
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
                        this.state.set({ loading: true, message: undefined, error: undefined });
                        return this.userService.verifyAccountToken$(token);
                    } else {
                        this.state.set({ loading: false, message: undefined, error: 'Invalide Link. Please try again' });
                        return EMPTY;
                    }
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(this.verifyAccount);
    }

    closeMessage = () => this.state.set({ loading: false, message: undefined, error: undefined });

    /**
     *  this will execute when the method verifyAccountToken$(token) has been executed
     */
    private verifyAccount: Observer<any> = {
        next: (response: IResponse) => {
            this.state.set({ loading: false, message: response.message, error: undefined });
            this.messageService.add({
                severity: 'success',
                summary: 'Verification Account',
                detail: 'Account has been verified'
            });
        },
        error: (error: string) => {
            this.state.set({ loading: false, message: undefined, error });
            this.messageService.add({
                severity: 'error',
                summary: 'Verification Account',
                detail: error
            });
        },
        complete: () => {}
    };
}
