# Ubuntu 22.04 Deployment

## Target

- OS: `Ubuntu 22.04`
- Process manager: `pm2`
- Reverse proxy: `nginx`
- App port: `3015`

## 1. Upload the project

Upload the whole `pdf-converter-web` directory to the server, for example:

```bash
/home/admin/pdf-converter-web
```

## 2. Install system dependencies

Run:

```bash
cd /home/admin/pdf-converter-web
chmod +x deploy/ubuntu-22.04/install-system-deps.sh
./deploy/ubuntu-22.04/install-system-deps.sh
```

This installs:

- `Node.js 24`
- `pm2`
- `Tesseract OCR`
- `Ghostscript`
- `LibreOffice`
- `poppler-utils`
- Chinese fonts required by LibreOffice PDF export
- Python runtime packages required by the conversion script
- `nginx`
- `python3-opencv`

The install script also runs:

```bash
sudo python3 -m pip install pypdf pdf2docx ocrmypdf pymupdf python-pptx pillow-heif openpyxl "rembg[cpu]" "qrcode[pil]" openai-whisper
```

This is required by:

- `PDF 转 PPT`
- `PDF 转 Word`
- `扫描件转可搜索 PDF`
- `图片转 Word`
- `PDF 转 Excel`
- `图片表格转 Excel`
- `试卷 / 讲义整理`
- `PDF 提取页面`
- `拆分 PDF`
- `PDF 压缩`
- `HEIC 转 JPG / PNG`
- `智能抠图 / 去背景`
- `二维码生成 / 批量二维码`
- `音频转文字`
- `二维码解码` additionally requires system `python3-opencv`

## 3. Prepare environment variables

Copy the production example:

```bash
cd /home/admin/pdf-converter-web
cp .env.production.example .env
```

Recommended `.env`:

```env
PORT=3015
ADMIN_USERNAME=your-admin-name
ADMIN_PASSWORD=your-strong-password
ADMIN_SESSION_TTL_MS=43200000
BUYER_SESSION_TTL_MS=259200000
PYTHON_BIN=/usr/bin/python3
LIBREOFFICE_BIN=/usr/bin/libreoffice
POPPLER_BIN_DIR=/usr/bin
GHOSTSCRIPT_BIN=/usr/bin/gs
OCRMYPDF_BIN=/usr/local/bin/ocrmypdf
TESSERACT_BIN=/usr/bin/tesseract
FFMPEG_BIN=/usr/bin/ffmpeg
WHISPER_MODEL=tiny
```

## 4. Install app dependencies and start with PM2

Run:

```bash
cd /home/admin/pdf-converter-web
chmod +x deploy/ubuntu-22.04/start-with-pm2.sh
./deploy/ubuntu-22.04/start-with-pm2.sh
```

This script will:

- run `npm install --omit=dev`
- start or restart `pdf-converter-web`
- save the `pm2` process list
- verify `GET /api/health`

## 5. Configure Nginx

Copy the example config:

```bash
sudo cp /home/admin/pdf-converter-web/deploy/nginx/pdf-converter-web.conf.example /etc/nginx/conf.d/pdf-converter-web.conf
```

If you have a real domain, replace:

```nginx
server_name _;
```

with your domain.

Then test and reload:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 6. Verify the deployment

Run:

```bash
pm2 status
curl http://127.0.0.1:3015/api/health
curl -I http://127.0.0.1
```

Then verify in browser:

- buyer login page opens
- buyer preview page opens at `/preview`
- admin login page opens
- admin can create a code
- admin dashboard tabs switch correctly between:
  - `卡密管理`
  - `最近转换记录`
  - `功能统计`
  - `卡密图表`
- buyer can use a code to log in
- `Images -> PDF` works
- `PDF -> Images` works
- `PDF 转 PPT` works
- `PDF 转 Word` works
- `PDF 压缩` works
- `PDF 提取页面` works
- `拆分 PDF` works
- `Word -> PDF` works
- `扫描件转可搜索 PDF` works
- `批量 Word 转 PDF` works
- `批量 PDF 转图片` works
- `试卷 / 讲义整理` works
- `图片转 Word` works
- `PDF 转 Excel` works
- `图片表格转 Excel` works
- `图片隐私打码` works
- `图片模糊背景填充` works
- `收款码合并` works
- `二维码生成` works
- `批量二维码` works
- `二维码解码` works
- admin can see conversion records
- admin recent-conversions table shows:
  - `时间`
  - `卡密`
  - Chinese tool labels
- admin code-management search works by partial code value
- admin recent-conversions search works by partial code value
- admin code chart can query one code and render the top-15 tool legend

## 6.1 Word -> PDF Chinese text troubleshooting

If the generated PDF layout is correct but Chinese text renders as squares or garbled boxes, the usual root cause is missing server fonts rather than conversion logic.

Install fonts:

```bash
sudo apt update
sudo apt install -y fonts-noto-cjk fonts-wqy-zenhei fonts-wqy-microhei
fc-cache -fv
```

Then restart the service:

```bash
cd /home/admin/pdf-converter-web
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
```

Optional extra refresh:

```bash
rm -rf ~/.cache/fontconfig
fc-cache -fv
```

Useful verification:

```bash
fc-list | grep "Noto Sans CJK" | head
fc-list | grep "WenQuanYi" | head
```

## 7. Data location

Persistent runtime data is stored under:

```bash
/home/admin/pdf-converter-web/data
```

Important contents:

- `data/app.db`
- `data/conversions`

## 8. Backup

Run:

```bash
cd /home/admin/pdf-converter-web
chmod +x deploy/ubuntu-22.04/backup-data.sh
./deploy/ubuntu-22.04/backup-data.sh
```

Default backup output:

```bash
/home/admin/pdf-converter-web-backups
```

## 9. Upgrade flow

For later updates:

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
curl http://127.0.0.1:3015/api/health
```

If environment variables changed:

```bash
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
```

Current admin/chart update note:

- the latest admin dashboard round added:
  - `/preview`
  - admin section tabs
  - admin client-side pagination
  - admin code-value search
  - admin per-code usage chart
- this round is a `mixed change`
  because it touches:
  - `public/*`
  - `server/*`
