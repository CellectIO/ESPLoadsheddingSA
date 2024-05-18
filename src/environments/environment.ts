import { NgxLoggerLevel } from "ngx-logger";

export const environment = {
    production: false,
    useMockData: true,
    api_eskom: '/eskomAPI',
    logging: {
        level: NgxLoggerLevel.INFO,
        serverLogLevel: NgxLoggerLevel.INFO,
    }
};