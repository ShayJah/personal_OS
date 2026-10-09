"""Build Shay's brand board and key assets.

Drop photos (jpg/png) into ../photos, then run from anywhere:
    uv run --with numpy --with pillow python tools/build.py
Photos are graded with the Shay Warm look, placed into every template, and each template is
rendered to a PNG in ../exports. brand-board.html is rewritten to show all of it.
"""
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from make_lut import grade  # noqa: E402

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BUILD, EXPORTS = ROOT / "build", ROOT / "exports"

C = dict(night="#1d1612", choc="#3b2418", caramel="#b9814a", olive="#6f7347", oat="#ebe3d3",
         oat_deep="#d8cbb2", olive_tone="#7d8257", choc_tone="#4d3123", night_tone="#2a201a")

SPRITE = f"""<svg width="0" height="0" style="position:absolute"><defs>
<symbol id="ngondo" viewBox="0 0 80 80"><path d="M40 40a4 4 0 0 1 8 0a8 8 0 0 1-16 0a12 12 0 0 1 24 0a16 16 0 0 1-32 0a20 20 0 0 1 40 0a24 24 0 0 1-48 0a28 28 0 0 1 56 0a32 32 0 0 1-64 0" fill="none" stroke="currentColor" stroke-width="4"/></symbol>
<symbol id="amatana" viewBox="0 0 80 80"><g fill="none" stroke="currentColor" stroke-width="4"><polygon points="40,4 76,40 40,76 4,40"/><polygon points="40,14 66,40 40,66 14,40"/><polygon points="40,24 56,40 40,56 24,40"/></g><polygon points="40,34 46,40 40,46 34,40" fill="currentColor"/></symbol>
<symbol id="itweka" viewBox="0 0 80 80"><g fill="none" stroke="currentColor" stroke-width="4"><rect x="4" y="4" width="72" height="72"/><rect x="14" y="14" width="52" height="52"/><rect x="24" y="24" width="32" height="32"/></g><rect x="35" y="35" width="10" height="10" fill="currentColor"/></symbol>
<g id="itq" fill="none" stroke="currentColor" stroke-width="4"><polyline points="4,4 40,40 76,4"/><polyline points="18,4 40,26 62,4"/><polyline points="32,4 40,12 48,4"/></g>
<symbol id="itangaza" viewBox="0 0 80 80"><use href="#itq"/><use href="#itq" transform="rotate(90 40 40)"/><use href="#itq" transform="rotate(180 40 40)"/><use href="#itq" transform="rotate(270 40 40)"/></symbol>
<symbol id="abashi" viewBox="0 0 80 80"><g stroke-width="7" stroke="currentColor"><line x1="-4" y1="20" x2="20" y2="-4"/><line x1="-4" y1="44" x2="44" y2="-4"/><line x1="-4" y1="68" x2="68" y2="-4" stroke="{C['caramel']}"/><line x1="12" y1="84" x2="84" y2="12"/><line x1="36" y1="84" x2="84" y2="36"/><line x1="60" y1="84" x2="84" y2="60"/></g></symbol>
<symbol id="amaboko" viewBox="0 0 80 80"><g fill="currentColor"><polygon points="4,36 22,6 40,36"/><polygon points="40,36 58,6 76,36"/><polygon points="4,44 22,74 40,44"/><polygon points="40,44 58,74 76,44"/></g></symbol>
<pattern id="border" width="48" height="32" patternUnits="userSpaceOnUse"><rect width="48" height="32" fill="{C['choc']}"/><polygon points="0,32 12,8 24,32" fill="{C['oat']}"/><polygon points="24,32 36,8 48,32" fill="{C['caramel']}"/></pattern>
</defs></svg>"""

CSS = f"""
@font-face{{font-family:"Big Shoulders";src:url("{(ROOT / 'fonts' / 'BigShoulders.ttf').as_uri()}");font-weight:100 900}}
@font-face{{font-family:"Hanken Grotesk";src:url("{(ROOT / 'fonts' / 'HankenGrotesk.ttf').as_uri()}");font-weight:100 900}}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:var(--w);height:var(--h);overflow:hidden}}
body{{position:relative;font-family:"Hanken Grotesk",sans-serif;color:{C['choc']};-webkit-font-smoothing:antialiased}}
.cap{{font-family:"Big Shoulders",sans-serif;font-weight:800;font-variation-settings:"opsz" 72;text-transform:uppercase;line-height:.88;letter-spacing:.01em}}
.label{{font-weight:500;letter-spacing:.12em;text-transform:uppercase}}
.abs{{position:absolute}}
.motif{{position:absolute;display:block}}
.photo{{position:absolute;background-size:cover;background-position:center}}
.ph{{background:#4a3324;overflow:hidden}}
.ph::before{{content:"";position:absolute;left:30%;top:24%;width:40%;height:90%;background:#2e2018;border-radius:42% 42% 0 0}}
.ph::after{{content:"your photo";position:absolute;right:24px;top:20px;font:500 22px "Hanken Grotesk";letter-spacing:.12em;text-transform:uppercase;color:#a07a5c}}
.logo [data-color=primary]{{fill:var(--ink,{C['choc']})}}
.logo [data-color=brand-2]{{fill:{C['caramel']}}}
.border{{position:absolute;left:0;right:0}}
"""


