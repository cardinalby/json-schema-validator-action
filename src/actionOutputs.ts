import * as ghActions from '@actions/core';

export const OUTPUT_ERROR_TYPE = 'errorType'

export const actionOutputs = {
    set [OUTPUT_ERROR_TYPE](value: string) { ghActions.setOutput(OUTPUT_ERROR_TYPE, value); },
}