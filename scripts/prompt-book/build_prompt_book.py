import sys; sys.path.insert(0, ".")
from content import DAYS, LIBRARY
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from xml.sax.saxutils import escape

VERSION, DATE = "1.0", "October 1, 2026"
OUT = "../../prompts/SkyTech_Prompts_v1.0_2026-10-01.pdf"  # run from scripts/prompt-book
ss = getSampleStyleSheet(); navy = colors.HexColor("#1F3A5F")
H1 = ParagraphStyle("H1", parent=ss["Heading1"], textColor=navy, fontSize=16, spaceAfter=8)
DAY = ParagraphStyle("DAY", parent=H1, fontSize=14, backColor=colors.HexColor("#E6ECF3"), borderPadding=6, spaceBefore=6, spaceAfter=10)
H2 = ParagraphStyle("H2", parent=ss["Heading2"], textColor=navy, fontSize=12, spaceBefore=8, spaceAfter=3)
B = ParagraphStyle("B", parent=ss["BodyText"], fontSize=10, leading=14)
LBL = ParagraphStyle("LBL", parent=B, fontName="Helvetica-Bold", fontSize=8, textColor=colors.HexColor("#4A6A8F"), spaceAfter=1)
ORIG = ParagraphStyle("ORIG", parent=B, fontName="Helvetica-Oblique", fontSize=9, leading=12, textColor=colors.HexColor("#555555"), leftIndent=8, spaceAfter=6)
P = ParagraphStyle("P", parent=B, fontSize=9.5, leading=13.5, leftIndent=8, rightIndent=8,
    backColor=colors.HexColor("#F3F5F8"), borderColor=colors.HexColor("#C9D2DE"), borderWidth=0.6, borderPadding=7, spaceBefore=3, spaceAfter=12)

def fmt(t):
    out = []
    for line in escape(t).split("\n"):
        for k in ["ROLE:", "CONTEXT:", "GOAL:", "TASK:", "CONSTRAINTS:", "OUTPUT:", "RULES:", "INPUT:", "FORMAT:", "IF BLOCKED:", "APPROVAL:", "INSTRUCTION", "QUESTION:", "UPDATE:", "FORMAT RULE", "CONSTRAINTS (standing):"]:
            if line.startswith(k):
                line = "<b>" + k + "</b>" + line[len(k):]; break
        out.append(line)
    return "<br/>".join(out)

def tbl(rows, widths):
    t = Table(rows, colWidths=widths)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),navy),("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),9),
        ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#C9D2DE")),("VALIGN",(0,0),(-1,-1),"TOP"),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4)]))
    return t

def footer(c, d):
    c.saveState(); c.setFont("Helvetica", 8); c.setFillColor(colors.HexColor("#777777"))
    c.drawString(0.75*inch, 0.5*inch, f"SkyTech Solutions LLC  |  Prompt Book v{VERSION}  |  {DATE}")
    c.drawRightString(letter[0]-0.75*inch, 0.5*inch, f"Page {d.page}"); c.restoreState()

doc = SimpleDocTemplate(OUT, pagesize=letter, leftMargin=0.75*inch, rightMargin=0.75*inch, topMargin=0.75*inch, bottomMargin=0.8*inch,
    title=f"SkyTech Prompt Book v{VERSION}", author="SkyTech Solutions LLC", subject="SkyTech Agent Program prompts",
    creator="SkyTech Solutions LLC", producer="SkyTech Solutions LLC", keywords="")
cell = ParagraphStyle("cell", parent=B, fontSize=9, leading=12)
s = [Paragraph("SkyTech Agent Program", ParagraphStyle("T", parent=H1, fontSize=22, spaceAfter=4)),
     Paragraph("Prompt Book", ParagraphStyle("T2", parent=H1, fontSize=15, textColor=colors.HexColor("#4A6A8F"))), Spacer(1,6),
     tbl([["Version","Date","Changes"],[VERSION, DATE, Paragraph("First release: Day 1 prompts with engineered versions, numbered by day; reusable prompt library L-01 to L-10", cell)]],
         [0.8*inch, 1.3*inch, 4.9*inch]), Spacer(1,10),
     Paragraph("How to use", H2),
     Paragraph("Part 1 lists every prompt by day. Each entry shows the original wording and an engineered version to reuse. "
               "Part 2 is a ready-to-copy library for daily agent work: replace anything in [brackets]. "
               "Numbering: [day].[nn] - Day 1 is 1.01, 1.02...; the next working day starts at 2.01. Increase the version for every update.", B),
     Paragraph("Prompt structure", H2),
     tbl([["Part","What it tells the agent"],
          ["ROLE","Who the agent is (e.g., SkyTech_BackOffice)"],
          ["CONTEXT / INPUT","Facts and files it needs"],
          ["TASK","Numbered steps to do"],
          ["CONSTRAINTS / RULES","Limits: $0 budget, approval first, legal rules"],
          ["OUTPUT","Exact format of the answer"]], [1.8*inch, 5.2*inch]),
     PageBreak(), Paragraph("Part 1 - Prompts by day", H1)]

for d, (day, items) in enumerate(DAYS, 1):
    s.append(Paragraph(day, DAY))
    for n, (title, orig, eng) in enumerate(items, 1):
        s.append(KeepTogether([Paragraph(f"{d}.{n:02d}  {escape(title)}", H2),
            Paragraph("AS WRITTEN", LBL), Paragraph(escape(orig), ORIG),
            Paragraph("ENGINEERED PROMPT", LBL), Paragraph(fmt(eng), P)]))

s += [PageBreak(), Paragraph("Part 2 - Reusable prompt library", H1),
      Paragraph("Copy a prompt, fill in the [brackets], and paste it into the SkyTech project.", B), Spacer(1,4),
      tbl([["ID","Use","Agent"]] + [[i, u, a] for i, u, a, _ in LIBRARY], [0.7*inch, 2.8*inch, 3.5*inch]), Spacer(1,8)]
for i, u, a, t in LIBRARY:
    s.append(KeepTogether([Paragraph(f"{i}  {escape(u)}  <font size=9 color='#4A6A8F'>({escape(a)})</font>", H2), Paragraph(fmt(t), P)]))

doc.build(s, onFirstPage=footer, onLaterPages=footer)
