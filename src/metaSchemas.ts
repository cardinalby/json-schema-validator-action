import * as fs from "fs";
import * as path from "path";
import {SchemaValidationError} from "./errors";
import {stripIdFragment} from "./utils";
import {ResolvedSchema} from "./ResolvedSchema";

// Move this file with care:
// Tricky path resolving: should be valid for:
// src/metaSchemas.ts
// lib/metaSchemas.js
// dist/index.js
// All these files should be at the same level relating to metaSchemas dir
const metaSchemasDir = path.resolve(__dirname, '../metaSchemas')
const metaSchemasSchemasDir = path.join(metaSchemasDir, 'schemas')
const schemaFilesJsonFile = path.join(metaSchemasDir, 'schema-files.json')

const unexpectedMetaSchemaErrorAdvice =
    "Normally loading meta-schema from action local storage shouldn't fail, contact the author!"

const metaSchemas = JSON.parse(fs.readFileSync(schemaFilesJsonFile).toString()) as
    {[id: string]: MetaSchemaInfo}

interface MetaSchemaInfo {
    filePath: string
    refs: [string]
}

export function hasBuiltInMetaSchema(schemaId: string): boolean {
    return metaSchemas.hasOwnProperty(schemaId)
}

export async function loadBuiltInMetaSchema(schemaId: string): Promise<ResolvedSchema|undefined> {
    schemaId = stripIdFragment(schemaId)
    const schemaInfo = metaSchemas[schemaId]
    if (schemaInfo === undefined) {
        return undefined
    }
    let res: ResolvedSchema
    try {
        res = new ResolvedSchema(await loadMetaSchemaFromFile(schemaInfo.filePath))
    } catch (err) {
        throw new SchemaValidationError(
            `Error loading '${schemaId}' meta schema from '${schemaInfo.filePath}'`,
            unexpectedMetaSchemaErrorAdvice
        )
    }

    for (let ref of schemaInfo.refs) {
        if (res.refSchemas.has(ref)) {
            continue
        }
        const resolved = await loadBuiltInMetaSchema(ref)
        if (resolved == undefined) {
            throw new SchemaValidationError(
                `can't resolve '${ref} ref in '${schemaId} meta schema'`,
                unexpectedMetaSchemaErrorAdvice
            )
        }
        res.refSchemas.set(ref, resolved.mainSchema)
        for (let resolvedRef in resolved.refSchemas) {
            res.refSchemas.set(resolvedRef, resolved.refSchemas.get(resolvedRef))
        }
    }
    return res
}

async function loadMetaSchemaFromFile(infoFilePath: string): Promise<any> {
    return JSON.parse((await fs.promises.readFile(
        path.join(metaSchemasSchemasDir, infoFilePath)
    )).toString())
}