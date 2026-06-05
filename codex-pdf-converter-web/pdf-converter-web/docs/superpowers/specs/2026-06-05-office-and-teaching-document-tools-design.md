# 办公与教学文档工具扩展设计

## 目标

- 面向办公文档人群、学生、老师，新增一组更容易卖年卡的强需求工具
- 保持当前 `Node.js + Express + Python` 单体结构，不做大重构
- 采用“实用优先版”策略，优先覆盖文字清晰、表格规则、版式常见的资料
- 新工具继续复用现有 catalog、上传、转换记录、下载结果、管理台统计链路

## 本轮范围

本轮纳入同一条产品线的 5 组能力：

1. `扫描件转可搜索 PDF`
2. `批量 Office / PDF 处理`
3. `试卷 / 讲义整理`
4. `图片转 Word`
5. `PDF 转 Excel` 与 `图片表格转 Excel`

## 设计原则

- 不新建第二套应用架构，继续沿用当前 conversion pipeline
- 对外用清晰易卖的工具名，对内尽量复用已有 Python 能力和公共辅助函数
- 前台拆成用户容易理解的独立工具，后台只在必要处共用处理能力
- 错误文案保持买家导向，不暴露底层库名和服务端实现细节
- 先做高频正常文档，复杂跨页表、重度合并单元格、手写模糊扫描件不承诺完美还原

## 总体实现方式

### 保持现有主干

继续扩展以下主干文件与模块：

- `server/services/conversionService.cjs`
- `scripts/run_conversion.py`
- `public/toolCatalogMarkup.mjs`
- buyer catalog source files
- admin 中文标签映射
- 测试目录下的 catalog、参数、接口回归用例

### 公共能力抽取

本轮只抽出必要公共能力，不做平台化重写：

- OCR 语言归一化与参数校验
- 批量任务 ZIP 打包
- 页面图像预处理
- 表格导出 Excel 辅助
- Word / Excel 输出文件名规范

## 工具边界

### 1. 扫描件转可搜索 PDF

- 前台工具名：`扫描件转可搜索 PDF`
- 输入：
  - 1 个 PDF
  - OCR 语言选项，默认 `chi_sim+eng`
- 输出：
  - 1 个可搜索 PDF
- 一期目标：
  - 尽量保留原页面视觉外观
  - 为原 PDF 叠加可搜索文字层
- 一期不承诺：
  - 手写体准确识别
  - 极端歪斜、污损、低清晰度资料的高质量恢复

建议 conversion key：

- `scan_to_searchable_pdf`

### 2. 批量 Office / PDF 处理

- 前台拆成 4 个独立工具：
  - `批量 Word 转 PDF`
  - `批量 Excel 转 PDF`
  - `批量 PPT 转 PDF`
  - `批量 PDF 转图片`
- 输入：
  - 同类多文件一次上传
- 输出：
  - 1 个 ZIP
- 一期目标：
  - 逐个文件执行现有单文件转换
  - 保持用户上传顺序
  - 打包统一下载
- 一期不做：
  - 一个批次里混合多种输入格式再自动分流
  - 批量任务队列与异步轮询页

建议 conversion key：

- `batch_word_to_pdf`
- `batch_excel_to_pdf`
- `batch_ppt_to_pdf`
- `batch_pdf_to_images`

### 3. 试卷 / 讲义整理

- 前台工具名：`试卷 / 讲义整理`
- 输入：
  - 图片或 PDF
- 输出：
  - 优先输出整理后的 PDF
  - 有需要时附加输出图片 ZIP
- 一期固定功能：
  - 自动纠偏
  - 去黑边
  - 提亮 / 对比增强
  - 转黑白或灰度
  - 双页拆分
  - 页面尺寸统一
- 一期不做：
  - 自动识别题号重排
  - 自动删答案区
  - 复杂版面结构理解

建议 conversion key：

- `exam_paper_cleanup`

### 4. 图片转 Word

