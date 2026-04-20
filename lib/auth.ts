import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { dbPool } from "@/lib/db";
import { appendFileSync } from "fs";
import crypto from "crypto";

// Diagnostics logger
const logAuth = async (msg: string) => {
    try {
        appendFileSync("nextauth_trace.log", `${new Date().toISOString()} - ${msg}\n`);
    } catch {}
    console.log(`[NextAuth Trace]: ${msg}`);
    
    // Also log to DB if possible for production visibility
    try {
        await dbPool.query("INSERT INTO rate_limits (key, timestamp) VALUES ($1, now())", [`AUTH_LOG: ${msg.substring(0, 100)}`]);
    } catch {}
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
        const id = user.id || crypto.randomUUID();
        const res = await pool.query(
          `INSERT INTO users (id, name, email, image) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (email) DO UPDATE SET 
             name = COALESCE(users.name, EXCLUDED.name),
             image = COALESCE(users.image, EXCLUDED.image)
           RETURNING *`,
          [id, user.name || null, user.email || null, user.image || null]
        );
        logAuth(`User upserted: ${res.rows[0].id}`);
        const newUser = res.rows[0];
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
        return user ? { ...user, emailVerified: user.email_verified || null } : null;
      } catch (e: any) {
        logAuth(`getUser ERROR: ${e.message}`);
        return null;
      }
    },
    async getUserByEmail(email: string) {
      try {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = res.rows[0];
        return user ? { ...user, emailVerified: user.email_verified || null } : null;
      } catch (e: any) {
        logAuth(`getUserByEmail ERROR: ${e.message}`);
        return null;
      }
    },
    async getUserByAccount({ provider, providerAccountId }: any) {
      try {
        logAuth(`getUserByAccount: ${provider} / ${providerAccountId}`);
        const res = await pool.query(
          `SELECT u.* FROM users u 
           JOIN accounts a ON u.id = a.user_id 
           WHERE a.provider = $1 AND a.provider_account_id = $2`,
          [provider, providerAccountId]
        );
        const user = res.rows[0];
        logAuth(`getUserByAccount result: ${user ? user.email : "not found"}`);
        return user ? { ...user, emailVerified: user.email_verified || null } : null;
      } catch (e: any) {
        logAuth(`getUserByAccount ERROR: ${e.message}`);
        return null;
      }
    },
    async linkAccount(account: any) {
       logAuth(`linkAccount: ${account.provider} for user ${account.userId}`);
       try {
         await pool.query(
          `INSERT INTO accounts (id, user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (provider, provider_account_id) DO UPDATE SET
             refresh_token = COALESCE(EXCLUDED.refresh_token, accounts.refresh_token),
             access_token = COALESCE(EXCLUDED.access_token, accounts.access_token),
             expires_at = COALESCE(EXCLUDED.expires_at, accounts.expires_at),
             id_token = COALESCE(EXCLUDED.id_token, accounts.id_token),
             session_state = COALESCE(EXCLUDED.session_state, accounts.session_state)`,
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
          throw e;
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
  events: {
    async signIn(message: any) { await logAuth(`Event: signIn success for ${message.user.email}`); },
    async createUser(message: any) { await logAuth(`Event: createUser ${message.user.email}`); },
    async linkAccount(message: any) { await logAuth(`Event: linkAccount ${message.account.provider}`); },
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
        try {
            console.log("signIn callback invoked with:", { user, account, profile });
            logAuth(`signIn: ${user?.email} via ${account?.provider}`);
            if (!user || !account) {
                logAuth(`signIn FAILED: Missing user or account data`);
                return false;
            }
            return true;
        } catch (e: any) {
            logAuth(`CRITICAL CALLBACK ERROR: ${e.message}`);
            return false;
        }
    },
    async redirect({ url, baseUrl }) {
        // Use the root domain only (strip www if it exists)
        // const rootBase = baseUrl;
        if (url.includes('/app')) return `${baseUrl}/app`;
        if (url.startsWith("/")) return `${baseUrl}${url}`;
        return baseUrl;
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
  // Use standard NextAuth cookie names for maximum compatibility with Vercel/Next.js
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
};
