import {RunOptions, RunTarget} from "github-action-ts-run-api";

describe('main', () => {
    const target = RunTarget.jsFile('lib/index.js', 'action.yml');

    it('should validate action.yml against github-action schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'action.yml',
                schema: 'https://json.schemastore.org/github-action.json'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.warnings).toHaveLength(0);
    });

    it('should validate file by $schema set in file', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/package.schema.json',
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.warnings).toHaveLength(0);
    });

    it('should validate action.yml against angular schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'action.yml',
                schema: 'https://raw.githubusercontent.com/angular/angular-cli/master/packages/angular/cli/lib/config/workspace-schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: 'validation'});
        expect(res.warnings).toHaveLength(0);
    });

    it('should validate package.json against schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json',
                schema: 'tests/integration/data/package.schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.warnings).toHaveLength(0);
    });

    it('should throw schema error on invalid schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json',
                schema: 'LICENSE'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: 'schema'});
        expect(res.warnings).toHaveLength(0);
    });

    it('should throw schema error on missing schema', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: 'schema'});
        expect(res.warnings).toHaveLength(0);
    });

    it('should throw remote schema error', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'package.json',
                schema: 'https://dwedwoo430930jfgerno9w04.com/'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: 'schema'});
        expect(res.warnings).toHaveLength(0);
    });

    it('should throw file error', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'LICENSE',
                schema: 'tests/integration/data/package.schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: 'file'});
        expect(res.warnings).toHaveLength(0);
    });

    it('should validate by glob', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/files/package_*.json',
                schema: 'tests/integration/data/package.schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.warnings).toHaveLength(0);
    });

    it('should validate list of files', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/files/package_*.json|tests/integration/data/files/3_package.json',
                schema: 'tests/integration/data/package.schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(true);
        expect(res.commands.errors).toEqual([]);
        expect(res.commands.outputs).toEqual({});
        expect(res.warnings).toHaveLength(0);
    });

    it('should validate list of files with invalid', async () => {
        const res = await target.run(RunOptions.create({
            inputs: {
                file: 'tests/integration/data/files/*.json',
                schema: 'tests/integration/data/package.schema.json'
            }
        }));
        expect(res.isSuccess).toEqual(false);
        expect(res.commands.errors).not.toEqual([]);
        expect(res.commands.outputs).toEqual({errorType: 'validation'});
        expect(res.warnings).toHaveLength(0);
    });
});