#!/usr/bin/env bash
# Uso: ci/toolshop.sh sprint5 | sprint5-with-bugs | down
set -euo pipefail
cd "$(dirname "$0")"
compose() { docker compose -f toolshop.compose.yml "$@"; }

if [ "${1:-}" = down ]; then
  SPRINT=sprint5 compose down -v --remove-orphans
  exit 0
fi

export SPRINT="${1:?indica el sprint: sprint5 o sprint5-with-bugs}"
compose up -d --quiet-pull

# La base tarda en aceptar conexiones: la migración se reintenta hasta que entra.
for i in $(seq 1 30); do
  if compose exec -T laravel-api php artisan migrate:fresh --seed --force >/dev/null 2>&1; then break; fi
  [ "$i" = 30 ] && { echo "La base no respondió"; compose logs --tail 50; exit 1; }
  sleep 5
done

# ng serve compila al arrancar; hasta que termina, la interfaz no responde.
esperar() {
  for i in $(seq 1 60); do
    curl -fs -o /dev/null "$1" && { echo "Listo: $1"; return 0; }
    sleep 5
  done
  echo "No respondió: $1"; compose logs --tail 50; exit 1
}
esperar http://localhost:8091/products
esperar http://localhost:4200
