import { Routes } from '@angular/router';
import { ListComponent } from './components/list/list.component'
import { ListRxComponent } from './components/list-rx/list-rx.component'
import { ListCdkComponent } from './components/list-cdk/list-cdk.component'
import { ListCdk2Component } from './components/list-cdk2/list-cdk2.component'
import { ListCdk3Component } from './components/list-cdk3/list-cdk3.component'
import { ListCdk4Component } from './components/list-cdk4/list-cdk4.component'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'cdk4',
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
  },
  {
    path: 'cdk2',
    component: ListCdk2Component
  },
  {
    path: 'cdk3',
    component: ListCdk3Component
  },
  {
    path: 'cdk4',
    component: ListCdk4Component
  }
];
