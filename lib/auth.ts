import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { dbPool } from "@/lib/db";
import { appendFileSync } from "fs";

// Diagnostics logger
const logAuth = (msg: string) => {
    try {
        appendFileSync("nextauth_trace.log", `${new Date().toISOString()} - ${msg}\n`);
    } catch {}
    console.log(`[NextAuth Trace]: ${msg}`);
};

/**
 * CUSTOM ADAPTER FOR SUPABASE / POSTGRES
 * Matches the actual schema found in the database.
 */
const customAdapter = (pool: any) => {
  return {
    async createUser(user: any) {
      logAuth(`createUser: ${user.email}`);
      try {
        // Generating a UUID if one isn't provided
        const id = user.id || crypto.randomUUID();
        const res = await pool.query(
          'INSERT INTO users (id, name, email, image) VALUES ($1, $2, $3, $4) RETURNING *',
          [id, user.name || null, user.email || null, user.image || null]
        );
        logAuth(`User created: ${id}`);
        const newUser = res.rows[0];
        // Map back to camelCase for NextAuth internal consistency
        return { 
            ...newUser, 
            emailVerified: newUser.email_verified || newUser.emailVerified || null 
        };
      } catch (e: any) {
        logAuth(`createUser ERROR: ${e.message}`);
        throw e;
      }
    },
    async getUser(id: string) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        const user = res.rows[0];
        return user ? { ...user, emailVerified: user.email_verified || user.emailVerified || null } : null;
      } catch (e: any) {
        logAuth(`getUser ERROR: ${e.message}`);
        return null;
      }
    },
    async getUserByEmail(email: string) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = res.rows[0];
        return user ? { ...user, emailVerified: user.email_verified || user.emailVerified || null } : null;
      } catch (e: any) {
        logAuth(`getUserByEmail ERROR: ${e.message}`);
        return null;
      }
    },
    async getUserByAccount({ provider, providerAccountId }: any) {
      try {
        logAuth(`getUserByAccount: ${provider} / ${providerAccountId}`);
        // Matching actual DB columns: userId, providerAccountId (camelCase found in dump)
        const res = await pool.query(
          `SELECT u.* FROM users u 
           JOIN accounts a ON u.id = a."userId" 
           WHERE a.provider = $1 AND a."providerAccountId" = $2`,
          [provider, providerAccountId]
        );
        const user = res.rows[0];
        logAuth(`getUserByAccount result: ${user ? user.email : "not found"}`);
        return user ? { ...user, emailVerified: user.email_verified || user.emailVerified || null } : null;
      } catch (e: any) {
        logAuth(`getUserByAccount ERROR: ${e.message}`);
        // Fallback: If "userId" fails, try user_id (snake_case)
        try {
            const res = await pool.query(
                `SELECT u.* FROM users u 
                 JOIN accounts a ON u.id = a.user_id 
                 WHERE a.provider = $1 AND a.provider_account_id = $2`,
                [provider, providerAccountId]
            );
            return res.rows[0];
        } catch {
            return null;
        }
      }
    },
    async linkAccount(account: any) {
       logAuth(`linkAccount: ${account.provider} for user ${account.userId}`);
       try {
         // Using double quotes for camelCase columns which are often the default in PG if created via certain tools
         await pool.query(
          `INSERT INTO accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            crypto.randomUUID(),
            account.userId, 
            account.type, 
            account.provider, 
            account.providerAccountId, 
            account.refresh_token, 
            account.access_token, 
            account.expires_at, 
            account.token_type, 
            account.scope, 
            account.id_token, 
            account.session_state
          ]
        );
        logAuth(`Account linked successfully`);
       } catch (e: any) {
          logAuth(`linkAccount ERROR: ${e.message}`);
          // Fallback to snake_case if camelCase fails
          try {
            await pool.query(
                `INSERT INTO accounts (user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [account.userId, account.type, account.provider, account.providerAccountId, account.refresh_token, account.access_token, account.expires_at, account.token_type, account.scope, account.id_token, account.session_state]
              );
          } catch (e2: any) {
            logAuth(`linkAccount Fallback ERROR: ${e2.message}`);
            throw e2;
          }
       }
    }
  };
};

export const authOptions: NextAuthOptions = {
  adapter: customAdapter(dbPool) as any,
  debug: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
        logAuth(`signIn: ${user?.email}`);
        return true;
    },
    async redirect({ url, baseUrl }) {
        // Force redirect to /app
        return baseUrl + "/app";
    },
    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
};
