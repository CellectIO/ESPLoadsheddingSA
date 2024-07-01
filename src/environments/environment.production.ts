import { NgxLoggerLevel } from "ngx-logger";

export const environment = {
    production: true,
    mocking: {
        useMock: false,
        mockDelay: 0,
        useMockTime: false,
        mockTime: ''
    },
    api_eskom: 'https://developer.sepush.co.za/business/2.0',
    logging: {
        level: NgxLoggerLevel.ERROR,
        serverLogLevel: NgxLoggerLevel.ERROR,
        logPanel: {
            syncEverySeconds: 2000,
            logLifeSpanSeconds: 4000
        }
    },
    cache: {
        defaultExpiresInMinutes: 120
    }
};