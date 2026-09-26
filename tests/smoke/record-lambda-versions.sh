#!/usr/bin/env bash
# Record what the five functions' production aliases point at, before a smoke
# run (stoasystem/stoa-backend#27, 频率: every run records the alias target
# version and CodeSha256 of all five, tied to a deploy run, commit and artifact).
#
# Read-only: `get-alias` and `get-function-configuration`. Run it by hand with
# credentials that may read the functions; the smoke itself never calls AWS.
#
#   tests/smoke/record-lambda-versions.sh <deploy-run> <backend-commit> <artifact>
#
# Writes .smoke/lambda-versions.json (or $STOA_SMOKE_STATE_DIR), which
# 01-preflight.spec.ts copies into the run record and checks is complete and
# no older than twelve hours.
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "usage: $0 <deploy-run> <backend-commit> <artifact>" >&2
  exit 64
fi

region="${AWS_REGION:-eu-central-2}"
alias_name="${STOA_LAMBDA_ALIAS:-production}"
dir="${STOA_SMOKE_STATE_DIR:-$(cd "$(dirname "$0")/../.." && pwd)/.smoke}"
mkdir -p "$dir"

entries=""
for fn in stoa-api stoa-weekly-report stoa-dispatch-reconciler stoa-account-deletion stoa-conversation-generation; do
  version="$(aws lambda get-alias --region "$region" --function-name "$fn" --name "$alias_name" \
    --query FunctionVersion --output text)"
  sha="$(aws lambda get-function-configuration --region "$region" --function-name "$fn" \
    --qualifier "$version" --query CodeSha256 --output text)"
  entries="${entries}${entries:+,}\"$fn\":{\"version\":\"$version\",\"codeSha256\":\"$sha\"}"
done

printf '{"recordedAt":"%s","region":"%s","alias":"%s","deployRun":"%s","backendCommit":"%s","artifact":"%s","functions":{%s}}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$region" "$alias_name" "$1" "$2" "$3" "$entries" \
  > "$dir/lambda-versions.json"
echo "wrote $dir/lambda-versions.json"
