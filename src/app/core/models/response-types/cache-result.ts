export class CacheResult<T> {

    data: T | null;
    created: Date;
    validateCache: boolean;
    expiresInMinutes: number;

    constructor(_data: T, _created: Date, validateCache: boolean, expiresInMinutes: number) {
        this.data = _data;
        this.created = _created
        this.validateCache = validateCache;
        this.expiresInMinutes = expiresInMinutes;
    }

}