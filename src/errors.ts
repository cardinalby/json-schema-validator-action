export enum ErrorType {
    FILE = 'file',
    SCHEMA = 'schema',
    VALIDATION = 'validation',
    INPUTS = 'inputs'
}

export class ValidatorError extends Error {
    constructor(
        public readonly errorType: ErrorType,
        public readonly errors: string[],
        public readonly advice?: string
    ) {
        super(`${errorType} error`);
    }
}

export class InputsValidationError extends ValidatorError {
    constructor(errors: string[]) {
        super(ErrorType.INPUTS, errors);
    }
}

export class SchemaValidationError extends ValidatorError {
    constructor(error: string, advice?: string) {
        super(ErrorType.SCHEMA, [error], advice);
    }
}

export class DataValidationError extends ValidatorError {
    constructor(errors: string[]) {
        super(ErrorType.VALIDATION, errors);
    }
}

export class FileValidationError extends ValidatorError {
    constructor(error: string) {
        super(ErrorType.FILE, [error]);
    }
}