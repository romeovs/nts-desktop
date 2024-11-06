bin = ./node_modules/.bin

help: ## Show this help.
	@echo 'NTS Desktop'
	@echo 'Please use one of these make rules:'
	@echo
	@grep '##' $(MAKEFILE_LIST) | grep -v 'grep' | awk -F ': ##' '{ printf("%18s  %s\n", $$1, $$2) }'
	@echo

start: ## Start the app, making sure it is build to the latest version
start: index preload run

run: ## Run the application (not recommended, use start instead)
run:
	@$(bin)/electron dist

build: ## Build all the JavaScript, without bundling the Electron app
build: index preload client packages

.PHONY: app
app: ## Build the electron app
app:
	@$(bin)/electron-builder build --mac --universal --publish=never

dev: ## Start the development server for interactive development
dev:
	@$(bin)/concurrently "make client.dev" "sleep 3 && make start"

TSC_FLAGS =

typecheck: ## Check for type errors
typecheck:
	@$(bin)/tsc --noEmit $(TSC_FLAGS)

typecheck.watch: ## Check for type errors and recheck when a file changes
typecheck.watch: TSC_FLAGS = --watch
typecheck.watch: typecheck

format: ## Format all code
format:
	@$(bin)/biome check . --linter-enabled=false --organize-imports-enabled=true --fix


formatting: ## Check the formatting of all code
formatting:
	@$(bin)/biome check . --linter-enabled=false --organize-imports-enabled=true


lint: ## Check lint
lint:
	@$(bin)/biome lint .

index: # Build the "server"-side js
index: app/main.ts
	@mkdir -p dist
	@env NODE_ENV=development $(bin)/esbuild --bundle --format=cjs --platform=node --external:electron --loader:.png=file app/main.ts --outfile=dist/index.cjs --define:FIREBASE_CONFIG='$(shell $(bin)/dotenv -p FIREBASE_CONFIG)'

preload: # Build the preload script
preload: dist/preload.js
dist/preload.js: app/preload.js
	@mkdir -p dist
	@cp app/preload.js dist/preload.js

.PHONY: client
client: # Build the client-side code
client:
	@mkdir -p dist
	@rm -rf dist/client/*
	@$(bin)/vite build

client.dev: # Start client-side development server
client.dev:
	@$(bin)/vite

packages: # Copy package.json and amend it for Electron
packages: dist/pnpm-lock.json
dist/pnpm-lock.json: package.json
	@mkdir -p dist
	@cat package.json | $(bin)/json -e 'this.dependencies=undefined' -e 'this.devDependencies=undefined' > dist/package.json
	@cd dist && pnpm install --production

logos: ## Convert all svg logos into their png counterparts
logos: $(patsubst %.svg,%.png,$(wildcard logos/*.svg))

logos/%.png: logos/%.svg
	@inkscape -h 300 $< -o $@
