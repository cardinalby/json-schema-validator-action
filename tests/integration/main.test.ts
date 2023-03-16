import {deleteAllFakedDirs, RunOptions, RunTarget} from "github-action-ts-run-api";
import {ADD_EXTERNAL_SCHEMAS_ADVICE, TRY_LAX_MODE_ADVICE} from "../../src/schemasafeValidator";
import {
    INPUT_FILE,
    INPUT_MODE,
    INPUT_REF_SCHEMAS_ARRAY,
    INPUT_REF_SCHEMAS_MAP,
    INPUT_SCHEMA
} from "../../src/actionInputs";
import {OUTPUT_ERROR_TYPE} from "../../src/actionOutputs";

describe('main', () => {
    const target = process.env.CI
        ? RunTarget.mainJs('action.yml')
        : RunTarget.jsFile('lib/index.js', 'action.yml');

    afterAll(() => {
        deleteAllFakedDirs()
    })

    it('should validate action.yml against draft-07 schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'action.yml',
                [INPUT_SCHEMA]: 'https://json.schemastore.org/github-action.json'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate schema against draft-04 meta-schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'tests/integration/data/schemas/package.schema.json',
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate action.yml against wrong draft-04 schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'action.yml',
                [INPUT_SCHEMA]: 'https://json.schemastore.org/sprite.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'validation'});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate package.json against wrong draft-07 schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'package.json',
                [INPUT_SCHEMA]: 'https://json.schemastore.org/github-action.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'validation'});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate package.json against schema in lax mode', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'package.json',
                [INPUT_SCHEMA]: 'tests/integration/data/schemas/package.schema.json',
                [INPUT_MODE]: 'lax'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should not validate package.json against schema in default mode', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'package.json',
                [INPUT_SCHEMA]: 'tests/integration/data/schemas/package.schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'schema'});
        expect(res.stdout).toContain(TRY_LAX_MODE_ADVICE);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should throw schema error on invalid schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'package.json',
                [INPUT_SCHEMA]: 'LICENSE'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'schema'});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should throw schema error on missing schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'package.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'schema'});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should throw remote schema error', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'package.json',
                [INPUT_SCHEMA]: 'https://dwedwoo430930jfgerno9w04.com/'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'schema'});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should throw file error', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'LICENSE',
                [INPUT_SCHEMA]: 'tests/integration/data/schemas/package.schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'file'});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate by glob', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'tests/integration/data/files/package_*.json',
                [INPUT_SCHEMA]: 'tests/integration/data/schemas/package.schema.json',
                [INPUT_MODE]: 'lax'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate list of files', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'tests/integration/data/files/package_*.json|tests/integration/data/files/3_package.json',
                [INPUT_SCHEMA]: 'tests/integration/data/schemas/package.schema.json',
                [INPUT_MODE]: 'lax'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate list of files with invalid', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'tests/integration/data/files/*.json',
                [INPUT_SCHEMA]: 'tests/integration/data/schemas/package.schema.json',
                [INPUT_MODE]: 'lax'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'validation'});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate data with draft/2020-12/schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                [INPUT_FILE]: 'tests/integration/data/files/2020_12_data.json',
                [INPUT_SCHEMA]: 'tests/integration/data/schemas/2020_12_schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate schema file against draft/2020-12 meta-schema', async () => {
        const res = await target.run(RunOptions.create({
            workingDir: 'tests/integration',
            inputs: {
                [INPUT_FILE]: 'data/schemas/2020_12_schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    test.each([
        [INPUT_REF_SCHEMAS_MAP, '{"https://example.com/integer": "data/schemas/integer.schema.json"}'],
        [INPUT_REF_SCHEMAS_ARRAY, '["data/schemas/integer.schema.json"]']
    ])("should validate schema with external ref passed via %s", async (inputName, inputsValue) => {

        const res = await target.run(RunOptions.create({
            workingDir: 'tests/integration',
            inputs: {
                [INPUT_FILE]: 'data/files/integer.json',
                [INPUT_SCHEMA]: 'data/schemas/integer_ref.schema.json',
                [inputName]: inputsValue
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should not should validate schema with external ref', async () => {
        const res = await target.run(RunOptions.create({
            workingDir: 'tests/integration',
            inputs: {
                [INPUT_FILE]: 'data/files/integer.json',
                [INPUT_SCHEMA]: 'data/schemas/integer_ref.schema.json',
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({[OUTPUT_ERROR_TYPE]: 'schema'});
        expect(res.stdout).toContain(ADD_EXTERNAL_SCHEMAS_ADVICE)
        expect(res.runnerWarnings).toHaveLength(0);
    });
});