def svg_inline(name, cls="logo", style=""):
    s = (ROOT / "logo" / f"master-{name}.svg").read_text()
    return s.replace("<svg ", f'<svg class="{cls}" style="{style}" ', 1)


def motif(name, color, style):
    return f'<svg class="motif" viewBox="0 0 80 80" style="color:{color};{style}"><use href="#{name}"/></svg>'


def border_band(h, where="top:0"):
    # pattern scaled by height: draw the pattern in a nested svg at native size, scaled
    return (f'<svg class="border" style="{where};height:{h}px;width:100%" viewBox="0 0 {round(1600*32/h)} 32" '
            f'preserveAspectRatio="xMinYMid slice"><rect width="100%" height="32" fill="url(#border)"/></svg>')


class Photos:
    def __init__(self):
        src = sorted(p for p in (ROOT / "photos").iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"))
        out = BUILD / "photos"
        out.mkdir(parents=True, exist_ok=True)
        self.files = []
        for i, p in enumerate(src):
            im = Image.open(p).convert("RGB")
            im.thumbnail((2400, 2400))
            a = np.asarray(im).astype(np.float32) / 255
            g = Image.fromarray((grade(a, "warm") * 255 + 0.5).astype(np.uint8))
            dst = out / f"{i:02d}.jpg"
            g.save(dst, quality=90)
            self.files.append(dst)

    def __call__(self, i, style):
        if not self.files:
            return f'<div class="photo ph" style="{style}"></div>'
        f = self.files[i % len(self.files)]
        return f'<div class="photo" style="{style};background-image:url(\'{f.as_uri()}\')"></div>'


def templates(photo):
    T = {}
    oat, choc, night, olive, car = C["oat"], C["choc"], C["night"], C["olive"], C["caramel"]

    T["profile-picture"] = (1080, 1080, choc, f"""
      <div class="abs" style="inset:0;display:grid;place-items:center">{svg_inline('symbol', style=f'width:560px;--ink:{oat}')}</div>""")

    for key, m in (("work", "itweka"), ("training", "abashi"), ("notes", "amatana"), ("travel", "ngondo"), ("about", "itangaza")):
        T[f"highlight-{key}"] = (1080, 1920, choc, f"""
          {motif(m, oat, 'left:330px;top:630px;width:420px;height:420px')}""")

    T["post-text"] = (1080, 1350, oat, f"""
      {motif('ngondo', C['oat_deep'], 'right:-330px;top:-260px;width:900px;height:900px')}
      <div class="abs label" style="left:84px;bottom:560px;font-size:26px;color:{olive}">Shay · Notes</div>
      <div class="abs cap" style="left:80px;bottom:200px;font-size:200px">Notes<br>from<br>Montreal</div>
      <div class="abs" style="left:84px;bottom:110px;font-size:34px;color:#5a4636">three days, one notebook, too much coffee.</div>""")

    T["post-photo"] = (1080, 1350, night, f"""
      {photo(0, 'left:0;top:0;width:1080px;height:1010px')}
      {motif('amatana', oat, 'left:56px;top:56px;width:120px;height:120px')}
      <div class="abs cap" style="left:72px;bottom:72px;font-size:130px;color:{oat}">Slow week.<br>Good week.</div>""")

    T["post-update"] = (1080, 1350, olive, f"""
      {border_band(44)}
      {motif('itweka', C['olive_tone'], 'right:-230px;top:300px;width:640px;height:640px')}
      <div class="abs cap" style="left:80px;bottom:230px;font-size:170px;color:#f4efe4">What I'm<br>building<br>right now</div>
      <div class="abs" style="left:84px;bottom:130px;font-size:34px;color:#e3e4cf">honest update, no highlight reel.</div>""")

    T["carousel-cover"] = (1080, 1350, oat, f"""
      {photo(1, 'left:64px;top:64px;width:952px;height:760px')}
      {motif('itangaza', C['oat_deep'], 'right:-190px;bottom:-190px;width:380px;height:380px')}
      <div class="abs label" style="left:68px;top:868px;font-size:24px;color:{olive}">1 / 6 · swipe</div>
      <div class="abs cap" style="left:64px;bottom:96px;font-size:120px">Things I'd tell<br>first-year me</div>""")

    T["carousel-slide"] = (1080, 1350, oat, f"""
      <div class="abs cap" style="left:80px;top:96px;font-size:150px;color:{car}">02</div>
      <div class="abs cap" style="left:80px;top:300px;font-size:120px">Ship the<br>ugly version</div>
      <div class="abs" style="left:84px;top:560px;width:860px;font-size:42px;line-height:1.45;color:#4a3426">Nobody remembers your first version. They remember that you kept going. Put it out, watch what people do with it, then fix the part that matters.</div>
      <div class="abs" style="left:80px;bottom:80px">{svg_inline('lockup-horizontal', style=f'height:56px;--ink:{choc}')}</div>
      <div class="abs label" style="right:84px;bottom:96px;font-size:24px;color:{olive}">2 / 6</div>""")

    T["reel-cover"] = (1080, 1920, night, f"""
      {photo(2, 'inset:0')}
      <div class="abs" style="left:0;right:0;top:1060px;height:400px;background:{night}"></div>
      <div class="abs cap" style="left:80px;top:1110px;font-size:150px;color:{oat}">Day in the<br>life, honestly</div>
      {motif('amatana', oat, 'right:80px;top:1140px;width:96px;height:96px')}""")

    T["story"] = (1080, 1920, oat, f"""
      {photo(3, 'left:0;top:0;width:1080px;height:1240px')}
      {border_band(36, 'top:1240px')}
      <div class="abs label" style="left:84px;top:1350px;font-size:26px;color:{olive}">This week</div>
      <div class="abs cap" style="left:80px;top:1410px;font-size:150px">Gym 6am.<br>Code 9pm.</div>
      <div class="abs" style="left:84px;bottom:150px;font-size:34px;color:#5a4636">somewhere in between: class.</div>""")

    T["reel-end-card"] = (1080, 1920, night, f"""
      {motif('ngondo', C['night_tone'], 'left:-420px;top:280px;width:1500px;height:1500px')}
      <div class="abs" style="inset:0;display:grid;place-items:center">
        <div style="text-align:center">{svg_inline('lockup-stacked', style=f'height:380px;--ink:{oat}')}
        <div style="margin-top:60px;font-size:40px;color:#cbbda4">see you next week.</div></div></div>""")

    T["linkedin-banner"] = (1584, 396, oat, f"""
      {border_band(28, 'bottom:0')}
      {motif('ngondo', C['oat_deep'], 'left:-110px;top:-250px;width:520px;height:520px')}
      <div class="abs" style="right:96px;top:84px;text-align:right">
        <div class="cap" style="font-size:88px">Building Cobuu Ventures</div>
        <div style="margin-top:22px;font-size:30px;color:#5a4636">Computer science · Western → Kelowna · training most mornings</div></div>""")

    T["website-hero"] = (1440, 900, oat, f"""
      <div class="abs" style="left:72px;top:44px">{svg_inline('lockup-horizontal', style=f'height:40px;--ink:{choc}')}</div>
      <div class="abs" style="right:72px;top:46px;display:flex;gap:40px;align-items:center;font-size:19px;font-weight:500">
        <span>Work</span><span>Notes</span><span>Training</span><span>About</span>
        <span style="background:{choc};color:{oat};padding:12px 24px;border-radius:999px">Say hi</span></div>
      {photo(4, 'right:72px;top:150px;width:560px;height:680px')}
      {border_band(24, 'bottom:0')}
      <div class="abs label" style="left:76px;top:230px;font-size:18px;color:{olive}">Computer science · Founder, Cobuu Ventures</div>
      <div class="abs cap" style="left:72px;top:280px;font-size:128px">Building,<br>training,<br>figuring<br>it out.</div>""")
    return T


def page(w, h, bg, body):
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>:root{{--w:{w}px;--h:{h}px}}{CSS}'
            f'body{{background:{bg}}}</style></head><body>{SPRITE}{body}</body></html>')


