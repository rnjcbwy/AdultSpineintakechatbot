"""
Verify the fillable intake PDF behaves as a form, not just that it was written.

    node scripts/build-intake-pdf.mjs
    python scripts/verify-intake-pdf.py            (needs: pip install pymupdf pypdfium2)

Layout can be eyeballed; behaviour cannot. Two independent engines are used:

  MuPDF    executes the form's JavaScript. Answers are set the way a viewer
           sets them and the resulting visibility of every conditional block
           is read back - so "tick Physical therapy and round 1 appears" is
           observed, not assumed.
  PDFium   (the engine inside Chrome and Edge) takes real mouse clicks on the
           hand-built checkboxes, radios and body-diagram cells; the file is
           saved and read back with MuPDF.

A pass therefore means the script runs, the branches fire in the right order,
and a click changes the file in a way that survives a save.
"""
import collections
import os
import re
import sys
import tempfile

import pymupdf
import pypdfium2 as pdfium
import pypdfium2.raw as c

m = pymupdf.mupdf
SRC = sys.argv[1] if len(sys.argv) > 1 else "forms/Spine-Intake-Form.pdf"
H = 792
results = []


def check(name, cond, detail=""):
    results.append(bool(cond))
    print(("PASS" if cond else "FAIL") + "  " + name)
    if detail and not cond:
        print("        " + detail)


# =============================================================================
# 1. At rest (no JavaScript): everything must be visible.
# =============================================================================
plain = pymupdf.open(SRC)
hidden_at_rest = [
    w.field_name for p in plain for w in p.widgets()
    if w.field_name != "_si_branch" and (plain.xref_get_key(w.xref, "F")[1] in ("2", "6"))
]
check("saved with every block visible (usable without JavaScript)", not hidden_at_rest,
      "hidden at rest: %s" % hidden_at_rest[:6])

# =============================================================================
# 2. Branching, with the script running.
# =============================================================================
doc = pymupdf.open(SRC)
pdf = pymupdf._as_pdf_document(doc)
m.pdf_enable_js(pdf)
check("a JavaScript engine accepts the form's script", m.pdf_js_supported(pdf))
fields_root = m.pdf_dict_getp(m.pdf_trailer(pdf), "Root/AcroForm/Fields")


def field(name):
    f = m.pdf_lookup_field(fields_root, name)
    if not f.m_internal:
        raise SystemExit("no such field: " + name)
    return f


def visible(name):
    f = field(name)
    kids = m.pdf_dict_gets(f, "Kids")
    w = m.pdf_array_get(kids, 0) if m.pdf_is_array(kids) else f
    return (m.pdf_to_int(m.pdf_dict_gets(w, "F")) & 2) == 0


def setv(name, value):
    m.pdf_set_field_value(pdf, field(name), value, 0)
    m.pdf_calculate_form(pdf)


def value(name):
    return m.pdf_field_value(field(name))


def expect(label, shown, hidden_):
    wrong = [n for n in shown if not visible(n)] + ["(should be hidden) " + n for n in hidden_ if visible(n)]
    check(label, not wrong, "wrong: %s" % wrong)


# -- on opening: nothing conditional shows except what a blank form needs ------
expect("on opening, treatment details are hidden until a treatment is ticked",
       [], ["pt1_clinic", "pt2_clinic", "pt3_clinic", "inj1_type", "hep_guided", "chiro_provider", "medtrial_pharmacy"])
expect("on opening, contact / medication / allergy tables show (nothing ticked yet)",
       ["pt_phone", "ins_provider", "med_1_name", "alg_1_what"], [])
expect("on opening, the questionnaires and the warning are hidden",
       [], ["odi_1", "ndi_1", "mjoa_1", "redflag_msg", "nrs_back", "nrs_neck", "neck_fine", "low_belowknee"])

# -- physical therapy: most recent first, each round reveals the one before ----
setv("tx_pt", "Yes")
expect("ticking Physical therapy shows the MOST RECENT round only", ["pt1_clinic", "pt1_more"], ["pt2_clinic", "pt3_clinic"])
setv("pt1_more", "Yes")
expect("'I had an earlier round' adds round 2, not round 3", ["pt1_clinic", "pt2_clinic", "pt2_more"], ["pt3_clinic"])
setv("pt2_more", "Yes")
expect("'another round before this one' adds round 3", ["pt1_clinic", "pt2_clinic", "pt3_clinic"], [])
setv("pt1_more", "Off")
expect("un-ticking round 1's box removes rounds 2 AND 3 (no orphaned round)", ["pt1_clinic"], ["pt2_clinic", "pt3_clinic"])
setv("tx_pt", "Off")
expect("un-ticking Physical therapy removes every round", [], ["pt1_clinic", "pt2_clinic", "pt3_clinic"])

