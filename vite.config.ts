import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import tspaths from "vite-tsconfig-paths"

const port = Number(process.env.NTS_DEV_PORT ?? 5173)

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "")
	const firebase = env.FIREBASE_CONFIG ? env.FIREBASE_CONFIG : "null"

	return {
		define: {
			FIREBASE_CONFIG: firebase,
		},
		build: {
			manifest: true,
			outDir: "./dist/client",
			emptyOutDir: true,
		},
		clearScreen: false,
		server: {
			port,
			strictPort: true,
			watch: {
				ignored: ["**/src-tauri/**"],
			},
		},
		plugins: [react(), tspaths()],
	}
})
