const userId = process.argv[2]
const role = process.argv[3]
const scopesInput = process.argv.slice(4)

if (!userId || !role || scopesInput.length === 0) {
  console.error(
    'Usage: ts-node src/scripts/generate-token.ts <userId> <role> <scopes>'
  )
  process.exit(1)
}

const payload = {
  user: { id: userId, role },
  scopes: scopesInput,
}

const token = Buffer.from(JSON.stringify(payload)).toString('base64')

console.log(
  `OAuth2 Token for userId ${userId}, role ${role} with scopes ${scopesInput.join(', ')}:`
)
console.log(`Bearer ${token}`)
