import * as yaml from "js-yaml";
import * as ghActions from "@actions/core";
import {ActualParserType, ParserType} from "./parserType";

export interface ParseableData {
    name: string
    data: string
}

type Parser = (s: string) => any

function getParser(parserType: ActualParserType): Parser {
    switch (parserType) {
        case ParserType.JSON: return JSON.parse
        case ParserType.YAML: return yaml.load
    }
    throw new Error(`Unknown parser type '${parserType}'`)
}

export function parseObject(
    data: ParseableData,
    parserTypes: ActualParserType|ActualParserType[]|undefined
): any {
    if (parserTypes == undefined) {
        parserTypes = [ParserType.JSON, ParserType.YAML]
    } else if (!Array.isArray(parserTypes)) {
        parserTypes = [parserTypes]
    }
    const errors: string[] = []
    for (let parserType of parserTypes) {
        try {
            const result = getParser(parserType as ActualParserType)(data.data)
            ghActions.info(`Contents of '${data.name}' has been parsed as ${parserType} ${typeof result}`);
            return result;
        } catch (err) {
            errors.push(`${parserType}: ${err}`)
        }
    }
    throw new Error(`Contents of '${data.name}' aren't a valid ${parserTypes.join(' or ')}: ${errors.join('; ')}`);
}