from __future__ import annotations

import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
SOURCE_MD = ROOT / "docs" / "universe-ai-project-report.md"
TEMPLATE_DOCX = Path(r"C:\Users\LENOVO\Documents\individual doc.docx")
OUTPUT_DOCX = ROOT / "docs" / "UniverseAI_Project_Report.docx"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
CP_NS = "http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
DC_NS = "http://purl.org/dc/elements/1.1/"
DCTERMS_NS = "http://purl.org/dc/terms/"
XSI_NS = "http://www.w3.org/2001/XMLSchema-instance"


def extract_sect_pr(template_docx: Path) -> str:
    with zipfile.ZipFile(template_docx, "r") as zf:
        xml_bytes = zf.read("word/document.xml")
    root = ET.fromstring(xml_bytes)
    body = root.find(f"{{{W_NS}}}body")
    if body is None:
        raise RuntimeError("Template document has no body element.")
    sect_pr = body.find(f"{{{W_NS}}}sectPr")
    if sect_pr is None:
        raise RuntimeError("Template document has no section properties.")
    return ET.tostring(sect_pr, encoding="unicode")


def paragraph_xml(
    text: str = "",
    *,
    style: str | None = None,
    align: str | None = None,
    bold: bool = False,
    size_half_points: int | None = None,
    page_break_before: bool = False,
) -> str:
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{escape(style)}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{escape(align)}"/>')
    if page_break_before:
        ppr.append('<w:pageBreakBefore/>')

    rpr = []
    if bold:
        rpr.append("<w:b/>")
    if size_half_points:
        rpr.append(f'<w:sz w:val="{size_half_points}"/>')

    ppr_xml = f"<w:pPr>{''.join(ppr)}</w:pPr>" if ppr else ""
    rpr_xml = f"<w:rPr>{''.join(rpr)}</w:rPr>" if rpr else ""

    if text == "":
        run_xml = "<w:r><w:t xml:space=\"preserve\"></w:t></w:r>"
    else:
        safe = escape(text)
        run_xml = f"<w:r>{rpr_xml}<w:t xml:space=\"preserve\">{safe}</w:t></w:r>"

    return f"<w:p>{ppr_xml}{run_xml}</w:p>"


def page_break_xml() -> str:
    return "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>"


def parse_source(md_path: Path) -> list[str]:
    lines = md_path.read_text(encoding="utf-8").splitlines()
    paragraphs: list[str] = []
    centered = False
    buffer: list[str] = []

    def flush_buffer() -> None:
        nonlocal buffer
        if not buffer:
            return
        text = " ".join(part.strip() for part in buffer if part.strip())
        if text:
            paragraphs.append(paragraph_xml(text, align="center" if centered else None))
        buffer = []

    for raw in lines:
        line = raw.rstrip()
        stripped = line.strip()

        if stripped == "[CENTER]":
            flush_buffer()
            centered = True
            continue
        if stripped == "[ENDCENTER]":
            flush_buffer()
            centered = False
            continue
        if stripped == "[PAGEBREAK]":
            flush_buffer()
            paragraphs.append(page_break_xml())
            continue
        if stripped == "":
            flush_buffer()
            continue

        heading_match = re.match(r"^(#{1,3})\s+(.*)$", stripped)
        if heading_match:
            flush_buffer()
            marks, text = heading_match.groups()
            level = len(marks)
            if level == 1:
                paragraphs.append(
                    paragraph_xml(
                        text,
                        style="Title",
                        align="center" if centered else None,
                        bold=True,
                        size_half_points=32,
                    )
                )
            elif level == 2:
                paragraphs.append(
                    paragraph_xml(
                        text,
                        style="Heading1",
                        align="center" if centered else None,
                        bold=True,
                    )
                )
            else:
                paragraphs.append(
                    paragraph_xml(
                        text,
                        style="Heading2",
                        align="center" if centered else None,
                        bold=True,
                    )
                )
            continue

        list_match = re.match(r"^(- |\d+\.\s)(.*)$", stripped)
        if list_match:
            flush_buffer()
            marker, text = list_match.groups()
            paragraphs.append(
                paragraph_xml(
                    f"{marker}{text}",
                    style="ListParagraph",
                    align="center" if centered else None,
                )
            )
            continue

        buffer.append(stripped)

    flush_buffer()
    return paragraphs


def build_document_xml(body_items: list[str], sect_pr_xml: str) -> str:
    body_xml = "".join(body_items) + sect_pr_xml
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document '
        'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
        'xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" '
        'xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" '
        'xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" '
        'xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" '
        'xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" '
        'xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" '
        'xmlns:cx6="http://schemas.microsoft.com/office/drawing/2016/5/12/chartex" '
        'xmlns:cx7="http://schemas.microsoft.com/office/drawing/2016/5/13/chartex" '
        'xmlns:cx8="http://schemas.microsoft.com/office/drawing/2016/5/14/chartex" '
        'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
        'xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink" '
        'xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d" '
        'xmlns:o="urn:schemas-microsoft-com:office:office" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
        'xmlns:v="urn:schemas-microsoft-com:vml" '
        'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
        'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
        'xmlns:w10="urn:schemas-microsoft-com:office:word" '
        f'xmlns:w="{W_NS}" '
        'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
        'xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" '
        'xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex" '
        'xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid" '
        'xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml" '
        'xmlns:w16du="http://schemas.microsoft.com/office/word/2023/wordml/word16du" '
        'xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash" '
        'xmlns:w16sdtfl="http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock" '
        'xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" '
        'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
        'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" '
        'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" '
        'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
        'mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh w16sdtfl w16du wp14">'
        f"<w:body>{body_xml}</w:body></w:document>"
    )


def build_core_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<cp:coreProperties xmlns:cp="{CP_NS}" xmlns:dc="{DC_NS}" '
        f'xmlns:dcterms="{DCTERMS_NS}" xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        f'xmlns:xsi="{XSI_NS}">'
        "<dc:title>Universe AI Project Report</dc:title>"
        "<dc:subject>Project Documentation</dc:subject>"
        "<dc:creator>Codex</dc:creator>"
        "<cp:keywords>Universe AI, project report, Next.js, AI platform</cp:keywords>"
        "<dc:description>Project report generated from the provided sample document and adapted to the Universe AI codebase.</dc:description>"
        "<cp:lastModifiedBy>Codex</cp:lastModifiedBy>"
        "</cp:coreProperties>"
    )


def generate() -> None:
    if not TEMPLATE_DOCX.exists():
        raise FileNotFoundError(f"Template document not found: {TEMPLATE_DOCX}")
    if not SOURCE_MD.exists():
        raise FileNotFoundError(f"Source markdown not found: {SOURCE_MD}")

    OUTPUT_DOCX.parent.mkdir(parents=True, exist_ok=True)

    sect_pr_xml = extract_sect_pr(TEMPLATE_DOCX)
    body_items = parse_source(SOURCE_MD)
    document_xml = build_document_xml(body_items, sect_pr_xml)
    core_xml = build_core_xml()

    with zipfile.ZipFile(TEMPLATE_DOCX, "r") as src, zipfile.ZipFile(OUTPUT_DOCX, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            if item.filename in {"word/document.xml", "docProps/core.xml"}:
                continue
            dst.writestr(item, src.read(item.filename))
        dst.writestr("word/document.xml", document_xml.encode("utf-8"))
        dst.writestr("docProps/core.xml", core_xml.encode("utf-8"))


if __name__ == "__main__":
    generate()
