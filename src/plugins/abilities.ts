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

function parseScope(scope: string): {
  action: Actions
  subject: Subjects
  condition?: any
} {
  const parts = scope.split(':')
  const actionPart = parts[0]
  const subjectPart = parts[1] || 'all'
  const ownershipPart = parts[2]

  const action = mapScopeActionToAbilityAction(actionPart)
  const subject = subjectPart

  let condition = undefined
  if (ownershipPart === 'owner') {
    if (subject === 'offers') {
      condition = { merchantId: '${userId}' }
    } else if (subject === 'products') {
      condition = { ownerId: '${userId}' }
    }
  }

  return { action, subject, condition }
}

export function buildAbility(request: FastifyRequest): AppAbility {
  const { can, cannot, build } = new AbilityBuilder(
    Ability as AbilityClass<AppAbility>
  )

  const scopes = request.scopes || []
  const userId = request.user.id

  scopes.forEach((scope: string) => {
    const { action, subject, condition } = parseScope(scope)
    if (condition) {
      // Replace any '${userId}' with actual userId
      const conditionWithUserId = {}
      for (const key in condition) {
        const value = condition[key]
        if (typeof value === 'string' && value === '${userId}') {
          // @ts-ignore
          conditionWithUserId[key] = userId
        } else {
          // @ts-ignore
          conditionWithUserId[key] = value
        }
      }
      can(action, subject, conditionWithUserId)
    } else {
      can(action, subject)
    }
  })

  // If no scopes, deny everything
  if (scopes.length === 0) {
    cannot('manage', 'all')
  }

  return build()
}
