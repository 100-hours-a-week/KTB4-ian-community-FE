#!/usr/bin/env bash

set -Eeuo pipefail

root="${1:-dist}"
[[ -d "${root}" ]] || {
  echo "Build directory not found: ${root}" >&2
  exit 1
}

if find "${root}" -type f -name '*.map' -print -quit | grep -q .; then
  echo "Source maps must not be included in the production build" >&2
  exit 1
fi

if rg --hidden --no-messages -n \
  'AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{30,}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----' \
  "${root}"; then
  echo "Credential-shaped content found in the production build" >&2
  exit 1
fi

echo "PASS: production build has no source maps or credential-shaped content."
