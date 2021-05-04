bin = ./node_modules/.bin

typecheck:
	@$(bin)/tsc --noEmit

index: src/main.ts
	@env NODE_ENV=development $(bin)/esbuild --bundle --platform=node --external:electron --loader:.png=file src/main.ts --outfile=dist/index.js

dist/preload.js: src/preload.js
	@cp src/preload.js dist/preload.js

preload: dist/preload.js

start: index preload
	@$(bin)/electron dist

client.dev:
	@$(bin)/snowpack dev

dev:
	@$(bin)/concurrently "make client.dev" "make start"
