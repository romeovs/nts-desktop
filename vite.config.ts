import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
	build: {
		manifest: true,
		outDir: "./dist/client",
	},
	plugins: [react()],
})
