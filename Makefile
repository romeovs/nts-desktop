bin = ./node_modules/.bin

TSC_FLAGS =
typecheck:
	@$(bin)/tsc --noEmit $(TSC_FLAGS)

typecheck.watch: TSC_FLAGS = --watch
typecheck.watch: typecheck

index: src/main.ts
	@env NODE_ENV=development $(bin)/esbuild --bundle --platform=node --external:electron --loader:.png=file src/main.ts --outfile=dist/index.js

dist/preload.js: src/preload.js
	@cp src/preload.js dist/preload.js

preload: dist/preload.js

start: index preload
	@$(bin)/electron dist

client.dev:
	@$(bin)/snowpack dev

client:
	@rm -rf dist/client/*
	@snowpack build

dev:
	@$(bin)/concurrently "make client.dev" "make start"

dist/yarn.lock: package.json
	@cat package.json | jq 'del(.devDependencies)' | jq 'del(.dependencies)' > dist/package.json
	@cd dist && yarn --production

packages: dist/yarn.lock

main: index preload
build: main client

package: packages
	@electron-builder build --mac --universal
