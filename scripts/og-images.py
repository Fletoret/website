#!/usr/bin/env python3
"""
Render a share image ("OG image") for every published book.

    python3 scripts/og-images.py                       # all books
    python3 scripts/og-images.py hil-mosi              # one author
    python3 scripts/og-images.py hil-mosi/lotet-e-dashtnies

Each image carries the book cover, the author's portrait, and two counts read
straight off the markdown in `autore/` — so the numbers are whatever the corpus
actually holds on the day it is run. Output:

    static/images/og/<author>/<book>.jpg   1200×628, the share asset
    static/images/og/manifest.json         what the SvelteKit route reads

JPEG rather than PNG, at quality 92 with no chroma subsampling: visually
indistinguishable here (checked on the type, which is what would suffer) and a
sixth of the bytes. These are regenerated whenever the corpus changes, so every
kilobyte lands in git history more than once.

Design follows design.md: the dark theme's tokens verbatim, Instrument Serif for
display type, Source Serif 4 for prose and figures, Inter for anything scanned
(eyebrow, labels, URL). Rendered at 2x and downsampled, which is cheaper than
hinting text at final size and keeps the hairlines from disappearing.
"""

import glob
import json
import os
import re
import sys
from html import unescape

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "autore/index.json")
OUT_DIR = os.path.join(ROOT, "static/images/og")

# --- type ------------------------------------------------------------------
# fontsource splits its files by unicode-range: the *-latin-ext files hold ONLY
# the extended codepoints, so basic Latin renders as .notdef there. Albanian
# ë ç ê â all live in Latin-1, which the plain *-latin subsets cover.
NM = os.path.join(ROOT, "node_modules")
F_DISPLAY = f"{NM}/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2"
F_SERIF = f"{NM}/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2"
F_SERIF_IT = f"{NM}/@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2"
F_SANS = os.path.join(ROOT, "static/fonts/InterVariable.woff2")

# --- colour: dark theme tokens, verbatim from src/lib/css/app.css ----------
BG = (26, 23, 18)  # --bg-primary-dark
INK = (230, 223, 207)  # --text-primary-dark
INK_DIM = (151, 141, 123)  # --text-secondary-dark
ACCENT = (231, 154, 114)  # --link-primary-dark
LINE = (46, 42, 34)  # --border-color-dark

S = 2  # supersample factor — every measurement below is logical px
W, H = 1200, 628  # the Reddit/OG frame used in src/routes/social-images

# ---------------------------------------------------------------------------
# What each book *is*, and what its pieces are called.
#
# `genre` in autore/index.json is too coarse for this ("classic" covers a
# treatise, a proverb collection and an apologia), and the unit a reader counts
# differs per book: poems in a canzoniere, chapters in a novel, articles in the
# Kanun. So the wording is stated per book, and anything unlisted falls back to
# the heuristic in `describe()` — poems if the pieces are verse, chapters if not.
#
#   kind  — the noun under the title, beside the year
#   unit  — what the first figure counts
#   count — where that figure comes from:
#           files    one per markdown file (default)
#           lines    non-empty lines, for books that are a single long poem
#           numbered "1. …" items, for the numbered proverb volumes
#   quote — an optional line from the book itself; left out where none is chosen
# ---------------------------------------------------------------------------
BOOK_META = {
    "migjeni/vargjet-e-lira": {"kind": "Vjersha", "unit": "vjersha"},
    "migjeni/novelat-e-qytetit-te-veriut": {"kind": "Novela", "unit": "novela"},
    "konica/doktor-gjilpera": {"kind": "Roman satirik", "unit": "pjesë"},
    "konica/ese": {"kind": "Ese", "unit": "ese"},
    "fishta/mrizi-i-zanave": {"kind": "Vjersha", "unit": "vjersha"},
    "fishta/gomari-i-babatasit": {"kind": "Poemë satirike", "unit": "pjesë"},
    "fishta/lahuta-e-malcis": {"kind": "Epos", "unit": "këngë"},
    "leke-dukagjini/kanuni": {"kind": "Kanun", "unit": "libra"},
    "gjecovi/agimi-i-gjytetniis": {"kind": "Edukatë qytetare", "unit": "pjesë"},
    "sami-frasheri/shqiperia": {"kind": "Traktat", "unit": "krerë"},
    "sami-frasheri/proverba": {
        "kind": "Fjalë të urta",
        "unit": "fjalë të urta",
        "count": "numbered",
    },
    "naim-frasheri/bageti-e-bujqesi": {
        "kind": "Poemë",
        "unit": "vargje",
        "count": "lines",
    },
    "fan-noli/albumi": {"kind": "Vjersha e përkthime", "unit": "vjersha"},
    "frang-bardhi/skenderbeu": {"kind": "Apologji", "unit": "pjesë"},
    "ndre-mjeda/juvenilja": {"kind": "Vjersha", "unit": "vjersha"},
    "ndre-mjeda/lirija": {"kind": "Poemë", "unit": "vargje", "count": "lines"},
    "haki-stermilli/sikur-te-isha-djale": {"kind": "Roman", "unit": "kapituj"},
    "zef-serembe/vjersha": {"kind": "Vjersha", "unit": "vjersha"},
    "grameno/kryengritja-shqiptare": {"kind": "Kujtime", "unit": "krerë"},
    "cajupi/baba-tomorri": {
        "kind": "Vjersha",
        "unit": "pjesë",
        "quote": "Baba-Tomorr, Kish'e Shqipërisë",
    },
    "hil-mosi/lotet-e-dashtnies": {
        "kind": "Vjersha dashtnore",
        "unit": "vjersha",
        "quote": "Me t'gjith zêmer kto i shkrova…",
    },
}