def render(name, w, h, html):
    f = BUILD / "html" / f"{name}.html"
    f.write_text(html)
    out = EXPORTS / f"{name}.png"
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--allow-file-access-from-files", "--virtual-time-budget=4000",
                    f"--window-size={w},{h}", f"--screenshot={out}", f.as_uri()],
                   check=True, capture_output=True)
    return out


BOARD_CSS = """
@font-face{font-family:"Big Shoulders";src:url("fonts/BigShoulders.ttf");font-weight:100 900}
@font-face{font-family:"Hanken Grotesk";src:url("fonts/HankenGrotesk.ttf");font-weight:100 900}
:root{--night:#1d1612;--choc:#3b2418;--caramel:#b9814a;--olive:#6f7347;--oat:#ebe3d3;--oat-deep:#d8cbb2;--ink:#3b2418;--muted:#6b5545}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--oat);color:var(--choc);font:400 17px/1.6 "Hanken Grotesk",sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1200px;margin:0 auto;padding:0 32px}
.cap{font-family:"Big Shoulders",sans-serif;font-weight:800;font-variation-settings:"opsz" 72;text-transform:uppercase;line-height:.9;letter-spacing:.01em}
.label{font-size:13px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--olive)}
header{padding:40px 0 24px;display:flex;justify-content:space-between;align-items:center}
section{padding:72px 0;border-top:1px solid var(--oat-deep)}
section.dark{background:var(--night);color:var(--oat);border:0}
section.dark .label{color:#a9ad7f}
h2.cap{font-size:84px;margin:10px 0 18px}
p.lede{max-width:640px;color:var(--muted);font-size:19px}
.dark p.lede{color:#cbbda4}
.grid{display:grid;gap:20px}
.g2{grid-template-columns:repeat(2,minmax(0,1fr))}.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.g4{grid-template-columns:repeat(4,minmax(0,1fr))}.g5{grid-template-columns:repeat(5,minmax(0,1fr))}
.g6{grid-template-columns:repeat(6,minmax(0,1fr))}
.tile{border-radius:10px;overflow:hidden;border:1px solid var(--oat-deep)}
.tile img{display:block;width:100%;height:auto}
.cap-note{font-size:14px;color:var(--muted);margin-top:8px}
.dark .cap-note{color:#b5a68d}
.sw{height:150px;border-radius:10px;padding:14px;display:flex;flex-direction:column;justify-content:flex-end;font-size:14px}
.sw b{font-weight:500}
.rule{background:#fff8;border-radius:10px;padding:18px}
.dark .rule{background:#2a201a}
.rule h4{font-weight:500;font-size:16px;margin-bottom:4px}
.rule p{font-size:15px;color:var(--muted)}
.dark .rule p{color:#b5a68d}
.do h4::before{content:"Do · ";color:var(--olive)}.dont h4::before{content:"Don't · ";color:#a5502a}
.motif-t{background:var(--choc);color:var(--oat);border-radius:10px;padding:16px}
.motif-t svg{display:block;width:100%;aspect-ratio:1}
.motif-t div{font-size:14px;margin-top:8px}
.logo [data-color=primary]{fill:var(--ink)}.logo [data-color=brand-2]{fill:var(--caramel)}
a{color:inherit}
.files li{margin:6px 0;list-style:none}
@media (max-width:760px){.g3,.g4,.g5,.g6{grid-template-columns:repeat(2,minmax(0,1fr))}.g2{grid-template-columns:1fr}h2.cap{font-size:56px}}
"""


