import * as ghActions from '@actions/core';
import {isObject} from "./utils";
import {SchemasafeMode} from "./schemasafeValidator";
import {InputsValidationError} from "./errors";

export const INPUT_SCHEMA = "schema"
export const INPUT_FILE = "file"
export const INPUT_MODE = "mode"
export const INPUT_REF_SCHEMAS_MAP = "refSchemasMap"
export const INPUT_REF_SCHEMAS_ARRAY = "refSchemasArray"

export interface ActionInputs {
    schema: string,
    file: string,
    mode: SchemasafeMode,
    refSchemasMap: Map<string, string>,
    refSchemasArray: string[]
}

/**
 * @throws InputsValidationError
 */
export function getActionInputs(): ActionInputs {
    const errors: string[] = []
    const readInput = <T>(readFn: () => T): T|undefined => {
        try {
            return readFn()
        } catch (err) {
            errors.push(err instanceof Error ? err.message : String(err))
            return undefined
        }
    }
    const inputs: Partial<ActionInputs> = {
        [INPUT_SCHEMA]: readInput(getSchemaInput),
        [INPUT_FILE]: readInput(getFileInput),
        [INPUT_MODE]: readInput(getModeInput),
        [INPUT_REF_SCHEMAS_MAP]: readInput(getRefSchemasMapInput),
        [INPUT_REF_SCHEMAS_ARRAY]: readInput(getRefSchemasArrayInput)
    }
    if (errors.length > 0) {
        throw new InputsValidationError(errors)
    }
    return inputs as ActionInputs
}

function getSchemaInput(): string {
    return ghActions.getInput(INPUT_SCHEMA, {required: false})
}

function getFileInput(): string {
    return ghActions.getInput(INPUT_FILE, {required: true})
}

function getModeInput(): SchemasafeMode {
    const mode = ghActions.getInput(INPUT_MODE, {required: true})
    const allowedModes: SchemasafeMode[] = ['default', 'lax', 'strong']
    if (!allowedModes.includes(mode as SchemasafeMode)) {
        throw new Error(`"${INPUT_MODE}" has unknown value "${mode}". Allowed values: ${allowedModes.join(', ')}`)
    }
    return mode as SchemasafeMode
}

function getRefSchemasMapInput(): Map<string, string> {
    const refSchemasMapStr = ghActions.getInput(INPUT_REF_SCHEMAS_MAP, {required: false})
    if (!refSchemasMapStr) {
        return new Map<string, string>
    }
    let refSchemasMap: any
    const invalidJsonErr = new Error(`${INPUT_REF_SCHEMAS_MAP} should contain a valid {string: string} JSON object`)
    try {
        refSchemasMap = JSON.parse(refSchemasMapStr)
    } catch (err) {
        throw invalidJsonErr
    }
    if (!isObject(refSchemasMap)) {
        throw invalidJsonErr
    }
    const res = new Map<string, string>()
    for (let key in refSchemasMap) {
        if (typeof refSchemasMap[key] !== 'string') {
            throw invalidJsonErr
        }
        res.set(key, refSchemasMap[key])
    }
    return res
}

function getRefSchemasArrayInput(): string[] {
    const refSchemasArrayStr = ghActions.getInput(INPUT_REF_SCHEMAS_ARRAY, {required: false})
    if (!refSchemasArrayStr) {
        return []
    }
    let refSchemas: any
    const invalidJsonErr = new Error(`${INPUT_REF_SCHEMAS_ARRAY} should contain a valid strings array`)
    try {
        refSchemas = JSON.parse(refSchemasArrayStr)
    } catch (err) {
        throw invalidJsonErr
    }
    if (!Array.isArray(refSchemas)) {
        throw invalidJsonErr
    }
    return refSchemas
}
