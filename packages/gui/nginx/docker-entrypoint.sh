#!/usr/bin/env sh
set -eu

envsubst '${SHARLY_BACKEND_HOST} ${SHARLY_BACKEND_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
