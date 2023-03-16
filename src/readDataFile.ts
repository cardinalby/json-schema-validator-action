import {parseObject} from "./parseObject";
import * as fs from "fs-extra";
import {FileValidationError} from "./errors";

export async function readAndParseFileData(file: string): Promise<any> {
    try {
        return parseObject((await fs.readFile(file)).toString(), file);
    } catch (err) {
        throw new FileValidationError('Error reading file. ' + err);
    }
}