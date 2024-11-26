// index.ts
import Fastify from 'fastify'
import * as yaml from 'js-yaml'
import * as fs from 'fs'
import { dirname, join } from 'path'
import fastifyAuth from '@fastify/auth'
import {
  authenticateOAuth2,
  authenticateApiKey,
} from './plugins/authenticate.js'
import { Controllers } from './controllers/index.js'
import fastifyOpenapiGlue from 'fastify-openapi-glue'
import { buildAbility, AppAbility } from './plugins/abilities.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

declare module 'fastify' {
  interface FastifyRequest {
    user?: any
    scopes?: string[]
    ability?: AppAbility
  }

  interface FastifyInstance {
    authenticateOAuth2: typeof authenticateOAuth2
    authenticateApiKey: typeof authenticateApiKey
  }
}

const app = Fastify()

const apiSpec = yaml.load(
  fs.readFileSync(join(__dirname, '../api.yaml'), 'utf8')
) as any

const glueOptions = {
  specification: apiSpec,
  service: new Controllers(),
  noAdditional: true,
  securityHandlers: {
    // @ts-ignore
    poc_auth: async function (req, reply, scopes) {
      try {
        await app.authenticateOAuth2(req, reply, scopes)
        req.ability = buildAbility(req)
        return true // Indicate successful authentication
      } catch (err) {
        // @ts-ignore
        throw app.httpErrors.unauthorized('Unauthorized')
      }
    },
    // @ts-ignore
    api_key: async function (req) {
      try {
        await app.authenticateApiKey(req, req)
        req.ability = buildAbility(req)
        return true
      } catch (err) {
        // @ts-ignore
        throw app.httpErrors.unauthorized('Unauthorized')
      }
    },
  },
}

app.register(fastifyAuth)

app.decorate('authenticateOAuth2', authenticateOAuth2)
app.decorate('authenticateApiKey', authenticateApiKey)

// Pre-handler to check security requirements
/*app.addHook('preHandler', async (request, reply) => {
  // @ts-ignore
  console.log('Route Schema:', request.routeSchema);
  // @ts-ignore
  const security = request.routeSchema?.security;
  console.log('Security:', security);

  if (security) {
    let authenticated = false;
    for (const secRequirement of security) {
      try {
        if (secRequirement.poc_auth) {
          await app.authenticateOAuth2(request, reply, secRequirement.poc_auth);
          authenticated = true;
          break;
        } else if (secRequirement.api_key) {
          await app.authenticateApiKey(request, reply);
          authenticated = true;
          break;
        }
      } catch (err) {
        // Continue to try next security requirement
      }
    }

    if (!authenticated) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    // Build abilities based on user's scopes
    request.ability = buildAbility(request);
  }
});*/

app.register(fastifyOpenapiGlue, glueOptions)

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' })
    console.log('Server listening at http://localhost:3000')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
