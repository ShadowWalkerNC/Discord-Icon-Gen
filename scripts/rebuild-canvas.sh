#!/usr/bin/env bash
set -e

# Find every pkgconfig directory in the entire nix store (no depth limit)
PKG_CONFIG_PATH=$(find /nix/store /root/.nix-profile -name 'pkgconfig' -type d 2>/dev/null \
  | sort -u \
  | paste -sd ':' -)

export PKG_CONFIG_PATH
echo "[canvas] PKG_CONFIG_PATH=$PKG_CONFIG_PATH"

# Verify cairo is findable
pkg-config --libs cairo && echo "[canvas] cairo OK" || echo "[canvas] cairo still missing"

npm rebuild canvas --build-from-source
