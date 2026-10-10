"""Version: V2.1 (2026-10-10) — scripts/prompt-book/build_prompt_book.py — V2.1
Builds the SkyTech Prompt Book PDF from content.py.
Run from the repository folder:  python scripts/prompt-book/build_prompt_book.py
Needs : pip install reportlab   (free).  Errors: SKY-DOC-001 package missing, SKY-DOC-002 file problem.
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "common")); import skylog
skylog.install("build_prompt_book", "SKY-DOC-001")  # reportlab missing → SKY-DOC-001 with the pip command
from content import DAYS, LIBRARY, STANDING_RULES, VERSIONS
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from xml.sax.saxutils import escape

VERSION, DATE, DATE_ISO = "2.0", "October 2, 2026", "2026-10-02"
OUT = os.path.join(HERE, "..", "..", "prompts", f"SkyTech_Prompts_V{VERSION}_{DATE_ISO}.pdf")

ss = getSampleStyleSheet(); navy = colors.HexColor("#1F3A5F"); soft = colors.HexColor("#4A6A8F"); line = colors.HexColor("#C9D2DE")
H1 = ParagraphStyle("H1", parent=ss["Heading1"], textColor=navy, fontSize=16, spaceAfter=8)
DAY = ParagraphStyle("DAY", parent=H1, fontSize=14, backColor=colors.HexColor("#E6ECF3"), borderPadding=6, spaceBefore=6, spaceAfter=10)
H2 = ParagraphStyle("H2", parent=ss["Heading2"], textColor=navy, fontSize=12, spaceBefore=8, spaceAfter=3)
B = ParagraphStyle("B", parent=ss["BodyText"], fontSize=10, leading=14)
LBL = ParagraphStyle("LBL", parent=B, fontName="Helvetica-Bold", fontSize=7.5, textColor=soft, spaceAfter=1)
NOTE = ParagraphStyle("NOTE", parent=B, fontName="Helvetica-Oblique", fontSize=8.5, leading=11, textColor=colors.HexColor("#666666"), spaceAfter=4)
P = ParagraphStyle("P", parent=B, fontSize=9.5, leading=13.5, leftIndent=8, rightIndent=8,
    backColor=colors.HexColor("#F3F5F8"), borderColor=line, borderWidth=0.6, borderPadding=7, spaceBefore=3, spaceAfter=12)
cell = ParagraphStyle("cell", parent=B, fontSize=8.5, leading=11)
KEYS = ["ROLE:", "CONTEXT:", "GOAL:", "TASK:", "CONSTRAINTS (standing):", "CONSTRAINTS:", "OUTPUT:", "RULES:", "RULE (standing):", "INPUT:", "FORMAT:",
        "IF BLOCKED:", "APPROVAL:", "INSTRUCTIONS (standing):", "INSTRUCTION (standing):", "REQUIREMENT (standing):", "QUESTION:"]

def fmt(t):
    """Escapes a prompt and puts the ROLE:/TASK:/… keywords in bold on their own lines."""
    out = []
    for ln in escape(t).split("\n"):
        for k in KEYS:
            if ln.startswith(k): ln = "<b>" + k + "</b>" + ln[len(k):]; break
        out.append(ln)
    return "<br/>".join(out)

def tbl(rows, widths, header=True):
    """Styled ReportLab table (header row, grid, wrapped cells)."""
    rows = [[Paragraph(escape(str(c)), cell) if not hasattr(c, "wrap") else c for c in r] for r in rows]
    t = Table(rows, colWidths=widths, repeatRows=1)
    st = [("GRID", (0, 0), (-1, -1), 0.5, line), ("VALIGN", (0, 0), (-1, -1), "TOP"),
          ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]
    if header: st += [("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E6ECF3"))]
    t.setStyle(TableStyle(st)); return t

def footer(c, d):
    """Page footer: version line and page number on every page."""
    c.saveState(); c.setFont("Helvetica", 8); c.setFillColor(colors.HexColor("#777777"))
    c.drawString(0.75 * inch, 0.5 * inch, f"SkyTech Solutions LLC  |  Prompt Book V{VERSION}  |  {DATE}")
    c.drawRightString(letter[0] - 0.75 * inch, 0.5 * inch, f"Page {d.page}"); c.restoreState()

doc = SimpleDocTemplate(OUT, pagesize=letter, leftMargin=0.75 * inch, rightMargin=0.75 * inch, topMargin=0.75 * inch, bottomMargin=0.8 * inch,
    title=f"SkyTech Prompt Book V{VERSION}", author="SkyTech Solutions LLC", subject="SkyTech Agent Program prompts",
    creator="SkyTech Solutions LLC", producer="SkyTech Solutions LLC", keywords="")
count = sum(len(i) for _, i in DAYS)
s = [Paragraph("SkyTech Agent Program", ParagraphStyle("T", parent=H1, fontSize=22, spaceAfter=4)),
     Paragraph(f"Prompt Book V{VERSION}", ParagraphStyle("T2", parent=H1, fontSize=15, textColor=soft)),
     Paragraph(f"{count} prompts across {len(DAYS)} days · {len(LIBRARY)} reusable library prompts · {DATE}", B), Spacer(1, 8),
     Paragraph("Version history", H2),
     tbl([["Version", "Date", "Changes"]] + [list(v) for v in VERSIONS], [0.7 * inch, 1.2 * inch, 5.1 * inch]), Spacer(1, 6),
     Paragraph("How to use", H2),
     Paragraph("Part 1 lists the standing rules that apply to all work. Part 2 lists every prompt by day in professional form; "
               "where several messages covered the same request, they are merged into one prompt and the note above it says which. "
               "Part 3 is a ready-to-copy library for daily agent work: replace anything in [brackets]. "
               "Numbering is [day].[nn]: Day 1 is 1.01, 1.02 and so on; each new working day starts again at the next day number.", B),
     Paragraph("Prompt structure", H2),
     tbl([["Part", "What it tells the agent"], ["ROLE", "Who the agent is (for example SkyTech_BackOffice)"],
          ["CONTEXT / INPUT", "Facts and files it needs"], ["TASK", "Numbered steps to do"],
          ["RULES / CONSTRAINTS", "Limits: $0 budget, approval first, no duplicates, legal rules"], ["OUTPUT", "Exact format of the answer"]],
         [1.8 * inch, 5.2 * inch]),
     PageBreak(), Paragraph("Part 1 - Standing rules", H1),
     Paragraph("These rules come from the prompts below and apply to every task unless the owner changes them.", B), Spacer(1, 4),
     tbl([["Rule", "What it means", "From"]] + [list(r) for r in STANDING_RULES], [1.4 * inch, 4.7 * inch, 0.9 * inch]),
     PageBreak(), Paragraph("Part 2 - Prompts by day", H1)]

for d, (day, items) in enumerate(DAYS, 1):
    s.append(Paragraph(day, DAY))
    for n, (title, cons, prompt) in enumerate(items, 1):
        s.append(KeepTogether([Paragraph(f"{d}.{n:02d}  {escape(title)}", H2), Paragraph(escape(cons), NOTE),
                               Paragraph("PROMPT", LBL), Paragraph(fmt(prompt), P)]))

s += [PageBreak(), Paragraph("Part 3 - Reusable prompt library", H1),
      Paragraph("Copy a prompt, fill in the [brackets], and paste it into the SkyTech project.", B), Spacer(1, 4),
      tbl([["ID", "Use", "Agent"]] + [[i, u, a] for i, u, a, _ in LIBRARY], [0.7 * inch, 2.8 * inch, 3.5 * inch]), Spacer(1, 8)]
for i, u, a, t in LIBRARY:
    s.append(KeepTogether([Paragraph(f"{i}  {escape(u)}  <font size=9 color='#4A6A8F'>({escape(a)})</font>", H2), Paragraph(fmt(t), P)]))
s.append(Spacer(1, 12))
s.append(Paragraph(f"Version: V{VERSION} ({DATE_ISO}) — prompts/SkyTech_Prompts_V{VERSION}_{DATE_ISO}.pdf — V{VERSION}", NOTE))

doc.build(s, onFirstPage=footer, onLaterPages=footer)
print("wrote", os.path.normpath(OUT))

# Version: V2.1 (2026-10-10) — scripts/prompt-book/build_prompt_book.py — V2.1
