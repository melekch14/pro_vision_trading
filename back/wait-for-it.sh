#!/bin/sh
# usage: ./wait-for-it.sh host:port [--timeout=N] [-- command args]
# Simple script to wait until a service is ready
# Source: https://github.com/vishnubob/wait-for-it
timeout=60
hostport=$1
shift
cmd="$@"

until nc -z $(echo $hostport | sed 's/:/ /') >/dev/null 2>&1; do
  timeout=$((timeout-1))
  if [ $timeout -le 0 ]; then
    echo "Timeout waiting for $hostport"
    exit 1
  fi
  sleep 1
done

exec $cmd
