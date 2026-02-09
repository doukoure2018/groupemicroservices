import { IResponse } from '@/interface/response';
import { IUser } from '@/interface/user';
import { StorageService } from '@/service/storage.service';
import { UserService } from '@/service/user.service';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-admin',
    imports: [CommonModule, TableModule, InputTextModule, ProgressBarModule, ButtonModule, TagModule],
    templateUrl: './admin.component.html',
    providers: [ConfirmationService]
})
export class AdminComponent {}