# -- injections chain the same way -----------------------------------------------
setv("tx_inj", "Yes")
expect("ticking Spine injections shows the most recent injection only", ["inj1_type"], ["inj2_type", "inj3_type", "inj4_type"])
setv("inj1_more", "Yes"); setv("inj2_more", "Yes"); setv("inj3_more", "Yes")
expect("three 'another injection' ticks reveal all four", ["inj1_type", "inj2_type", "inj3_type", "inj4_type"], [])
setv("inj2_more", "Off")
expect("un-ticking the middle one removes everything after it", ["inj1_type", "inj2_type"], ["inj3_type", "inj4_type"])

# -- the other treatments -----------------------------------------------------------
for box, probe in [("tx_hep", "hep_guided"), ("tx_chiro", "chiro_provider"), ("tx_acu", "acu_provider"),
                   ("tx_massage", "massage_provider"), ("tx_brace", "brace_type"), ("tx_other", "othertx_detail"),
                   ("tx_meds", "medtrial_pharmacy")]:
    setv(box, "Yes")
    on = visible(probe)
    setv(box, "Off")
    check("%s shows its section, and hides it again" % box, on and not visible(probe))

# -- symptom areas drive sections and questionnaires -------------------------------
setv("area_lowback", "Yes")
expect("Low back: back/leg scores, lower-body questions and the ODI appear; neck items do not",
       ["nrs_back", "nrs_leg", "low_belowknee", "odi_1"], ["nrs_neck", "neck_fine", "ndi_1"])
check("ODI status line tells the patient to complete it", "Please complete" in value("odi_status"), value("odi_status"))
check("NDI status line says it is not needed", "not needed" in value("ndi_status"), value("ndi_status"))
setv("area_neck", "Yes")
expect("adding Neck brings the neck items and the NDI", ["nrs_neck", "neck_fine", "ndi_1", "odi_1"], [])
expect("mJOA stays hidden until a myelopathy answer is Yes", [], ["mjoa_1"])
setv("neck_fine", "Yes")
expect("hand clumsiness = Yes reveals the mJOA", ["mjoa_1"], [])

# -- safety ----------------------------------------------------------------------
setv("urg_saddle", "Yes")
expect("saddle numbness = Yes shows the urgent warning", ["redflag_msg"], [])
setv("urg_saddle", "No")
expect("...and No hides it", [], ["redflag_msg"])

# -- the rest -------------------------------------------------------------------
setv("pt_onfile", "Yes")
expect("'office already has my information' hides contact and insurance", [], ["pt_phone", "ins_provider", "ec_name"])
check("name and date of birth stay visible and required when contact is skipped",
      visible("pt_first") and visible("pt_last") and visible("pt_dob"))
setv("med_none", "Yes"); setv("alg_nkda", "Yes")
expect("'no medications' and 'no known allergies' hide their tables", [], ["med_1_name", "alg_1_what"])
setv("soc_nicotine", "current")
expect("current nicotine use asks the current-use questions only", ["nic_product"], ["nicf_quit"])
setv("soc_nicotine", "former")
expect("former use asks when they quit instead", ["nicf_quit"], ["nic_product"])
setv("ctx_wc", "Yes")
expect("a workers' compensation claim asks for the claim details", ["ctx_claim"], [])
setv("cc_prior_surgery", "Yes")
expect("prior spine surgery asks what and when", ["ps_type"], [])

# -- calculated fields -----------------------------------------------------------
for i, v in enumerate([3, 1, 4, 4, 2, 3, 2, 0, 3, 2], start=1):
    setv("odi_%d" % i, str(v))
check("ODI scores itself: 24/50 = 48% (severe)", "24/50 = 48%" in value("odi_score") and "severe" in value("odi_score"), value("odi_score"))
for i, v in enumerate([3, 4, 2, 2], start=1):
    setv("mjoa_%d" % i, str(v))
check("mJOA scores itself: 11/18 (severe myelopathy)", "11/18" in value("mjoa_score") and "severe" in value("mjoa_score"), value("mjoa_score"))
setv("pt_first", "Jane"); setv("pt_last", "Doe"); setv("pt_dob", "05/04/1960")
check("the footer on every page carries the patient's name and date of birth", value("pt_footer") == "Jane Doe   DOB 05/04/1960", value("pt_footer"))
check("age is calculated from the date of birth", value("pt_age").isdigit() and 60 <= int(value("pt_age")) <= 80, value("pt_age"))

# =============================================================================
# 3. Real clicks, in Chrome's engine.
# =============================================================================
def find(pred):
    for i, p in enumerate(plain):
        for w in p.widgets():
            if pred(w):
                r = w.rect
                return i, (r.x0 + r.x1) / 2, H - (r.y0 + r.y1) / 2
    return None


