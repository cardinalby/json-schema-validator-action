import {deleteAllFakedDirs, RunOptions, RunTarget} from "github-action-ts-run-api";
import {ADD_EXTERNAL_SCHEMAS_ADVICE, TRY_LAX_MODE_ADVICE} from "../../src/schemasafeValidator";
import {RawActionInputs} from "../../src/actionInputs";
import {RawActionOutputs} from "../../src/actionOutputs";
import {ErrorType} from "../../src/errors";
import {ParserType} from "../../src/parser/parserType";

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
                file: 'action.yml',
                schema: 'https://json.schemastore.org/github-action.json'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate schema against draft-04 meta-schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/schemas/package.schema.json',
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate action.yml against wrong draft-04 schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'action.yml',
                schema: 'https://json.schemastore.org/sprite.json'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.VALIDATION} as RawActionOutputs);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate package.json against wrong draft-07 schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json',
                schema: 'https://json.schemastore.org/github-action.json'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.VALIDATION} as RawActionOutputs);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate package.json against schema in lax mode', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json',
                schema: 'tests/integration/data/schemas/package.schema.json',
                mode: 'lax'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should not validate package.json against schema in default mode', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json',
                schema: 'tests/integration/data/schemas/package.schema.json'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.SCHEMA} as RawActionOutputs);
        expect(res.stdout).toContain(TRY_LAX_MODE_ADVICE);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should throw schema error on invalid schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json',
                schema: 'LICENSE'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.SCHEMA} as RawActionOutputs);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should throw schema error on missing schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.SCHEMA} as RawActionOutputs);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should throw remote schema error', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json',
                schema: 'https://dwedwoo430930jfgerno9w04.com/'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.SCHEMA} as RawActionOutputs);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should throw file error', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'LICENSE',
                schema: 'tests/integration/data/schemas/package.schema.json'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.FILE} as RawActionOutputs);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate by glob', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/files/package_*.json',
                schema: 'tests/integration/data/schemas/package.schema.json',
                mode: 'lax'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate list of files', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/files/package_*.json|tests/integration/data/files/3_package.json',
                schema: 'tests/integration/data/schemas/package.schema.json',
                mode: 'lax'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate list of files with invalid', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/files/*.json',
                schema: 'tests/integration/data/schemas/package.schema.json',
                mode: 'lax'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.VALIDATION} as RawActionOutputs);
        expect(res.runnerWarnings).toHaveLength(0);
    });

    it('should validate data with draft/2020-12/schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/files/2020_12_data.json',
                schema: 'tests/integration/data/schemas/2020_12_schema.json'
            } as RawActionInputs
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
                file: 'data/schemas/2020_12_schema.json'
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.runnerWarnings).toHaveLength(0);
    });

    test.each([
        ["refSchemasMap" as keyof RawActionInputs, '{"https://example.com/integer": "data/schemas/integer.schema.json"}'],
        ["refSchemasArray" as keyof RawActionInputs, '["data/schemas/integer.schema.json"]']
    ])("should validate schema with external ref passed via %s", async (inputName, inputsValue) => {

        const res = await target.run(RunOptions.create({
            workingDir: 'tests/integration',
            inputs: {
                file: 'data/files/integer.json',
                schema: 'data/schemas/integer_ref.schema.json',
                [inputName]: inputsValue
            } as RawActionInputs
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
                file: 'data/files/integer.json',
                schema: 'data/schemas/integer_ref.schema.json',
            } as RawActionInputs
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: ErrorType.SCHEMA} as RawActionOutputs);
        expect(res.stdout).toContain(ADD_EXTERNAL_SCHEMAS_ADVICE)
        expect(res.runnerWarnings).toHaveLength(0);
    });

    test.each([
        [ParserType.AUTO, ErrorType.FILE],
        [ParserType.JSON, ErrorType.FILE],
        [ParserType.YAML, ""],
        [undefined, ErrorType.FILE],
        [`${ParserType.JSON}|${ParserType.YAML}`, ""],
        [`${ParserType.YAML}|${ParserType.JSON}`, ""],
        [`${ParserType.YAML}|invalid`, ErrorType.INPUTS],
    ])('with fileParser="%s" should have errorType="%s"', async (fileParser: string|undefined, errorType: string) => {
        const res = await target.run(RunOptions.create({
            workingDir: 'tests/integration',
            inputs: {
                file: 'data/files/extra_comma.json',
                schema: 'data/schemas/any.schema.json',
                fileParser: fileParser
            } as RawActionInputs
        }));
        if (errorType !== "") {
            expect(res.isSuccess).toEqual(false);
            expect(res.commands.errors).not.toEqual([]);
            expect(res.commands.outputs).toEqual({errorType: errorType} as RawActionOutputs);
        } else {
            expect(res.isSuccess).toEqual(true);
            expect(res.commands.errors).toEqual([]);
            expect(res.commands.outputs).toEqual({} as RawActionOutputs);
        }
        expect(res.runnerWarnings).toHaveLength(0);
    });
});