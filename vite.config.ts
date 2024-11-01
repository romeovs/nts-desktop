import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	build: {
		manifest: true,
		outDir: "./dist/client",
	},
	plugins: [react()],
})
