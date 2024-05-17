import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { LoggerModule } from "ngx-logger";
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    provideAnimationsAsync(), 
    provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom(
      LoggerModule.forRoot({
        level: environment.logging.level,
        serverLogLevel: environment.logging.serverLogLevel
      })
    )
  ]
};
