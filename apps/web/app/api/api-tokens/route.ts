import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createApiTokenForUser, listApiTokensForUser } from "@/lib/api-token"

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function GET() {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tokens = await listApiTokensForUser(user.id)
  return NextResponse.json({ tokens })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { name?: string }
  const token = await createApiTokenForUser({
    userId: user.id,
    name: body.name,
  })

  return NextResponse.json(
    {
      token,
      message: "API token created. Copy it now because it will not be shown again.",
    },
    { status: 201 }
  )
}
