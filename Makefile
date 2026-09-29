MVN ?= ./mvnw
SKIP_TESTS ?= false
DOCKER ?= docker
IMAGE_NAME ?= booklibrary
IMAGE_TAG ?= java25
CONTAINER_NAME ?= booklibrary
DB_CONTAINER_NAME ?= PageTurner-mysql
HOST_PORT ?= 8080
CONTAINER_PORT ?= 8080

WATCH ?= pom.xml src mvnw
RERUN_POLL_INTERVAL ?= 1
.PHONY: all clean install update run build-image db-up db-down down re

all: install run

db-up:
	@if [ -z "$$($(DOCKER) ps -q -f name=$(DB_CONTAINER_NAME))" ]; then \
		echo "Starting MySQL container..."; \
		$(DOCKER) start $(DB_CONTAINER_NAME) 2>/dev/null || $(DOCKER) run --name $(DB_CONTAINER_NAME) -e MYSQL_ROOT_PASSWORD=super_secret_root -e MYSQL_DATABASE=PageTurner_db -e MYSQL_USER=student -e MYSQL_PASSWORD=student -p 3307:3306 -d mysql:8.0; \
		echo "Waiting for MySQL to initialize..."; \
		sleep 10; \
	fi

db-down:
	@$(DOCKER) rm -f $(DB_CONTAINER_NAME) >/dev/null 2>&1 || true

down: db-down
	@$(DOCKER) rm -f $(CONTAINER_NAME) >/dev/null 2>&1 || true

clean: down
	@$(MVN) clean

re: clean all

install: clean
	@$(MVN) install -DskipTests=$(SKIP_TESTS)

update:
	@git pull --ff-only || true
	@$(MVN) -U dependency:resolve
	@$(MVN) install -DskipTests=$(SKIP_TESTS)

build-image:
	@$(DOCKER) buildx build --platform=linux/amd64 -t $(IMAGE_NAME):$(IMAGE_TAG) --load .

run: db-up build-image
	@ENV_FILE_FLAG=""; \
	if [ -f .env ]; then \
	  ENV_FILE_FLAG="--env-file .env"; \
	fi; \
	$(DOCKER) rm -f $(CONTAINER_NAME) >/dev/null 2>&1 || true; \
	$(DOCKER) run --rm --name $(CONTAINER_NAME) --network host $$ENV_FILE_FLAG -e SERVER_PORT=$(CONTAINER_PORT) $(IMAGE_NAME):$(IMAGE_TAG)