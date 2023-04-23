import * as ghActions from '@actions/core';
import {ErrorType} from "./errors";

export const actionOutputs = {
    set errorType(value: ErrorType) {
        ghActions.setOutput('errorType' as keyof RawActionOutputs, value)
    },
}

export type RawActionOutputs = Partial<{
    errorType: ErrorType
}>