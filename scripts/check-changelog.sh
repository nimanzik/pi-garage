#!/usr/bin/env bash
# Check an extension changelog against its package version.
# Usage: scripts/check-changelog.sh <extension>
set -euo pipefail

extension=${1:?usage: scripts/check-changelog.sh <extension>}
workspace="extensions/$extension"
changelog="$workspace/CHANGELOG.md"
name="@nimanzik/$extension"
version=$(jq -er --arg name "$name" 'select(.name == $name) | .version' "$workspace/package.json")
if ! [[ "$version" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "$name: version '$version' is not MAJOR.MINOR.PATCH" >&2
  exit 1
fi

# New entries need a place to go, so the first section is always "## Unreleased".
if [[ $(grep -m1 '^## ' "$changelog") != "## Unreleased" ]]; then
  echo "$changelog: the first section must be '## Unreleased'" >&2
  exit 1
fi

# Require a non-empty "## <version> - YYYY-MM-DD" section.
if ! awk -v heading="## $version - " '
  found && /^## / { exit }
  index($0, heading) == 1 && substr($0, length(heading) + 1) ~ /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/ { found = 1; next }
  found && /[^[:space:]]/ { nonempty = 1; exit }
  END { exit !nonempty }
' "$changelog"; then
  echo "Missing changelog entry for $name@$version" >&2
  exit 1
fi
