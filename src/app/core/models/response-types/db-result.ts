export class DbResult<T>{

    isLoaded: boolean;
    errors: string[] | null;
    data: T | null;
    
    constructor(data: T | null, errors: string[] | null) {
        this.isLoaded = (errors == null || errors.length === 0);
        this.errors = errors;
        this.data = data;
    }
    
}