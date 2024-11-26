import { FastifyReply, FastifyRequest } from 'fastify'
import { openDb } from '../db.js'
import { Actions } from '../plugins/abilities.js'

export class Controllers {
  async publicEndpoint(request: FastifyRequest, reply: FastifyReply) {
    reply.send({ message: 'This is a public endpoint' })
  }

  checkAbility(request: FastifyRequest, action: Actions, subject: string) {
    if (!request.ability || !request.ability.can(action, subject)) {
      throw new Error('Forbidden')
    }
  }

  // Product Groups Methods
  async getProductGroups(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'read', 'products')

      const db = await openDb()
      const productGroups = await db.all('SELECT * FROM ProductGroup')
      await db.close()
      reply.send(productGroups)
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async createProductGroup(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'manage', 'products')

      const { name } = request.body as any
      const db = await openDb()
      const result = await db.run(
        'INSERT INTO ProductGroup (name) VALUES (?)',
        [name]
      )
      await db.close()
      reply.code(201).send({ id: result.lastID, name })
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  // Products Methods
  async getProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'read', 'products')

      const db = await openDb()
      const products = await db.all('SELECT * FROM Product')
      await db.close()
      reply.send(products)
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async getProductById(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'read', 'products')

      const { id } = request.params as any
      const db = await openDb()
      const product = await db.get('SELECT * FROM Product WHERE id = ?', [id])
      await db.close()
      if (product) {
        reply.send(product)
      } else {
        reply.code(404).send({ error: 'Product not found' })
      }
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async createProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'manage', 'products')

      const { productGroupId, name } = request.body as any
      const db = await openDb()
      const result = await db.run(
        'INSERT INTO Product (productGroupId, name) VALUES (?, ?)',
        [productGroupId, name]
      )
      await db.close()
      reply.code(201).send({ id: result.lastID, productGroupId, name })
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async updateProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'manage', 'products')

      const { id } = request.params as any
      const { productGroupId, name } = request.body as any
      const db = await openDb()
      const result = await db.run(
        'UPDATE Product SET productGroupId = ?, name = ? WHERE id = ?',
        [productGroupId, name, id]
      )
      await db.close()
      // @ts-ignore
      if (result.changes > 0) {
        reply.send({ id, productGroupId, name })
      } else {
        reply.code(404).send({ error: 'Product not found' })
      }
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async deleteProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'manage', 'products')

      const { id } = request.params as any
      const db = await openDb()
      const result = await db.run('DELETE FROM Product WHERE id = ?', [id])
      await db.close()
      // @ts-ignore
      if (result.changes > 0) {
        reply.code(204).send()
      } else {
        reply.code(404).send({ error: 'Product not found' })
      }
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  // Offers Methods
  async getOffers(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'read', 'offers')

      const db = await openDb()
      const offers = await db.all('SELECT * FROM Offer')
      await db.close()
      reply.send(offers)
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async createOffer(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'manage', 'offers')

      const { productId, merchantId, price } = request.body as any
      const db = await openDb()
      const result = await db.run(
        'INSERT INTO Offer (productId, merchantId, price) VALUES (?, ?, ?)',
        [productId, merchantId, price]
      )
      await db.close()
      reply.code(201).send({ id: result.lastID, productId, merchantId, price })
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async updateOffer(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'manage', 'offers')

      const { id } = request.params as any
      const { productId, merchantId, price } = request.body as any
      const db = await openDb()
      const result = await db.run(
        'UPDATE Offer SET productId = ?, merchantId = ?, price = ? WHERE id = ?',
        [productId, merchantId, price, id]
      )
      await db.close()
      // @ts-ignore
      if (result.changes > 0) {
        reply.send({ id, productId, merchantId, price })
      } else {
        reply.code(404).send({ error: 'Offer not found' })
      }
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async deleteOffer(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'manage', 'offers')

      const { id } = request.params as any
      const db = await openDb()
      const result = await db.run('DELETE FROM Offer WHERE id = ?', [id])
      await db.close()
      // @ts-ignore
      if (result.changes > 0) {
        reply.code(204).send()
      } else {
        reply.code(404).send({ error: 'Offer not found' })
      }
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }
}
