import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'

import {
  describeRoute,
  openAPIRouteHandler,
  resolver,
  validator,
} from 'hono-openapi'

import { z } from 'zod'

import { apiReference, Scalar } from '@scalar/hono-api-reference'

/* -------------------- */
/* Schemas (Zod) */
/* -------------------- */

const BugSchema = z.object({
  title: z.string(),
  description: z.string(),
})

const BugArraySchema = z.array(BugSchema)

/* -------------------- */
/* App setup */
/* -------------------- */

const app = new Hono()
app.use('*', cors())

type Bug = z.infer<typeof BugSchema>
const bugs: Bug[] = []

/* -------------------- */
/* Routes */
/* -------------------- */

// GET / → list bugs
app.get(
  '/',
  describeRoute({
    description: 'Get all bugs',
    responses: {
      200: {
        description: 'List of bugs',
        content: {
          'application/json': {
            schema: resolver(BugArraySchema),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json(bugs)
  }
)

// POST / → create bug
app.post(
  '/',
  describeRoute({
    description: 'Create a new bug',
    responses: {
      201: {
        description: 'Bug created',
        content: {
          'application/json': {
            schema: resolver(BugSchema),
          },
        },
      },
    },
  }),
  validator('json', BugSchema),
  (c) => {
    const body = c.req.valid('json')

    const newBug: Bug = {
      title: body.title,
      description: body.description,
    }

    bugs.push(newBug)

    return c.json(newBug, 201)
  }
)

/* -------------------- */
/* OpenAPI + Scalar */
/* -------------------- */

app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Bug Tracker API',
        version: '1.0.0',
        description: 'Bug API built with Hono + Zod + OpenAPI',
      },
      servers: [
        {
          url: 'http://localhost:3000/openapi',
          description: 'Local server',
        },
      ],
    },
  })
)
// for scalar
const baseUrl =
  process.env.NODE_ENV === 'production'
    ? 'https://your-api-domain.com'
    : 'http://localhost:3000'
app.get(
  '/scalar',
  apiReference({
    
      url: 'http://localhost:3000/openapi',
    
  })
)

/* -------------------- */
/* Server */
/* -------------------- */

serve({
  fetch: app.fetch,
  port: 3000,
})

console.log('🚀 API running at http://localhost:3000')
console.log('📘 OpenAPI JSON at http://localhost:3000/openapi')
console.log('🧭 Scalar Docs at http://localhost:3000/scalar')


export default app;