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
	@echo 'NTS Desktop'
	@echo 'Please use one of these make rules:'
	@echo
	@grep '##' $(MAKEFILE_LIST) | grep -v 'grep' | awk -F ': ##' '{ printf("%18s  %s\n", $$1, $$2) }'
	@echo

build: ## Build the client bundle
build: client

.PHONY: app
app: ## Build the universal macOS app and dmg
app:
	@$(log) "Bundling app..."
	@# CI=true makes tauri pass --skip-jenkins to bundle_dmg.sh. Without it the
	@# Finder AppleScript that arranges the dmg window fails on macOS 15 with
	@# "Can't set statusbar visible ... (-10006)" and the whole bundle fails.
	@env CI=true $(bin)/tauri build --target universal-apple-darwin

dev: ## Start the app for interactive development
dev:
	@$(log) "Starting dev app..."
	@$(bin)/tauri dev

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
	@$(bin)/biome check . --linter-enabled=false --organize-imports-enabled=true --fix


formatting: ## Check the formatting of all code
formatting:
	@$(log) "Checking format..."
	@$(bin)/biome check . --linter-enabled=false --organize-imports-enabled=true $(SILENT)


lint: ## Check lint
lint:
	@$(log) "Linting..."
	@$(bin)/biome lint . $(SILENT)

.PHONY: client
client: # Build the client-side code
client:
	@$(log) "Building client..."
	@mkdir -p dist
	@rm -rf dist/client/*
	@$(bin)/vite build

client.dev: # Start client-side development server
client.dev:
	@$(bin)/vite

logos: ## Convert all svg logos into their png counterparts
logos: $(patsubst %.svg,%.png,$(wildcard logos/*.svg))

check: lint formatting typecheck rust

rust: ## Check the Rust code
rust:
	@$(log) "Checking Rust..."
	@cd src-tauri && cargo clippy --quiet -- -D warnings


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
