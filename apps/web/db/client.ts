import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { userAiProvider, userAiProviderRelations } from "./schema/ai-provider"
import {
  account,
  accountRelations,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
} from "./schema/auth"
import { bookmark, bookmarkRelations } from "./schema/bookmark"
import { chat, chatRelations, message, messageRelations } from "./schema/chat"
import { embedding } from "./schema/embedding"
import { folder, folderRelations } from "./schema/folder"
import { bookmarkTag, bookmarkTagRelations, tag, tagRelations } from "./schema/tag"

const schema = {
  user,
  session,
  account,
  verification,
  userRelations,
  sessionRelations,
  accountRelations,
  folder,
  folderRelations,
  bookmark,
  bookmarkRelations,
  tag,
  bookmarkTag,
  tagRelations,
  bookmarkTagRelations,
  chat,
  chatRelations,
  message,
  messageRelations,
  embedding,
  userAiProvider,
  userAiProviderRelations,
}

function createMissingDatabaseClient() {
  const throwMissingDatabaseUrl = () => {
    throw new Error("DATABASE_URL is missing. Set it in Vercel or apps/web/.env.local.")
  }

  return new Proxy(throwMissingDatabaseUrl, {
    apply() {
      throwMissingDatabaseUrl()
    },
    get() {
      return throwMissingDatabaseUrl
    },
  })
}

const sql = process.env.DATABASE_URL
  ? neon(process.env.DATABASE_URL)
  : createMissingDatabaseClient()

export const db = drizzle(sql as ReturnType<typeof neon>, { schema })
