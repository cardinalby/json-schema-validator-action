[![test](https://github.com/cardinalby/schema-validator-action/actions/workflows/test.yml/badge.svg)](https://github.com/cardinalby/schema-validator-action/actions/workflows/test.yml)
[![build](https://github.com/cardinalby/schema-validator-action/actions/workflows/build.yml/badge.svg)](https://github.com/cardinalby/jschema-validator-action/actions/workflows/build.yml)

## Validate JSON or YAML against a schema

A GitHub Action for validating JSON or YAML file against a schema. 
Fails if validation doesn't succeed. Uses 
[schemasafe](https://github.com/ExodusMovement/schemasafe) validator under the hood.

## Examples

```yaml
- name: Validate package.json against a local schema
  uses: cardinalby/schema-validator-action@v2
  with:
    file: 'package.json'
    schema: 'schemas/package.schema.json'
```

```yaml
- name: Validate action.yml against a remote schema
  uses: cardinalby/schema-validator-action@v2
  with:
    file: 'action.yml'
    schema: 'https://json.schemastore.org/github-action.json'
```

```yaml
- name: Validate all json files using their own $schema properties
  uses: cardinalby/schema-validator-action@v2
  with:
    file: 'dir/*.json'
```

```yaml
- name: Validate 3 files using the same schema
  uses: cardinalby/schema-validator-action@v2
  with:
    file: 'first.json|second.json|third.json'
    schema: 'https://json.schemastore.org/swagger-2.0.json'
```

## Basic inputs

### 🔸 `file` **Required**
Path to the JSON or YAML file to be validated.

* Can accept a _glob_ pattern (will validate all matched files)
* Can accept multiple files (or glob patterns) separated by `|` symbol.

### 🔸 `schema`
Path or URL to JSON or YAML file with a schema to validate against.

**Can be empty** if all validated files contain valid `$schema` property.
Input value has a priority over `$schema` property in file if both present. 

### 🔸 `mode` _default value: "default"_
Sets the strictness of the schema compiling. Possible values:
- `lax`: the most relaxed mode
- `default`: used **by default**, doesn't allow unknown keywords and unreachable checks to be present in the schema 
- `strong`: the most strict mode

Read details in [schemasafe documentation](https://github.com/ExodusMovement/schemasafe/blob/master/doc/Options.md).

### 🔸 `refSchemasMap`
Contains a JSON object with the schemas needed to resolve external `$ref`s in the main schema. 
JSON object should contain pairs of:
 - key: id of the external schema
 - value: path to schema file or URL to download schema from

Example: `{"https://my-schemas.com/schema-id": "schema_files/my.schema.json"}`

### 🔸 `refSchemasArray`
Contains a JSON array with the schemas needed to resolve external `$ref`s in the main schema.
JSON array should contain string elements, each pointing to schema file path or URL to download schema from.

All schemas should contain `$id` (or `id` for draft-04) property to be identified.

This input is more convenient alternative for `refSchemasMap` input if all external schemas
contain `$id` property.

Example: `["schema_files/my.schema.json"]`

## Outputs

### 🔹 `errorType`
Is empty if validation succeeds.
* `file`: file loading or parsing failed
* `schema`: schema loading, parsing or refs resolving failed
* `validation`: file data doesn't correspond schema