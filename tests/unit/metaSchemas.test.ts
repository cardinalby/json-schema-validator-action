import {loadBuiltInMetaSchema} from "../../src/metaSchemas";
import assert from "assert";
import {getSchemaId} from "../../src/utils";

describe('loadMetaSchema', () => {
    const metaSchemas = [
        'http://json-schema.org/draft-03/schema#',
        'http://json-schema.org/draft-03/schema',
        'http://json-schema.org/draft-04/schema#',
        'http://json-schema.org/draft-06/schema',
        'http://json-schema.org/draft-06/schema#',
        'http://json-schema.org/draft-07/schema',
        'http://json-schema.org/draft-07/schema#',
        'https://json-schema.org/draft/2019-09/schema#',
        'https://json-schema.org/draft/2019-09/schema',
        'https://json-schema.org/draft/2020-12/schema',
        'https://json-schema.org/draft/2020-12/schema#',
    ]

    test.each(metaSchemas)("should load '%s' meta-schema", async (id) => {
        const resolved = await loadBuiltInMetaSchema(id)
        expect(resolved).not.toBeUndefined();
        assert(resolved)
        expect(resolved.mainSchema).not.toBeUndefined()
        expect(getSchemaId(resolved.mainSchema)).not.toBeUndefined()
    });
});