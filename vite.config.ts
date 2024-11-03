import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tspaths from "vite-tsconfig-paths"

export default defineConfig({
	build: {
		manifest: true,
		outDir: "./dist/client",
	},
	plugins: [react(), tspaths()],
})
