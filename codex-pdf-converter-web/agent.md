# 儿童英语测评项目上下文

## 会话执行纪律（所有后续会话必须遵守）

这部分是高优先级规则，用来约束后续任何会话、任何接手者的执行顺序。

### 核心原则

- 一次只解决 `当前眼前的一个主问题`
- 当前问题没有明确闭环前，`不要提前切去做下一个待办`
- 新出现的问题，默认先记录到待办，不立刻打断当前问题

### 用户前台文案与信息暴露规则

- 面向买家 / 用户的页面，只允许展示 `用户完成当前任务所需的信息`
- 服务端依赖默认视为 `内部部署信息`，不要在买家页面暴露：
  - LibreOffice
  - poppler
  - ffmpeg
  - Python 运行时
  - 任何“请先安装某依赖”式文案
- 不要在买家页面暴露：
  - 开发进度
  - 占位说明
  - “下一步接入 / 待实现 / 第一版先这样” 之类的研发状态文案
  - 后台、卡密管理、运营、内部流程等内部视角信息
  - 管理入口、后台入口，除非用户明确要求要暴露
- 买家首页文案默认只回答两件事：
  - 这是做什么的
  - 现在怎么开始
- 买家进入功能区后，默认不要展示：
  - 功能状态，例如“可用 / 已启用 / 运行中”
  - 会话有效期、登录剩余时间
  - “转换目录 / 功能页 / 模块”这类偏内部结构化标签
  - 任何不能帮助用户更快上传和拿结果的元信息
- 买家功能区默认只保留：
  - 转换方式名称
  - 必要的格式说明
  - 文件选择
  - 开始转换
  - 结果下载
- 如果页面是给外部用户看的，提交前必须自查：
  - 文案是否站在用户视角
  - 是否泄露内部能力、后台结构、研发状态
  - 是否出现“演示 / 占位 / 开发中 / 后台管理”这类不该给买家看的词
  - 是否塞进了“状态 / 有效期 / 目录 / 模块名”这类客户并不关心的字段

### 什么叫“当前问题已闭环”

只有满足下面任一组合，才算当前问题完成，可以进入下一项：

- 代码已经改完 + 相关验证已经跑过 + 当前现象已消失
- 或者已经明确说明：为什么当前问题暂时不能继续，并得到用户确认后再切换

禁止出现下面这种情况：

- 上面的问题只改到一半
- 中途发现了别的可优化点
- 然后马上开始处理下面的新事项
- 导致原问题悬空

### 新问题插入时的处理规则

如果用户在处理中途又提出新问题，必须先判断：

#### 1. 是否阻塞当前问题

只有下面两种情况，才允许立刻中断当前问题：

- 用户明确说：`先处理这个`
- 新问题会直接导致当前修改无效、报错或无法继续验证

#### 2. 如果不阻塞

如果新问题不阻塞当前任务，必须这样做：

- 先把新问题记为“后续待办”
- 明确告诉用户：会在当前问题完成后处理
- 继续把当前问题做完

### 回复顺序要求

后续会话里，回复必须尽量遵守下面的顺序：

1. 先说明 `当前正在处理的唯一问题`
2. 做完并验证这个问题
3. 明确写出：`这个问题已闭环`
4. 再进入下一条待办

### 待办管理规则

- 待办可以列出来
- 但 `不能因为列出来就提前开工`
- 待办顺序必须服从“先闭环当前问题，再一条条处理”

### 调试 / 测试时的特别要求

- 不能把“没报错 / 没炸”直接当成完成
- 但也不能因为发现新的体验问题，就丢下当前明确目标不管
- 应该：
  - 先完成当前明确目标
  - 再把新发现的问题加入后续待办
- 做前端 / 接口自测时，不能只用极小样例文件
- 只用极小样例通过，不代表真实用户场景可用；对于上传、转换、导出这类功能，至少要额外覆盖：
  - 更接近真实大小的文件
  - 请求体放大后的情况，例如 base64 导致的体积膨胀
  - 服务端体积上限、超时、非 JSON 错误响应
- 如果 `webapp-testing` 只验证了小文件成功，还不能宣称上传链路稳定；必须补一次真实体量或接近真实体量的样例验证
- 遇到 `413 Payload Too Large`、超时、内存占用异常这类问题时，默认优先检查：
  - 请求编码方式是否放大体积
  - 服务端 body limit 是否过小
  - 前端是否把非 JSON 错误页误当 JSON 解析

