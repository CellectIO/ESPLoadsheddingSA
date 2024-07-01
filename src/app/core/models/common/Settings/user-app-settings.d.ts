export interface EskomSePushConfig {
    eskomSePushApiKey: string | null;
    apiSyncInterval: number; //TODO: not being used yet to invalidate cache?
    pagesSetup: boolean;
    pagesAllowance: boolean;
}