import * as ghActions from '@actions/core';
import {isObject} from "./utils";
import {SchemasafeMode} from "./schemasafeValidator";
import {InputsValidationError} from "./errors";
import {ActualParserType, asActualParserType, ParserType} from "./parser/parserType";
import {InputOptions} from "@actions/core";

export interface ActionInputs {
    schema: string,
    file: string,
    fileParser: ActualParserType[]|ParserType.AUTO
    mode: SchemasafeMode,
    refSchemasMap: Map<string, string>,
    refSchemasArray: string[]
    fixSchemas: boolean
}

export type RawActionInputs = Partial<{
    [k in keyof ActionInputs]: string
}>

function rawInput(name: keyof ActionInputs, options?: InputOptions): string {
    return ghActions.getInput(name, options)
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
        schema: readInput(getSchemaInput),
        file: readInput(getFileInput),
        fileParser: readInput(getFileParserInput),
        mode: readInput(getModeInput),
        refSchemasMap: readInput(getRefSchemasMapInput),
        refSchemasArray: readInput(getRefSchemasArrayInput),
        fixSchemas: readInput(getFixSchemasInput),
    }
    if (errors.length > 0) {
        throw new InputsValidationError(errors)
    }
    return inputs as ActionInputs
}

function getSchemaInput(): string {
    return rawInput('schema', {required: false})
}

function getFileInput(): string {
    return rawInput('file', {required: true})
}

function getFileParserInput(): ActualParserType[]|ParserType.AUTO {
    const fileParser = rawInput('fileParser', {required: true})
    if (fileParser == ParserType.AUTO) {
        return ParserType.AUTO
    }
    return fileParser
        .split("|")
        .map(asActualParserType)
        .filter((t, index, arr) => arr.indexOf(t) === index)
}

function getModeInput(): SchemasafeMode {
    const mode = rawInput('mode', {required: true})
    const allowedModes: SchemasafeMode[] = ['default', 'lax', 'strong', 'spec']
    if (!allowedModes.includes(mode as SchemasafeMode)) {
        throw new Error(`"mode" has unknown value "${mode}". Allowed values: ${allowedModes.join(', ')}`)
    }
    return mode as SchemasafeMode
}

function getRefSchemasMapInput(): Map<string, string> {
    const refSchemasMapStr = rawInput('refSchemasMap', {required: false})
    if (!refSchemasMapStr) {
        return new Map<string, string>
    }
    let refSchemasMap: any
    const invalidJsonErr = new Error(`refSchemasMap should contain a valid {string: string} JSON object`)
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
    const refSchemasArrayStr = rawInput('refSchemasArray', {required: false})
    if (!refSchemasArrayStr) {
        return []
    }
    let refSchemas: any
    const invalidJsonErr = new Error(`refSchemasArray should contain a valid strings array`)
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

function getFixSchemasInput(): boolean {
    const mode = rawInput('fixSchemas', {required: false})
    return ['true', '1'].includes(mode)
}