### 新工具线上发布规则（pdf-converter-web）

后续只要涉及这个新工具的上线、重发、部署、证书或 Nginx 调整，默认先按下面这套固定约定处理。

#### 一、与旧项目共存的固定约定

- 旧项目目录：
  - `/home/admin/EnglishQuestion`
- 新工具目录：
  - `/home/admin/pdf-converter-web`
- 旧项目 PM2 进程：
  - `english-question`
- 新工具 PM2 进程：
  - `pdf-converter-web`
- 新工具服务端口：
  - `3015`
- 新工具线上域名：
  - `https://pdf.seedling.top/`
- 新工具 Nginx 配置：
  - `/etc/nginx/conf.d/pdf-converter-web.conf`
- 新工具证书目录：
  - `/home/admin/certs/pdf.seedling.top/`

强约束：

- 不要把新工具部署到 `/home/admin/EnglishQuestion`
- 不要复用 `english-question` 这个 PM2 进程名
- 不要改旧项目现有 Nginx 配置来硬塞新工具
- 默认让新工具作为独立站点存在

#### 二、新工具首发部署顺序

1. 用 WinSCP 上传本地 `pdf-converter-web` 到：
   - `/home/admin/pdf-converter-web`
2. 服务器安装系统依赖：

```bash
cd /home/admin/pdf-converter-web
chmod +x deploy/ubuntu-22.04/install-system-deps.sh
./deploy/ubuntu-22.04/install-system-deps.sh
```

如果脚本里的 `python3-pdf2image` 包名报错，不要反复重跑整脚本，改为手动执行：

```bash
sudo apt update
sudo apt install -y \
  curl \
  ca-certificates \
  gnupg \
  unzip \
  nginx \
  libreoffice \
  poppler-utils \
  python3 \
  python3-pil \
  python3-reportlab \
  python3-docx \
  python3-pip
sudo python3 -m pip install pdf2image
```

如果 `Word -> PDF` 在线上生成的 PDF 结构正常但中文显示为方框或乱码，优先判断为服务器缺中文字体，而不是先怀疑转换逻辑。

修复命令：

```bash
sudo apt update
sudo apt install -y fonts-noto-cjk fonts-wqy-zenhei fonts-wqy-microhei
fc-cache -fv
cd /home/admin/pdf-converter-web
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
```

必要时再执行：

```bash
rm -rf ~/.cache/fontconfig
fc-cache -fv
```

验证命令：

```bash
fc-list | grep "Noto Sans CJK" | head
fc-list | grep "WenQuanYi" | head
```

3. 配置环境变量：

```bash
cd /home/admin/pdf-converter-web
cp .env.production.example .env
```

推荐 `.env`：

```env
PORT=3015
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
ADMIN_SESSION_TTL_MS=43200000
BUYER_SESSION_TTL_MS=259200000
PYTHON_BIN=/usr/bin/python3
LIBREOFFICE_BIN=/usr/bin/libreoffice
POPPLER_BIN_DIR=/usr/bin
```

