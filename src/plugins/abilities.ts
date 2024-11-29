import {
  AbilityBuilder,
  Ability,
  AbilityClass,
  InferSubjects,
} from '@casl/ability'
import { FastifyRequest } from 'fastify'
import { Offer } from '../models/Offer.js'
import { parseOpenApiSecurity } from '../utils/openapi-parser.js'
import { Product } from '../models/Product.js'
import { ProductGroup } from '../models/ProductGroup.js'

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage'

/*export type Subjects =
  | 'Offer'
  | 'Product'
  | 'ProductGroup'
  | Offer
  | Product
  | ProductGroup
  | 'all'*/

export type Subjects = 'Offer' | 'Product' | 'ProductGroup' | 'all'

export type AppAbility = Ability<[Actions, Subjects | any]>
export const AppAbility = Ability as AbilityClass<AppAbility>

const subjectMap: { [key: string]: Subjects } = {
  'offers': 'Offer',
  'Offer': 'Offer',
  'products': 'Product',
  'Product': 'Product',
  'product-groups': 'ProductGroup',
  'ProductGroup': 'ProductGroup',
  'all': 'all',
}

const operations = parseOpenApiSecurity()

export const scopeToPermissions = new Map<
  string,
  { action: Actions; subject: Subjects }
>()

operations.forEach((op) => {
  op.scopes.forEach((scope) => {
    const { action, subject } = parseScope(scope)
    console.log('ACTION', action)
    console.log('SUBJECT', subject)
    scopeToPermissions.set(scope, { action, subject })
  })
})

function mapScopeActionToAbilityAction(scopeAction: string): Actions {
  switch (scopeAction) {
    case 'read':
      return 'read'
    case 'write':
      return 'create'
    case 'update':
      return 'update'
    case 'delete':
      return 'delete'
    case 'manage':
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
  const subject = subjectMap[subjectPart] || 'all'

  console.log('Scope:', scope)
  console.log('Subject Part:', subjectPart)
  console.log('Mapped Subject:', subject)

  let condition = undefined
  if (ownershipPart === 'owner') {
    condition = { merchantId: '${userId}' }
  }

  return { action, subject, condition }
}


export function buildAbility(request: FastifyRequest): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(Ability as AbilityClass<AppAbility>)

  const scopes = request.scopes || []
  const userId = request.user.id

  /*
  const userRole = request.user.role
  if (userRole === 'admin') {
    can('manage', 'all')
  } else {
    // Process scopes as usual
  }
  */

  scopes.forEach((scope: string) => {
    const { action, subject: abilitySubject, condition } = parseScope(scope)
    if (condition) {
      // Replaces '${userId}' with actual userId
      const conditionWithUserId: Record<string, any> = {}
      for (const key in condition) {
        const value = condition[key]
        if (typeof value === 'string' && value === '${userId}') {
          conditionWithUserId[key] = userId
        } else {
          conditionWithUserId[key] = value
        }
      }
      can(action, abilitySubject as Subjects, conditionWithUserId)
    } else {
      can(action, abilitySubject as Subjects)
    }
  })

  // If no scopes, deny everything
  if (scopes.length === 0) {
    cannot('manage', 'all')
  }

  return build({
    detectSubjectType: (item) => {
      if (item && 'merchantId' in item && 'price' in item) {
        return 'Offer'
      }
      if (item && 'productGroupId' in item && 'name' in item) {
        return 'Product'
      }
      if (item && 'name' in item && !('productGroupId' in item)) {
        return 'ProductGroup'
      }
      return 'all'
    },
  })
}


