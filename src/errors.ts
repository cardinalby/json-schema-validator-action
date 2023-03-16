export type ErrorType = 'file'|'schema'|'validation'|'inputs';

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
        super('inputs', errors);
    }
}

export class SchemaValidationError extends ValidatorError {
    constructor(error: string, advice?: string) {
        super('schema', [error], advice);
    }
}

export class DataValidationError extends ValidatorError {
    constructor(errors: string[]) {
        super('validation', errors);
    }
}

export class FileValidationError extends ValidatorError {
    constructor(error: string) {
        super('file', [error]);
    }
}