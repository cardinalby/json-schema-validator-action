export enum ParserType {
    JSON = 'json',
    YAML = 'yaml',
    AUTO = 'auto'
}

export type ActualParserType = ParserType.YAML | ParserType.JSON

export function asActualParserType(value: string): ActualParserType {
    if (value != ParserType.JSON && value != ParserType.YAML) {
        throw new Error(`Invalid parser type '${value}'`)
    }
    return value
}

const JSON_CONTENT_TYPES = ["application/json"]
const YAML_CONTENT_TYPES = [
    "text/x-yaml",
    "text/yaml",
    "text/yml",
    "application/x-yaml",
    "application/x-yml",
    "application/yaml",
    "application/yml"
]

export function getParserTypeByContentType(contentType: string): ActualParserType|undefined {
    if (JSON_CONTENT_TYPES.indexOf(contentType.toLowerCase()) != -1) {
        return ParserType.JSON
    }
    if (YAML_CONTENT_TYPES.indexOf(contentType.toLowerCase()) != -1) {
        return ParserType.YAML
    }
    return undefined
}

export function getParserTypeByFileExt(ext: string): ActualParserType|undefined {
    switch (ext) {
        case ".json": return ParserType.JSON
        case ".yml": case ".yaml": return ParserType.YAML
    }
    return undefined
}