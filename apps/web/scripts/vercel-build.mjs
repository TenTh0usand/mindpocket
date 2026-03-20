import { spawnSync } from "node:child_process"

const packageManagerExec = process.env.npm_execpath
  ? {
      command: process.execPath,
      args: [process.env.npm_execpath],
    }
  : {
      command: process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      args: [],
    }

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function runPnpm(args) {
  run(packageManagerExec.command, [...packageManagerExec.args, ...args])
}

runPnpm(["--filter", "@repo/types", "build"])

if (process.env.DATABASE_URL) {
  console.log("[vercel-build] DATABASE_URL detected, running db bootstrap.")
  runPnpm(["db:bootstrap"])
} else {
  console.log("[vercel-build] DATABASE_URL is missing, skipping db bootstrap.")
}

runPnpm(["exec", "next", "build"])
