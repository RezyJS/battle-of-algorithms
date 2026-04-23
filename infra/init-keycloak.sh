#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYCLOAK_ENV_FILE="${ROOT_DIR}/infra/keycloak.env"
BACKEND_ENV_FILE="${ROOT_DIR}/infra/backend.env"
FRONTEND_ENV_FILE="${ROOT_DIR}/infra/frontend.env"

if [[ ! -f "${KEYCLOAK_ENV_FILE}" || ! -f "${BACKEND_ENV_FILE}" || ! -f "${FRONTEND_ENV_FILE}" ]]; then
  echo "Expected infra/keycloak.env, infra/backend.env and infra/frontend.env to exist"
  exit 1
fi

load_env_file() {
  local env_file="$1"

  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line%$'\r'}"

    if [[ -z "${line}" || "${line}" == \#* ]]; then
      continue
    fi

    local key="${line%%=*}"
    local value="${line#*=}"

    export "${key}=${value}"
  done < "${env_file}"
}

load_env_file "${KEYCLOAK_ENV_FILE}"
load_env_file "${BACKEND_ENV_FILE}"
load_env_file "${FRONTEND_ENV_FILE}"

KEYCLOAK_CONTAINER="${KEYCLOAK_CONTAINER:-boa-keycloak}"
KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:8080}"
REALM_NAME="${KEYCLOAK_REALM:-battle-of-algorithms}"
FRONTEND_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-frontend}"
BACKEND_CLIENT_ID="${KEYCLOAK_BACKEND_CLIENT_ID:-backend}"
BACKEND_CLIENT_SECRET_VALUE="${KEYCLOAK_BACKEND_CLIENT_SECRET:-replace-me}"
APP_URL_VALUE="${APP_URL:-http://localhost:3000}"
APP_CALLBACK_URL="${APP_URL_VALUE}/api/auth/callback"

run_kcadm() {
  docker exec "${KEYCLOAK_CONTAINER}" /opt/keycloak/bin/kcadm.sh "$@"
}

client_uuid() {
  local client_id="$1"
  run_kcadm get clients -r "${REALM_NAME}" -q "clientId=${client_id}" --fields id --format csv --noquotes | tail -n 1
}

user_uuid() {
  local username="$1"
  run_kcadm get users -r "${REALM_NAME}" -q "username=${username}" --fields id --format csv --noquotes | tail -n 1
}

ensure_realm() {
  if run_kcadm get "realms/${REALM_NAME}" >/dev/null 2>&1; then
    echo "Realm ${REALM_NAME} already exists"
    return
  fi

  run_kcadm create realms -s "realm=${REALM_NAME}" -s enabled=true
  echo "Created realm ${REALM_NAME}"
}

ensure_realm_role() {
  local role_name="$1"

  if run_kcadm get "realms/${REALM_NAME}/roles/${role_name}" >/dev/null 2>&1; then
    echo "Role ${role_name} already exists"
    return
  fi

  run_kcadm create "realms/${REALM_NAME}/roles" -s "name=${role_name}"
  echo "Created role ${role_name}"
}

ensure_frontend_client() {
  local id
  id="$(client_uuid "${FRONTEND_CLIENT_ID}")"

  if [[ -z "${id}" ]]; then
    run_kcadm create clients -r "${REALM_NAME}" \
      -s "clientId=${FRONTEND_CLIENT_ID}" \
      -s enabled=true \
      -s publicClient=true \
      -s standardFlowEnabled=true \
      -s directAccessGrantsEnabled=false \
      -s implicitFlowEnabled=false \
      -s serviceAccountsEnabled=false \
      -s "rootUrl=${APP_URL_VALUE}" \
      -s "baseUrl=${APP_URL_VALUE}" \
      -s 'redirectUris=["'"${APP_CALLBACK_URL}"'","'"${APP_URL_VALUE}"'/*"]' \
      -s 'webOrigins=["'"${APP_URL_VALUE}"'"]' \
      -s 'attributes."pkce.code.challenge.method"=S256'
    id="$(client_uuid "${FRONTEND_CLIENT_ID}")"
    echo "Created frontend client"
  fi

  run_kcadm update "clients/${id}" -r "${REALM_NAME}" \
    -s enabled=true \
    -s publicClient=true \
    -s standardFlowEnabled=true \
    -s directAccessGrantsEnabled=false \
    -s implicitFlowEnabled=false \
    -s serviceAccountsEnabled=false \
    -s "rootUrl=${APP_URL_VALUE}" \
    -s "baseUrl=${APP_URL_VALUE}" \
    -s 'redirectUris=["'"${APP_CALLBACK_URL}"'","'"${APP_URL_VALUE}"'/*"]' \
    -s 'webOrigins=["'"${APP_URL_VALUE}"'"]' \
    -s 'attributes."pkce.code.challenge.method"=S256'
}

ensure_backend_client() {
  local id
  id="$(client_uuid "${BACKEND_CLIENT_ID}")"

  if [[ -z "${id}" ]]; then
    run_kcadm create clients -r "${REALM_NAME}" \
      -s "clientId=${BACKEND_CLIENT_ID}" \
      -s enabled=true \
      -s publicClient=false \
      -s secret="${BACKEND_CLIENT_SECRET_VALUE}" \
      -s standardFlowEnabled=false \
      -s directAccessGrantsEnabled=false \
      -s serviceAccountsEnabled=true
    id="$(client_uuid "${BACKEND_CLIENT_ID}")"
    echo "Created backend client"
  fi

  run_kcadm update "clients/${id}" -r "${REALM_NAME}" \
    -s enabled=true \
    -s publicClient=false \
    -s secret="${BACKEND_CLIENT_SECRET_VALUE}" \
    -s standardFlowEnabled=false \
    -s directAccessGrantsEnabled=false \
    -s serviceAccountsEnabled=true
}

ensure_user() {
  local username="$1"
  local password="$2"
  local first_name="$3"
  local last_name="$4"
  local role_name="$5"
  local id

  id="$(user_uuid "${username}")"

  if [[ -z "${id}" ]]; then
    run_kcadm create users -r "${REALM_NAME}" \
      -s "username=${username}" \
      -s enabled=true \
      -s emailVerified=true \
      -s "firstName=${first_name}" \
      -s "lastName=${last_name}"
    id="$(user_uuid "${username}")"
    echo "Created user ${username}"
  fi

  run_kcadm set-password -r "${REALM_NAME}" --userid "${id}" --new-password "${password}"
  run_kcadm add-roles -r "${REALM_NAME}" --uusername "${username}" --rolename "${role_name}"
}

echo "Authenticating in Keycloak admin API"
run_kcadm config credentials \
  --server "${KEYCLOAK_BASE_URL}" \
  --realm master \
  --user "${KC_BOOTSTRAP_ADMIN_USERNAME}" \
  --password "${KC_BOOTSTRAP_ADMIN_PASSWORD}" >/dev/null

ensure_realm
ensure_realm_role user
ensure_realm_role moderator
ensure_realm_role admin
ensure_frontend_client
ensure_backend_client

ensure_user "dev-user" "DevPass123!" "Dev" "User" "user"
ensure_user "dev-moderator" "DevPass123!" "Dev" "Moderator" "moderator"
ensure_user "dev-admin" "DevPass123!" "Dev" "Admin" "admin"

echo
echo "Keycloak bootstrap complete"
echo "Realm: ${REALM_NAME}"
echo "Frontend client: ${FRONTEND_CLIENT_ID}"
echo "Backend client: ${BACKEND_CLIENT_ID}"
