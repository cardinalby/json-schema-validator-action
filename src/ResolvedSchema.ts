export type RefSchemasMap = Map<string, any>

export class ResolvedSchema {
    refSchemas: RefSchemasMap

    constructor(
        public readonly mainSchema: any,
        refSchemas: RefSchemasMap = new Map()
    ) {
        this.refSchemas = refSchemas
    }

    addRefSchemasMap(map: RefSchemasMap) {
        map.forEach((value, key) => this.refSchemas.set(key, value))
    }
}