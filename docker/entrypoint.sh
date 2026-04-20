deploy() {
  # Ignore errors,
  until (spacetime server ping local 2>/dev/null) | grep -q "Server is online";
  do
    echo "Waiting for server to start..."
    sleep 1
  done

  read -ra module_names <<<"$MODULES"
  echo "Publishing ${#module_names[@]} modules"
  for module in "${module_names[@]}"
  do
    echo "$module"
    spacetime publish -b /app/pogly.wasm -s local "$module"
  done
}

generate_runtime_config() {
  export REACT_APP_OIDC_AUTHORITY="${REACT_APP_OIDC_AUTHORITY:-https://auth.spacetimedb.com/oidc}"
  export REACT_APP_OIDC_CLIENT_ID="${REACT_APP_OIDC_CLIENT_ID:-client_0332oanjeP60cq8KNcjcJX}"
  envsubst </etc/caddy/runtime-config.js.template >/usr/share/caddy/runtime-config.js
}

# Kill all parallel processes below
trap "kill 0" SIGINT

generate_runtime_config

caddy run --config /etc/caddy/Caddyfile --adapter caddyfile \
& spacetime start --listen-addr 0.0.0.0:3000 --data-dir /stdb \
& deploy \
&& wait
