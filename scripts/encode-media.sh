#!/usr/bin/env bash
# encode-media.sh — re-encode the original demo recordings/renders into web-optimized
# MP4 (H.264) + WebM (VP9) + a WebP poster, written beside each project's content so
# Astro's import.meta.glob picks them up. Replaces the heavy animated GIFs.
#
# Source of truth = the originals on the Desktop (NOT the GIFs — encoding from the
# originals is higher quality than GIF->MP4). See the vault note:
#   specs/2026-05-28-mobile-efficiency-pass.md  (source->project map + rationale)
#
# Usage:   ./scripts/encode-media.sh
# Requires ffmpeg with libx264 + libvpx-vp9 (brew install ffmpeg).
# Idempotent: re-encodes everything each run.
#
# Crossword GENERATE screenshot is a still, not in MAP. Re-encode with:
#   SRC=~/Desktop/WebCrosswordGeneratorMedia/WebCrosswordGeneratorScreenshot.png
#   OUT=src/content/projects/web-crossword-generator/images/web_crossword_generator_photo.jpg
#   ffmpeg -y -i "$SRC" -vf "scale='min(1400,iw)':'min(1400,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuvj444p" \
#     -q:v 3 "$OUT"
# 4:4:4 JPEG (not PNG): UI screenshot at 1400px was ~1.3 MB as PNG, ~197 KB as JPEG.

set -uo pipefail

SRC_DIR="/Users/rafanquader/Desktop/videos_to_make_gifs_for_portfolio"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJ="$ROOT/src/content/projects"

# Cap the longest side to 900px (no upscaling), keep dims even for yuv420p.
SCALE="scale='min(900,iw)':'min(900,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2"
FPS=30

# "<source> | <project-slug>/images/<output-basename>"
# Relative names resolve under SRC_DIR. Absolute paths are used as-is
# (crossword demo was re-shot 2026-08-15 into a separate Desktop folder).
MAP=(
  "01_recursive_tree.mp4|manim-wallpapers/images/01_recursive_tree"
  "02_falling_leaves.mp4|manim-wallpapers/images/02_falling_leaves"
  "03_phyllotaxis.mp4|manim-wallpapers/images/03_phyllotaxis"
  "04_constellation.mp4|manim-wallpapers/images/04_constellation"
  "05_recursive_tree_v2.mp4|manim-wallpapers/images/05_recursive_tree_v2"
  "06_aurora.mp4|manim-wallpapers/images/06_aurora"
  "07_network_nodes.mp4|manim-wallpapers/images/07_network_nodes"
  "08_falling_leaves_forest.mp4|manim-wallpapers/images/08_falling_leaves_forest"
  "09_drift_field.mp4|manim-wallpapers/images/09_drift_field"
  "10_aurora_subtle.mp4|manim-wallpapers/images/10_aurora_subtle"
  "portfolio_website_demo.mov|portfolio-website/images/portfolio_website_demo"
  "legendary_ui_ux_demo.mov|legendary-ui-ux/images/legendary_ui_ux_demo"
  "instagram_demo_real.mov|insta-dm/images/instagram_demo_real"
  "arabic_dialect_map_demo.mov|arabic-dialect-map/images/arabic_dialect_map_demo"
  "adhkar_counter_demo.mov|adhkar-counter/images/adhkar_counter_demo"
  "/Users/rafanquader/Desktop/WebCrosswordGeneratorMedia/WebCrosswordGeneratorVideo.mov|web-crossword-generator/images/web_crossword_generator_demo"
)

FF="ffmpeg -hide_banner -loglevel error -y"
ok=0; fail=0

encode() {
  local src="$1" out="$2"
  local base="$PROJ/$out"
  mkdir -p "$(dirname "$base")"

  # MP4 (H.264, high profile, web-friendly faststart)
  $FF -i "$src" -an -vf "$SCALE,fps=$FPS" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 21 -preset slow \
    -movflags +faststart "$base.mp4" || return 1

  # WebM (VP9 constant-quality)
  $FF -i "$src" -an -vf "$SCALE,fps=$FPS" \
    -c:v libvpx-vp9 -b:v 0 -crf 32 -pix_fmt yuv420p -row-mt 1 -cpu-used 2 -deadline good \
    "$base.webm" || return 1

  # Poster: a representative frame ~10% into the clip, as JPEG.
  # (This ffmpeg build lacks libwebp; JPEG is universal and tiny. Convert to WebP via Sharp later if desired.)
  local dur ts
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src" 2>/dev/null || echo 1)
  ts=$(awk "BEGIN{d=$dur; printf \"%.2f\", (d>0?d*0.1:0)}")
  $FF -ss "$ts" -i "$src" -frames:v 1 -vf "$SCALE" -c:v mjpeg -q:v 3 "$base.poster.jpg" || return 1
}

for entry in "${MAP[@]}"; do
  src="${entry%%|*}"; out="${entry##*|}"
  if [[ "$src" == /* ]]; then srcfile="$src"; else srcfile="$SRC_DIR/$src"; fi
  printf '>> %-32s -> %s\n' "$(basename "$src")" "$out"
  if [ ! -f "$srcfile" ]; then echo "   MISSING SOURCE: $srcfile"; fail=$((fail+1)); continue; fi
  if encode "$srcfile" "$out"; then ok=$((ok+1)); else echo "   FAILED: $src"; fail=$((fail+1)); fi
done

echo ""
echo "=== done: $ok ok, $fail failed ==="
