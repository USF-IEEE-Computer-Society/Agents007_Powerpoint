"""Render a tailored result as a PDF the student can hand around.

Built from a result the caller already has, so downloading never costs another
model call.
"""

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

# The chapter's palette, so the handout matches the app.
NAVY = colors.HexColor("#0A2E45")
IEEE_BLUE = colors.HexColor("#00629B")
GOLD = colors.HexColor("#CFC493")
MUTED = colors.HexColor("#5A6B78")
INK = colors.HexColor("#10222E")

TITLE = ParagraphStyle(
    "Title", fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=NAVY
)
SUBTITLE = ParagraphStyle(
    "Subtitle", fontName="Helvetica", fontSize=9, leading=13, textColor=MUTED
)
ROLE = ParagraphStyle(
    "Role", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=NAVY
)
COMPANY = ParagraphStyle(
    "Company", fontName="Helvetica", fontSize=10, leading=13, textColor=IEEE_BLUE
)
WHY = ParagraphStyle(
    "Why", fontName="Helvetica-Oblique", fontSize=8.5, leading=12, textColor=MUTED
)
BULLET = ParagraphStyle(
    "Bullet",
    fontName="Helvetica",
    fontSize=10,
    leading=14.5,
    textColor=INK,
    alignment=TA_LEFT,
)
FOOTNOTE = ParagraphStyle(
    "Footnote", fontName="Helvetica", fontSize=8.5, leading=12, textColor=MUTED
)


def _escape(text: str) -> str:
    """reportlab parses a mini-HTML in paragraphs, so markup must be escaped."""
    return (
        str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )


def build_pdf(result: dict) -> bytes:
    """Return the tailored result as PDF bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=LETTER,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.85 * inch,
        bottomMargin=0.75 * inch,
        title="Tailored resume bullets",
        author="IEEE-CS at USF Resume Kit",
    )

    story = [
        Paragraph("Tailored resume bullets", TITLE),
        Spacer(1, 3),
        Paragraph(
            f"IEEE-CS at USF &middot; generated {result['generatedAt'][:10]} "
            f"&middot; {len(result['selected'])} of {result['consideredCount']} "
            "experiences selected",
            SUBTITLE,
        ),
        Spacer(1, 7),
        HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=14),
    ]

    for entry in result["selected"]:
        story.append(Paragraph(_escape(entry["role"]), ROLE))
        story.append(Paragraph(_escape(entry["company"]), COMPANY))
        if entry.get("whyChosen"):
            story.append(Spacer(1, 3))
            story.append(Paragraph(_escape(entry["whyChosen"]), WHY))
        story.append(Spacer(1, 6))
        story.append(
            ListFlowable(
                [
                    ListItem(Paragraph(_escape(bullet), BULLET), leftIndent=14)
                    for bullet in entry["bullets"]
                ],
                bulletType="bullet",
                bulletChar="•",
                bulletColor=IEEE_BLUE,
                leftIndent=14,
                spaceBefore=0,
            )
        )
        story.append(Spacer(1, 16))

    if result.get("notSelected"):
        story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=10))
        left_out = "; ".join(
            f"{_escape(e['role'])} ({_escape(e['company'])})"
            for e in result["notSelected"]
        )
        story.append(
            Paragraph(f"<b>Considered and left out:</b> {left_out}", FOOTNOTE)
        )
        story.append(Spacer(1, 8))

    story.append(
        Paragraph(
            "Written from what you saved. Check every bullet before you use it.",
            FOOTNOTE,
        )
    )

    doc.build(story)
    return buffer.getvalue()
