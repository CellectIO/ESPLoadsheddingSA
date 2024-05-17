import { ResultBase } from "./result-base";

export class Result<T> extends ResultBase
{

    data: T | null;
    
    constructor(data: T | null, errors: string[] | null) {
        super(errors);
        this.data = data;
    }
}