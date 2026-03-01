# 测试与可行性验证指南（MVP）

本文给出**可直接执行**的验证流程，覆盖：
1. 环境可运行性
2. 权限可行性（Viewer / Editor / Admin）
3. 核心业务规则
4. 严格模式导入
5. i18n 可用性

## 0. 启动与初始化
```bash
docker compose up -d
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

## 1. 基础健康检查
```bash
curl -i http://localhost:3000/api/auth/me
```
预期：401，且 body 为统一错误结构：
```json
{ "code": "UNAUTHORIZED", "message_zh": "请先登录", "message_en": "Please login first" }
```

## 2. 鉴权与角色权限验证（推荐使用 cookie jar）

### 2.1 Admin 登录
```bash
curl -i -c admin.cookie -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Passw0rd!"}'
```
预期：200，返回 `role: ADMIN`。

### 2.2 Viewer 登录并验证写入被拒绝
```bash
curl -i -c viewer.cookie -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"viewer@example.com","password":"Passw0rd!"}'

curl -i -b viewer.cookie -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"sku":"SKU-V-1","name":"v","color":"black","fabric":"nylon","lining":"poly","stock":1,"weight_kg":0.5,"waterproof":false,"eco":false}'
```
预期：第二个请求 403 + `FORBIDDEN`。

### 2.3 Editor 可写、不可导入
```bash
curl -i -c editor.cookie -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"editor@example.com","password":"Passw0rd!"}'

curl -i -b editor.cookie -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"sku":"SKU-E-1","name":"Editor Item","color":"blue","fabric":"cotton","lining":"poly","release_date":"2026-03-01","stock":2,"weight_kg":0.7,"waterproof":true,"eco":true}'

curl -i -b editor.cookie http://localhost:3000/api/imports
```
预期：创建产品 201；导入列表 403。

## 3. 核心业务规则验证

### 3.1 SKU 标准化唯一（去空格+大小写不敏感）
```bash
curl -i -b admin.cookie -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"sku":" Abc - 001 ","name":"A","color":"black","fabric":"nylon","lining":"poly","stock":1,"weight_kg":0.2,"waterproof":false,"eco":false}'

curl -i -b admin.cookie -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"sku":"abc-001","name":"B","color":"black","fabric":"nylon","lining":"poly","stock":1,"weight_kg":0.2,"waterproof":false,"eco":false}'
```
预期：第二个请求 409 + `SKU_EXISTS`。

### 3.2 release_date 格式验证
```bash
curl -i -b admin.cookie -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"sku":"SKU-DATE-1","name":"Date","color":"black","fabric":"nylon","lining":"poly","release_date":"03-01-2026","stock":1,"weight_kg":0.2,"waterproof":false,"eco":false}'
```
预期：400 + `INVALID_INPUT`。

### 3.3 stock 必须整数且 >=0
```bash
curl -i -b admin.cookie -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"sku":"SKU-STOCK-NEG","name":"Neg","color":"black","fabric":"nylon","lining":"poly","stock":-1,"weight_kg":0.2,"waterproof":false,"eco":false}'
```
预期：400 + `INVALID_INPUT`。

### 3.4 weight_kg 为 number
```bash
curl -i -b admin.cookie -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"sku":"SKU-W-STR","name":"Weight","color":"black","fabric":"nylon","lining":"poly","stock":1,"weight_kg":"heavy","waterproof":false,"eco":false}'
```
预期：400 + `INVALID_INPUT`。

## 4. 严格模式导入验证（Admin）

### 4.1 上传错误 CSV 并校验
```bash
cat > /tmp/bad.csv <<'CSV'
sku,name,color,fabric,lining,release_date,stock,weight_kg,waterproof,eco
SKU-IMP-1,Item1,black,nylon,poly,2026-03-01,2,0.4,true,false
SKU-IMP-1,Item2,red,cotton,poly,2026-03-01,2,0.4,true,false
CSV

RAW=$(python3 - <<'PY'
import json
print(json.dumps(open('/tmp/bad.csv','r',encoding='utf-8').read()))
PY
)

curl -s -b admin.cookie -X POST http://localhost:3000/api/imports/upload \
  -H 'Content-Type: application/json' \
  -d "{\"fileName\":\"bad.csv\",\"rawCsv\":${RAW}}" > /tmp/upload.json

ID=$(python3 - <<'PY'
import json
print(json.load(open('/tmp/upload.json'))['id'])
PY
)

curl -i -b admin.cookie -X POST http://localhost:3000/api/imports/${ID}/validate
curl -i -b admin.cookie -X POST http://localhost:3000/api/imports/${ID}/commit
```
预期：validate 结果 `FAILED`；commit 返回 400（必须先校验通过）。

### 4.2 下载失败报告
```bash
curl -i -b admin.cookie http://localhost:3000/api/imports/${ID}/failures
```
预期：200，`Content-Type: text/csv`。

## 5. 前端验收建议（手工）
1. 登录后左侧菜单显示：产品库 /（Admin 才有）导入记录 / 个人中心。
2. 右上角切换 ZH/EN，观察 UI 文案与字段名变化。
3. 产品列表每行最多 5 卡，支持搜索与筛选（防水/环保/日期区间/库存状态）。
4. Editor/Admin 可进编辑页，SKU 输入时触发实时 exists 校验。
5. Admin 导入流程可完成上传→校验→提交；错误场景可下载失败 CSV。

## 6. 数据库侧可行性复核
```bash
psql "$DATABASE_URL" -c 'select role, count(*) from "User" group by role;'
psql "$DATABASE_URL" -c 'select sku, "skuNormalized" from "Product" order by "createdAt" desc limit 20;'
psql "$DATABASE_URL" -c 'select "fileName", status, "totalRows", "invalidRows" from "ImportJob" order by "createdAt" desc limit 20;'
```

## 7. 通过标准（MVP）
- 鉴权与 RBAC 均符合权限预期。
- 规则校验均触发且返回统一错误结构。
- 导入严格模式可阻止错误批次入库，并提供失败报告。
- 关键页面流程可走通，i18n 切换生效。