# Portrait framing. The default centres the top of a studio bust; these
# photographs don't all sit that way — Konica is a wide desk portrait with his
# face left of centre and small in frame. `focus` is a fraction of the source
# image, `zoom` above 1 crops tighter.
PORTRAIT_FRAMING = {
    "/images/faik-konica.avif": {"focus": (0.44, 0.28), "zoom": 1.35},
    "/images/zef-serembe.avif": {"focus": (0.5, 0.38), "zoom": 1.1},
    "/images/mihal-grameno.avif": {"focus": (0.5, 0.38)},
    "/images/ndre-mjeda.avif": {"focus": (0.5, 0.38)},
}


# ------------------------------------------------------------------ counting
def clean_body(raw):
    """Markdown/HTML in, plain transcribed text out."""
    text = raw
    text = re.sub(r"<[^>]+>", " ", text)  # the prose books carry <center>, <b>, <br>
    text = unescape(text)
    text = re.sub(r"\[\^[^\]]+\]:?", "", text)  # footnote refs and definitions
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text)  # links, images
    text = re.sub(r"^\s{0,3}#{1,6}\s*", "", text, flags=re.M)  # headings
    text = re.sub(r"[*_`]+", "", text)
    return text


def read_book(folder):
    """Walk a book's markdown and return (pieces, words, lines, numbered)."""
    pieces = words = lines = numbered = 0
    for path in sorted(glob.glob(os.path.join(ROOT, "autore", folder, "**/*.md"), recursive=True)):
        with open(path, encoding="utf-8") as fh:
            raw = fh.read()
        body = raw.split("---", 2)[2] if raw.startswith("---") else raw
        numbered += len(re.findall(r"^\s*\d+\.\s+\S", body, flags=re.M))
        text = clean_body(body)
        pieces += 1
        words += len([w for w in text.split() if re.search(r"[^\W\d_]", w, re.U)])
        lines += len([ln for ln in text.split("\n") if ln.strip()])
    return pieces, words, lines, numbered


def is_verse(folder):
    """True when most of a book's pieces are laid out as verse."""
    flags = []
    for path in glob.glob(os.path.join(ROOT, "autore", folder, "**/*.md"), recursive=True):
        with open(path, encoding="utf-8") as fh:
            raw = fh.read()
        frontmatter = raw.split("---")[1] if raw.startswith("---") else ""
        flags.append("respectLineBreaks: true" in frontmatter)
    return bool(flags) and sum(flags) > len(flags) / 2


def describe(folder, pieces):
    """Merge the stated wording for a book with a fallback for anything new."""
    meta = dict(BOOK_META.get(folder, {}))
    if "unit" not in meta:
        verse = is_verse(folder)
        if pieces == 1:
            meta["unit"], meta["count"] = ("vargje", "lines") if verse else ("fjalë", "words")
        else:
            meta["unit"] = "vjersha" if verse else "krerë"
    meta.setdefault("count", "files")
    return meta


