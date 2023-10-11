export type RefSchemasMap = Map<string, any>

export class ResolvedSchema {
    constructor(
        public readonly mainSchema: any,
        public refSchemas: RefSchemasMap = new Map()
    ) {
        this.refSchemas = refSchemas
    }
}