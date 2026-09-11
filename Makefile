bin = ./node_modules/.bin

ifneq (CI,1)
SILENT += >/dev/null
endif

# Logging

__blue = $$(tput setaf 4)
__normal = $$(tput sgr0)
title = $(shell pwd | xargs basename)
log = printf "$(__blue)$(title): $(__normal) %s\\n"

help: ## Show this help.
	@echo 'NTSer'
	@echo 'Please use one of these make rules:'
	@echo
	@grep '##' $(MAKEFILE_LIST) | grep -v 'grep' | awk -F ': ##' '{ printf("%18s  %s\n", $$1, $$2) }'
	@echo

start: ## Start the app with the native shell and a Vite dev server
start:
	@$(log) "Starting app"
	@$(bin)/tauri dev

dev: ## Start the development server for interactive development
dev: start

# GitHub Actions sets CI=true. Build a universal disk image there so Intel
# and Apple Silicon both get one download; locally, only this machine.
ifeq ($(CI),true)
TAURI_FLAGS ?= --target universal-apple-darwin
endif

.PHONY: app
app: ## Build the macOS app (universal on CI)
app:
	@$(log) "Bundling app..."
	@$(bin)/tauri build --bundles dmg $(TAURI_FLAGS)

.PHONY: version
version: ## Set the version in package.json, Cargo.toml and tauri.conf.json
version:
	@test -n "$(VERSION)" || (echo "VERSION=x.y.z required" && exit 1)
	@node scripts/set-version.mjs "$(VERSION)"

TSC_FLAGS =

typecheck: ## Check for type errors
typecheck:
	@$(log) "Typechecking..."
	@$(bin)/tsc --noEmit $(TSC_FLAGS)

typecheck.watch: ## Check for type errors and recheck when a file changes
typecheck.watch: TSC_FLAGS = --watch
typecheck.watch: typecheck

format: ## Format all code
format:
	@$(bin)/biome check . --linter-enabled=false --write


formatting: ## Check the formatting of all code
formatting:
	@$(log) "Checking format..."
	@$(bin)/biome check . --linter-enabled=false $(SILENT)


lint: ## Check lint
lint:
	@$(log) "Linting..."
	@$(bin)/biome lint . $(SILENT)

.env: # Recover the public Firebase config NTS ships in its own frontend bundle
.env:
	@$(log) "Fetching Firebase config from nts.live..."
	@node scripts/firebase-config.mjs > .env || (rm -f .env; \
		$(log) "Could not reach nts.live; building without the live tracklist"; \
		touch .env)

env: ## Refresh .env with the public Firebase config from nts.live
env:
	@rm -f .env
	@$(MAKE) --no-print-directory .env

.PHONY: client
client: # Build the client-side code
client:
	@$(log) "Building client..."
	@$(bin)/vite build

client.dev: # Start client-side development server
client.dev:
	@$(bin)/vite

logos: ## Convert all svg logos into their png counterparts
logos: $(patsubst %.svg,%.png,$(wildcard logos/menu*.svg))

.PHONY: icons
icons: ## Build macOS/Windows app icons from the squircle SVG
icons: logos/app-icon.svg
	@$(log) "Building app icons..."
	@$(bin)/tauri icon logos/app-icon.svg
	@rm -rf src-tauri/icons/android src-tauri/icons/ios
	@rm -f src-tauri/icons/Square*.png src-tauri/icons/StoreLogo.png

check: lint formatting typecheck


# Git hooks
.PHONY: run-always

.git/hooks/%: run-always
	@echo "Creating $* hook"
	@echo "make -j4 git.$*" > ".git/hooks/$*"
	@chmod a+x ".git/hooks/$*"

.PHONY: hooks
hooks: .git/hooks/pre-commit .git/hooks/pre-push

git.pre-push: check
git.pre-commit: check
