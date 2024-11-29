import { FastifyReply, FastifyRequest } from 'fastify'
import { openDb } from '../db.js'
import { Actions, AppAbility, Subjects } from '../plugins/abilities.js'
import { Offer } from '../models/Offer.js'
import { Product } from '../models/Product.js'
import { ProductGroup } from '../models/ProductGroup.js'
import { subject } from '@casl/ability'

export class Controllers {
  async publicEndpoint(request: FastifyRequest, reply: FastifyReply) {
    reply.send({ message: 'This is a public endpoint' })
  }

  checkAbility(
    request: FastifyRequest,
    action: Actions,
    resource: Subjects | any
  ) {
    const ability = request.ability as AppAbility
    if (!ability) {
      throw new Error('Ability is undefined')
    }

    if (typeof resource === 'string') {
      // Resource is a subject string
      // @ts-ignore
      if (!ability.can(action, resource)) {
        throw new Error('Forbidden')
      }
    } else {
      // Resource is an instance
      if (!ability.can(action, resource)) {
        throw new Error('Forbidden')
      }
    }
  }


  // Product Groups Methods
  async getProductGroups(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'read', 'ProductGroup')

      const db = await openDb()
      const productGroupsData = await db.all('SELECT * FROM ProductGroup')
      await db.close()

      // Map data to ProductGroup instances
      const productGroups = productGroupsData.map(
        (data: any) => new ProductGroup(data)
      )

      reply.send(productGroups)
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async createProductGroup(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'create', 'ProductGroup')

      const { name } = request.body as any
      const db = await openDb()
      const result = await db.run('INSERT INTO ProductGroup (name) VALUES (?)', [
        name,
      ])
      await db.close()
      reply.code(201).send({ id: result.lastID, name })
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  // Products Methods
  async getProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'read', 'Product')

      const db = await openDb()
      const productsData = await db.all('SELECT * FROM Product')
      await db.close()

      // Map data to Product instances
      const products = productsData.map((data: any) => new Product(data))

      reply.send(products)
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async getProductById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any
      const db = await openDb()
      const productData = await db.get('SELECT * FROM Product WHERE id = ?', [id])
      await db.close()

      if (productData) {
        const product = new Product(productData)
        this.checkAbility(request, 'read', product)
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
      this.checkAbility(request, 'create', 'Product')

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
      const { id } = request.params as any
      const db = await openDb()
      const existingProductData = await db.get(
        'SELECT * FROM Product WHERE id = ?',
        [id]
      )

      if (!existingProductData) {
        await db.close()
        reply.code(404).send({ error: 'Product not found' })
        return
      }

      const existingProduct = new Product(existingProductData)
      this.checkAbility(request, 'update', existingProduct)

      const { productGroupId, name } = request.body as any
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
      const { id } = request.params as any
      const db = await openDb()
      const existingProductData = await db.get(
        'SELECT * FROM Product WHERE id = ?',
        [id]
      )

      if (!existingProductData) {
        await db.close()
        reply.code(404).send({ error: 'Product not found' })
        return
      }

      const existingProduct = new Product(existingProductData)
      this.checkAbility(request, 'delete', existingProduct)

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
      const ability = request.ability as AppAbility
      if (!ability) {
        throw new Error('Ability is undefined')
      }

      const db = await openDb()
      const offersData = await db.all('SELECT * FROM Offer')
      await db.close()

      // Use plain objects instead of class instances
      const offers = offersData
        .map((data: any) => ({
          ...data,
          merchantId: String(data.merchantId), // Ensure merchantId is a string
        }))
        .filter((offer) => {
          const canRead = ability.can('read', offer)
          console.log(
            `Offer ID: ${offer.id}, Merchant ID: ${offer.merchantId}, User ID: ${request.user.id}, Can Read: ${canRead}`
          )
          return canRead
        })

      reply.send(offers)
    } catch (err) {
      console.error(err)
      reply.code(403).send({ error: 'Forbidden' })
    }
  }


  async getOfferById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any
      const db = await openDb()
      const offerData = await db.get('SELECT * FROM Offer WHERE id = ?', [id])
      await db.close()

      if (offerData) {
        const offer = new Offer(offerData)
        this.checkAbility(request, 'read', offer)
        reply.send(offer)
      } else {
        reply.code(404).send({ error: 'Offer not found' })
      }
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async createOffer(request: FastifyRequest, reply: FastifyReply) {
    try {
      this.checkAbility(request, 'create', 'Offer')

      const { productId, price } = request.body as any
      const merchantId = request.user.id
      const db = await openDb()
      const result = await db.run(
        'INSERT INTO Offer (productId, merchantId, price) VALUES (?, ?, ?)',
        [productId, merchantId, price]
      )
      await db.close()
      reply
        .code(201)
        .send({ id: result.lastID, productId, merchantId, price })
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async updateOffer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any
      const db = await openDb()
      const existingOfferData = await db.get('SELECT * FROM Offer WHERE id = ?', [
        id,
      ])

      if (!existingOfferData) {
        await db.close()
        reply.code(404).send({ error: 'Offer not found' })
        return
      }

      const existingOffer = new Offer(existingOfferData)
      this.checkAbility(request, 'update', existingOffer)

      const { productId, price } = request.body as any
      const result = await db.run(
        'UPDATE Offer SET productId = ?, price = ? WHERE id = ?',
        [productId, price, id]
      )
      await db.close()
      // @ts-ignore
      if (result.changes > 0) {
        reply.send({
          id,
          productId,
          merchantId: existingOffer.merchantId,
          price,
        })
      } else {
        reply.code(404).send({ error: 'Offer not found' })
      }
    } catch (err) {
      reply.code(403).send({ error: 'Forbidden' })
    }
  }

  async deleteOffer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any
      const db = await openDb()
      const existingOfferData = await db.get('SELECT * FROM Offer WHERE id = ?', [
        id,
      ])

      if (!existingOfferData) {
        await db.close()
        reply.code(404).send({ error: 'Offer not found' })
        return
      }

      const existingOffer = new Offer(existingOfferData)
      this.checkAbility(request, 'delete', existingOffer)

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