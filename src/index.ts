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
      const isAuthenticated = await app.authenticateOAuth2(req, reply, scopes)
      if (isAuthenticated) {
        req.ability = buildAbility(req)
        return true
      } else {
        return false
      }
    },
    // @ts-ignore
    api_key: async function (req, reply) {
      const isAuthenticated = await app.authenticateApiKey(req, reply)
      if (isAuthenticated) {
        req.ability = buildAbility(req)
        return true
      } else {
        return false
      }
    },
  },
}

app.register(fastifyAuth)

app.decorate('authenticateOAuth2', authenticateOAuth2)
app.decorate('authenticateApiKey', authenticateApiKey)

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
