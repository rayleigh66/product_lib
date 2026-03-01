# Product Library MVP

登录后可用的产品管理网站（MVP），支持 Viewer/Editor/Admin 三种角色。

## 技术栈
- Next.js 14（React + Node Route Handlers）
- Prisma + PostgreSQL
- JWT Cookie 认证
- 中英文切换（UI 文案与字段名）

## 角色权限
- Viewer: 列表/详情、搜索筛选
- Editor: 新增/编辑产品
- Admin: 全权限 + 批量导入、导入记录、失败报告下载

## 关键规则
- `sku` 必填，按“去空格+小写”规范化后唯一
- `release_date` 如果非空必须为 `yyyy-mm-dd`
- `stock` 整数且 >=0，默认 0
- `weight_kg` number（kg）
- `waterproof`、`eco` 默认为 false
- 库存状态：`stock > 0` 可发货，否则缺货

## 快速开始
```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

## 测试账号
- admin@example.com / Passw0rd!
- editor@example.com / Passw0rd!
- viewer@example.com / Passw0rd!

## API
- Auth: `POST /api/auth/login` `POST /api/auth/logout` `GET /api/auth/me`
- 产品:
  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/products`
  - `PUT /api/products/:id`
  - `GET /api/products/exists?sku=...`
- 导入:
  - `GET /api/imports/template`
  - `POST /api/imports/upload`
  - `POST /api/imports/:id/validate`
  - `POST /api/imports/:id/commit`
  - `GET /api/imports`
  - `GET /api/imports/:id/failures`

## 错误结构
所有错误 API 返回统一结构：
```json
{ "code": "...", "message_zh": "...", "message_en": "...", "details": {} }
```

## 导入流程（严格模式）
上传 CSV -> 预览/校验 -> 提交。
一旦存在任何错误，整批不入库，并生成失败 CSV 报告供下载。


## 测试与可行性验证
请参考完整验证清单：`docs/testing-and-validation.md`。

该文档包含：
- 启动检查与鉴权验证
- Viewer/Editor/Admin 权限回归
- 核心业务规则（SKU 唯一标准化、日期/库存/重量校验）
- Admin 严格模式导入（失败阻断+失败报告下载）
- 前端手工验收与数据库复核 SQL
