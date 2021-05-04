bin = ./node_modules/.bin

typecheck:
	@$(bin)/tsc --noEmit

index: src/main.ts
	@env NODE_ENV=development $(bin)/esbuild --bundle --platform=node --external:electron --loader:.png=file src/main.ts --outfile=dist/index.js

start: index
	@$(bin)/electron dist

client.dev:
	@$(bin)/snowpack dev

dev:
	@$(bin)/concurrently "make client.dev" "make start"
