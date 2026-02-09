import { IUser } from '@/interface/user';
import { UserService } from '@/service/user.service';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminComponent } from '../admin/admin.component';
import { RespAgentComponent } from '../resp-agent/resp-agent.component';

@Component({
    selector: 'app-home',
    imports: [AdminComponent, RespAgentComponent],
    templateUrl: './home.component.html'
})
export class HomeComponent {
    state = signal<{ user?: IUser; loading: boolean; message: string | undefined; error: string | any }>({
        loading: false,
        message: undefined,
        error: undefined
    });
    private destroyRef = inject(DestroyRef);
    private userService = inject(UserService);

    ngOnInit(): void {
        this.loadUserProfile();
    }
    private loadUserProfile(): void {
        this.state.update((state) => ({ ...state, loading: true, message: undefined, error: undefined }));
        this.userService
            .getInstanceUser$()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    this.state.update((state) => ({ ...state, loading: false, user: response.data.user, message: undefined, error: undefined }));
                },
                error: (error) => {
                    this.state.update((state) => ({ ...state, loading: false, user: undefined, message: undefined, error }));
                },
                complete: () => {}
            });
    }
}
