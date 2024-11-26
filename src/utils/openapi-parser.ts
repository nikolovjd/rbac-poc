import yaml from 'js-yaml'
import fs from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface SecurityRequirement {
  scopes: string[]
}

export interface OperationInfo {
  path: string
  method: string
  operationId: string
  scopes: string[]
}
export function parseOpenApiSecurity() {
  const apiSpec = yaml.load(
    fs.readFileSync(join(__dirname, '../../api.yaml'), 'utf8')
  ) as any
  const operations: OperationInfo[] = []

  const paths = apiSpec.paths
  for (const path in paths) {
    const methods = paths[path]
    for (const method in methods) {
      const operation = methods[method]
      const operationId = operation.operationId || `${method}_${path}`
      const securities = operation.security || apiSpec.security
      const scopesSet = new Set<string>()

      if (securities) {
        for (const sec of securities) {
          if (sec.poc_auth) {
            sec.poc_auth.forEach((scope: string) => scopesSet.add(scope))
          }
        }
      }

      operations.push({
        path,
        method: method.toLowerCase(),
        operationId,
        scopes: Array.from(scopesSet),
      })
    }
  }

  return operations
}
