# bakes the film's extra hull pictures from the package's full-size tiles (run with python3 -I)
import sys, json, os
import numpy as np
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
M = json.load(open(os.path.join(src, "manifest.json")))["hull"]
Wd, Ht = M["size"]
strip = np.zeros((Ht, Wd, 4), np.float32)
for t in M["tiles"]:
    im = np.asarray(Image.open(os.path.join(src, t["file"])).convert("RGBA"), np.float32)
    cx, cy, cw, ch = t["content_rect"]; lx, lw = t["logical_x"], t["logical_width"]
    strip[:, lx:lx + lw] = im[cy:cy + ch, cx:cx + lw]
    print(t["file"], im.shape, lx, lw)
a = strip[..., 3:4] / 255.0
pm = strip.copy(); pm[..., :3] *= a            # premultiplied
def boxh(x, r):                                 # horizontal box blur, radius r
    c = np.cumsum(np.pad(x, ((0, 0), (r + 1, r), (0, 0)), mode="edge"), axis=1)
    return (c[:, 2 * r + 1:] - c[:, :-(2 * r + 1)]) / (2 * r + 1)
def unpm(x):
    al = np.clip(x[..., 3:4], 1e-3, 255) / 255.0
    o = x.copy(); o[..., :3] = np.clip(x[..., :3] / al, 0, 255); return np.clip(o, 0, 255).astype(np.uint8)
os.makedirs(os.path.join(dst, "hi"), exist_ok=True); os.makedirs(os.path.join(dst, "mb"), exist_ok=True); os.makedirs(os.path.join(dst, "glow"), exist_ok=True)
TW = 2044
# 1. full size, as the package gives them (2 px of bleed each side)
for i, t in enumerate(M["tiles"]):
    Image.open(os.path.join(src, t["file"])).convert("RGBA").save(os.path.join(dst, "hi", "hull-0%d.webp" % i), quality=84, method=6)
# 2. motion blur along the hull (a 3-pass box = near gaussian, about 16 hull px), a quarter as wide, full height
mb = boxh(boxh(boxh(pm, 5), 5), 5)
pad = lambda x, l, r: np.pad(x, ((0, 0), (l, r), (0, 0)), mode="edge")
for i, t in enumerate(M["tiles"]):
    lx, lw = t["logical_x"], t["logical_width"]
    seg = pad(mb, 8, 8)[:, lx:lx + lw + 16]
    im = Image.fromarray(unpm(seg)).resize(((lw + 16) // 4, Ht), Image.LANCZOS)
    im.save(os.path.join(dst, "mb", "hull-0%d.webp" % i), quality=80, method=6)
# 3. the lights alone (windows, hangars, lamps: bright and coloured), softened: drawn over the hull adding light
rgb = strip[..., :3]; mx = rgb.max(-1); mn = rgb.min(-1)
sat = (mx - mn) / np.maximum(mx, 1)
k = np.clip((mx - 100) / 80, 0, 1) * np.clip((sat - 0.22) / 0.25, 0, 1) * a[..., 0]
em = Image.fromarray(np.clip(rgb * k[..., None], 0, 255).astype(np.uint8))
em = Image.blend(em.filter(ImageFilter.GaussianBlur(5)), em.filter(ImageFilter.GaussianBlur(18)), 0.55)
em = np.clip(np.asarray(em, np.float32) * 2.2, 0, 255)
al = em.max(-1, keepdims=True)                 # (its own alpha: the light's strength, so it can be added over anything)
em = np.concatenate([np.clip(em / np.maximum(al, 1) * 255, 0, 255), al], -1)
for i, t in enumerate(M["tiles"]):
    lx, lw = t["logical_x"], t["logical_width"]
    seg = pad(em, 8, 8)[:, lx:lx + lw + 16]
    Image.fromarray(seg.astype(np.uint8), "RGBA").resize(((lw + 16) // 4, Ht // 4), Image.LANCZOS).save(os.path.join(dst, "glow", "hull-0%d.webp" % i), quality=80, method=6)
