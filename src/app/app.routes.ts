import { Routes } from '@angular/router';
import { MyAreasComponent } from './components/main/my-areas/my-areas.component';
import { AddAreaComponent } from './components/main/add-area/add-area.component';
import { EskomDashboardComponent } from './components/main/eskom-dashboard/eskom-dashboard.component';
import { SettingsComponent } from './components/main/settings/settings.component';
import { SetupComponent } from './components/shared/setup/setup.component';
import { AllowanceDashboardComponent } from './components/main/allowance-dashboard/allowance-dashboard.component';

export const routes: Routes = [
    {
        path: '', //DEFAULT LANDING PAGE
        component: SettingsComponent
    },
    {
        path: 'settings',
        component: SettingsComponent
    },
    {
        path: 'page_setup',
        component: SetupComponent
    },
    {
        path: 'allowance',
        component: AllowanceDashboardComponent
    },
    {
        path: 'areas/my',
        component: MyAreasComponent
    },
    {
        path: 'areas/add',
        component: AddAreaComponent
    },
    {
        path: 'areas/:id',
        component: EskomDashboardComponent
    }
];
