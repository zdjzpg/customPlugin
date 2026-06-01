from __future__ import annotations

import os
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree

from docx import Document
from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError
from pdf2image import convert_from_path
from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


def main() -> int:
    if len(sys.argv) < 2:
        raise SystemExit("missing conversion command")

    command = sys.argv[1]

    if command == "images_to_pdf":
      return images_to_pdf(sys.argv[2], sys.argv[3:])
    if command == "pdf_to_images":
      return pdf_to_images(sys.argv[2], sys.argv[3])
    if command == "docx_to_pdf_fallback":
      return docx_to_pdf_fallback(sys.argv[2], sys.argv[3])
    if command == "zip_files":
      return zip_files(sys.argv[2], sys.argv[3:])

    raise SystemExit(f"unsupported conversion command: {command}")


def images_to_pdf(output_path: str, input_paths: list[str]) -> int:
    if not input_paths:
        raise SystemExit("images_to_pdf requires at least one image")

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    first_image = Image.open(input_paths[0])
    page_width, page_height = first_image.size
    pdf = canvas.Canvas(str(output), pagesize=(page_width, page_height))

    for index, image_path in enumerate(input_paths):
        image = Image.open(image_path)
        width, height = image.size
        if index > 0:
            pdf.setPageSize((width, height))
        pdf.drawImage(ImageReader(image), 0, 0, width=width, height=height)
        pdf.showPage()

    pdf.save()
    return 0


def pdf_to_images(output_prefix: str, pdf_path: str) -> int:
    poppler_bin_dir = os.environ.get("POPPLER_BIN_DIR") or None
    try:
        prefix = Path(output_prefix)
        prefix.parent.mkdir(parents=True, exist_ok=True)

        image_paths = convert_from_path(
            pdf_path,
            poppler_path=poppler_bin_dir,
            dpi=144,
            fmt="png",
            output_folder=str(prefix.parent),
            output_file=prefix.name,
            paths_only=True,
            thread_count=1,
        )
    except PDFInfoNotInstalledError as exc:
        raise SystemExit(
            "pdf_to_images requires poppler (pdfinfo/pdftoppm) to be installed and reachable"
        ) from exc
    except PDFPageCountError as exc:
        raise SystemExit("Unable to read PDF page count for pdf_to_images") from exc

    if not image_paths:
        raise SystemExit("pdf_to_images did not render any pages")

    return 0


def docx_to_pdf_fallback(input_path: str, output_path: str) -> int:
    document = Document(input_path)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    pdf = canvas.Canvas(str(output))
    page_width, page_height = pdf._pagesize
    cursor_y = page_height - 56
    line_height = 20

    title = extract_docx_title(input_path)
    if title:
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(56, cursor_y, title[:90])
        cursor_y -= 32

    pdf.setFont("Helvetica", 11)

    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]
    if not paragraphs:
        paragraphs = ["(Empty document)"]

    for paragraph in paragraphs:
        for line in wrap_text(paragraph, 90):
            if cursor_y < 56:
                pdf.showPage()
                pdf.setFont("Helvetica", 11)
                cursor_y = page_height - 56
            pdf.drawString(56, cursor_y, line)
            cursor_y -= line_height

        cursor_y -= 4

    pdf.save()
    return 0


def zip_files(zip_path: str, input_paths: list[str]) -> int:
    if not input_paths:
        raise SystemExit("zip_files requires at least one input file")

    output = Path(zip_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for input_path in input_paths:
            path = Path(input_path)
            archive.write(path, arcname=path.name)

    return 0


def extract_docx_title(input_path: str) -> str:
    path = Path(input_path)
    try:
        with zipfile.ZipFile(path) as archive:
            with archive.open("docProps/core.xml") as core_file:
                tree = ElementTree.parse(core_file)
    except Exception:
        return ""

    namespace = {"dc": "http://purl.org/dc/elements/1.1/"}
    title_node = tree.find(".//dc:title", namespace)
    return title_node.text.strip() if title_node is not None and title_node.text else ""


def wrap_text(text: str, max_chars: int) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    words = text.split()
    if not words:
        return [text]

    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else current + " " + word
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = word
    if current:
        lines.append(current)
    return lines or [text]


if __name__ == "__main__":
    raise SystemExit(main())
