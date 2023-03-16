import {SchemaValidationError} from "./errors";

export function isValidHttpUrl(str: string): boolean {
    try {
        const url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

export function isObject(value: any): boolean {
    const type = typeof value;
    return type === 'object' && !!value;
}

export function getSchemaId(schema: any): string|undefined {
    return schema['$id'] || schema['id']
}

export function getIdFromSchemaProperty(data: any): string {
    if (typeof data !== 'object' ||
        typeof data['$schema'] !== 'string'
    ) {
        throw new SchemaValidationError(`$schema property is missing in the file`);
    }
    return data['$schema']
}

export function stripIdFragment(id: string): string {
    const fragmentSignIndex = id.indexOf('#')
    return fragmentSignIndex !== -1
        ? id.substring(0, fragmentSignIndex)
        : id
}