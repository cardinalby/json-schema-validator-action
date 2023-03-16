import {glob} from "glob";

export async function getFilePaths(fileInput: string): Promise<string[]> {
    const parts = fileInput.split('|');
    const matches = await Promise.all(parts.map(part => glob(part)));
    return matches.flat();
}