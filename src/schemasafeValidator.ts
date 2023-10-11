import {validator, Validate } from '@exodus/schemasafe'
// @ts-ignore
import * as schemaSafeFormats from '@exodus/schemasafe/src/formats'
import {DataValidationError, SchemaValidationError} from "./errors";
import {ResolvedSchema} from "./ResolvedSchema";

export type SchemasafeMode = 'default'|'lax'|'strong'|'spec'

const knownFormats = new Set([
    ...Object.keys(schemaSafeFormats.core),
    ...Object.keys(schemaSafeFormats.extra),
    ...Object.keys(schemaSafeFormats.weak),
])

export const TRY_LAX_MODE_ADVICE = "Try running with `mode: lax`"
export const ADD_EXTERNAL_SCHEMAS_ADVICE =
    "Try passing schemas for not resolved refs manually via refSchemasMap or refSchemasArray inputs"
export const TRY_FIX_SCHEMAS_ADVICE = "Try running with `fixSchemas: true`"

export async function validateAgainstResolvedSchema(
    data: any,
    resolvedSchema: ResolvedSchema,
    mode: SchemasafeMode
) {
    let validate: Validate
    try {
        validate = validator(resolvedSchema.mainSchema, {
            mode,
            schemas: resolvedSchema.refSchemas,
            includeErrors: true,
            allErrors: true,
            weakFormats: true,
            extraFormats: true,
        })

    } catch (error) {
        if (error instanceof Error) {
            throw new SchemaValidationError(error.message, getAdvice(error.message))
        }
        throw new SchemaValidationError(String(error))
    }
    const res = validate(data)
    if (!res) {
        throw new DataValidationError(validate.errors
            ? validate.errors.map(err => `Invalid ${err.instanceLocation} (schema path: ${err.keywordLocation})`)
            : [])
    }
}

function getAdvice(errorMsg: string): string|undefined {
    errorMsg = errorMsg.toLowerCase()
    if (errorMsg.startsWith('keyword not supported')) {
        return TRY_LAX_MODE_ADVICE
    }
    if (errorMsg.startsWith('failed to resolve $ref')) {
        return ADD_EXTERNAL_SCHEMAS_ADVICE
    }
    if (errorMsg.startsWith('unrecognized format used')) {
        return TRY_FIX_SCHEMAS_ADVICE
    }
}

export function fixResolvedSchema(resolvedSchema: ResolvedSchema) {
    fixSchemaObject(resolvedSchema.mainSchema)
    for (let schema of resolvedSchema.refSchemas.values()) {
        fixSchemaObject(schema)
    }
}

function fixSchemaObject(data: any) {
    if (data !== Object(data)) {
        return
    }
    stripUnknownFormats(data)
    for (let key in data) {
        fixSchemaObject(data[key])
    }
}

function stripUnknownFormats(data: any) {
    if (data.type == 'string' && typeof data.format === 'string' && !knownFormats.has(data.format)) {
        delete data.format
    }
}