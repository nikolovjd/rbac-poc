const role = process.argv[2]
const scopesInput = process.argv.slice(3)

if (!role || scopesInput.length === 0) {
  console.error(
    'Usage: ts-node src/scripts/generate-oauth2-token.ts <role> <scopes>'
  )
  process.exit(1)
}

const payload = {
  user: { role },
  scopes: scopesInput,
}

const token = Buffer.from(JSON.stringify(payload)).toString('base64')

console.log(
  `OAuth2 Token for role ${role} with scopes ${scopesInput.join(', ')}:`
)
console.log(`Bearer ${token}`)