def board(names):
    rel = lambda n: f"exports/{n}.png"
    img = lambda n, note="": f'<div><div class="tile"><img src="{rel(n)}" alt="{n.replace("-", " ")}"></div>' + (f'<div class="cap-note">{note}</div>' if note else "") + "</div>"
    lockup = svg_inline("lockup-horizontal", style="height:44px")
    motifs = "".join(f'<div class="motif-t"><svg viewBox="0 0 80 80"><use href="#{m}"/></svg><div>{m.capitalize()}</div><div style="opacity:.7;margin-top:0">{d}</div></div>'
                     for m, d in (("amatana", "Notes, the mark"), ("ngondo", "Travel, end cards"), ("itweka", "Work, building"),
                                  ("abashi", "Training"), ("itangaza", "About, carousels"), ("amaboko", "Dividers")))
    has_photos = bool(list((BUILD / "photos").glob("*.jpg")))
    html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shay brand board</title><style>{BOARD_CSS}</style></head><body>{SPRITE}
<div class="wrap"><header>{lockup}<span class="label">Brand board · v1</span></header></div>

<section style="border:0;padding-top:24px"><div class="wrap">
  <div class="label">The vibe</div>
  <h2 class="cap">Warm, clean,<br>honest, chill.</h2>
  <p class="lede">Builder, student, training most mornings. Warm-clean posts for words, moody-warm photos for life, and one Imigongo motif from Rwanda to make it mine. No hustle talk, no guru posts, no quote cards.</p>
