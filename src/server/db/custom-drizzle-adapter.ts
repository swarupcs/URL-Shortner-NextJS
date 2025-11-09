import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "./index"
import { users, accounts, sessions, verificationTokens } from "./schema"
import { eq, and } from "drizzle-orm"

/**
 * Custom Drizzle Adapter that maps NextAuth's default table names
 * to your existing schema (`users`, `accounts`, `sessions`, `verification_token`)
 */
export function CustomDrizzleAdapter() {
  const base = DrizzleAdapter(db)

  return {
    ...base,

    async getUser(id) {
      const [user] = await db.select().from(users).where(eq(users.id, id))
      return user ?? null
    },

    async getUserByEmail(email: string) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
      return user ?? null
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const result = await db
        .select()
        .from(accounts)
        .innerJoin(users, eq(accounts.userId, users.id))
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId)
          )
        )

      return result?.[0]?.users ?? null
    },

    async linkAccount(account) {
      await db.insert(accounts).values(account)
      return account
    },

    async createUser(user) {
      const [newUser] = await db.insert(users).values(user).returning()
      return newUser
    },

    async createSession(session) {
      const [newSession] = await db.insert(sessions).values(session).returning()
      return newSession
    },

    async getSessionAndUser(sessionToken) {
      const result = await db
        .select()
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken))

      const record = result?.[0]
      if (!record) return null

      return {
        session: record.sessions,
        user: record.users,
      }
    },

    async updateUser(user) {
      const [updatedUser] = await db
        .update(users)
        .set(user)
        .where(eq(users.id, user.id))
        .returning()
      return updatedUser
    },

    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))
    },

    async useVerificationToken(identifier_token) {
      const [deleted] = await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier_token.identifier),
            eq(verificationTokens.token, identifier_token.token)
          )
        )
        .returning()
      return deleted ?? null
    },
  }
}
