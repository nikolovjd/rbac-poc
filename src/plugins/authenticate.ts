import { FastifyRequest, FastifyReply } from 'fastify'
import { scopeToPermissions } from './abilities.js'

export async function authenticateOAuth2(
  request: FastifyRequest,
  reply: FastifyReply,
  requiredScopes: string[]
) {
  console.log('Required Scopes:', requiredScopes)
  const authHeader = request.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false // Return false to allow other security handlers
  }

  const token = authHeader.substring(7)

  try {
    const payload = decodeToken(token)
    console.log('Token Scopes:', payload.scopes)
    if (!payload || !payload.scopes || !payload.user || !payload.user.id) {
      return false
    }

    // Check if any of the required scopes are included in the token's scopes
    const hasRequiredScopes =
      requiredScopes.length === 0 ||
      requiredScopes.some((scope) => payload.scopes.includes(scope))

    if (!hasRequiredScopes) {
      return false
    }

    request.user = payload.user
    request.scopes = payload.scopes
    return true // Indicate successful authentication
  } catch (err) {
    return false
  }
}


export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['api_key'] || request.headers['x-api-key']

  if (!apiKey || apiKey !== 'valid_api_key') {
    return false
  }

  request.user = { role: 'api_key_user' }
  request.scopes = Array.from(scopeToPermissions.keys()).filter((scope) =>
    scope.startsWith('read:')
  )
  return true
}


function decodeToken(token: string): any {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    return JSON.parse(decoded)
  } catch (err) {
    throw new Error('Invalid token')
  }
}
