import * as ghActions from '@actions/core';
import * as fs from 'fs-extra'
import {isValidHttpUrl} from "./utils";
import {Validator} from "jsonschema";
import YAML from 'yaml'
import {SchemaValidatorError} from "./errors";
import axios from "axios";
import {getFilePaths} from "./getFilePaths";
import assert from "assert";

type FileObject = {parsed: any, schema: undefined }|{parsed: object, schema: object};

// noinspection JSUnusedLocalSymbols
export async function run(): Promise<void> {
    try {
        await validate(
            ghActions.getInput('schema', {required: false}),
            ghActions.getInput('file', {required: true})
        );
    } catch (error) {
        if (error instanceof SchemaValidatorError) {
            ghActions.setOutput('errorType', error.errorType);
        }
        if (typeof error === 'string' || error instanceof Error) {
            ghActions.setFailed(error.toString());
        } else {
            ghActions.setFailed('Unknown error');
        }
    }
}

export async function validate(schema: string, file: string) {
    const files = await getFilePaths(file);
    if (files.length === 0) {
        throw new SchemaValidatorError('file', 'No files found according to "file" input.');
    }

    let schemaObj;
    if (schema) {
        try {
            schemaObj = readData(await readSchemaContents(schema), schema);
        } catch (err) {
            throw new SchemaValidatorError('schema', 'Error reading schema. ' + err);
        }
    }

    const validator = new Validator();
    for (let filePath of files) {
        const fileObject = await readFile(filePath, !schema);
        let fileSchemaObj = schemaObj || fileObject.schema;
        assert(fileSchemaObj);
        const result = validator.validate(fileObject.parsed, fileSchemaObj);
        if (!result.valid) {
            result.errors.forEach(error => ghActions.error(error.stack));
            throw new SchemaValidatorError('validation', 'Validation error');
        }
    }
    ghActions.info('Validated');
}

function readData(data: string, name: string): any {
    for (let parser of [
        {name: 'JSON', parse: (s: string) => JSON.parse(s)},
        {name: 'YAML', parse: (s: string) => YAML.parse(s)},
    ]) {
        try {
            ghActions.info(`Parsing ${name} as ${parser.name}...`);
            const result = parser.parse(data);
            ghActions.info(`Parsed to ${typeof result}`);
            return result;
        } catch (err) {
            ghActions.info(`${name} is not a valid ${parser.name}`);
        }
    }
    throw new Error(`${name} is not a valid JSON or YAML`);
}

async function readFile(
    file: string,
    requireSchemaProperty: boolean
): Promise<FileObject> {
    let parsed;
    try {
        parsed = readData((await fs.readFile(file)).toString(), file);
    } catch (err) {
        throw new SchemaValidatorError('file', 'Error reading file. ' + err);
    }
    if (!requireSchemaProperty) {
        return {parsed, schema: undefined};
    }
    assert(parsed != undefined);
    if (typeof parsed !== 'object' ||
        typeof parsed['$schema'] !== 'string'
    ) {
        throw new SchemaValidatorError(
            'schema', `"schema" input is not set and $schema property is missing in ${file}`
        );
    }
    try {
        ghActions.info(
            `"schema" input is not set, reading $schema = ` +
            `"${parsed['$schema']} from ${file}"`
        );
        const schema = readData(await readSchemaContents(parsed['$schema']), parsed['$schema']);
        return {parsed, schema}
    } catch (err) {
        throw new SchemaValidatorError('schema', 'Error reading schema. ' + err);
    }
}


async function readSchemaContents(schemaPath: string): Promise<string> {
    if (isValidHttpUrl(schemaPath)) {
        ghActions.info(`Loading schema from URL: ${schemaPath} ...`);
        const response = await axios.get(schemaPath, {
            responseType: 'text',
            transformResponse: res => res }
        );
        ghActions.info(
            `${response.status}, ${response.headers['Content-Length']} bytes loaded, Content-Type: ` +
            response.headers['Content-Type']
        );
        return response.data;
    }
    ghActions.info(`Loading schema from file: ${schemaPath} ...`);
    const buffer = await fs.readFile(schemaPath);
    ghActions.info(`${buffer.length} bytes loaded`);
    return buffer.toString();
}
