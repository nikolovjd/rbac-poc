const userId = process.argv[2]
const scopesInput = process.argv.slice(3)

if (!userId || scopesInput.length === 0) {
  console.error(
    'Usage: ts-node src/scripts/generate-token.ts <userId> <scopes>'
  )
  process.exit(1)
}

const payload = {
  user: { id: userId },
  scopes: scopesInput,
}

const token = Buffer.from(JSON.stringify(payload)).toString('base64')

console.log(
  `OAuth2 Token for userId ${userId} with scopes ${scopesInput.join(', ')}:`
)
console.log(`Bearer ${token}`)