</div></section>

<section><div class="wrap">
  <div class="label">01 · Logo</div><h2 class="cap">The Amatana diamond</h2>
  <p class="lede">Two nested bands around a caramel core, taken straight from Imigongo's Amatana motif, next to SHAY in calm tall caps. Use the diamond alone anywhere it's small: profile picture, favicon, watermark.</p>
  <div class="grid g3" style="margin-top:28px">
    <div class="rule" style="display:grid;place-items:center;height:220px;background:#fff8">{svg_inline('lockup-horizontal', style='height:70px')}</div>
    <div class="rule" style="display:grid;place-items:center;height:220px;background:var(--choc);--ink:var(--oat)">{svg_inline('lockup-stacked', style='height:150px;--ink:#ebe3d3')}</div>
    {img('profile-picture', 'Profile picture, everywhere')}
  </div>
  <div class="grid g4" style="margin-top:20px">
    <div class="rule dont"><h4>fill in the bands</h4><p>The gaps are the motif. A solid diamond is just a shape.</p></div>
    <div class="rule dont"><h4>turn it into a square</h4><p>It always stands on a point.</p></div>
    <div class="rule dont"><h4>recolour the core</h4><p>The core is caramel or the ground colour, nothing else.</p></div>
    <div class="rule do"><h4>keep space around it</h4><p>At least the height of the S on every side.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="label">02 · Colour</div><h2 class="cap">Chocolate, caramel, olive, oat</h2>
  <p class="lede">Oat and chocolate do most of the work. Olive is the second surface. Caramel is the small thing: the diamond core, the border, one number. Night is only for moody photo frames and end cards.</p>
  <div class="grid g5" style="margin-top:28px">
    <div class="sw" style="background:var(--oat);border:1px solid var(--oat-deep)"><b>Oat</b>#EBE3D3 · grounds</div>
    <div class="sw" style="background:var(--choc);color:var(--oat)"><b>Chocolate</b>#3B2418 · text, logo</div>
    <div class="sw" style="background:var(--olive);color:#f4efe4"><b>Olive</b>#6F7347 · second surface</div>
    <div class="sw" style="background:var(--caramel);color:#2a170d"><b>Caramel</b>#B9814A · accents only</div>
    <div class="sw" style="background:var(--night);color:var(--oat)"><b>Night</b>#1D1612 · photo frames</div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="label">03 · Type</div><h2 class="cap">Tall caps, plain words</h2>
  <div class="grid g2" style="margin-top:20px;align-items:end">
    <div><div class="cap" style="font-size:120px">Slow week.<br>Good week.</div><div class="cap-note">Big Shoulders ExtraBold, uppercase. Captions and headlines, six words max.</div></div>
    <div><p style="font-size:24px;line-height:1.45">Most days I write code, lift something heavy and ship one small thing.</p><div class="cap-note">Hanken Grotesk Regular. Everything people actually read: bios, carousel text, site copy. Lowercase is fine here.</div></div>
  </div>
</div></section>

