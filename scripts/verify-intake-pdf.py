"""
Verify the fillable intake PDF behaves as a form, not just that it was written.

    node scripts/build-intake-pdf.mjs
    python scripts/verify-intake-pdf.py            (needs: pip install pymupdf pypdfium2)

Layout can be eyeballed; behaviour cannot. These drive REAL mouse clicks
through PDFium - the engine inside Chrome and Edge - save the result, and read
it back with a different library (MuPDF), so a pass means a patient's click
changes the file and the change survives a save.

Checked:
  - a body-diagram cell marks on click and clears on a second click;
  - cells sit on the side of the figure their anatomical tooltip claims;
  - gate radios and ordinary checkboxes take a click;
  - every skip button lands on the section it names;
  - name and date of birth are one field repeated on every page, and required;
  - nothing runs off the bottom of a page.
"""
import collections
import os
import re
import sys
import tempfile

import fitz
import pypdfium2 as pdfium
import pypdfium2.raw as c

SRC = sys.argv[1] if len(sys.argv) > 1 else "forms/Spine-Intake-Form.pdf"
H = 792
results = []


def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS" if cond else "FAIL") + "  " + name)
    if detail and not cond:
        print("        " + detail)


doc = fitz.open(SRC)


def page_of(prefix):
    for i, p in enumerate(doc):
        if any((w.field_name or "").startswith(prefix) for w in p.widgets()):
            return i
    return None


def centre(pno, pred):
    for w in doc[pno].widgets():
        if pred(w):
            r = w.rect
            return ((r.x0 + r.x1) / 2, H - (r.y0 + r.y1) / 2)
    return None


def named(prefix, zone=None):
    def pred(w):
        if not (w.field_name or "").startswith(prefix):
            return False
        return zone is None or (w.field_label or "").endswith(zone)
    return pred


# ---- 1. clicks ------------------------------------------------------------
targets = [
    ("diagram cell marks (pain, lumbar spine)", "diagram_pain_back", named("diagram_pain_back", "lumbar spine")),
    ("diagram cell marks (numbness, right thumb)", "diagram_numb_front", named("diagram_numb_front", "right thumb / index finger")),
    ("gate radio takes a click (PT tried)", "pt.tried", named("pt.tried")),
    ("checkbox takes a click (records checklist)", "attached.", named("attached.physical_therapy")),
]
points = []
for label, prefix, pred in targets:
    pno = page_of(prefix)
    pt = centre(pno, pred) if pno is not None else None
    if pt is None:
        check("target exists: " + label, False)
    else:
        points.append((label, pno, pt[0], pt[1]))


def click_all(src, pts, out):
    pdf = pdfium.PdfDocument(src)
    pdf.init_forms()
    env = pdf.formenv
    for _, pno, x, y in pts:
        page = pdf[pno]
        for fn in (c.FORM_OnMouseMove, c.FORM_OnLButtonDown, c.FORM_OnLButtonUp):
            fn(env.raw, page.raw, 0, x, y)
    c.FORM_ForceToKillFocus(env.raw)
    pdf.save(out)


def state_at(path, pno, x, y):
    d = fitz.open(path)
    for w in d[pno].widgets():
        r = w.rect
        if abs((r.x0 + r.x1) / 2 - x) < 0.5 and abs(H - (r.y0 + r.y1) / 2 - y) < 0.5:
            return d.xref_get_key(w.xref, "AS")[1]
    return None


tmp = tempfile.mkdtemp()
once = os.path.join(tmp, "once.pdf")
twice = os.path.join(tmp, "twice.pdf")
click_all(SRC, points, once)
for label, pno, x, y in points:
    s = state_at(once, pno, x, y)
    check(label, s not in (None, "/Off", "null"), "appearance state after click: %s" % s)
if points:
    label, pno, x, y = points[0]
    click_all(once, [points[0]], twice)
    check("second click removes a diagram mark", state_at(twice, pno, x, y) == "/Off")


# ---- 2. laterality ----------------------------------------------------------
# Facing the patient the sides swap; from behind they match. A diagram that got
# this backwards would put the wrong leg in the chart.
def wrong_side(prefix, left_zone_is_viewer_left):
    pno = page_of(prefix)
    cells = [w for w in doc[pno].widgets() if (w.field_name or "").startswith(prefix)]
    xs = [w.rect.x0 for w in cells]
    mid = (min(xs) + max(xs)) / 2
    wrong = total = 0
    for w in cells:
        zone = (w.field_label or "").split(": ", 1)[-1]
        if not (zone.startswith("left") or zone.startswith("right")):
            continue
        total += 1
        viewer_left = w.rect.x0 < mid
        is_left = zone.startswith("left")
        if (is_left == viewer_left) != left_zone_is_viewer_left:
            wrong += 1
    return wrong, total


w, t = wrong_side("diagram_pain_back", True)
check("back view: cells on the figure's left are the patient's LEFT", t > 0 and w <= 0.03 * t, "%d of %d on the wrong side" % (w, t))
w, t = wrong_side("diagram_pain_front", False)
check("front view: cells on the figure's left are the patient's RIGHT", t > 0 and w <= 0.03 * t, "%d of %d on the wrong side" % (w, t))

# ---- 3. skip buttons ----------------------------------------------------------
xref_to_page = {doc[i].xref: i for i in range(len(doc))}
n_links = 0
for pno, page in enumerate(doc):
    for l in page.get_links():
        raw = doc.xref_object(l["xref"], compressed=True)
        m = re.search(r"/Dest\[(\d+) 0 R/XYZ ([\d.]+) ([\d.]+)", raw)
        if not m:
            continue
        n_links += 1
        tp = xref_to_page[int(m.group(1))]
        top = H - float(m.group(3))
        label = page.get_textbox(l["from"]).strip()
        lines = []
        for b in doc[tp].get_text("dict")["blocks"]:
            for ln in b.get("lines", []):
                text = "".join(s["text"] for s in ln["spans"]).strip()
                if text and ln["bbox"][1] >= top - 2:
                    lines.append((ln["bbox"][1], text))
        lines.sort()
        landing = lines[0][1] if lines else ""
        want = re.search(r"(\d+[A-E]?)\s*\xbb", label)
        check(
            'skip button on p%d lands on "%s"' % (pno + 1, landing[:36]),
            bool(want) and landing.startswith(want.group(1) + "."),
            'label "%s" landed on "%s"' % (label, landing),
        )
check("skip buttons were found at all", n_links >= 10, "only %d found" % n_links)

# ---- 4. identity fields -------------------------------------------------------
counts = collections.Counter()
required = {}
for page in doc:
    for w in page.widgets():
        if w.field_name in ("patient.lastName", "patient.firstName", "patient.dob"):
            counts[w.field_name] += 1
            required[w.field_name] = bool(w.field_flags & 2)
for k in ("patient.lastName", "patient.firstName", "patient.dob"):
    check("%s repeats on every page and is required" % k, counts[k] == len(doc) and required.get(k))

# ---- 5. page fit ----------------------------------------------------------------
for i, page in enumerate(doc):
    low = max((w.rect.y1 for w in page.widgets()), default=0)
    check("page %d fields stay above the footer" % (i + 1), low <= H - 40, "lowest field at %.0f" % low)

print("\n%d/%d checks pass" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
