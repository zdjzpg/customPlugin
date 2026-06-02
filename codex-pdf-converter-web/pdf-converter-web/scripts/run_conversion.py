from __future__ import annotations

import os
import json
import sys
import subprocess
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree

from docx import Document
from pdf2docx import Converter as PdfToDocxConverter
from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError
from pdf2image import convert_from_path
from PIL import Image
from pypdf import PdfReader, PdfWriter
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
    if command == "pdf_to_word":
      return pdf_to_word(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6])
    if command == "merge_pdf":
      return merge_pdf(sys.argv[2], sys.argv[3:])
    if command == "compress_pdf":
      return compress_pdf(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
    if command == "pdf_extract_pages":
      return pdf_extract_pages(sys.argv[2], sys.argv[3], sys.argv[4])
    if command == "split_pdf":
      return split_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
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


def pdf_to_word(output_path: str, input_path: str, conversion_mode: str, ocrmypdf_bin: str, ocr_language: str) -> int:
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    source_pdf_path = input_path

    with tempfile.TemporaryDirectory(dir=str(output.parent)) as temp_directory:
        if conversion_mode == "ocr":
            if not ocrmypdf_bin:
                raise SystemExit("OCR mode requires OCRmyPDF to be configured")

            ocr_output_path = str(Path(temp_directory) / "ocr-output.pdf")
            try:
                subprocess.run(
                    [
                        ocrmypdf_bin,
                        "--force-ocr",
                        "--language",
                        ocr_language,
                        input_path,
                        ocr_output_path,
                    ],
                    check=True,
                )
            except FileNotFoundError as exc:
                raise SystemExit("OCRmyPDF is not installed or not reachable") from exc
            except subprocess.CalledProcessError as exc:
                raise SystemExit(f"OCRmyPDF failed with exit code {exc.returncode}") from exc

            source_pdf_path = ocr_output_path

        converter = PdfToDocxConverter(source_pdf_path)
        try:
            converter.convert(str(output))
        finally:
            converter.close()

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


def merge_pdf(output_path: str, input_paths: list[str]) -> int:
    if len(input_paths) < 2:
        raise SystemExit("merge_pdf requires at least two PDF files")

    writer = PdfWriter()
    for input_path in input_paths:
        reader = PdfReader(input_path)
        for page in reader.pages:
            writer.add_page(page)

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as output_file:
        writer.write(output_file)

    return 0


def compress_pdf(output_path: str, input_path: str, compression_level: str, ghostscript_bin: str) -> int:
    if compression_level not in {"standard", "strong"}:
        raise SystemExit("compress_pdf requires compression_level to be standard or strong")

    pdf_setting = "/ebook" if compression_level == "standard" else "/screen"
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    command = [
        ghostscript_bin,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS={pdf_setting}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output}",
        input_path,
    ]

    try:
        subprocess.run(command, check=True)
    except FileNotFoundError as exc:
        raise SystemExit("Ghostscript is not installed or not reachable") from exc
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f"Ghostscript failed with exit code {exc.returncode}") from exc

    return 0


def pdf_extract_pages(output_path: str, input_path: str, selection_json: str) -> int:
    payload = json.loads(selection_json)
    ordered_pages = payload.get("orderedPages") or []
    if not ordered_pages:
        raise SystemExit("pdf_extract_pages requires at least one selected page")

    reader = PdfReader(input_path)
    writer = PdfWriter()
    total_pages = len(reader.pages)

    for page_number in ordered_pages:
        ensure_page_in_bounds(page_number, total_pages)
        writer.add_page(reader.pages[page_number - 1])

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as output_file:
        writer.write(output_file)

    return 0


def split_pdf(zip_path: str, input_path: str, selection_json: str) -> int:
    payload = json.loads(selection_json)
    outputs = payload.get("outputs") or []
    if not outputs:
        raise SystemExit("split_pdf requires at least one output range")

    reader = PdfReader(input_path)
    total_pages = len(reader.pages)
    source_name = Path(input_path).stem
    zip_output = Path(zip_path)
    zip_output.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(dir=str(zip_output.parent)) as temp_directory:
        temp_root = Path(temp_directory)
        generated_paths: list[Path] = []

        for index, ordered_pages in enumerate(outputs, start=1):
            if not ordered_pages:
                raise SystemExit("split_pdf cannot create an empty output file")

            writer = PdfWriter()
            for page_number in ordered_pages:
                ensure_page_in_bounds(page_number, total_pages)
                writer.add_page(reader.pages[page_number - 1])

            part_path = temp_root / f"{source_name}-part-{index}.pdf"
            with part_path.open("wb") as part_file:
                writer.write(part_file)
            generated_paths.append(part_path)

        with zipfile.ZipFile(zip_output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for generated_path in generated_paths:
                archive.write(generated_path, arcname=generated_path.name)

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


def ensure_page_in_bounds(page_number: int, total_pages: int) -> None:
    if page_number < 1 or page_number > total_pages:
        raise SystemExit(f"第 {page_number} 页超出 PDF 总页数（共 {total_pages} 页）。")


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