<section class="dark"><div class="wrap">
  <div class="label">04 · Imigongo motifs</div><h2 class="cap">One per post, at the edge</h2>
  <p class="lede">Imigongo is the relief art of Rwanda's Eastern Province, traditionally made by women in Nyakarambi. These six motifs and the zigzag border are drawn in the brand colours. Use them like a signature, not a background.</p>
  <div class="grid g6" style="margin-top:28px">{motifs}</div>
  <div class="tile" style="margin-top:20px"><svg width="100%" height="36" style="display:block"><rect width="100%" height="36" fill="url(#border)" /></svg></div>
  <div class="cap-note">The zigzag border (Amaboko-style triangles): top or bottom edge only, 24–44 px tall at 1080 wide.</div>
  <div class="grid g4" style="margin-top:28px">
    <div class="rule do"><h4>crop it off an edge</h4><p>A corner or a side, never dead centre.</p></div>
    <div class="rule do"><h4>one step lighter</h4><p>Oat lines, or tone on tone one step off the ground.</p></div>
    <div class="rule dont"><h4>put it under text</h4><p>Captions always sit on a clean ground.</p></div>
    <div class="rule dont"><h4>use it over a face</h4><p>On photos, only small and in a quiet corner.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="label">05 · Photos</div><h2 class="cap">Warm, natural, a little grain</h2>
  <p class="lede">Natural light, golden hour, gym lights, real places. Grade everything with the Shay LUTs: Warm for daytime and clean posts, Low Light for night, gym and moody reels. In CapCut, start at 70–80% intensity.</p>
  <div class="tile" style="margin-top:28px"><img src="lut/lut-preview.jpg" alt="Original, Shay Warm and Shay Low Light side by side"></div>
  <div class="cap-note">Left to right: original, Shay Warm, Shay Low Light. {'Graded on your photos.' if has_photos else 'Shown on a reference feed you shared, for comparison only; rebuild with your own photos to replace it.'}</div>
  <div class="grid g3" style="margin-top:28px">
    <div class="rule"><h4>Photo first, words second</h4><p>The photo fills the frame; the caption sits on a solid night or oat band below it, never on top of busy parts.</p></div>
    <div class="rule"><h4>Frame, don't filter</h4><p>Oat margins around a photo turn it into a page. Use it for carousel covers and text-heavy posts.</p></div>
    <div class="rule"><h4>Keep the safe zone</h4><p>Reels and stories: keep words in the middle 4:5 so the grid crop and the UI never cut them.</p></div>
  </div>
</div></section>

<section><div class="wrap">
  <div class="label">06 · Instagram</div><h2 class="cap">The feed</h2>
  <p class="lede">Rotate three kinds of post: a text post on oat, a photo with a caption band, an honest update on olive. The grid stays calm because every post uses the same four colours.</p>
  <div class="grid g3" style="margin-top:28px">{img('post-text','Text post')}{img('post-photo','Photo post')}{img('post-update','Update post')}</div>
  <div class="grid g3" style="margin-top:20px">{img('carousel-cover','Carousel cover')}{img('carousel-slide','Carousel slide')}<div></div></div>
  <div class="grid g3" style="margin-top:20px">{img('reel-cover','Reel cover')}{img('story','Story')}{img('reel-end-card','Reel end card')}</div>
  <div class="label" style="margin-top:40px">Highlight covers</div>
  <div class="grid g5" style="margin-top:12px">{img('highlight-work','Work')}{img('highlight-training','Training')}{img('highlight-notes','Notes')}{img('highlight-travel','Travel')}{img('highlight-about','About')}</div>
</div></section>

<section><div class="wrap">
  <div class="label">07 · LinkedIn and site</div><h2 class="cap">Same brand, quieter voice</h2>
  <p class="lede">LinkedIn and the site use the same colours and type with fewer motifs: the border, one spiral, plain facts.</p>
  <div style="margin-top:28px">{img('linkedin-banner','LinkedIn banner, 1584 × 396. The left side sits under your profile photo, so nothing important goes there.')}</div>
  <div style="margin-top:20px">{img('website-hero','Website hero, 1440 × 900')}</div>
</div></section>

<section><div class="wrap">
  <div class="label">08 · Files</div><h2 class="cap">What's in the folder</h2>
  <ul class="files" style="margin-top:16px">
    <li><b>exports/</b> every asset above as a PNG, at upload size</li>
    <li><b>lut/</b> Shay-Warm.cube and Shay-Low-Light.cube for CapCut desktop, Premiere, DaVinci and Final Cut</li>
    <li><b>Shay-brand-guidelines.pdf</b> the 13-page guide: logo rules, colour codes, type, dark mode, accessibility</li>
    <li><b>logo/</b> logo masters; full set of SVG and PNG versions in the guidelines kit folder</li>
    <li><b>photos/</b> drop your photos here and run tools/build.py: they're graded and placed into every template</li>
  </ul>
</div></section>
<div class="wrap" style="padding:40px 32px;font-size:13px;color:var(--muted)">Fonts: Big Shoulders and Hanken Grotesk, SIL Open Font License, from Google Fonts.</div>
</body></html>"""
    (ROOT / "brand-board.html").write_text(html)
    return ROOT / "brand-board.html"


def main():
    if BUILD.exists():
        shutil.rmtree(BUILD)
    (BUILD / "html").mkdir(parents=True)
    EXPORTS.mkdir(exist_ok=True)
    photo = Photos()
    for name, (w, h, bg, body) in templates(photo).items():
        print(render(name, w, h, page(w, h, bg, body)))
    print(board(list(templates(photo))))


if __name__ == "__main__":
    main()
