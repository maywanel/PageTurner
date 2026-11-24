#!/bin/sh
set -eu
umask 077
if [ ! -f .env ]; then
    cp .env.example .env
fi
# Preserve existing configuration; fill only absent Compose settings and example secrets.
set_default() {
    key=$1 value=$2
    if ! grep -q "^${key}=" .env; then
        printf '\n%s=%s\n' "$key" "$value" >> .env
    fi
}
secret() { openssl rand -hex 32; }
set_default DATABASE_USERNAME pageturner
set_default DATABASE_PASSWORD "$(secret)"
set_default JWT_SECRET "$(secret)"
set_default JWT_EXPIRATION 3600000
set_default MYSQL_ROOT_PASSWORD "$(secret)"
set_default MYSQL_DATABASE PageTurner_db
set_default HOST_PORT 8080
for key in DATABASE_PASSWORD MYSQL_ROOT_PASSWORD JWT_SECRET; do
    if grep -q "^${key}=replace_with_" .env; then
        sed -i "s/^${key}=.*/${key}=$(secret)/" .env
    fi
done
sed -i 's/^DATABASE_USERNAME=your_database_user$/DATABASE_USERNAME=pageturner/' .env
chmod 600 .env
printf 'Configuration ready in .env (existing values preserved). Run make run.\n'
