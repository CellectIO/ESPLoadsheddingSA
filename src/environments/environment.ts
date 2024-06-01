import { NgxLoggerLevel } from "ngx-logger";

export const environment = {
    production: false,
    mocking: {
        useMock: true,
        mockDelay: 1000
    },
    api_eskom: '/eskomAPI',
    logging: {
        level: NgxLoggerLevel.INFO,
        serverLogLevel: NgxLoggerLevel.INFO,
    }
};