- 前台工具名：`图片转 Word`
- 输入：
  - 单张或多张图片
  - OCR 语言选项
- 输出：
  - 1 个 `.docx`
- 一期目标：
  - 先识别文本内容
  - 以段落流方式写入 Word
  - 强调“可复制、可继续编辑”
- 一期不承诺：
  - 原图版式 1:1 还原
  - 复杂表格、公式、试卷框线完美恢复

建议 conversion key：

- `images_to_word`

### 5. PDF 转 Excel / 图片表格转 Excel

- 前台拆成 2 个独立工具：
  - `PDF 转 Excel`
  - `图片表格转 Excel`
- 输入：
  - 表格型 PDF，或表格截图 / 拍照图
- 输出：
  - 1 个 `.xlsx`
- 一期目标：
  - 优先支持规则表格
  - 适合课表、名单、成绩表、清单类资料
- 一期不承诺：
  - 跨页复杂财务报表完美恢复
  - 大量合并单元格、嵌套表、极低清晰度图片稳定还原

建议 conversion key：

- `pdf_to_excel`
- `image_table_to_excel`

后台实现上，两者共用同一条“表格识别导出 Excel”能力线：

- PDF 路径：必要时先转页图，再进入表格识别
- 图片路径：直接进入表格识别

## 技术方案

### Node 层

`server/services/conversionService.cjs` 需要扩展：

- catalog 条目定义
- 文件数量与扩展名校验
- OCR 语言参数校验
- 批量工具的多文件输出 ZIP 映射
- 新 summary 类型支持
- 统一产品化错误文案

相关辅助点：

- 为批量任务补充多文件输入规则
- 为 Excel / Word / searchable PDF 工具补充输出命名规范
- 尽量避免在 `executeConversion` 中继续无限堆长分支，必要时拆成局部辅助函数

### Python 层

`scripts/run_conversion.py` 需要扩展以下命令：

- `scan_to_searchable_pdf`
- `batch_word_to_pdf`
- `batch_excel_to_pdf`
- `batch_ppt_to_pdf`
- `batch_pdf_to_images`
- `exam_paper_cleanup`
- `images_to_word`
- `pdf_to_excel`
- `image_table_to_excel`

建议同步新增或抽取的公共函数：

- PDF OCR 包装函数
- 批量 ZIP 写入函数
- 图像预处理函数
- 图片 OCR 识别函数
- Excel workbook 写入函数
- 表格抽取结果标准化函数

## 依赖策略

继续保留现有主栈：

- Node.js
- Express
- Python
- SQLite

本轮新增 Python 依赖优先考虑：

- `openpyxl`
- `pytesseract`
- `opencv-python`
- 1 套 PDF 表格抽取库，优先在 `camelot-py` 与 `tabula-py` 中选择更适合 Ubuntu 22.04 和当前样例稳定性的方案

说明：

- `ocrmypdf`、`tesseract`、`ffmpeg`、`pymupdf` 等现有依赖继续复用
- `PDF 转 Excel` 与 `图片表格转 Excel` 的实际库型选择需要以本地样例验证结果为准
- 如果 `camelot-py` 对样例 PDF 覆盖更稳，则优先它；若 Java 依赖或线框表兼容性更差，再评估替代方案

## 前台交互设计

### buyer catalog

新工具在 buyer 侧以独立工具卡出现，不做“组合入口”：

- 扫描件转可搜索 PDF
- 批量 Word 转 PDF
- 批量 Excel 转 PDF
- 批量 PPT 转 PDF
- 批量 PDF 转图片
- 试卷 / 讲义整理
- 图片转 Word
- PDF 转 Excel
- 图片表格转 Excel

### detail form

每个工具只暴露必要参数：

- OCR 类工具：
  - 文件
  - OCR 语言
- 批量类工具：
  - 多文件上传
- 试卷整理：
  - 输出模式
  - 是否双页拆分
  - 是否增强对比
  - 黑白 / 灰度模式
