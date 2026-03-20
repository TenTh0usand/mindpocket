import { createHash, randomBytes } from "node:crypto"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "@/db/client"
import { apiToken } from "@/db/schema/api-token"

export function generateApiToken() {
  const secret = randomBytes(24).toString("base64url")
  return `mp_${secret}`
}

export function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createApiTokenForUser({
  userId,
  name,
}: {
  userId: string
  name?: string
}) {
  const plaintextToken = generateApiToken()
  const tokenHash = hashApiToken(plaintextToken)

  await db.insert(apiToken).values({
    id: nanoid(),
    userId,
    name: name?.trim() || "Default API Token",
    tokenHash,
    tokenPrefix: plaintextToken.slice(0, 10),
  })

  return plaintextToken
}

export async function listApiTokensForUser(userId: string) {
  return db
    .select({
      id: apiToken.id,
      name: apiToken.name,
      tokenPrefix: apiToken.tokenPrefix,
      createdAt: apiToken.createdAt,
      lastUsedAt: apiToken.lastUsedAt,
    })
    .from(apiToken)
    .where(eq(apiToken.userId, userId))
}

export async function findUserIdByApiToken(token: string) {
  const tokenHash = hashApiToken(token)
  const result = await db
    .select({
      id: apiToken.id,
      userId: apiToken.userId,
    })
    .from(apiToken)
    .where(eq(apiToken.tokenHash, tokenHash))
    .limit(1)

  if (!result[0]) {
    return null
  }

  await db
    .update(apiToken)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiToken.id, result[0].id))

  return result[0].userId
}
