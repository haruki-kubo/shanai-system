# Project settings
PROJECT_ID := test-kubo-483713
REGION := asia-northeast1
SERVICE_NAME := shanai-system
REPOSITORY := shanai-system
IMAGE_TAG := $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")
IMAGE_URL := $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(REPOSITORY)/$(SERVICE_NAME)

# Colors
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# ========================================
# Development
# ========================================

.PHONY: dev
dev: ## Start development server
	npm run dev

.PHONY: install
install: ## Install dependencies
	npm ci

.PHONY: lint
lint: ## Run linter
	npm run lint

.PHONY: lint-fix
lint-fix: ## Run linter with auto-fix
	npm run lint:fix

.PHONY: format
format: ## Format code
	npm run format

.PHONY: type-check
type-check: ## Run TypeScript type check
	npm run type-check

.PHONY: test
test: ## Run tests
	npm test

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	npm run test:watch

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	npm run test:coverage

# ========================================
# Database
# ========================================

.PHONY: db-generate
db-generate: ## Generate Prisma client
	npx prisma generate

.PHONY: db-migrate
db-migrate: ## Run database migrations (development)
	npx prisma migrate dev

.PHONY: db-migrate-prod
db-migrate-prod: ## Run database migrations (production)
	npx prisma migrate deploy

.PHONY: db-push
db-push: ## Push schema changes to database
	npx prisma db push

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	npx prisma studio

.PHONY: db-seed
db-seed: ## Seed database
	npx prisma db seed

# ========================================
# Build
# ========================================

.PHONY: build
build: ## Build application
	npm run build

.PHONY: docker-build
docker-build: ## Build Docker image
	@echo "$(YELLOW)Building Docker image: $(IMAGE_URL):$(IMAGE_TAG)$(NC)"
	docker build \
		--build-arg DATABASE_URL="$(DATABASE_URL)" \
		-t $(IMAGE_URL):$(IMAGE_TAG) \
		-t $(IMAGE_URL):latest \
		.

.PHONY: docker-run
docker-run: ## Run Docker container locally
	docker run -p 3000:3000 --env-file .env $(IMAGE_URL):$(IMAGE_TAG)

# ========================================
# Deploy
# ========================================

.PHONY: gcloud-auth
gcloud-auth: ## Configure Docker for Google Cloud
	gcloud auth configure-docker $(REGION)-docker.pkg.dev --quiet

.PHONY: docker-push
docker-push: ## Push Docker image to Artifact Registry
	@echo "$(YELLOW)Pushing Docker image: $(IMAGE_URL):$(IMAGE_TAG)$(NC)"
	docker push $(IMAGE_URL):$(IMAGE_TAG)
	docker push $(IMAGE_URL):latest

.PHONY: deploy
deploy: docker-build docker-push deploy-cloudrun ## Build, push and deploy to Cloud Run
	@echo "$(GREEN)Deployment completed!$(NC)"

.PHONY: deploy-cloudrun
deploy-cloudrun: ## Deploy to Cloud Run
	@echo "$(YELLOW)Deploying to Cloud Run...$(NC)"
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_URL):$(IMAGE_TAG) \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--platform managed \
		--allow-unauthenticated \
		--memory 512Mi \
		--cpu 1 \
		--min-instances 0 \
		--max-instances 10 \
		--port 3000 \
		--set-env-vars "NODE_ENV=production"
	@echo "$(GREEN)Deployed successfully!$(NC)"
	@gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --project=$(PROJECT_ID) --format='value(status.url)'

.PHONY: deploy-staging
deploy-staging: ## Deploy to staging environment
	$(MAKE) deploy SERVICE_NAME=$(SERVICE_NAME)-staging

.PHONY: deploy-prod
deploy-prod: ## Deploy to production environment
	$(MAKE) deploy

# ========================================
# GCP Setup
# ========================================

.PHONY: gcp-setup
gcp-setup: ## Initial GCP setup (Artifact Registry, etc.)
	@echo "$(YELLOW)Creating Artifact Registry repository...$(NC)"
	gcloud artifacts repositories create $(REPOSITORY) \
		--repository-format=docker \
		--location=$(REGION) \
		--project=$(PROJECT_ID) \
		--description="Docker repository for $(SERVICE_NAME)" \
		|| echo "Repository already exists"
	@echo "$(GREEN)GCP setup completed!$(NC)"

.PHONY: gcp-logs
gcp-logs: ## View Cloud Run logs
	gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$(SERVICE_NAME)" \
		--project=$(PROJECT_ID) \
		--limit=50 \
		--format="table(timestamp,textPayload)"

.PHONY: gcp-describe
gcp-describe: ## Describe Cloud Run service
	gcloud run services describe $(SERVICE_NAME) \
		--region=$(REGION) \
		--project=$(PROJECT_ID)

# ========================================
# Utilities
# ========================================

.PHONY: clean
clean: ## Clean build artifacts
	rm -rf .next node_modules coverage

.PHONY: check
check: lint type-check test ## Run all checks (lint, type-check, test)
	@echo "$(GREEN)All checks passed!$(NC)"