def sq(n):
    """12853 -> '12.853' — Albanian thousands separator."""
    return f"{n:,}".replace(",", ".")


# --------------------------------------------------------------------- fonts
_FONT_CACHE = {}


def font(path, size, wght=None):
    key = (path, round(size * S), wght)
    if key not in _FONT_CACHE:
        f = ImageFont.truetype(path, round(size * S))
        if wght is not None:
            axes = f.get_variation_axes()
            f.set_variation_by_axes(
                [wght if b"Weight" in ax["name"] else ax["default"] for ax in axes]
            )
        _FONT_CACHE[key] = f
    return _FONT_CACHE[key]


def track(draw, xy, text, fnt, fill, spacing=0.0):
    """Draw text with letter-spacing (PIL has none). Baseline-anchored."""
    x, y = xy[0] * S, xy[1] * S
    gap = spacing * fnt.size
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill, anchor="ls")
        x += draw.textlength(ch, font=fnt) + gap
    return x / S


def measure(draw, text, fnt, spacing=0.0):
    gap = spacing * fnt.size
    if not text:
        return 0
    return (sum(draw.textlength(c, font=fnt) + gap for c in text) - gap) / S


def missing_glyphs(text, fnt):
    """Codepoints the face has no glyph for — a silent tofu box otherwise."""
    notdef = (fnt.getbbox("￾"), fnt.getlength("￾"))
    out = set()
    for ch in set(text):
        if ch.isspace():
            continue
        if (fnt.getbbox(ch), fnt.getlength(ch)) == notdef and ch != "￾":
            out.add(ch)
    return out


def fit_title(draw, text, max_width, sizes=(66, 60, 54, 48, 43), max_lines=2):
    """Largest size at which the title fits `max_lines` lines, plus those lines."""
    for size in sizes:
        fnt = font(F_DISPLAY, size)
        words = text.split()
        lines, cur = [], ""
        for word in words:
            trial = f"{cur} {word}".strip()
            if measure(draw, trial, fnt) <= max_width or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = word
        lines.append(cur)
        if len(lines) <= max_lines and all(measure(draw, ln, fnt) <= max_width for ln in lines):
            return fnt, lines, size
    fnt = font(F_DISPLAY, sizes[-1])
    return fnt, [text], sizes[-1]


# -------------------------------------------------------------------- assets
def resolve(web_path):
    """Pick the best local file behind an /images/... path.

    The covers and portraits are stored per-format and not always complete —
    a .webp can be a 0-byte stub, some entries only ship .avif — so try them in
    quality order and take the first that actually decodes.
    """
    stem = os.path.splitext(web_path)[0]
    for ext in (".png", ".webp", ".avif", ".jpg", ".jpeg"):
        path = os.path.join(ROOT, "static", stem.lstrip("/") + ext)
        if os.path.exists(path) and os.path.getsize(path) > 0:
            try:
                img = Image.open(path)
                img.load()
                return img.convert("RGB"), path
            except Exception:
                continue
    return None, None


def radial_mask(size, power=2.2):
    """Alpha falling off from the centre — feathers the cover glow."""
    small = 96
    m = Image.new("L", (small, small))
    px = m.load()
    for yy in range(small):
        for xx in range(small):
            dx = (xx - small / 2) / (small / 2)
            dy = (yy - small / 2) / (small / 2)
            d = min(1.0, (dx * dx + dy * dy) ** 0.5)
            px[xx, yy] = int(255 * max(0.0, 1.0 - d) ** power)
    return m.resize(size, Image.LANCZOS)


def rounded_alpha(size, radius):
    """A rounded-rectangle alpha channel, built at 2x and downsampled."""
    w, h = size
    mask = Image.new("L", (w * 2, h * 2), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, w * 2 - 1, h * 2 - 1], radius=radius * 2, fill=255
    )
    return mask.resize((w, h), Image.LANCZOS)


