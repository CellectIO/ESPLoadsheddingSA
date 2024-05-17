export class ResultBase{

    isSuccess: boolean;
    errors: string[] | null;
    
    constructor(errors: string[] | null) {
        this.isSuccess = (errors == null || errors.length === 0);
        this.errors = errors;
    }
    
}