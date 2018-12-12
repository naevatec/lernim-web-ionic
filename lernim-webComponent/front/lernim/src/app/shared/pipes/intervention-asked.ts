import { Pipe, PipeTransform } from '@angular/core';
import { UserModel } from '../models/user-model';

@Pipe({
    name: 'interventionAskedFilter',
    pure: false
})
export class InterventionAskedPipe implements PipeTransform {
    transform(items: UserModel[]): any {
        if (!items) {
            return items;
        }
        // Return only those users which have asked for intervention
        return items.filter(item => item.interventionRequired);
    }
}
