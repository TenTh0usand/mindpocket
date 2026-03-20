import { expo } from "@better-auth/expo"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { bearer } from "better-auth/plugins/bearer"
import { count } from "drizzle-orm"
import { db } from "@/db/client"
import { user as userTable } from "@/db/schema/auth"

const appUrl =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://127.0.0.1:3000")

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  (process.env.VERCEL_URL ? `${process.env.VERCEL_URL}-preview-secret-fallback` : undefined) ||
  "local-development-secret-local-development-secret"

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
  appUrl,
  "chrome-extension://*",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8081",
  "http://localhost:8081",
  "mindpocket://",
  "exp://",
  "exp://**",
].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index)

export const auth = betterAuth({
  baseURL: appUrl,
  secret: authSecret,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(_data, _request) {
      // Send an email to the user with a link to reset their password.
    },
  },
  // socialProviders: {
  //   google: {
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  //   },
  //   github: {
  //     clientId: process.env.GITHUB_CLIENT_ID!,
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  //   },
  // },
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const result = await db.select({ count: count() }).from(userTable)
          const userCount = result[0]?.count || 0

          if (userCount > 0) {
            throw new APIError("FORBIDDEN", {
              message: "Registration is closed.",
            })
          }
        },
      },
    },
  },
  plugins: [nextCookies(), bearer(), expo()],
})
