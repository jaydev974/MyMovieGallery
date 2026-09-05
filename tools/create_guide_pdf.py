from pathlib import Path
from textwrap import wrap


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "MY_MOVIE_GALLERY_GUIDE.md"
OUTPUT = ROOT / "docs" / "MY_MOVIE_GALLERY_GUIDE.pdf"


def escape_pdf(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def collect_lines() -> list[tuple[str, str]]:
    lines: list[tuple[str, str]] = []
    in_code = False
    for raw in SOURCE.read_text(encoding="utf-8").splitlines():
        line = raw.rstrip()
        if line.startswith("```"):
            in_code = not in_code
            continue
        if not line:
            lines.append(("space", ""))
        elif line.startswith("# "):
            lines.append(("title", line[2:]))
        elif line.startswith("## "):
            lines.append(("heading", line[3:]))
        elif line.startswith("### "):
            lines.append(("subheading", line[4:]))
        elif in_code:
            lines.append(("code", line))
        elif line.startswith("- "):
            lines.append(("body", "  * " + line[2:]))
        elif line[:2].isdigit() and line[2:4] == ". ":
            lines.append(("body", line))
        else:
            lines.append(("body", line))
    return lines


def make_pdf() -> None:
    page_width, page_height = 612, 792
    margin = 54
    usable_width = 82
    pages: list[list[str]] = [[]]

    for kind, text in collect_lines():
        if kind == "space":
            pages[-1].append("")
            continue
        width = 76 if kind == "code" else usable_width
        wrapped = wrap(text, width=width, break_long_words=False, break_on_hyphens=False) or [""]
        for item in wrapped:
            pages[-1].append(f"{kind}|{item}")
            if len(pages[-1]) >= 47:
                pages.append([])

    if not pages[-1]:
        pages.pop()

    objects: list[bytes] = []

    def add_object(value: str | bytes) -> int:
        objects.append(value.encode("latin-1") if isinstance(value, str) else value)
        return len(objects)

    catalog_id = add_object(b"")
    pages_id = add_object(b"")
    font_id = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    bold_id = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    page_ids: list[int] = []

    for page_lines in pages:
        commands = ["q", "0.08 0.10 0.15 rg", f"0 0 {page_width} {page_height} re", "f", "Q"]
        y = page_height - margin
        for entry in page_lines:
            if not entry:
                y -= 8
                continue
            kind, text = entry.split("|", 1)
            if kind == "title":
                size, leading, font, color = 24, 30, bold_id, "0.98 0.78 0.28"
            elif kind == "heading":
                size, leading, font, color = 14, 22, bold_id, "0.35 0.82 0.88"
            elif kind == "subheading":
                size, leading, font, color = 11, 17, bold_id, "0.98 0.78 0.28"
            elif kind == "code":
                size, leading, font, color = 8.5, 13, font_id, "0.78 0.88 0.90"
            else:
                size, leading, font, color = 9.5, 15, font_id, "0.90 0.93 0.94"
            commands.extend([f"BT /F{2 if font == bold_id else 1} {size} Tf {color} rg {margin} {y} Td ({escape_pdf(text)}) Tj ET"])
            y -= leading
        content = "\n".join(commands).encode("latin-1")
        content_id = add_object(f"<< /Length {len(content)} >>\nstream\n".encode("latin-1") + content + b"\nendstream")
        page_id = add_object(f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {page_width} {page_height}] /Resources << /Font << /F1 {font_id} 0 R /F2 {bold_id} 0 R >> >> /Contents {content_id} 0 R >>")
        page_ids.append(page_id)

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode("latin-1")
    objects[catalog_id - 1] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("latin-1")

    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("latin-1"))
        output.extend(obj)
        output.extend(b"\nendobj\n")
    xref = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("latin-1"))
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))
    output.extend(f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode("latin-1"))
    OUTPUT.write_bytes(output)
    print(f"Created {OUTPUT} ({len(pages)} pages)")


if __name__ == "__main__":
    make_pdf()