export class CacheResult<T> {

    data: T | null;
    created: Date;
    validateCache: boolean;

    constructor(_data: T, _created: Date, validateCache: boolean) {
        this.data = _data;
        this.created = _created
        this.validateCache = validateCache;
    }

}