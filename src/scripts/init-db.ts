import { openDb } from '../db.js'

async function initDb() {
  const db = await openDb()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS ProductGroup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Product (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productGroupId INTEGER,
      name TEXT NOT NULL,
      FOREIGN KEY(productGroupId) REFERENCES ProductGroup(id)
    );

    CREATE TABLE IF NOT EXISTS Offer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER,
      merchantId INTEGER,
      price REAL,
      FOREIGN KEY(productId) REFERENCES Product(id)
    );
  `)

  console.log('Database initialized')
  await db.close()
}

initDb()
