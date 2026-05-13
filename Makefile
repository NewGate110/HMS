SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help
help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

.PHONY: backend
backend: ## Restore, build, and run backend
	cd backend && dotnet restore
	cd backend && dotnet build
	cd backend/HMS.API && dotnet run

.PHONY: frontend
frontend: ## Run Angular frontend
	cd frontend && ng serve