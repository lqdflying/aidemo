#!/usr/bin/env bash
# Release script for the aidemo SPA image.
#
# Builds the hardened Nginx image, pushes four tags to Harbor, signs the
# pushed manifest by digest with Cosign, and verifies the signature.
#
# Usage:  VERSION=0.1.0 ./scripts/release.sh
#
# Prerequisites:
#   - Harbor auth in ~/.docker/config.json (img.aksg.net robot account).
#   - Cosign key material at ${COSIGN_KEY_DIR} (default ~/.config/aidemo/):
#       cosign.key (chmod 600), cosign.pub, cosign.password (chmod 600).
#   - cosign on PATH (or set PATH="$HOME/.local/bin:$PATH").
#
# This script never stores credentials or keys in the repo. It signs by the
# immutable digest, so one signature covers all four tags that share the manifest.
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"

: "${VERSION:?VERSION is required, e.g. VERSION=0.1.0}"
IMAGE="${IMAGE:-img.aksg.net/aidemo/aidemo}"
COSIGN_KEY_DIR="${COSIGN_KEY_DIR:-${HOME}/.config/aidemo}"
COSIGN_KEY="${COSIGN_KEY:-${COSIGN_KEY_DIR}/cosign.key}"
COSIGN_PUB="${COSIGN_PUB:-${COSIGN_KEY_DIR}/cosign.pub}"
COSIGN_PASSWORD_FILE="${COSIGN_PASSWORD_FILE:-${COSIGN_KEY_DIR}/cosign.password}"

MINOR="${VERSION%.*}"   # 0.1.0 -> 0.1
MAJOR="${VERSION%%.*}"  # 0.1.0 -> 0

echo "==> aidemo release ${VERSION}"
echo "    image : ${IMAGE}"
echo "    tags  : ${VERSION} ${MINOR} ${MAJOR} latest"

# 1. Align version.json with the requested release version.
sed -i "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" version.json

# 2. Pull latest base images so every build uses current 0-CVE bases.
docker pull img.aksg.net/nodejs/nodejs:latest
docker pull img.aksg.net/nginx/nginx:latest

# 3. Build with --pull, tagged with all four tags (same manifest/digest).
BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build --pull \
  --build-arg "BUILD_DATE=${BUILD_DATE}" \
  -t "${IMAGE}:${VERSION}" \
  -t "${IMAGE}:${MINOR}" \
  -t "${IMAGE}:${MAJOR}" \
  -t "${IMAGE}:latest" \
  .

# 4. Push all four tags to Harbor (uses ~/.docker/config.json auth).
docker push "${IMAGE}:${VERSION}"
docker push "${IMAGE}:${MINOR}"
docker push "${IMAGE}:${MAJOR}"
docker push "${IMAGE}:latest"

# Capture the immutable digest from the pushed manifest (authoritative).
DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' "${IMAGE}:${VERSION}" | sed 's/.*@//')"
echo "==> digest: ${DIGEST}"

# 5. Sign with cosign (key-based), by digest.
export COSIGN_PASSWORD
COSIGN_PASSWORD="$(cat "${COSIGN_PASSWORD_FILE}")"
cosign sign --key "${COSIGN_KEY}" --yes "${IMAGE}@${DIGEST}"

# 6. Verify the signature.
cosign verify --key "${COSIGN_PUB}" "${IMAGE}@${DIGEST}"

echo "==> released ${IMAGE}:${VERSION} (${DIGEST}), signed and verified"