- Excel / Word 导出类：
  - 必要语言或识别提示

避免一次暴露过多专业参数，先保证可用与成交感知。

## 数据流

1. buyer 打开工具详情页
2. 上传文件并填写最少必要参数
3. 前端提交到现有 `/api/conversions/run`
4. Node 层写入 conversion record、参数校验、落盘输入文件
5. Python 执行对应命令
6. 输出文件写入 `data/conversions/.../outputs`
7. Node 回传下载链接与简要 summary
8. admin 统计继续按 conversion key 记录中文标签

## 错误处理

错误处理原则：

- 对买家展示“怎么改输入”而不是“底层命令失败”
- 统一用中文可操作提示
- 不展示 Python 包名、系统命令名、堆栈

典型文案方向：

- 文件不清晰：建议上传更清晰、边框更完整的文件
- 表格过复杂：建议使用线条更清楚、排版更规则的表格文件
- OCR 失败：建议更换语言或上传更高分辨率文件
- 依赖缺失：记录服务端失败，但买家端提示为“当前环境暂时无法处理该文件，请稍后重试或联系管理员”

## 测试与验证

### 自动化测试

补充以下覆盖：

- catalog 新工具可见性
- 参数校验
- 多文件上传规则
- admin 中文标签映射
- 下载结果类型
- 批量 ZIP 输出行为

### Python 回归样例

至少准备以下真实样例：

- 规则表格 PDF
- 扫描 PDF
- 手机拍照表格图
- 试卷照片
- 多张图片 OCR 合并为 Word

### 浏览器回归

至少手测以下链路：

- 扫描件转可搜索 PDF
- 批量 Word 转 PDF
- 批量 PDF 转图片
- 试卷 / 讲义整理
- 图片转 Word
- PDF 转 Excel
- 图片表格转 Excel

重点核对：

- 上传成功
- 处理成功
- 结果可下载
- ZIP 包完整
- 中文文件名正常
- buyer 文案不暴露底层依赖
- admin 显示中文工具名

## 部署与文档更新

需要同步更新：

- `README.md`
- `docs/deployment-ubuntu-22.04.md`
- 若依赖安装脚本涉及新增依赖，需同步更新 Ubuntu 安装脚本

需要在部署文档中补充：

- 新增 Python 包安装说明
- 若使用 `tabula-py`，则需明确 Java 依赖
- 表格识别能力的适用边界说明

## 分阶段落地顺序

### 第 1 波

- 扫描件转可搜索 PDF
- 批量 Word 转 PDF
- 批量 Excel 转 PDF
- 批量 PPT 转 PDF
- 批量 PDF 转图片

原因：

- 复用现有能力最多
- 最快形成可卖功能
- 风险最低

### 第 2 波

- 试卷 / 讲义整理
- 图片转 Word

原因：

- 与学生 / 老师场景高度相关
- 与现有 OCR、图像处理能力衔接自然

### 第 3 波

- PDF 转 Excel
- 图片表格转 Excel

原因：

- 技术不确定性最高
- 需要以真实样例决定最终依赖与容错策略

## 明确不在本轮范围

- 异步任务队列
- 任务历史单独筛选页
- 极复杂文档版面 1:1 恢复
- 手写公式识别
- 自动题号重排与知识点结构化
- 混合格式批量智能分流
- 云 OCR 外部 API 方案

## 验收标准

- 新工具在 buyer catalog 中可见，文案清晰
- 每个工具至少打通 1 条真实上传到下载链路
- admin 可看到中文工具标签
- README 与 Ubuntu 部署文档同步更新
- 至少一轮真实浏览器回归完成
- 对复杂文档的限制在前台文案或帮助文案中说清楚

## 决策结论

- 本轮采用“同一产品线、分阶段实现”的混合路线
- 保持现有 Node + Python conversion 管线
- 优先交付可卖、可用、可部署的版本
- 复杂表格与复杂扫描件能力以后续真实样例驱动增强，不在首轮承诺过度效果
