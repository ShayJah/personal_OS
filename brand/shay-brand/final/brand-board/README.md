# Shay brand board

Open `brand-board.html` in a browser to see the whole brand: logo, colours, type, Imigongo motifs, photo grade and every template.

- `exports/` every asset as a PNG at upload size (profile picture, highlight covers, posts, carousel, reel cover, story, end card, LinkedIn banner, website hero)
- `lut/Shay-Warm.cube`, `lut/Shay-Low-Light.cube` colour grades. CapCut desktop: Adjust > LUT > Import. Start at 70-80% intensity.
- `Shay-brand-guidelines.pdf` the 13-page guidelines
- `logo/` logo masters. All SVG/PNG variants: `../shay/kit/A/logo/`
- `photos/` drop your photos here, then rebuild:

```bash
cd ~/Downloads/shay-brand/final/brand-board && uv run --with numpy --with pillow python tools/build.py
```

Your photos are graded with Shay Warm and placed into the templates. Edit captions in `tools/build.py` (`templates()`).

Fonts: Big Shoulders and Hanken Grotesk, SIL Open Font License (Google Fonts).
