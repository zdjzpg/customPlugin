from __future__ import annotations

import os
import json
import sys
import asyncio
import subprocess
import tempfile
import zipfile
from io import BytesIO
from pathlib import Path
from xml.etree import ElementTree

import fitz
from docx import Document
from pdf2docx import Converter as PdfToDocxConverter
from pdf2image.exceptions import PDFInfoNotInstalledError, PDFPageCountError
from pdf2image import convert_from_path
from PIL import Image
from pptx import Presentation
from pptx.util import Emu, Pt
from pypdf import PdfReader, PdfWriter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfgen import canvas

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
EMU_PER_POINT = 12700


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
    if command == "pdf_to_pptx":
      return pdf_to_pptx(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else "")
    if command == "delete_pages_pdf":
      return delete_pages_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
    if command == "reorder_pages_pdf":
      return reorder_pages_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
    if command == "protect_unlock_pdf":
      return protect_unlock_pdf(sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
    if command == "watermark_pdf":
      return watermark_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
    if command == "add_page_numbers_pdf":
      return add_page_numbers_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
    if command == "sign_stamp_pdf":
      return sign_stamp_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
    if command == "rotate_pdf":
      return rotate_pdf(sys.argv[2], sys.argv[3], sys.argv[4])
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
    if command == "text_to_speech":
      return text_to_speech(
          sys.argv[2],
          sys.argv[3],
          sys.argv[4],
          sys.argv[5],
          sys.argv[6] if len(sys.argv) > 6 else "",
      )

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


def pdf_to_pptx(output_path: str, input_path: str, ocrmypdf_bin: str) -> int:
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(dir=str(output.parent)) as temp_directory:
        source_pdf_path = input_path
        if ocrmypdf_bin and should_run_ocr_for_pdf_to_pptx(input_path):
            ocr_output_path = str(Path(temp_directory) / "ocr-output.pdf")
            try:
                subprocess.run(
                    [
                        ocrmypdf_bin,
                        "--force-ocr",
                        "--language",
                        "chi_sim+eng",
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

        build_presentation_from_pdf(source_pdf_path, output)

    return 0


def delete_pages_pdf(output_path: str, input_path: str, selection_json: str) -> int:
    payload = json.loads(selection_json)
    deleted_pages = set(payload.get("orderedPages") or [])
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for index, page in enumerate(reader.pages, start=1):
        if index in deleted_pages:
            continue
        writer.add_page(page)

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as output_file:
        writer.write(output_file)

    return 0


def should_run_ocr_for_pdf_to_pptx(input_path: str) -> bool:
    with fitz.open(input_path) as document:
        if document.page_count == 0:
            return False

        for page in document:
            if page.get_text("text", sort=True).strip():
                return False

    return True


def build_presentation_from_pdf(input_path: str, output_path: Path) -> None:
    with fitz.open(input_path) as document:
        if document.page_count == 0:
            raise SystemExit("pdf_to_pptx requires at least one PDF page")

        first_page = document[0]
        presentation = Presentation()
        presentation.slide_width = Emu(int(first_page.rect.width * EMU_PER_POINT))
        presentation.slide_height = Emu(int(first_page.rect.height * EMU_PER_POINT))
        blank_layout = presentation.slide_layouts[6]

        for page in document:
            slide = presentation.slides.add_slide(blank_layout)
            added_content = add_page_content_to_slide(
                page,
                slide,
                int(presentation.slide_width),
                int(presentation.slide_height),
            )
            if not added_content:
                add_page_snapshot_to_slide(
                    page,
                    slide,
                    int(presentation.slide_width),
                    int(presentation.slide_height),
                )

        presentation.save(str(output_path))


def add_page_content_to_slide(page, slide, slide_width_emu: int, slide_height_emu: int) -> bool:
    page_dict = page.get_text("dict", sort=True)
    added_content = False

    for block in page_dict.get("blocks", []):
        block_type = block.get("type")
        if block_type == 0:
            added_content = add_text_block_to_slide(
                block,
                slide,
                float(page.rect.width),
                float(page.rect.height),
                slide_width_emu,
                slide_height_emu,
            ) or added_content
        elif block_type == 1:
            added_content = add_image_block_to_slide(
                block,
                slide,
                float(page.rect.width),
                float(page.rect.height),
                slide_width_emu,
                slide_height_emu,
            ) or added_content

    return added_content


def add_text_block_to_slide(
    block: dict,
    slide,
    page_width: float,
    page_height: float,
    slide_width_emu: int,
    slide_height_emu: int,
) -> bool:
    lines: list[str] = []
    max_font_size = 12.0

    for line in block.get("lines", []):
        spans = line.get("spans", [])
        line_text = "".join(span.get("text", "") for span in spans).strip()
        if line_text:
            lines.append(line_text)
        for span in spans:
            max_font_size = max(max_font_size, float(span.get("size") or 12))

    if not lines:
        return False

    left, top, width, height = scale_bbox_to_slide(
        block.get("bbox") or (0, 0, 1, 1),
        page_width,
        page_height,
        slide_width_emu,
        slide_height_emu,
    )
    textbox = slide.shapes.add_textbox(left, top, width, height)
    textbox.fill.background()
    textbox.line.fill.background()
    text_frame = textbox.text_frame
    text_frame.clear()
    text_frame.word_wrap = True

    for index, line_text in enumerate(lines):
        paragraph = text_frame.paragraphs[0] if index == 0 else text_frame.add_paragraph()
        paragraph.text = line_text
        paragraph.font.size = Pt(max(10, min(28, max_font_size)))

    return True


def add_image_block_to_slide(
    block: dict,
    slide,
    page_width: float,
    page_height: float,
    slide_width_emu: int,
    slide_height_emu: int,
) -> bool:
    image_bytes = block.get("image")
    if not image_bytes:
        return False

    left, top, width, height = scale_bbox_to_slide(
        block.get("bbox") or (0, 0, 1, 1),
        page_width,
        page_height,
        slide_width_emu,
        slide_height_emu,
    )
    slide.shapes.add_picture(BytesIO(bytes(image_bytes)), left, top, width=width, height=height)
    return True


def add_page_snapshot_to_slide(page, slide, slide_width_emu: int, slide_height_emu: int) -> None:
    pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    slide.shapes.add_picture(
        BytesIO(pixmap.tobytes("png")),
        Emu(0),
        Emu(0),
        width=Emu(slide_width_emu),
        height=Emu(slide_height_emu),
    )


def scale_bbox_to_slide(
    bbox, page_width: float, page_height: float, slide_width_emu: int, slide_height_emu: int
) -> tuple[Emu, Emu, Emu, Emu]:
    x0, y0, x1, y1 = bbox
    scale_x = slide_width_emu / max(page_width, 1.0)
    scale_y = slide_height_emu / max(page_height, 1.0)

    left = max(0, int(x0 * scale_x))
    top = max(0, int(y0 * scale_y))
    width = max(1, int((x1 - x0) * scale_x))
    height = max(1, int((y1 - y0) * scale_y))
    return Emu(left), Emu(top), Emu(width), Emu(height)


def reorder_pages_pdf(output_path: str, input_path: str, selection_json: str) -> int:
    payload = json.loads(selection_json)
    ordered_pages = payload.get("orderedPages") or []
    if not ordered_pages:
        raise SystemExit("reorder_pages_pdf requires ordered pages")

    reader = PdfReader(input_path)
    total_pages = len(reader.pages)
    writer = PdfWriter()

    for page_number in ordered_pages:
        ensure_page_in_bounds(page_number, total_pages)
        writer.add_page(reader.pages[page_number - 1])

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as output_file:
        writer.write(output_file)

    return 0


def protect_unlock_pdf(output_path: str, input_path: str, mode: str, password: str) -> int:
    reader = PdfReader(input_path)
    writer = PdfWriter()

    if mode == "unlock":
      if not reader.is_encrypted:
        raise SystemExit("The PDF is not password-protected")
      decrypt_result = reader.decrypt(password)
      if decrypt_result == 0:
        raise SystemExit("Incorrect PDF password")

    for page in reader.pages:
        writer.add_page(page)

    if mode == "protect":
        writer.encrypt(password)

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as output_file:
        writer.write(output_file)

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


def watermark_pdf(output_path: str, input_path: str, watermark_json: str) -> int:
    payload = json.loads(watermark_json)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)

        with tempfile.TemporaryDirectory(dir=str(output.parent)) as temp_directory:
            overlay_path = Path(temp_directory) / "overlay.pdf"
            create_watermark_overlay(overlay_path, width, height, payload)
            overlay_reader = PdfReader(str(overlay_path))
            page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

    with output.open("wb") as output_file:
        writer.write(output_file)

    return 0


def add_page_numbers_pdf(output_path: str, input_path: str, options_json: str) -> int:
    payload = json.loads(options_json)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(input_path)
    writer = PdfWriter()
    page_number_start = int(payload.get("pageNumberStart") or 1)

    for index, page in enumerate(reader.pages):
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        with tempfile.TemporaryDirectory(dir=str(output.parent)) as temp_directory:
            overlay_path = Path(temp_directory) / "page-number-overlay.pdf"
            create_page_number_overlay(
                overlay_path,
                width,
                height,
                payload,
                page_number_start + index,
            )
            overlay_reader = PdfReader(str(overlay_path))
            page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

    with output.open("wb") as output_file:
        writer.write(output_file)

    return 0


def sign_stamp_pdf(output_path: str, input_path: str, options_json: str) -> int:
    payload = json.loads(options_json)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        with tempfile.TemporaryDirectory(dir=str(output.parent)) as temp_directory:
            overlay_path = Path(temp_directory) / "sign-overlay.pdf"
            create_sign_stamp_overlay(overlay_path, width, height, payload)
            overlay_reader = PdfReader(str(overlay_path))
            page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

    with output.open("wb") as output_file:
        writer.write(output_file)

    return 0


def rotate_pdf(output_path: str, input_path: str, rotation_angle: str) -> int:
    angle = int(rotation_angle)
    if angle not in {90, 180, 270}:
        raise SystemExit("rotate_pdf only supports 90, 180, or 270 degrees")

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(input_path)
    writer = PdfWriter()
    for page in reader.pages:
        rotated_page = page.rotate(angle)
        writer.add_page(rotated_page)

    with output.open("wb") as output_file:
        writer.write(output_file)

    return 0


def create_watermark_overlay(output_path: Path, width: float, height: float, payload: dict) -> None:
    overlay = canvas.Canvas(str(output_path), pagesize=(width, height))
    if payload.get("watermarkType") == "image":
        draw_image_watermark(overlay, width, height, payload)
    else:
        draw_text_watermark(overlay, width, height, payload)
    overlay.save()


def create_page_number_overlay(
    output_path: Path, width: float, height: float, payload: dict, page_number: int
) -> None:
    overlay = canvas.Canvas(str(output_path), pagesize=(width, height))
    position = payload.get("pageNumberPosition") or "footer_center"
    page_number_format = payload.get("pageNumberFormat") or "cn_page"
    text = str(page_number) if page_number_format == "plain" else f"第 {page_number} 页"

    overlay.setFont("Helvetica", 11)
    y = 20
    if position == "bottom_right":
        overlay.drawRightString(width - 24, y, text)
    else:
        overlay.drawCentredString(width / 2, y, text)
    overlay.save()


def create_sign_stamp_overlay(output_path: Path, width: float, height: float, payload: dict) -> None:
    overlay = canvas.Canvas(str(output_path), pagesize=(width, height))
    draw_fixed_image_overlay(overlay, width, height, payload, payload.get("stampImagePath"))
    overlay.save()


def draw_text_watermark(overlay: canvas.Canvas, width: float, height: float, payload: dict) -> None:
    text_content = payload.get("textContent") or "水印"
    font_size = int(payload.get("fontSize") or 24)
    opacity = float(payload.get("opacity") or 0.18)
    rotation = float(payload.get("rotation") or -30)
    text_layout = payload.get("textLayout") or "tile"

    overlay.saveState()
    overlay.setFillAlpha(opacity)
    font_name = "STSong-Light" if any(ord(char) > 127 for char in text_content) else "Helvetica-Bold"
    overlay.setFont(font_name, font_size)

    if text_layout == "center":
        overlay.translate(width / 2, height / 2)
        overlay.rotate(rotation)
        overlay.drawCentredString(0, 0, text_content)
        overlay.restoreState()
        return

    step_x = max(font_size * 6, 160)
    step_y = max(font_size * 4, 120)
    overlay.translate(width / 2, height / 2)
    overlay.rotate(rotation)
    for x in range(-int(width), int(width) + step_x, step_x):
        for y in range(-int(height), int(height) + step_y, step_y):
            overlay.drawCentredString(x, y, text_content)
    overlay.restoreState()


def draw_image_watermark(overlay: canvas.Canvas, width: float, height: float, payload: dict) -> None:
    image_path = payload.get("watermarkImagePath")
    if not image_path:
        raise SystemExit("Image watermark requires watermarkImagePath")

    draw_fixed_image_overlay(overlay, width, height, payload, image_path)


def draw_fixed_image_overlay(
    overlay: canvas.Canvas, width: float, height: float, payload: dict, image_path: str
) -> None:
    image_scale_percent = max(5, min(100, int(payload.get("imageScalePercent") or 30)))
    opacity = float(payload.get("opacity") or 0.3)
    image_position = payload.get("imagePosition") or "center"

    with Image.open(image_path).convert("RGBA") as image:
        alpha = image.getchannel("A")
        alpha = alpha.point(lambda value: int(value * opacity))
        image.putalpha(alpha)

        max_target_width = width * (image_scale_percent / 100.0)
        scale = max_target_width / image.width
        target_width = max(1, int(image.width * scale))
        target_height = max(1, int(image.height * scale))
        resized = image.resize((target_width, target_height))

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as temp_png:
            temp_png_path = Path(temp_png.name)
            resized.save(temp_png_path, format="PNG")

        try:
            margin = 24
            x = (width - target_width) / 2
            y = (height - target_height) / 2
            if image_position == "bottom_left":
                x = margin
                y = margin
            elif image_position == "bottom_right":
                x = width - target_width - margin
                y = margin

            overlay.drawImage(str(temp_png_path), x, y, width=target_width, height=target_height, mask='auto')
        finally:
            if temp_png_path.exists():
                temp_png_path.unlink()


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


def text_to_speech(
    output_path: str,
    source_text: str,
    language: str,
    output_format: str,
    ffmpeg_bin: str,
) -> int:
    try:
        import edge_tts
    except ImportError as exc:
        raise SystemExit("text_to_speech requires python package edge-tts") from exc

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    voice_map = {
        "zh": "zh-CN-XiaoxiaoNeural",
        "en": "en-US-AriaNeural",
    }
    voice_name = voice_map.get(language, voice_map["zh"])

    async def synthesize_mp3(mp3_path: Path) -> None:
        communicator = edge_tts.Communicate(source_text, voice_name)
        await communicator.save(str(mp3_path))

    if output_format == "mp3":
        asyncio.run(synthesize_mp3(output))
        return 0

    if output_format == "wav":
        if not ffmpeg_bin:
            raise SystemExit("text_to_speech wav output requires ffmpeg")

        with tempfile.TemporaryDirectory(dir=str(output.parent)) as temp_directory:
            temp_mp3 = Path(temp_directory) / "tts-output.mp3"
            asyncio.run(synthesize_mp3(temp_mp3))
            try:
                subprocess.run(
                    [
                        ffmpeg_bin,
                        "-y",
                        "-i",
                        str(temp_mp3),
                        str(output),
                    ],
                    check=True,
                )
            except FileNotFoundError as exc:
                raise SystemExit("ffmpeg is not installed or not reachable") from exc
            except subprocess.CalledProcessError as exc:
                raise SystemExit(f"ffmpeg failed with exit code {exc.returncode}") from exc
        return 0

    raise SystemExit("text_to_speech only supports mp3 or wav output")


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
