typecheck:
	@tsc --noEmit

index: src/main.ts
	env NODE_ENV=development esbuild --bundle --platform=node --external:electron --loader:.png=file src/main.ts --outfile=dist/index.js

start: index
	electron dist

client.dev:
	@snowpack dev

dev:
	concurrently "make client.dev" "make start"
