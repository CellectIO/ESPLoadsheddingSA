import { NgxLoggerLevel } from "ngx-logger";

export const environment = {
    production: false,
    mocking: {
        useMock: true,
        mockDelay: 1000,
        useMockTime: true,
        mockTime: 'Sat Jun 01 2024 06:29:24 GMT+0200 (GMT+02:00)'
    },
    api_eskom: '/eskomAPI',
    logging: {
        level: NgxLoggerLevel.INFO,
        serverLogLevel: NgxLoggerLevel.INFO,
        logPanel: {
            syncEverySeconds: 2000,
            logLifeSpanSeconds: 4000
        }
    },
    cache: {
        defaultExpiresInMinutes: 120
    }
};