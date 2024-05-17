export class IteratableDbResult<T>{

    isLoaded: boolean;
    errors: string[] | null;
    data: T[];
    
    constructor(data: T[] | null, errors: string[] | null) {
        this.isLoaded = (errors == null || errors.length === 0);
        this.errors = errors;
        this.data = data ? data! : [];
    }
    
}