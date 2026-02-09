import { IResponse } from '@/interface/response';
import { IRole } from '@/interface/role';
import { UserService } from '@/service/user.service';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputText } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { TextareaModule } from 'primeng/textarea';

@Component({
    selector: 'app-create-user',
    imports: [TextareaModule, FileUploadModule, FormsModule, ButtonModule, InputGroupModule, RippleModule, MessageModule, ProgressSpinnerModule, PasswordModule, DropdownModule],
    templateUrl: './create-user.component.html',
    providers: [MessageService]
})
export class CreateUserComponent {}
