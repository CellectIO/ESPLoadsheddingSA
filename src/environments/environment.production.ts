import { NgxLoggerLevel } from "ngx-logger";

export const environment = {
    production: true,
    useMockData: false,
    api_eskom: 'https://developer.sepush.co.za/business/2.0',
    logging: {
        level: NgxLoggerLevel.ERROR,
        serverLogLevel: NgxLoggerLevel.ERROR,
    }
};