def circle_crop(img, d, focus=(0.5, 0.42), zoom=0.82):
    """Circular medallion of a portrait.

    The portraits are tight studio busts: inscribed 1:1 they lose the top of the
    head to the arc, so each is set on a square of its own paper colour
    (`zoom` < 1 = more room) with the focal point centred, then masked.
    """
    w, h = img.size
    side = int(min(w, h) / zoom)
    paper = img.crop((0, 0, 24, 24)).resize((1, 1), Image.BOX).getpixel((0, 0))

    square = Image.new("RGB", (side, side), paper)
    square.paste(img, (int(side / 2 - focus[0] * w), int(side / 2 - focus[1] * h)))

    px = d * S
    square = ImageEnhance.Contrast(square.resize((px, px), Image.LANCZOS)).enhance(1.04)
    out = square.convert("RGBA")
    out.putalpha(rounded_alpha((px, px), px // 2))
    return out


# --------------------------------------------------------------------- render
def render(book):
    """One book in, one 2x RGBA frame out."""
    canvas = Image.new("RGBA", (W * S, H * S), BG + (255,))
    draw = ImageDraw.Draw(canvas)

    cover, cover_path = resolve(book["thumbnail"])
    if cover is None:
        raise SystemExit(f"no readable cover for {book['folder']} ({book['thumbnail']})")

    # Cover: fixed height, width from its own aspect — the covers run 0.61 to
    # 0.75 wide, so the text column starts wherever this one ends.
    ch = 468
    cw = round(ch * cover.width / cover.height)
    cx, cy = 76, (H - ch) // 2

    # Glow: the site's cover-glow effect (see app.css). Two passes — a wide,
    # faint bloom that lifts the left half off the flat ground, and a tighter,
    # hotter one hugging the artwork.
    # Pale covers (Proverba, Lirija, Vargjet e lira) bloom into a pink fog at
    # the strength dark artwork needs, so the wash is scaled back as the cover
    # gets brighter.
    grey = cover.convert("L").resize((16, 16), Image.LANCZOS)
    brightness = sum(grey.tobytes()) / (16 * 16)
    damp = 1.0 if brightness < 110 else max(0.42, 1.0 - (brightness - 110) / 190)

    for glow_d, blur, sat, bright, opacity, dx in (
        (1500, 120, 1.55, 1.30, 0.60 * damp, 120),
        (760, 70, 1.70, 1.45, 0.55 * damp, 20),
    ):
        g = cover.resize((64, 96), Image.LANCZOS).resize((glow_d, glow_d), Image.BICUBIC)
        g = g.filter(ImageFilter.GaussianBlur(blur))
        g = ImageEnhance.Color(g).enhance(sat)
        g = ImageEnhance.Brightness(g).enhance(bright)
        g = g.convert("RGBA")
        g.putalpha(radial_mask((glow_d, glow_d)).point(lambda v: int(v * opacity)))
        canvas.alpha_composite(
            g, ((cx + cw // 2 + dx) * S - glow_d // 2, (cy + ch // 2) * S - glow_d // 2)
        )

    # Cover, with a soft shadow under it and a hairline so dark artwork on a
    # dark page keeps an edge.
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [(cx - 2) * S, (cy + 6) * S, (cx + cw + 2) * S, (cy + ch + 16) * S],
        radius=6 * S,
        fill=(0, 0, 0, 150),
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18 * S)))

    art = cover.resize((cw * S, ch * S), Image.LANCZOS).convert("RGBA")
    art.putalpha(rounded_alpha((cw * S, ch * S), 5 * S))
    canvas.alpha_composite(art, (cx * S, cy * S))
    draw.rounded_rectangle(
        [cx * S, cy * S, (cx + cw) * S - 1, (cy + ch) * S - 1],
        radius=5 * S,
        outline=(255, 240, 220, 26),
        width=max(1, S // 2),
    )

    # ---- text column ------------------------------------------------------
    col = cx + cw + 62
    col_w = (W - 76) - col

    f_eyebrow = font(F_SANS, 12, wght=600)
    f_sub = font(F_SERIF_IT, 21, wght=400)
    f_name = font(F_SERIF, 27, wght=600)
    f_meta = font(F_SANS, 12.5, wght=450)
    # Instrument Serif's "1" has no foot serif, so "141" reads as "l4l" at
    # size. The figures are the point of this image: Source Serif semibold.
    f_num = font(F_SERIF, 54, wght=600)
    f_label = font(F_SANS, 11, wght=550)
    f_quote = font(F_SERIF_IT, 19, wght=400)
    f_url = font(F_SANS, 13, wght=500)

    f_title, title_lines, _ = fit_title(draw, book["name"], col_w)
    title_leading = round(f_title.size / S * 1.02)

    # Lay the column out as a stack, then centre the stack on the cover: a
    # two-line title or a missing quote shifts everything, and nothing should
    # need re-nudging by hand when it does.
    PORTRAIT_D = 88
    stack = [
        ("eyebrow", 13),
        ("gap", 22),
        ("title", title_leading * len(title_lines)),
        ("gap", 12),
        ("subtitle", 22),
        ("gap", 28),
        ("rule", 1),
        ("gap", 24),
        ("author", PORTRAIT_D),
        ("gap", 24),
        ("rule", 1),
        ("gap", 30),
        ("stats", 66),
        ("gap", 32),
    ]
    if book["quote"]:
        stack += [("quote", 22), ("gap", 18)]
    stack += [("url", 16)]

    total = sum(h for _, h in stack)
    y = max(58, cy + (ch - total) / 2)

    for kind, h in stack:
        if kind == "gap":
            y += h
            continue
        if kind == "eyebrow":
            track(draw, (col, y + h), "FLETORET · BIBLIOTEKË DIXHITALE", f_eyebrow, ACCENT, 0.16)
        elif kind == "title":
            for i, line in enumerate(title_lines):
                draw.text(
                    (col * S, (y + title_leading * (i + 1) - title_leading * 0.22) * S),
                    line,
                    font=f_title,
                    fill=INK,
                    anchor="ls",
                )
        elif kind == "subtitle":
            draw.text((col * S, (y + h) * S), book["subtitle"], font=f_sub, fill=INK_DIM, anchor="ls")
        elif kind == "rule":
            draw.rectangle([col * S, y * S, (W - 76) * S, y * S + S - 1], fill=LINE)
        elif kind == "author":
            portrait, _ = resolve(book["portrait"])
            if portrait is not None:
                framing = PORTRAIT_FRAMING.get(book["portrait"], {})
                canvas.alpha_composite(
                    circle_crop(portrait, PORTRAIT_D, **framing), (col * S, round(y * S))
                )
                draw.ellipse(
                    [col * S, y * S, (col + PORTRAIT_D) * S - 1, (y + PORTRAIT_D) * S - 1],
                    outline=(231, 154, 114, 70),
                    width=max(1, S // 2),
                )
            # Several authors have no dates or birthplace in autore/index.json.
            # With no second line the name alone has to centre on the portrait
            # rather than sit where the two-line block put it.
            tx = col + PORTRAIT_D + 26
            name_baseline = y + (38 if book["author_meta"] else 52)
            draw.text((tx * S, name_baseline * S), book["author_name"], font=f_name, fill=INK, anchor="ls")
            if book["author_meta"]:
                track(draw, (tx, y + 62), book["author_meta"], f_meta, INK_DIM, 0.09)
        elif kind == "stats":
            # The second figure sits a fixed distance over, unless the first
            # one's own figure or label needs the room.
            gap = max(
                236,
                measure(draw, book["stats"][0][1], f_label, 0.13) + 78,
                measure(draw, book["stats"][0][0], f_num) + 62,
            )
            for i, (value, label) in enumerate(book["stats"]):
                x = col + i * gap
                draw.text((x * S, (y + 42) * S), value, font=f_num, fill=INK, anchor="ls")
                track(draw, (x, y + h), label, f_label, INK_DIM, 0.13)
            draw.rectangle(
                [(col + gap - 44) * S, (y - 4) * S, (col + gap - 44) * S + S - 1, (y + h + 6) * S],
                fill=LINE,
            )
        elif kind == "quote":
            track(draw, (col, y + h), f"“{book['quote']}”", f_quote, INK_DIM, 0.005)
        elif kind == "url":
            url = book["url"]
            track(draw, (col, y + h), url, f_url, ACCENT, 0.02)
            w_url = measure(draw, url, f_url, 0.02)
            draw.rectangle(
                [col * S, (y + h + 8) * S, (col + w_url) * S, (y + h + 8) * S + S - 1],
                fill=(231, 154, 114, 70),
            )
        y += h

    # Grain: keeps the flat dark ground from banding, and reads as paper.
    grain = Image.new("RGBA", canvas.size, (255, 245, 225, 0))
    grain.putalpha(Image.effect_noise(canvas.size, 22).convert("L").point(lambda v: int(abs(v - 128) * 0.10)))
    canvas.alpha_composite(grain)

    # Glyph coverage, checked once per book rather than discovered as tofu.
    for text, fnt, name in (
        (book["name"], f_title, "Instrument Serif"),
        (f"{book['subtitle']}{book['author_name']}{book['quote'] or ''}", f_sub, "Source Serif"),
        (f"{book['author_meta']}{book['url']}", f_eyebrow, "Inter"),
    ):
        gone = missing_glyphs(text, fnt)
        if gone:
            print(f"  ! {name} has no glyph for {sorted(gone)} in {book['folder']}")

    return canvas


# ----------------------------------------------------------------------- main
def collect(filters):
    """Every published book, as a flat render spec."""
    with open(INDEX, encoding="utf-8") as fh:
        index = json.load(fh)

    books = []
    for author in index.values():
        person = author.get("author") or {}
        place = (person.get("birthPlace") or {}).get("address") or ""
        city = place.split(",")[0].strip()
        birth, death = str(person.get("birthDate") or "")[:4], str(person.get("deathDate") or "")[:4]
        # Only print a lifespan that can be one. autore/index.json has Frang
        # Bardhi at 1635–1644, which is a data bug, not a nine-year life — and
        # a share image is the wrong place to repeat it.
        span = ""
        if birth and death and death.isdigit() and birth.isdigit() and int(death) - int(birth) >= 15:
            span = f"{birth}–{death}"
        author_meta = " · ".join(p for p in (city.upper(), span) if p)

        for book in author.get("books") or []:
            folder = book.get("folder") or ""
            if not book.get("publishedFletoret") or not folder:
                continue
            if filters and not any(folder == f or folder.startswith(f"{f}/") or folder.split("/")[0] == f for f in filters):
                continue

            pieces, words, lines, numbered = read_book(folder)
            meta = describe(folder, pieces)
            first = {"files": pieces, "lines": lines, "numbered": numbered, "words": words}[meta["count"]]

            year = str(book.get("datePublished") or "").replace("-", "–")
            books.append(
                {
                    "folder": folder,
                    "name": book.get("name") or folder,
                    "subtitle": " · ".join(p for p in (meta["kind"], year) if p),
                    "thumbnail": book.get("thumbnail") or "",
                    "portrait": author.get("thumbnail") or "",
                    "author_name": author.get("name") or "",
                    "author_meta": author_meta,
                    "quote": meta.get("quote"),
                    "url": f"fletoret.com/{folder}",
                    "stats": [
                        (sq(first), meta["unit"].upper()),
                        (sq(words), "FJALË TË TRANSKRIPTUARA"),
                    ],
                    "counts": {
                        "unit": meta["unit"],
                        "unitCount": first,
                        "words": words,
                        "pieces": pieces,
                        "lines": lines,
                    },
                }
            )
    return books


def main():
    filters = [f.strip("/") for f in sys.argv[1:]]
    books = collect(filters)
    if not books:
        raise SystemExit("nothing matched")

    manifest = {}
    for book in books:
        frame = render(book).convert("RGB")
        final = frame.resize((W, H), Image.LANCZOS)

        rel = f"{book['folder']}.jpg"
        path_jpg = os.path.join(OUT_DIR, rel)
        os.makedirs(os.path.dirname(path_jpg), exist_ok=True)
        final.save(path_jpg, "JPEG", quality=92, subsampling=0, optimize=True, progressive=True)

        manifest[book["folder"]] = {
            "image": f"/images/og/{rel}",
            "width": W,
            "height": H,
            "alt": (
                f"{book['name']}, {book['author_name']} — "
                f"{sq(book['counts']['unitCount'])} {book['counts']['unit']}, "
                f"{sq(book['counts']['words'])} fjalë të transkriptuara në Fletoret."
            ),
            **book["counts"],
        }
        print(
            f"{book['folder']:42s} {book['counts']['unitCount']:>6} {book['counts']['unit']:<14}"
            f" {book['counts']['words']:>7} fjalë  {os.path.getsize(path_jpg) / 1024:5.0f}K"
        )

    # Only rewrite the whole manifest on a full run; a filtered run patches it.
    path = os.path.join(OUT_DIR, "manifest.json")
    if filters and os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            merged = json.load(fh)
        merged.update(manifest)
        manifest = merged
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(dict(sorted(manifest.items())), fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"\n{len(books)} image(s) · manifest: {os.path.relpath(path, ROOT)}")


if __name__ == "__main__":
    main()
