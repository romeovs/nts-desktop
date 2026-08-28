import fs from "node:fs"
import react from "@vitejs/plugin-react"
import dotenv from "dotenv"
import { defineConfig } from "vite"
import tspaths from "vite-tsconfig-paths"

// dotenv-expand, which vite's loadEnv applies, strips the quotes from
// FIREBASE_CONFIG and leaves it invalid. Parse the file without expansion.
const env = dotenv.parse(fs.readFileSync(".env"))

export default defineConfig({
	build: {
		manifest: true,
		outDir: "./dist/client",
	},
	define: {
		FIREBASE_CONFIG: env.FIREBASE_CONFIG,
	},
	plugins: [react(), tspaths()],
})
