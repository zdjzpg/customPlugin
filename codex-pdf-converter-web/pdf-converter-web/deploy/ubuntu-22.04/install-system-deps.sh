#!/usr/bin/env bash
set -euo pipefail

sudo apt update
sudo apt install -y \
  curl \
  ca-certificates \
  gnupg \
  unzip \
  nginx \
  ghostscript \
  libreoffice \
  poppler-utils \
  python3 \
  python3-pip \
  python3-pil \
  python3-reportlab \
  python3-docx \
  python3-opencv \
  tesseract-ocr \
  tesseract-ocr-chi-sim \
  tesseract-ocr-eng \
  fonts-noto-cjk \
  fonts-wqy-zenhei \
  fonts-wqy-microhei \
  python3-pdf2image

sudo python3 -m pip install pypdf pdf2docx ocrmypdf pymupdf python-pptx openpyxl pillow-heif "rembg[cpu]" "qrcode[pil]" openai-whisper

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"
echo "Python version: $(python3 --version)"
echo "LibreOffice version: $(libreoffice --version)"
echo "Ghostscript version: $(gs --version)"
echo "Tesseract version: $(tesseract --version 2>&1 | head -n 1)"
echo "pdfinfo version: $(pdfinfo -v 2>&1 | head -n 1)"
echo "pdftoppm version: $(pdftoppm -v 2>&1 | head -n 1)"
echo "pm2 version: $(pm2 -v | tail -n 1)"
