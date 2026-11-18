"""Build Shay's .cube LUTs (CapCut desktop, Premiere, DaVinci, Final Cut) and before/after previews.

usage: make_lut.py OUT_DIR [preview_image ...]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

N = 33


def rgb_to_hsv(c):
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    mx, mn = c.max(-1), c.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rm = m & (mx == r)
    gm = m & (mx == g) & ~rm
    bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    h = h / 6.0
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return np.stack([h, s, mx], -1)


def hsv_to_rgb(c):
    h, s, v = c[..., 0] % 1.0, c[..., 1], c[..., 2]
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.choose(i[..., None] * np.ones(3, int),
                    [np.stack(x, -1) for x in ((v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q))])
    return out


def hue_weight(h, centre, width):
    d = np.abs(((h - centre + 0.5) % 1.0) - 0.5)
    return np.clip(1 - d / width, 0, 1) ** 2


def grade(rgb, look):
    x = rgb.copy()
    # tone curve: lifted blacks, soft shoulder
    lift, top, a = (0.035, 0.955, 0.25) if look == "warm" else (0.045, 0.90, 0.55)
    x = np.clip(x, 0, 1)
    s_curve = (1 - a) * x + a * x * x * (3 - 2 * x)
    x = lift + (top - lift) * s_curve

    hsv = rgb_to_hsv(x)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    # greens -> olive: shift toward yellow and calm them down
    gw = hue_weight(h, 0.30, 0.14)
    h = h - 0.035 * gw
    s = s * (1 - 0.35 * gw)
    # blues and cyans muted
    bw = hue_weight(h, 0.58, 0.14)
    s = s * (1 - (0.45 if look == "warm" else 0.55) * bw)
    v = v * (1 - 0.05 * bw)
    # skin and caramel kept rich
    kw = hue_weight(h, 0.075, 0.07)
    s = s * (1 + 0.06 * kw)
    # overall saturation
    s = s * (0.90 if look == "warm" else 0.80)
    x = hsv_to_rgb(np.stack([h, np.clip(s, 0, 1), np.clip(v, 0, 1)], -1))

    # split tone: chocolate shadows, oat highlights
    lum = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
    sh = (1 - lum) ** 2
    hi = lum ** 2
    shadow_tint = np.array([0.030, 0.012, -0.020]) * (1.0 if look == "warm" else 1.3)
    high_tint = np.array([0.018, 0.010, -0.022])
    x = x + sh * shadow_tint + hi * high_tint
    return np.clip(x, 0, 1)


def write_cube(path, title, look):
    g = np.linspace(0, 1, N)
    # .cube order: red changes fastest
    b, gg, r = np.meshgrid(g, g, g, indexing="ij")
    grid = np.stack([r, gg, b], -1).reshape(-1, 3)
    out = grade(grid, look)
    with open(path, "w") as f:
        f.write(f'TITLE "{title}"\nLUT_3D_SIZE {N}\nDOMAIN_MIN 0.0 0.0 0.0\nDOMAIN_MAX 1.0 1.0 1.0\n')
        for row in out:
            f.write(f"{row[0]:.6f} {row[1]:.6f} {row[2]:.6f}\n")


def preview(src, dst_dir, looks):
    im = Image.open(src).convert("RGB")
    im.thumbnail((900, 900))
    a = np.asarray(im).astype(np.float32) / 255
    panels = [im] + [Image.fromarray((grade(a, lk) * 255 + 0.5).astype(np.uint8)) for lk in looks]
    w, h = im.size
    sheet = Image.new("RGB", (w * len(panels) + 20 * (len(panels) - 1), h), (235, 227, 211))
    for i, p in enumerate(panels):
        sheet.paste(p, (i * (w + 20), 0))
    out = dst_dir / f"preview-{Path(src).stem}.jpg"
    sheet.save(out, quality=88)
    return out


def main():
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    write_cube(out / "Shay-Warm.cube", "Shay Warm", "warm")
    write_cube(out / "Shay-Low-Light.cube", "Shay Low Light", "moody")
    for src in sys.argv[2:]:
        print(preview(src, out, ["warm", "moody"]))
    print(out / "Shay-Warm.cube")
    print(out / "Shay-Low-Light.cube")


if __name__ == "__main__":
    main()