def named(prefix, zone=None):
    def pred(w):
        if not (w.field_name or "").startswith(prefix):
            return False
        return zone is None or (w.field_label or "").endswith(zone)
    return pred


targets = [
    ("diagram cell marks on click (pain, lumbar spine)", named("diagram_pain_back", "lumbar spine")),
    ("diagram cell marks on click (numbness, right thumb)", named("diagram_numb_front", "right thumb / index finger")),
    ("a checkbox takes a click (Physical therapy)", named("tx_pt")),
    ("a radio takes a click (bladder question)", named("urg_bladder")),
]
points = []
for label, pred in targets:
    hit = find(pred)
    if hit is None:
        check("target exists: " + label, False)
    else:
        points.append((label,) + hit)


def click_all(src, pts, out):
    d = pdfium.PdfDocument(src)
    d.init_forms()
    env = d.formenv
    for _, pno, x, y in pts:
        page = d[pno]
        for fn in (c.FORM_OnMouseMove, c.FORM_OnLButtonDown, c.FORM_OnLButtonUp):
            fn(env.raw, page.raw, 0, x, y)
    c.FORM_ForceToKillFocus(env.raw)
    d.save(out)


def state_at(path, pno, x, y):
    d = pymupdf.open(path)
    for w in d[pno].widgets():
        r = w.rect
        if abs((r.x0 + r.x1) / 2 - x) < 0.5 and abs(H - (r.y0 + r.y1) / 2 - y) < 0.5:
            return d.xref_get_key(w.xref, "AS")[1]
    return None


tmp = tempfile.mkdtemp()
once, twice = os.path.join(tmp, "once.pdf"), os.path.join(tmp, "twice.pdf")
click_all(SRC, points, once)
for label, pno, x, y in points:
    s = state_at(once, pno, x, y)
    check(label, s not in (None, "/Off", "null"), "appearance state after click: %s" % s)
if points:
    click_all(once, [points[0]], twice)
    _, pno, x, y = points[0]
    check("a second click removes a diagram mark", state_at(twice, pno, x, y) == "/Off")


# Laterality: facing the patient the sides swap; from behind they match.
def wrong_side(prefix, left_zone_is_viewer_left):
    cells = [w for p in plain for w in p.widgets() if (w.field_name or "").startswith(prefix)]
    xs = [w.rect.x0 for w in cells]
    mid = (min(xs) + max(xs)) / 2
    wrong = total = 0
    for w in cells:
        zone = (w.field_label or "").split(": ", 1)[-1]
        if not (zone.startswith("left") or zone.startswith("right")):
            continue
        total += 1
        if (zone.startswith("left") == (w.rect.x0 < mid)) != left_zone_is_viewer_left:
            wrong += 1
    return wrong, total


w_, t_ = wrong_side("diagram_pain_back", True)
check("back view: cells on the figure's left are the patient's LEFT", t_ > 0 and w_ <= 0.03 * t_, "%d of %d wrong" % (w_, t_))
w_, t_ = wrong_side("diagram_pain_front", False)
check("front view: cells on the figure's left are the patient's RIGHT", t_ > 0 and w_ <= 0.03 * t_, "%d of %d wrong" % (w_, t_))

# =============================================================================
# 4. Content rules.
# =============================================================================
raw = open(SRC, "rb").read()
text_all = " ".join(p.get_text() for p in plain)
# Scripts live in three places: standalone actions, a button's own action,
# and a field's calculate action. All three are searched.
js_all = " ".join(
    plain.xref_get_key(x, k)[1]
    for x in range(1, plain.xref_length())
    for k in ("JS", "A/JS", "AA/C/JS")
    if plain.xref_get_key(x, k)[0] == "string"
)
check("scripts were found to inspect", "mailDoc" in js_all and "siRefresh" in js_all)
check("no personal (gmail) address anywhere in the form", "gmail" not in text_all.lower() and "gmail" not in js_all.lower())
check("the return address is the work address", "awey@holyname.org" in text_all and "awey@holyname.org" in js_all)
req = {w.field_name: bool(w.field_flags & 2) for p in plain for w in p.widgets() if w.field_name in ("pt_first", "pt_last", "pt_dob")}
check("first name, last name and date of birth are required", len(req) == 3 and all(req.values()), str(req))
for i, page in enumerate(plain):
    low = max((w.rect.y1 for w in page.widgets() if w.field_name not in ("pt_footer", "_si_branch")), default=0)
    check("page %d fields stay above the footer" % (i + 1), low <= H - 44, "lowest field at %.0f" % low)

print("\n%d/%d checks pass" % (sum(results), len(results)))
sys.exit(0 if all(results) else 1)
