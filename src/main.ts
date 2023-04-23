import * as ghActions from '@actions/core';
import {FileValidationError, ValidatorError} from "./errors";
import {getFilePaths} from "./getFilePaths";
import assert from "assert";
import {resolveRefSchemas, SchemaResolver} from "./SchemaResolver";
import {readDataFile} from "./parser/readDataSource";
import {validateAgainstResolvedSchema} from "./schemasafeValidator";
import {actionOutputs} from "./actionOutputs";
import {ActionInputs, getActionInputs} from "./actionInputs";
import {getIdFromSchemaProperty} from "./utils";
import {parseObject} from "./parser/parseObject";
import {ParserType} from "./parser/parserType";

// noinspection JSUnusedLocalSymbols
export async function run(): Promise<void> {
    try {
        const inputs = getActionInputs()
        await validateFiles(inputs);
    } catch (error) {
        if (error instanceof ValidatorError) {
            actionOutputs.errorType = error.errorType
            error.errors.forEach(error => ghActions.error(error));
            if (error.advice) {
                ghActions.info(error.advice)
            }
            ghActions.setFailed('Failed because of ' + error.message)
        } else {
            ghActions.setFailed(error instanceof Error
                ? error.message
                : String(error)
            );
        }
    }
}

export async function validateFiles(inputs: ActionInputs) {
    const files = await getFilePaths(inputs.file);
    if (files.length === 0) {
        throw new FileValidationError('No files found according to "file" input.');
    }
    const schemaResolver = new SchemaResolver()
    if (inputs.refSchemasMap.size > 0 || inputs.refSchemasArray.length > 0) {
        ghActions.info('Resolving ref schemas passed to refSchemasMap and refSchemasArray inputs...')
        schemaResolver.refSchemas = await resolveRefSchemas(inputs.refSchemasMap, inputs.refSchemasArray)
    }

    let resolvedSchema = inputs.schema
        ? await schemaResolver.resolve(inputs.schema)
        : undefined

    for (let filePath of files) {
        const parsedData = await (async () => { try {
            const fileData = await readDataFile(filePath)
            const fileParser = inputs.fileParser === ParserType.AUTO
                ? fileData.dataType
                : inputs.fileParser
            return await parseObject(fileData, fileParser)
        } catch (err) {
            throw new FileValidationError(String(err))
        }})()

        if (!inputs.schema) {
            const schemaId = getIdFromSchemaProperty(parsedData)
            ghActions.info(`"Trying to find '${schemaId}' schema from $schema property of the file...`);
            resolvedSchema = await schemaResolver.resolve(schemaId)
        }
        assert(resolvedSchema !== undefined);
        await validateAgainstResolvedSchema(parsedData, resolvedSchema, inputs.mode)
    }
    ghActions.info('Validated');
}