import {getSchemaId, isValidHttpUrl} from "./utils";
import * as ghActions from "@actions/core";
import axios from "axios";
import * as fs from "fs-extra";
import {hasBuiltInMetaSchema, loadBuiltInMetaSchema} from "./metaSchemas";
import {parseObject} from "./parseObject";
import {SchemaValidationError} from "./errors";
import {RefSchemasMap, ResolvedSchema} from "./ResolvedSchema";

export class SchemaResolver {
    refSchemas: RefSchemasMap = new Map<string, any>()

    async resolve(schemaPath: string): Promise<ResolvedSchema> {
        if (this.refSchemas.has(schemaPath)) {
            const otherRefs = new Map(this.refSchemas)
            otherRefs.delete(schemaPath)

            return new ResolvedSchema(
                this.refSchemas.get(schemaPath),
                otherRefs
            )
        }

        const metaSchemas = await loadBuiltInMetaSchema(schemaPath)
        if (metaSchemas !== undefined) {
            ghActions.info(`'${schemaPath}' is a known meta schema, loaded from local storage`);
            return metaSchemas;
        }

        const externalSchema = await loadExternalSchema(schemaPath);
        return new ResolvedSchema(externalSchema, this.refSchemas)
    }
}

export async function resolveRefSchemas(schemasMap: RefSchemasMap, schemasArray: string[]): Promise<RefSchemasMap> {
    const resolving: Promise<[string, object]>[] =
        schemasArray.map(path => loadExternalSchema(path).then(resolved => {
            const id = getSchemaId(resolved)
            if (!id) {
                throw new SchemaValidationError(`Can't find id of the schema loaded from ${path}`)
            }
            if (hasBuiltInMetaSchema(id)) {
                ghActions.warning(
                    `'${path}' from schemasArray has id of the known '${id}' meta-schema and will be used to resolve ` +
                    `refs instead of one from action local storage. It's recommended to remove this element and ` +
                    `use built-in meta-schema`
                )
            }
            return [id, resolved]
        }))

    for (let entry of schemasMap.entries()) {
        if (hasBuiltInMetaSchema(entry[0])) {
            ghActions.warning(
                `'${entry[0]}' key from schemasMap is the known meta-schema. Data from ${entry[1]} will be used ` +
                `to resolve refs instead of one from action local storage. It's recommended to remove this element and` +
                `use built-in meta-schema`
            )
        }
        resolving.push(loadExternalSchema(entry[1]).then(resolved => [entry[0], resolved]))
    }
    const resolved = await Promise.all(resolving)

    const res = new Map<string, any>()
    const addToRes = (id: string, schema: any) => {
        if (res.has(id)) {
            ghActions.warning(`Duplicated id '${id}' among loaded schemas`)
        }
        res.set(id, schema)
    }

    for (let entry of resolved) {
        const [id, resolved] = entry
        addToRes(id, resolved)
    }
    return res
}

async function loadExternalSchema(schemaPath: string): Promise<object> {
    return isValidHttpUrl(schemaPath)
        ? await loadSchemaFromUrl(schemaPath)
        : await loadSchemaFromFile(schemaPath)
}

async function loadSchemaFromFile(filePath: string): Promise<any> {
    try {
        const buffer = await fs.readFile(filePath);
        ghActions.info(`Schema loaded from '${filePath}': ${buffer.length} bytes`);
        return parseObject(buffer.toString(), filePath);
    } catch (err) {
        throw new SchemaValidationError(`Can't load schema from '${filePath}': ${err}`)
    }
}

async function loadSchemaFromUrl(url: string): Promise<any> {
    try {
        const response = await axios.get(url, {
            responseType: 'text'
        });
        ghActions.info(
            `Schema loaded from ${url}: ${response.status}, ${response.headers['content-type']}, ` +
            `${response.headers['content-length']} bytes`
        );
        return parseObject(response.data, url)
    } catch (err) {
        throw new SchemaValidationError(`Can't load schema from '${url}': ${err}`)
    }
}