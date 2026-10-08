#!/usr/bin/env python3
"""Regenerate the locally bundled artwork from its replaceable PNG masters.

Requires Pillow in the asset-editing environment; the app itself does not use
Python, Pillow, an image service, or a new native image dependency.
"""

from pathlib import Path
from PIL import Image, ImageOps


root = Path(__file__).resolve().parents[1]
source_dir = root / "assets" / "artwork"
output_dir = source_dir / "optimized"
output_dir.mkdir(exist_ok=True)

for name in ("dawn", "eclipse", "receiving"):
    with Image.open(source_dir / f"{name}.png") as original:
        source = ImageOps.exif_transpose(original).convert("RGB")
        for variant, limit in (("cover", 1280), ("thumbnail", 288)):
            if variant == "thumbnail":
                # Row frames are almost square, so don't waste pixels on the
                # landscape edges that Image's cover crop would discard.
                image = ImageOps.fit(source, (limit, limit), Image.Resampling.LANCZOS)
            else:
                image = source.copy()
                image.thumbnail((limit, limit), Image.Resampling.LANCZOS)
            target = output_dir / f"{name}-{variant}.jpg"
            image.save(target, "JPEG", quality=84, optimize=True, progressive=True)
            print(f"{target.relative_to(root)}: {image.width}×{image.height}, {target.stat().st_size:,} bytes")
        if name == "eclipse":
            target = output_dir / "favicon.png"
            ImageOps.fit(source, (128, 128), Image.Resampling.LANCZOS).save(target, optimize=True)
            print(f"{target.relative_to(root)}: 128×128, {target.stat().st_size:,} bytes")
