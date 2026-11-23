#!/usr/bin/env bash
set -euo pipefail

sha="${RELEASE_SHA:-$(git rev-parse HEAD)}"
repo_url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY"
version_pattern='^[0-9]+\.[0-9]+\.[0-9]+$'

if [[ "$GITHUB_EVENT_NAME" == workflow_run ]]; then
  dev_sha=$(gh api "repos/$GITHUB_REPOSITORY/git/ref/heads/dev" --jq '.object.sha')
  if [[ "$dev_sha" != "$sha" ]]; then
    echo "Skipping $sha because dev has advanced to $dev_sha."
    exit 0
  fi

  for workflow in test.yml typecheck.yml; do
    conclusion=$(gh api --method GET "repos/$GITHUB_REPOSITORY/actions/workflows/$workflow/runs" \
      -f branch=dev -f event=push -f head_sha="$sha" -F per_page=1 \
      --jq '.workflow_runs[0].conclusion // "pending"')
    if [[ "$conclusion" != success ]]; then
      echo "Skipping $sha because $workflow is $conclusion."
      exit 0
    fi
  done
fi

tags=$(git ls-remote --tags "$repo_url" 'v[0-9]*')
tag_commit() {
  awk -v ref="refs/tags/$1" '
    $2 == ref { direct = $1 }
    $2 == ref "^{}" { peeled = $1 }
    END { print peeled ? peeled : direct }
  ' <<< "$tags"
}

case "$GITHUB_EVENT_NAME" in
  workflow_run)
    latest=$(awk '$2 ~ /^refs\/tags\/v[0-9]+\.[0-9]+\.[0-9]+$/ { sub("refs/tags/v", "", $2); print $2 }' \
      <<< "$tags" | sort -V | tail -n 1)
    if [[ -z "$latest" ]]; then
      version=1.0.0
    elif [[ "$(tag_commit "v$latest")" == "$sha" ]]; then
      # Reuse the tag if a previous attempt built the binaries but failed to publish them.
      version="$latest"
    else
      IFS=. read -r major minor patch <<< "$latest"
      version="$major.$minor.$((10#$patch + 1))"
    fi
    ;;
  workflow_dispatch) version="$RELEASE_VERSION" ;;
  push) version="${GITHUB_REF_NAME#v}" ;;
  *) echo "Unsupported release event: $GITHUB_EVENT_NAME" >&2; exit 1 ;;
esac

if [[ ! "$version" =~ $version_pattern ]]; then
  echo "Expected a release version like 1.0.8, got '$version'." >&2
  exit 1
fi

tag="v$version"
tag_sha=$(tag_commit "$tag")
if [[ -n "$tag_sha" && "$tag_sha" != "$sha" ]]; then
  echo "$tag already points to $tag_sha, expected $sha." >&2
  exit 1
fi

published=$(gh api --paginate "repos/$GITHUB_REPOSITORY/releases?per_page=100" \
  --jq '.[] | select(.draft == false) | .tag_name')
if grep -Fxq -- "$tag" <<< "$published"; then
  echo "$tag is already published."
  exit 0
fi

printf 'commit=%s\nversion=%s\ntag=%s\n' "$sha" "$version" "$tag" >> "$GITHUB_OUTPUT"
