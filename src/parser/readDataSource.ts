import * as fs from "fs-extra";
import * as path from "path";
import {ActualParserType, getParserTypeByContentType, getParserTypeByFileExt} from "./parserType";
import axios from "axios";

export interface DataResult {
    name: string
    data: string,
    dataType: ActualParserType|undefined
}

export async function readDataFile(filePath: string): Promise<DataResult> {
    return {
        data: (await fs.readFile(filePath)).toString(),
        name: filePath,
        dataType: getParserTypeByFileExt(path.extname(filePath))
    }
}

export async function readDataUrl(url: string): Promise<DataResult> {
    const response = await axios.get(url, {
        responseType: 'text'
    });
    return {
        data: response.data,
        name: url,
        dataType: getParserTypeByContentType(response.headers['content-length'])
    }
}