import { IUser } from '@/interface/user';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-resp-agent',
    imports: [],
    templateUrl: './resp-agent.component.html'
})
export class RespAgentComponent {
    @Input() user?: IUser;
}
