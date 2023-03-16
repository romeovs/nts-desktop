bin = ./node_modules/.bin

TSC_FLAGS =
typecheck:
	@$(bin)/tsc --noEmit $(TSC_FLAGS)

typecheck.watch: TSC_FLAGS = --watch
typecheck.watch: typecheck

index: src/main.ts
	@mkdir -p dist
	@env NODE_ENV=development $(bin)/esbuild --bundle --platform=node --external:electron --loader:.png=file src/main.ts --outfile=dist/index.js

dist/preload.js: src/preload.js
	@mkdir -p dist
	@cp src/preload.js dist/preload.js

preload: dist/preload.js

start: index preload
	@$(bin)/electron dist

client.dev:
	@$(bin)/vite

client:
	@mkdir -p dist
	@rm -rf dist/client/*
	@$(bin)/vite build

dev:
	@$(bin)/concurrently "make client.dev" "make start"

dist/yarn.lock: package.json
	@mkdir -p dist
	@cat package.json | $(bin)/json -e 'this.dependencies=undefined' -e 'this.devDependencies=undefined' > dist/package.json
	@cd dist && yarn --production

packages: dist/yarn.lock

main: index preload
build: main client

package: packages
	@electron-builder build --mac --universal

src/logo-menu.png: src/logo-menu.svg
	inkscape -h 300 src/logo-menu.svg -o src/logo-menu.png

src/logo-menu-one.png: src/logo-menu-one.svg
	inkscape -h 300 src/logo-menu-one.svg -o src/logo-menu-one.png

src/logo-menu-two.png: src/logo-menu-two.svg
	inkscape -h 300 src/logo-menu-two.svg -o src/logo-menu-two.png

logos: src/logo-menu.png src/logo-menu-one.png src/logo-menu-two.png
