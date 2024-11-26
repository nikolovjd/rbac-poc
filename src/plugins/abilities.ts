import {
  AbilityBuilder,
  Ability,
  AbilityClass,
  InferSubjects,
} from '@casl/ability'
import { FastifyRequest } from 'fastify'
import { parseOpenApiSecurity } from '../utils/openapi-parser.js'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'
type Subjects = InferSubjects<string | 'all'>

export type AppAbility = Ability<[Actions, Subjects]>

const operations = parseOpenApiSecurity()

export const scopeToPermissions = new Map<
  string,
  { action: Actions; subject: Subjects }
>()

operations.forEach((op) => {
  op.scopes.forEach((scope) => {
    const [actionPart, subjectPart] = scope.split(':')
    const action = mapScopeActionToAbilityAction(actionPart)
    const subject = subjectPart || 'all'

    scopeToPermissions.set(scope, { action, subject })
  })
})

function mapScopeActionToAbilityAction(scopeAction: string): Actions {
  switch (scopeAction) {
    case 'read':
      return 'read'
    case 'write':
      return 'manage'
    default:
      return 'read'
  }
}

export function buildAbility(request: FastifyRequest): AppAbility {
  const { can, cannot, build } = new AbilityBuilder(
    Ability as AbilityClass<AppAbility>
  )

  const scopes = request.scopes || []

  scopes.forEach((scope: string) => {
    const permission = scopeToPermissions.get(scope)
    if (permission) {
      can(permission.action, permission.subject)
    }
  })

  // If no scopes, deny everything
  if (scopes.length === 0) {
    cannot('manage', 'all')
  }

  return build()
}
