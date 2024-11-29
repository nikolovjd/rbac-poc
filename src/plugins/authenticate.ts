import { FastifyRequest, FastifyReply } from 'fastify'
import { scopeToPermissions } from './abilities.js'

export async function authenticateOAuth2(
  request: FastifyRequest,
  reply: FastifyReply,
  requiredScopes: string[]
) {
  const authHeader = request.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const token = authHeader.substring(7)

  try {
    const payload = decodeToken(token)
    if (!payload || !payload.scopes || !payload.user || !payload.user.id) {
      throw new Error('Invalid token')
    }

    // Verify that the token's scopes include the required scopes
    const hasRequiredScopes = requiredScopes.every((scope) =>
      payload.scopes.includes(scope)
    )
    if (!hasRequiredScopes) {
      throw new Error('Insufficient scope')
    }

    request.user = payload.user
    request.scopes = payload.scopes
  } catch (err) {
    throw new Error('Invalid token')
  }
}

export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['api_key'] || request.headers['x-api-key']

  if (!apiKey) {
    throw new Error('API key is missing')
  }

  if (apiKey !== 'valid_api_key') {
    throw new Error('Invalid API key')
  }

  request.user = { role: 'api_key_user' }
  request.scopes = Array.from(scopeToPermissions.keys()).filter((scope) =>
    scope.startsWith('read:')
  )
}

function decodeToken(token: string): any {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    return JSON.parse(decoded)
  } catch (err) {
    throw new Error('Invalid token')
  }
}
