DOCKER ?= docker
COMPOSE ?= $(DOCKER) compose
SERVICE ?= backend
SKIP_TESTS ?= false
.DEFAULT_GOAL := help
.PHONY: help init all run up stop down restart re build build-image pull logs ps config shell db-up db-down db-shell test test-backend test-frontend install update clean

help:
	@printf '%s\n' 'make init          Prepare .env with generated secrets (requires openssl)' 'make run / up      Build and start all services; wait for health checks' 'make down          Remove containers and network; retain database' 'make stop/restart  Stop or restart services' 'make build         Build application images' 'make logs          Follow logs (SERVICE=backend by default)' 'make ps            Show service status' 'make shell         Open a shell (SERVICE=backend by default)' 'make db-shell      Open the MySQL client' 'make test          Run Java and JavaScript tests in containers' 'make install       Package backend in a Maven container' 'make update        Refresh base images/dependencies and rebuild' 'make clean         Stop stack and clean Maven output; retain data' 'make re            Clean, rebuild, and start' 'make config        Validate Compose configuration' 'make frontend-dev  Start Next.js hot reload (requires local Node 22+)'

init:
	@sh scripts/init.sh

all run up: init
	$(COMPOSE) up -d --build --wait

build build-image: init
	$(COMPOSE) build

stop:
	$(COMPOSE) stop

down:
	$(COMPOSE) down --remove-orphans

restart:
	$(COMPOSE) restart

re: clean
	$(MAKE) run

pull: init
	$(COMPOSE) pull --ignore-buildable

logs:
	$(COMPOSE) logs -f $(SERVICE)

ps:
	$(COMPOSE) ps

config: init
	$(COMPOSE) config --quiet

shell:
	$(COMPOSE) exec $(SERVICE) sh

db-up: init
	$(COMPOSE) up -d --wait db

db-down:
	$(COMPOSE) stop db

db-shell:
	$(COMPOSE) exec db sh -c 'MYSQL_PWD="$$MYSQL_PASSWORD" exec mysql -u "$$MYSQL_USER" "$$MYSQL_DATABASE"'

test: test-backend test-frontend

test-backend: init
	$(COMPOSE) run --rm --no-deps backend-tools verify

test-frontend: init
	$(COMPOSE) run --rm --no-deps frontend-tools 'npm ci && npm test && npm run build'

install: init
	$(COMPOSE) run --rm --no-deps backend-tools install -DskipTests=$(SKIP_TESTS)

update: init
	$(COMPOSE) pull --ignore-buildable
	$(COMPOSE) run --rm --no-deps backend-tools -U dependency:resolve
	$(COMPOSE) build --pull

clean: down
	$(COMPOSE) run --rm --no-deps backend-tools clean

.PHONY: frontend-dev
frontend-dev: init
	cd frontend && npm ci && API_ORIGIN=http://localhost:$${HOST_PORT:-8080} npm run dev
