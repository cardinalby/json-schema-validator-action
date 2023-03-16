import YAML from "yaml";
import * as ghActions from "@actions/core";

export function parseObject(data: string, name: string): any {
    for (let parser of [
        {name: 'JSON', parse: (s: string) => JSON.parse(s)},
        {name: 'YAML', parse: (s: string) => YAML.parse(s)},
    ]) {
        try {
            const result = parser.parse(data);
            ghActions.info(`Contents of '${name}' has been parsed as ${parser.name} ${typeof result}`);
            return result;
        } catch (err) {
        }
    }
    throw new Error(`Contents of '${name}' aren't a valid JSON or YAML`);
}