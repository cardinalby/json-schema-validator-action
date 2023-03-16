const execSync = require("child_process").execSync;
const fs = require("fs")
const readDirRecursive = require('fs-readdir-recursive')
const deepForEach = require('deep-for-each');
const path = require('path')

const githubCodeLoadUrl = 'https://codeload.github.com/'
const repoOwner = 'ExodusMovement'
const repoName = 'schemasafe'
const repoBranch = 'master'
const repoDir = 'test/schemas'
const schemasDstLocalDir = 'metaSchemas/schemas'
const outputDictFilepath = 'metaSchemas/schema-files.json'

const downloadCmd = `cd ${schemasDstLocalDir} && curl ${githubCodeLoadUrl}${repoOwner}/${repoName}/tar.gz/${repoBranch}` +
    ` | tar -xz --strip=3 ${repoName}-${repoBranch}/${repoDir}`;

updateMetaSchemas()

function getSchemaId(schema) {
    return schema['$id'] || schema['id']
}

function stripIdFragment(id) {
    const fragmentSignIndex = id.indexOf('#')
    return fragmentSignIndex !== -1
        ? id.substring(0, fragmentSignIndex)
        : id
}

/**
 * @param schema {any}
 * @param schemaId {string}
 * @param fileBaseName {string}
 * @return {[string]}}
 */
function collectNonLocalRefs(schema, schemaId, fileBaseName) {
    const refs = new Set()
    let baseUri = schemaId.endsWith(fileBaseName)
        ? schemaId.slice(0, -fileBaseName.length)
        : schemaId
    deepForEach(schema, (value, key) => {
        if (key === '$ref' && typeof value === 'string' && value.length > 0 && value[0] !== '#') {
            let ref = stripIdFragment(value)
            if (ref.endsWith('.json')) {
                ref = ref.substring(0, -'.json'.length)
            }
            // noinspection HttpUrlsUsage
            if (!ref.startsWith('http://') && !ref.startsWith('https://')) {
                ref = baseUri + ref
            }
            refs.add(ref)
        }
    })
    return Array.from(refs)
}

function updateMetaSchemas() {
    execSync(downloadCmd)

    const metaSchemas = Object.fromEntries(readDirRecursive(schemasDstLocalDir)
        .filter(fileName => path.extname(fileName) === '.json')
        .map(filePath => {
            const schema = JSON.parse(fs.readFileSync(path.join(schemasDstLocalDir, filePath)).toString())
            let schemaId = getSchemaId(schema)
            if (schemaId === undefined) {
                throw Error(`id not found in ${filePath}`)
            }
            schemaId = stripIdFragment(schemaId)
            return [
                schemaId,
                {
                    filePath: filePath,
                    refs: collectNonLocalRefs(schema, schemaId, path.basename(filePath, '.json'))
                }
            ]
        }))

    if (Object.keys(metaSchemas).length === 0) {
        throw new Error("No meta-schemas have been downloaded")
    }

    // Check all refs are resolving
    for (let id in metaSchemas) {
        if (metaSchemas.hasOwnProperty(id)) {
            const refs = metaSchemas[id].refs
            for (let ref of refs) {
                if (!metaSchemas.hasOwnProperty(ref)) {
                    throw new Error(`Schema "${id}" has unknown ref "${ref}"`)
                }
            }
        }
    }

    console.log(metaSchemas)
    fs.writeFileSync(outputDictFilepath, JSON.stringify(metaSchemas, null, 2))
}