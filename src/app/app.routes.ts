import { Routes } from '@angular/router';
import { ListComponent } from './components/list/list.component'
import { ListRxComponent } from './components/list-rx/list-rx.component'
import { ListCdkComponent } from './components/list-cdk/list-cdk.component'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'cdk',
    pathMatch: 'full'
  },
  {
    path: 'plain',
    component: ListComponent
  },
  {
    path: 'rx',
    component: ListRxComponent
  },
  {
    path: 'cdk',
    component: ListCdkComponent
  }
];