4. 安装 Node 依赖：

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev --registry=https://registry.npmmirror.com --no-audit --fund=false
```

5. 启动 PM2：

```bash
cd /home/admin/pdf-converter-web
pm2 start ecosystem.config.cjs --only pdf-converter-web --update-env
pm2 save
```

6. 验证服务：

```bash
pm2 status
curl http://127.0.0.1:3015/api/health
```

#### 三、Nginx 当前固定配置思路

HTTP 跳 HTTPS：

```nginx
server {
    listen 80;
    server_name pdf.seedling.top;
    return 301 https://$host$request_uri;
}
```

HTTPS 反代到 `127.0.0.1:3015`：

```nginx
server {
    listen 443 ssl http2;
    server_name pdf.seedling.top;

    ssl_certificate     /home/admin/certs/pdf.seedling.top/pdf.seedling.top_bundle.pem;
    ssl_certificate_key /home/admin/certs/pdf.seedling.top/pdf.seedling.top.key;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3015;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

修改 Nginx 后固定执行：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### 四、证书获取结论

`certbot` 的 `http-01` 与手动 `dns-01` 在当前环境里都容易踩验证失败与速率限制，不作为默认首选。

默认优先方案：

- 使用腾讯云免费 SSL 证书
- 域名：`pdf.seedling.top`
- 验证方式：手动 DNS 验证
- 成功后下载 Nginx 证书
- 上传到：
  - `/home/admin/certs/pdf.seedling.top/`

当前已验证可用的文件名：

- `pdf.seedling.top.key`
- `pdf.seedling.top_bundle.pem`

#### 五、新工具后续更新流程

后续只要更新新工具代码，默认执行：

```bash
cd /home/admin/pdf-converter-web
npm install --omit=dev --registry=https://registry.npmmirror.com --no-audit --fund=false
pm2 restart ecosystem.config.cjs --only pdf-converter-web --update-env
curl http://127.0.0.1:3015/api/health
```

如果只改纯前端静态资源，因为这个项目不是独立 `dist` 发布模式，也仍然按整站代码上传后 `pm2 restart` 处理，不套用旧项目的 `dist` 上传流程。

#### 六、发布后必做验证

每次发布或重发后，至少执行：

```bash
pm2 status
curl http://127.0.0.1:3015/api/health
curl -I http://pdf.seedling.top
curl -I https://pdf.seedling.top
```

并人工验证：

- `https://pdf.seedling.top/` 能打开
- 管理员登录正常
- 买家卡密登录正常
- `Word -> PDF` 正常
- `PDF -> Images` 返回 ZIP 正常
- `Images -> PDF` 正常
- 上传进度条正常
- 中文文件名结果正常
- 卡密启用 / 禁用正常

### 给后续会话的强提醒

如果你是新的会话或新的接手者，请默认执行下面这句话：

> 只处理用户当前明确指出的那个问题；没有闭环前，不提前切换到下一条待办。

---
## 当前需求
这是一个儿童英语测评系统，当前按 4 个页面设计：

1. 已配置卷子页面
2. 新增卷子配置页面
3. 卷子页面
4. 本卷答题情况页面

核心目标：

- 老师配置固定 5 个题型模板
- 学生进入某张卷子后填写信息并答题
- 做完后生成结果，并查看该卷子的答题情况
- 第一版兼容电脑和 iPad
- 学生端页面不能跳回配置页
- 数据正式写入 MySQL

## 当前 5 个题型模板

- 听音选图
- 看图选词
- 拖拽组句
- 单词跟读
- 拼写填空

## 现在已经做了什么

### 前端
项目已经是标准 Vue 工程：

- Vue CLI
- Vue Router
- 题型拆成独立组件
- 支持电脑和 iPad 响应式布局

### 当前页面

#### 1. 已配置卷子页面
支持：

- 搜索卷子名称
- 按题型筛选
- 复制卷子
- 编辑卷子
- 进入卷子页面
- 查看本卷答题情况

#### 2. 新增卷子配置页面
支持：

- 配置卷子基础信息
- 配置 5 个固定题型
- 保存后写入数据库

#### 3. 卷子页面
支持：

- 学生填写姓名 / 电话 / 年龄 / 年级
- 进入答题流程
- 做完生成当前结果
- 可跳到“本卷答题情况”
- 不暴露配置页入口

#### 4. 本卷答题情况页面
支持：

- 只看当前卷子的答题记录
- 不能切换别的卷子
- 只能按学生姓名 / 手机号筛选

## 后端
已经加了 Node 后端：

- Express
- mysql2
- dotenv
- cors

### 已实现 API

- GET /api/health
- GET /api/papers
- GET /api/papers/:paperId
- POST /api/papers
- PUT /api/papers/:paperId
- DELETE /api/papers/:paperId
- POST /api/papers/:paperId/copy
- GET /api/papers/:paperId/submissions
- POST /api/papers/:paperId/submissions

## 数据库
已建 MySQL 数据库：

- 数据库名：kids_english

已建表：

- papers
- paper_questions
- submissions
- submission_answers
- 视图：vw_paper_summary

## 当前启动方式
在项目根目录执行：

```bash
npm start
```

当前会同时启动：

- 前端 Vue 开发服务
- 后端 API 服务

## 线上更新规则

后续线上环境默认按下面 3 类更新方式处理。每次准备更新前，先问用户这次改动属于哪一类：

- 只改前端
- 只改后端
- 改数据库

如果实际是混合改动，必须明确拆分成：

- 前端 + 后端
- 后端 + 数据库
- 前端 + 后端 + 数据库

然后按对应组合给出更新步骤，不要直接给笼统答案。

### 1. 只改前端时

适用范围：

- `src`
- `public`
- 样式
- Vue 页面
- 前端静态资源

推荐更新方式：

1. 在本地执行 `npm run build`
2. 用 WinSCP 上传最新 `dist` 到服务器 `/home/admin/EnglishQuestion/dist`
3. 一般不需要重启 `pm2`
4. 通常也不需要重启 `nginx`
5. 上传后直接刷新浏览器验证页面

给用户的默认建议：

- 小改动优先只传 `dist`
- 不要在当前 2C2G 服务器上执行前端构建，避免机器卡死

### 2. 只改后端时

适用范围：

- `server/index.js`
- `server/*.js`
- 被后端直接依赖的共享逻辑文件，例如 `src/shared/*`

推荐更新方式：

1. 用 WinSCP 上传修改后的后端代码到服务器 `/home/admin/EnglishQuestion`
2. 如果没有依赖变化，执行：

```bash
cd /home/admin/EnglishQuestion
pm2 restart english-question
```

3. 如果有依赖变化，还要先执行：

```bash
cd /home/admin/EnglishQuestion
npm install
pm2 restart english-question
```

4. 更新后默认验证：

```bash
pm2 status
curl http://127.0.0.1:3001/api/health
```

### 3. 改数据库时

适用范围：

- 新增表
- 改字段
- 改索引
- 改视图
- 数据修复脚本

推荐更新方式：

1. 先备份数据库：

```bash
mysqldump -u kidsenglish -p kids_english > /home/admin/kids_english_backup.sql
```

2. 再执行数据库变更脚本
3. 如果数据库变更依赖后端代码，同时更新后端代码
4. 变更完成后重启后端：

```bash
cd /home/admin/EnglishQuestion
pm2 restart english-question
```

5. 至少验证：

- 接口是否正常
- 关键页面是否还能读取和写入数据

## 后续会话中的提问规则

后续只要用户说“代码改完了，怎么更新”，默认先追问这次改动范围，优先用下面这个问法：

> 这次改动是前端、后端、数据库，还是其中多个都有？

然后按回答给更新方案：

- 只前端：给本地 build + 上传 `dist` 的方案
- 只后端：给上传代码 + `pm2 restart` 的方案
- 只数据库：给备份 + 执行 SQL + 重启后端的方案
- 混合改动：按“前端 / 后端 / 数据库”拆步骤，分顺序给方案

## 线上更新总原则

- 前端尽量本地构建，不在当前低配服务器上构建
- 后端更新后优先用 `pm2 restart english-question`
- 涉及 `package.json` 或 `package-lock.json` 变化时，要提醒执行 `npm install`
- 涉及数据库结构变化时，先备份再变更
- 给用户更新方案时，必须附上“更新后验证步骤”

## 线上发布 / 重发流程（当前服务器固定方案）

当前线上环境固定为：

- 项目目录：`/home/admin/EnglishQuestion`
- Nginx
- PM2 进程名：`english-question`
- MySQL 数据库：`kids_english`
- 前端静态目录：`/home/admin/EnglishQuestion/dist`

后续只要用户问“怎么发布”“怎么重发”“怎么把最新代码上线”，默认优先按下面流程回答。

### 一、标准发布顺序

1. 本地完成代码修改
2. 本地根据改动类型执行：
   - 前端有改动：`npm run build`
   - 后端有改动：准备上传后端代码
   - 数据库有改动：准备 SQL 脚本
3. 用 WinSCP 上传文件到 `/home/admin/EnglishQuestion`
4. 如果依赖有变化，再在服务器执行 `npm install`
5. 如果数据库有变化，先备份再执行 SQL
6. 重启后端服务
7. 验证接口、页面、关键业务流程

### 二、当前推荐发布方式

#### 1. 前端发布

- 本地执行：

```bash
npm run build
```

- 用 WinSCP 上传本地 `dist` 到：

```text
/home/admin/EnglishQuestion/dist
```

- 通常不需要重启 Nginx
- 如果只是纯前端静态修改，通常也不需要重启 PM2

#### 2. 后端发布

- 用 WinSCP 上传：
  - `server`
  - 后端依赖的共享文件，例如 `src/shared`
  - 若有配置变更，确认 `.env` 未被错误覆盖

- 如果没有依赖变化，服务器执行：

```bash
cd /home/admin/EnglishQuestion
pm2 restart english-question --update-env
```

#### 3. 数据库发布

- 先备份：

```bash
mysqldump -u kidsenglish -p kids_english > /home/admin/kids_english_backup_$(date +%F_%H%M%S).sql
```

- 再执行变更脚本：

```bash
mysql -u kidsenglish -p kids_english < /home/admin/EnglishQuestion/sql/你的变更脚本.sql
```

- 数据库改动完成后，通常也要执行：

```bash
cd /home/admin/EnglishQuestion
pm2 restart english-question --update-env
```

### 三、依赖更新规则

只有下面文件有变化时，才建议在服务器执行 `npm install`：

- `package.json`
- `package-lock.json`

推荐命令：

```bash
cd /home/admin/EnglishQuestion
npm install --registry=https://registry.npmmirror.com --no-audit --fund=false
```

### 四、ffmpeg-static 特殊处理规则

如果 `npm install` 卡在或失败于 `ffmpeg-static`，默认按下面流程处理：

1. 先安装系统 ffmpeg：

```bash
sudo apt update
sudo apt install -y ffmpeg
```

2. 确认路径：

```bash
which ffmpeg
```

正常应为：

```text
/usr/bin/ffmpeg
```

3. 安装依赖时显式指定：

```bash
cd /home/admin/EnglishQuestion
FFMPEG_BIN=/usr/bin/ffmpeg npm install --registry=https://registry.npmmirror.com --no-audit --fund=false
```

4. 并确保 `.env` 内有：

```env
FFMPEG_BIN=/usr/bin/ffmpeg
```

### 五、数据库账号规则

线上 Node 服务不要默认使用 MySQL `root` 账号。

当前约定应用账号应为：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=kidsenglish
DB_PASSWORD=Abcd1234
DB_NAME=kids_english
```

如果后端日志出现：

- `Access denied for user 'root'@'localhost'`

优先判断：

- `.env` 是否被错误改成 `DB_USER=root`
- PM2 是否仍在使用旧环境

### 六、PM2 启动 / 重启规则

#### 1. 正常重启

```bash
cd /home/admin/EnglishQuestion
pm2 restart english-question --update-env
```

#### 2. 如果怀疑 PM2 仍在使用旧环境变量

按下面顺序：

```bash
cd /home/admin/EnglishQuestion
pm2 delete english-question
unset DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME API_PORT
set -a
. ./.env
set +a
pm2 start server/index.js --name english-question --update-env
pm2 save
```

### 七、Nginx 当前约定

当前 Nginx 配置文件约定为：

```text
/etc/nginx/conf.d/english-question.conf
```

修改配置后，固定执行：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 八、发布后必做验证

每次上线后，默认至少执行：

```bash
pm2 status
curl http://127.0.0.1:3001/api/health
curl http://127.0.0.1/api/health
curl -I http://127.0.0.1
```

并至少人工验证：

- 首页能打开
- 登录正常
- 已配置卷子列表正常
- 新建或编辑卷子正常
- 学生端能打开卷子
- 提交答题正常
- 本卷答题情况页正常

### 九、线上录音 / 语音的已知发布注意事项

- 不要在发布录音相关问题时只看本地；必须区分本地和线上环境
- 本地可录音但线上不行时，优先排查：
  - 是否为 `http + IP` 访问
  - 是否缺少 HTTPS 安全上下文
- 线上播放语音如果请求 `/api/tts` 返回 `503`，优先排查：
  - `.env` 中是否配置了腾讯云相关密钥
  - `TENCENT_SECRET_ID`
  - `TENCENT_SECRET_KEY`
  - `TENCENT_TTS_REGION`
  - `TENCENT_TTS_VOICE_TYPE`

### 十、后续会话对“发布”的默认提问方式

如果用户说“我要发布”“我要更新线上”，默认先追问：

> 这次改动是前端、后端、数据库，还是三者都有？有没有依赖变化？

然后再按上面的固定流程输出，不要跳步骤，不要省略验证。

## 当前项目状态总结
一句话概括：

- 基础产品结构已搭完
- 固定 5 个题型 UI 已有
- MySQL 已接入
- 卷子和答题记录开始走正式数据库
- 还没做更深的生产化细节，例如参数校验、分页、鉴权、真实语音评分接口

## 建议下一步
优先级建议：

1. 给保存卷子 / 提交答卷加参数校验和错误提示
2. 给“本卷答题情况”页加分页
3. 接入真实音频生成 / 图片生成 / 语音评分接口
4. 增加登录、权限、老师端账号体系

---
## 2026-04-17 最新上下文补充（后续会话必须先看）

### 1. 听音做指令题保存校验

老师端保存卷子时，`listen_follow_instruction` 题如果是拖拽模式，必须校验以下 3 项，否则不允许保存：

- 已上传场景图
- 已设置目标区域
- 已设置正确答案

这条规则已经同时加到：

- 前端保存拦截
- 后端持久化拦截

### 2. 报告页布局统一规则

报告页当前已经统一成“平均两列”的思路：

- 顶部 KPI：平均两列
- 中间表现区 / 雷达区：平均两列
- 底部评语区 / 今日收获：平均两列

后续不要再把中间区单独改成左宽右窄，除非用户明确要求。

### 3. 抽奖弹窗当前规则

- 奖品结果使用独立结果弹层，不再把扭蛋机弹窗撑长
- 奖品标签位置已经做过多轮修正，后续如果再改，优先从“扇区中心角”和“标签锚点”两个方向查，不要只改半径

### 4. 浏览器语音播放当前规则

学生端“播放单词 / 听示范”这条浏览器 TTS 链路已经做过修正：

- 保持同步 `speechSynthesis.speak()`，不能 `await` 后再播，否则会丢失点击手势上下文
- 英文语音优先级：
  1. `Google UK English Female`
  2. `Google UK English Male`
  3. `Google US English`
- 如果英语 voice 启动失败，会自动回退浏览器默认 voice
- `listening` 播放速率当前约为 `0.68`

### 5. 麦克风题当前交互规则

以下规则已经确认并落地：

- 录音中可以手动结束
- 题目页不显示识别文本
- 题目页不显示演示结果 / 演示评分 / 演示回答按钮
- 题目页不显示即时分数
- 分数只在最终报告里体现

### 6. 录音文件保存方案

录音文件当前采用“方案 C 变体”：

- 先单独上传录音文件
- 再提交整张卷子的答案 JSON
- 录音文件目录：
  - `/home/admin/EnglishQuestion/uploads/records`
- 当前服务访问路径：
  - `/api/uploads/...`
- 录音元数据保存在：
  - `submission_answers.student_answer_json`

### 7. 录音问题的当前结论

曾出现“文件有时长但没声音”的问题，已定位并处理过这两层：

- 回放 URL 错误：已统一成 `/api/uploads/...`
- 录音启动时序问题：已改成录音器准备好后再开始识别

另外，当前已加入静音检测：

- 如果录音结束后检测到电平近似静音
- 不上传该录音
- 提示用户重新录音并检查麦克风

### 8. 答题记录页当前规则

- 题型列必须显示中文
- 麦克风作答题在明细里应支持直接在线播放

### 9. 已确认但尚未实现的语音评分方案

这个方案已经和用户确认，且目前是**当前主问题**：

- 供应商：腾讯云口语评测
- 第一阶段只接：`read_aloud`
- 评分时机：整张卷子提交后统一评分
- 评分完成后再生成报告
- 中间要有“生成报告中...”状态
- 每道麦克风题只要一个 `0-100` 分
- 如果评分失败，直接给 `100` 分

后续新会话如果继续做语音评分，必须从这里接着做，不要重新讨论供应商和评分时机。

### 10. 腾讯云口语评测当前执行约束

当前如果继续开发，默认只做这一件事：

> 接入腾讯云口语评测（方案 B），先完成 `read_aloud`，再说别的题型。

执行约束：

- 不要再切去处理录音静音、抽奖位置、报告布局等其他问题
- 不要一次把所有麦克风题都接上
- 先完成：
  - 后端统一评分
  - 前端“生成报告中...”状态
  - 失败兜底 100 分
- 真实密钥不允许写入任何 md、代码、测试、回复
- 只允许通过后端 `.env` 读取：
  - `TENCENT_SOE_APP_ID`
  - `TENCENT_SECRET_ID`
  - `TENCENT_SECRET_KEY`

