import { openDb } from '../db.js'

async function seedDb() {
  const db = await openDb()

  await db.run(`INSERT INTO ProductGroup (name) VALUES ('iPhone 15 Pro Max')`)
  await db.run(
    `INSERT INTO Product (productGroupId, name) VALUES (1, 'iPhone 15 Pro Max 512GB Red')`
  )
  await db.run(
    `INSERT INTO Offer (productId, merchantId, price) VALUES (1, 1, 1299.99)`
  )

  console.log('Database seeded')
  await db.close()
}

seedDb()
