import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Adapter, AdapterSession, AdapterUser } from 'next-auth/adapters';
import { db } from './index';
import { users, accounts, sessions, verificationTokens } from './schema';
import { eq, and, SQLWrapper } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

/**
 * Infer types directly from your Drizzle schema
 */
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type VerificationToken = InferSelectModel<typeof verificationTokens>;
export type NewVerificationToken = InferInsertModel<typeof verificationTokens>;

/**
 * Custom Drizzle Adapter that maps NextAuth's default table names
 * to your existing schema (`users`, `accounts`, `sessions`, `verification_token`)
 */
export function CustomDrizzleAdapter(): Adapter {
  const base = DrizzleAdapter(db);

  return {
    ...base,

    async getUser(id: string | SQLWrapper): Promise<AdapterUser | null> {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user ?? null;
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));
      return user ?? null;
    },

    async getUserByAccount({
      provider,
      providerAccountId,
    }): Promise<AdapterUser | null> {
      const result = await db
        .select()
        .from(accounts)
        .innerJoin(users, eq(accounts.userId, users.id))
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId)
          )
        );

      return result?.[0]?.users ?? null;
    },

    async linkAccount(account: NewAccount): Promise<void> {
      await db.insert(accounts).values(account);
    },

    async createUser(user: NewUser): Promise<AdapterUser> {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    },

    async updateUser(user: Partial<User>): Promise<AdapterUser> {
      const [updatedUser] = await db
        .update(users)
        .set(user)
        .where(eq(users.id, user.id!))
        .returning();
      return updatedUser;
    },

    async createSession(session: NewSession): Promise<AdapterSession> {
      const [newSession] = await db.insert(sessions).values(session).returning();
      return newSession;
    },

    async getSessionAndUser(
      sessionToken: string
    ): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const result = await db
        .select()
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken));

      const record = result?.[0];
      if (!record) return null;

      return {
        session: record.sessions,
        user: record.users,
      };
    },

    async deleteSession(sessionToken: string): Promise<void> {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },

    async useVerificationToken(params: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      const [deleted] = await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, params.identifier),
            eq(verificationTokens.token, params.token)
          )
        )
        .returning();
      return deleted ?? null;
    },
  };
}
