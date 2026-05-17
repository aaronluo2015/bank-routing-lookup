# 全球银行路由号查询工具 — 完整落地计划

---

## 一、商业准备

### 1.1 产品定位
- **免费Web工具**：全球银行路由号查询（SWIFT/ABA/IBAN/Sort Code等），自动识别+格式校验+银行信息查询
- **付费API产品**：面向B2B，按月订阅，按调用量计费
- **数据资产**：持续多源校验的银行路由号本地数据库

### 1.2 品牌
- 域名建议：`bankcodes.io` / `routingcheck.com` / `swiftlookup.com`（选一个可注册的.com或.io）
- 产品名建议：`BankCode Pro` / `RouteCheck` / `SwiftLookup`

### 1.3 收支规划
| 项目 | 初期成本/月 | 备注 |
|------|-----------|------|
| 域名 | ~$12/年 | Namecheap/Cloudflare |
| 服务器(Vercel免费层) | $0 | 流量上来后升级$20/月 |
| 外部API调用 | $0 | 全部用免费API源 |
| 总初始成本 | **~$1/月** | 几乎零启动成本 |

| 收入预期（第一年） | 保守 | 理想 |
|------|------|------|
| 联盟佣金 | $100-500/月 | $1000-2000/月 |
| API付费用户 | $0（第3-6月启动） | $500-2000/月 |
| 数据库销售 | 0 | 未定 |

### 1.4 付费API定价（上线后第3个月启动）
| 层级 | 月调用量 | 月费 | 年费 |
|------|---------|------|------|
| Free | 1,000 | $0 | - |
| Starter | 10,000 | $29 | $290 |
| Growth | 100,000 | $199 | $1,990 |
| Business | 500,000 | $499 | $4,990 |
| Enterprise | 定制 | 议价 | 议价 |

收费渠道：Stripe / Paddle

### 1.5 联盟营销合作方
- Wise（跨境汇款，佣金约$20-50/笔）
- Payoneer（跨境收款）
- Remitly / OFX / CurrencyFair
- 注册 Affiliate Program → 获取追踪链接 → 嵌入结果页

---

## 二、技术架构

### 2.1 技术栈
```
前端：Next.js 14 (App Router) + TailwindCSS + TypeScript
后端：Next.js API Routes（同项目内）
数据：本地JSON文件（data/banks.json）+ 内存缓存
部署：Vercel（免费层）→ 升级Pro
域名DNS：Cloudflare
监控：Vercel Analytics + 自建健康检查
```

### 2.2 项目结构
```
banks/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # 首页：输入框 + 查询
│   │   ├── lookup/
│   │   │   └── [code]/page.tsx # 详情结果页
│   │   ├── api/
│   │   │   ├── lookup/route.ts # 公开API
│   │   │   ├── validate/route.ts
│   │   │   ├── enrich/route.ts # 后台数据丰富
│   │   │   └── health/route.ts # 健康检查
│   │   ├── admin/              # 管理后台
│   │   │   ├── page.tsx        # Dashboard首页
│   │   │   ├── login/page.tsx  # 管理登录
│   │   │   ├── data/page.tsx   # 数据管理
│   │   │   ├── apikeys/page.tsx# API Key管理
│   │   │   ├── sources/page.tsx# 数据源状态
│   │   │   └── layout.tsx      # 管理后台布局
│   │   ├── docs/               # API文档页
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── types.ts            # 类型定义
│   │   ├── detectors.ts        # 号码类型自动识别
│   │   ├── validators/         # 格式校验器
│   │   │   ├── swift.ts
│   │   │   ├── aba.ts
│   │   │   ├── sortcode.ts
│   │   │   ├── iban.ts
│   │   │   ├── bsb.ts
│   │   │   ├── ifsc.ts
│   │   │   ├── transit.ts
│   │   │   ├── blz.ts
│   │   │   ├── cnaps.ts
│   │   │   └── index.ts
│   │   ├── sources/            # 外部数据源
│   │   │   ├── base.ts         # 数据源基类
│   │   │   ├── wise.ts
│   │   │   ├── openiban.ts
│   │   │   ├── bankcodes.ts
│   │   │   ├── razorpay-ifsc.ts
│   │   │   └── index.ts
│   │   ├── reconciler.ts       # 多源对比合并
│   │   ├── local-db.ts         # 本地数据库读写
│   │   ├── security.ts         # 安全中间件
│   │   ├── rate-limiter.ts     # 速率限制
│   │   ├── api-key-store.ts    # API Key管理
│   │   └── cache.ts            # 内存缓存
│   ├── data/
│   │   ├── banks.json          # 本地银行路由号数据
│   │   └── seed/               # 种子数据文件
│   ├── middleware.ts           # Next.js全局中间件
│   └── components/
│       ├── SearchInput.tsx
│       ├── ResultCard.tsx
│       ├── ConfidenceBadge.tsx
│       ├── admin/
│       │   ├── Sidebar.tsx
│       │   ├── StatsCard.tsx
│       │   └── DataTable.tsx
│       └── ui/                 # 通用UI组件
├── public/
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

### 2.3 核心数据模型
```ts
// 支持的号码类型
type RoutingCodeType = 'swift' | 'aba' | 'sortcode' | 'iban' | 'bsb'
  | 'ifsc' | 'transit' | 'blz' | 'cnaps' | 'ncc' | 'hk_bank_code'
  | 'sg_branch_code' | 'abi_cab' | 'nuban' | 'fedwire' | 'chips'

// 单条银行记录
interface BankRecord {
  code: string                    // 原始路由号
  normalizedCode: string          // 标准化后
  type: RoutingCodeType
  country: string
  bankName: string
  branch?: string
  address?: string
  city?: string
  zip?: string
  
  // 质量元数据
  sourceCount: number
  lastVerified: string            // ISO 日期
  confidence: number              // 0-100
  sources: string[]               // 来源列表
  conflicts: ConflictRecord[]
}

// 查询结果
interface LookupResult {
  valid: boolean
  code: string
  type: RoutingCodeType
  country: string
  parsedParts: { name: string; value: string }[]  // 解析出的各部分
  bank?: BankRecord
  confidence: number
  warnings?: string[]
}
```

### 2.4 号码识别逻辑（detectors.ts）
按优先级依次匹配：
1. **SWIFT**: 8-11位字母或字母+数字，前4位是银行码，5-6位是国家码，7-8位是地区码，9-11位是分行码（可选）
2. **IBAN**: 2字母国家码 + 2位校验位 + 最长30位BBAN
3. **ABA**: 9位纯数字，前4位是联邦储备路由号
4. **BSB**: 6位数字（XXX-XXX格式常见）
5. **Sort Code**: 6位数字（XX-XX-XX），与BSB区分需结合其他线索
6. **IFSC**: 11位，前4字母（银行码）+ 0 + 6位数字（分行码）
7. **Transit**: 5位数字 + 连字符 + 3位数字
8. **BLZ**: 8位纯数字
9. **CNAPS**: 12位纯数字
10. 其余：按长度+格式特征匹配

### 2.5 API 参数设计（可直接接入）

#### 2.5.1 公开API：查询银行路由号

**`GET /api/lookup?code=DEUTDEFF&type=swift`**

请求参数：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | **是** | 银行路由号 |
| `type` | string | 否 | 强制指定类型（swift/aba/iban/sortcode/bsb/ifsc/transit/blz/cnaps等），不传则自动识别 |
| `api_key` | string | 否 | API Key，无Key则使用免费配额（100次/天/IP） |
| `format` | string | 否 | 返回格式：json(默认) / xml |
| `lang` | string | 否 | 语言：en / zh，默认 en |

成功响应 (HTTP 200)：
```json
{
  "success": true,
  "code": "DEUTDEFF",
  "type": "swift",
  "country": "DE",
  "countryName": "Germany",
  "parsed": {
    "bankCode": "DEUT",
    "bankName": "Deutsche Bank AG",
    "countryCode": "DE",
    "locationCode": "FF",
    "branchCode": null,
    "isHeadOffice": true
  },
  "bank": {
    "name": "Deutsche Bank AG",
    "city": "Frankfurt am Main",
    "address": "Taunusanlage 12"
  },
  "confidence": 95,
  "sources": ["wise", "bank.codes", "local"],
  "verifiedAt": "2026-05-17T10:30:00Z",
  "queriedAt": "2026-05-17T12:00:00Z"
}
```

错误响应 (HTTP 400/404/429)：
```json
{
  "success": false,
  "error": "INVALID_FORMAT",
  "message": "The provided code does not match any known routing number format",
  "suggestions": ["SWIFT code should be 8 or 11 characters"]
}
```

错误码：
| 错误码 | HTTP | 说明 |
|--------|------|------|
| `INVALID_FORMAT` | 400 | 格式不符 |
| `NOT_FOUND` | 404 | 格式正确但查不到银行信息 |
| `RATE_LIMITED` | 429 | 超出频率限制 |
| `INVALID_API_KEY` | 401 | API Key无效 |
| `QUOTA_EXCEEDED` | 429 | 配额用尽，需升级 |

#### 2.5.2 批量查询API

**`POST /api/lookup/batch`**

```json
{
  "codes": ["DEUTDEFF", "CHASUS33", "BNPAFRPP"],
  "api_key": "sk_xxx"
}
```

响应：
```json
{
  "success": true,
  "results": [
    { "code": "DEUTDEFF", "type": "swift", "bankName": "Deutsche Bank AG", ... },
    { "code": "CHASUS33", "type": "swift", "bankName": "JPMorgan Chase Bank", ... },
    { "code": "BNPAFRPP", "type": "swift", "bankName": "BNP Paribas", ... }
  ],
  "total": 3,
  "found": 3
}
```

限制：单次最多 100 条。

#### 2.5.3 纯验证API

**`GET /api/validate?code=DEUTDEFF`**

响应：
```json
{
  "success": true,
  "valid": true,
  "code": "DEUTDEFF",
  "type": "swift",
  "country": "DE",
  "parsed": { ... }
}
```

#### 2.5.4 健康检查

**`GET /api/health`**

```json
{
  "status": "ok",
  "uptime": "7d 12h",
  "sources": {
    "wise": "online",
    "openiban": "online",
    "bankcodes": "degraded"
  },
  "localDb": { "size": 15234, "avgConfidence": 87 }
}
```

---

### 2.6 网络安全防护方案

#### 2.6.1 防护架构

```
                Cloudflare (第一层)
                     ↓
              DDoS防护 + WAF + Bot管理
                     ↓
                Vercel Edge (第二层)
                     ↓
            Next.js Middleware (第三层)
                     ↓
              API Route Handler (第四层)
```

#### 2.6.2 各层防护措施

**第一层：Cloudflare**
- ✅ DDoS 自动防护（免费版即含）
- ✅ SSL/TLS 全加密模式（Full, 严格模式）
- ✅ 开启 WAF（Web Application Firewall）托管规则
- ✅ Bot Fight Mode 拦截恶意爬虫
- ✅ 速率限制规则：同一IP > 100次/分钟 → 验证码
- ✅ 防火墙规则：
  - 阻止对 `/api/admin*` 的非白名单IP访问
  - 阻止对 `.env`, `wp-admin`, `.git` 等路径的扫描
  - 封禁已知恶意ASN和国家（如不需要的流量来源）

**第二层：Vercel**
- ✅ 自动 HTTPS
- ✅ Edge Network 全球分发
- ✅ 环境变量加密存储（API密钥等）
- ✅ 部署保护：预览环境需密码

**第三层：Next.js Middleware（middleware.ts）**
```ts
// 全局拦截
- CORS 白名单：只允许自己的域名 + 付费API客户域名
- 安全头：CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- 路径保护：/admin 路径需要Basic Auth或Session
- 请求大小限制：防止大payload攻击
- 方法限制：只允许 GET/POST/OPTIONS
```

**第四层：API Route 应用层**
```ts
- API Key 认证中间件
- 速率限制（基于IP + API Key双重维度的滑动窗口）
- 输入校验与消毒（防止注入）
- SQL注入不适用（无数据库），但防止JSON注入/参数污染
- 请求日志（不含敏感数据）
- 错误信息脱敏（不暴露内部堆栈）
```

#### 2.6.3 环境变量清单（.env.local）
```bash
# 数据库加密密钥
ENCRYPTION_KEY=random-32-char-string

# 管理员认证
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=bcrypt-hash
JWT_SECRET=random-jwt-secret
AUTH_COOKIE_NAME=bank_admin_token

# 外部API密钥（如有需要）
WISE_API_KEY=
OPENIBAN_API_KEY=

# 后台数据丰富定时任务密钥
ENRICH_SECRET=random-enrich-secret

# Vercel/Cloudflare
VERCEL_ENV=production
```

#### 2.6.4 攻击防护清单

| 攻击类型 | 防护措施 |
|----------|----------|
| DDoS/CC | Cloudflare + Vercel Edge 自动防护 |
| SQL注入 | 无数据库，不涉及 |
| XSS | React自动转义 + CSP头 |
| CSRF | SameSite Cookie + CSRF Token |
| API滥用 | 速率限制（滑动窗口）+ API Key配额 |
| 爬虫/采集 | Cloudflare Bot Management + 速率限制 |
| 暴力破解 | /admin 登录失败锁定（5次/15分钟） |
| 中间人攻击 | Cloudflare强制HTTPS |
| 敏感信息泄露 | 环境变量不提交Git + Vercel加密存储 |
| 依赖漏洞 | Dependabot自动扫描 + npm audit |

#### 2.6.5 API Key 管理安全
```
生成：crypto.randomUUID() → 64位hex
存储：SHA-256哈希存储，原key仅显示一次
验证：请求中的key → SHA256 → 对比存储的hash
权限：每个key绑定tier（free/starter/growth/business）
过期：支持设置过期时间
吊销：管理后台一键吊销
```

---

### 2.7 管理后台设计

#### 2.7.1 访问控制
- 路径：`/admin` 
- 认证：用户名+密码 → JWT Cookie（24h有效）
- 初次使用：环境变量设置初始管理员凭据

#### 2.7.2 Dashboard 首页 `/admin`
```
┌─────────────────────────────────────────────┐
│  Logo   管理后台                [退出登录]    │
├──────────┬──────────────────────────────────┤
│          │  ┌──────┐ ┌──────┐ ┌──────┐     │
│ 侧边栏   │  │总查询 │ │API调用│ │命中率 │     │
│          │  │12,345│ │ 8,920│ │ 87%  │     │
│          │  └──────┘ └──────┘ └──────┘     │
│ · 首页   │  ┌──────────┐ ┌──────────────┐  │
│ · 数据   │  │近7天查询 │ │号码类型分布   │  │
│   管理   │  │ 趋势图   │ │ 饼图          │  │
│ · API    │  └──────────┘ └──────────────┘  │
│   Key    │  ┌──────────────────────────┐   │
│ · 数据源 │  │ 数据源健康状态            │   │
│   监控   │  │ ✅ wise       | 正常      │   │
│          │  │ ⚠️ bankcodes  | 降级      │   │
│          │  │ ✅ openiban   | 正常      │   │
│          │  └──────────────────────────┘   │
└──────────┴──────────────────────────────────┘
```

指标：
- 今日/本周/本月查询总量
- API调用量（按Key统计）
- 缓存命中率
- 数据源健康状态
- 各类型号码查询分布

#### 2.7.3 数据管理 `/admin/data`
功能：
- 搜索/浏览本地数据库记录
- 查看单条记录详情（含来源、可信度、冲突记录）
- 手动新增/编辑/删除银行记录
- 批量导入：上传 JSON/CSV
- 批量导出：下载完整数据库
- 按置信度筛选（查看低质量数据）
- 重新验证：选中记录 → 调用外部API重新对比

表格列：
```
Code | 类型 | 银行名称 | 国家 | 置信度 | 数据源 | 操作
```

#### 2.7.4 API Key管理 `/admin/apikeys`
功能：
- 创建新 API Key（选择 tier → 生成）
- 查看所有 Key：名称、tier、已用配额、到期时间、状态
- 编辑配额/到期时间
- 启用/禁用/吊销 Key
- 查看每个 Key 的最后使用时间和IP

#### 2.7.5 数据源监控 `/admin/sources`
- 各数据源在线状态（实时检查）
- 每个数据源的调用统计（今日/本周/本月）
- 每个数据源的数据贡献占比
- 手动刷新/测试数据源连接

---

### 2.8 前台页面设计

#### 2.8.1 首页 `/`
```
┌─────────────────────────────────────────────┐
│  Logo     BankCode Lookup    [API文档] [管理] │
├─────────────────────────────────────────────┤
│                                             │
│    🌍 全球银行路由号查询                      │
│    支持 SWIFT · IBAN · ABA · Sort Code ...   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 输入银行路由号              [查询 🔍]│    │
│  └─────────────────────────────────────┘    │
│                                             │
│  支持的类型（卡片网格）：                      │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│  │ SWIFT │ │ IBAN  │ │  ABA  │ │ Sort  │   │
│  │全球银行│ │国际账户│ │美国路由│ │Code   │   │
│  │间代码  │ │号     │ │号     │ │英国   │   │
│  └───────┘ └───────┘ └───────┘ └───────┘   │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│  │  BSB  │ │ IFSC  │ │Transit│ │  BLZ  │   │
│  │澳大利亚│ │印度   │ │加拿大  │ │德国   │   │
│  └───────┘ └───────┘ └───────┘ └───────┘   │
│                                             │
│  或选择类型直接浏览：                          │
│  [SWIFT] [IBAN] [ABA] [Sort Code] ...       │
│                                             │
└─────────────────────────────────────────────┘
```

#### 2.8.2 查询结果页 `/lookup/DEUTDEFF`
```
┌─────────────────────────────────────────────┐
│  ← 返回首页                                  │
│  🔍 查询结果：DEUTDEFF    [⭐⭐⭐⭐⭐ 高可信度]   │
├─────────────────────────────────────────────┤
│  路由号类型：SWIFT/BIC                       │
│  国家：德国 (DE)                             │
│  ┌─────────────────────────────────────┐    │
│  │ 银行名称：Deutsche Bank AG           │    │
│  │ 城市：Frankfurt am Main             │    │
│  │ 地址：Taunusanlage 12               │    │
│  │ 分行：总行 (Head Office)             │    │
│  │ 是否连接SWIFT网络：是               │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  解析详情：                                  │
│  ┌─────────────────────────────────────┐    │
│  │ DEUT │ DE │ FF │ XXX               │    │
│  │ 银行码│国家│地区│分行(总行为XXX)     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  数据来源：wise ✅ | bank.codes ✅ | 本地 ✅   │
│  最后验证：2026-05-17                        │
│                                             │
│  [此信息正确? 👍 👎]                         │
│  ─────────────────────────────              │
│  💡 需要进行跨境汇款？                        │
│  [使用Wise汇款 →]  [注册Payoneer →]          │
└─────────────────────────────────────────────┘
```

#### 2.8.3 API文档页 `/docs`
```
┌─────────────────────────────────────────────┐
│  API Documentation                          │
│                                             │
│  快速开始       身份认证       端点列表        │
│                                             │
│  GET /api/lookup                            │
│  ├── 描述：查询银行路由号                    │
│  ├── 参数：code(必填), type(可选), api_key   │
│  ├── 示例请求                               │
│  ├── 示例响应                               │
│  └── 错误码                                 │
│                                             │
│  POST /api/lookup/batch                     │
│  ...                                        │
│                                             │
│  GET /api/validate                          │
│  ...                                        │
│                                             │
│  [申请API Key →]     [定价方案 →]            │
└─────────────────────────────────────────────┘
```

---

## 三、开发步骤（分4阶段，总计3-4周）

### 阶段一：MVP 核心（3-5天）— 可查询可接入
- [ ] 初始化 Next.js 14 项目 + TailwindCSS + TypeScript
- [ ] 全局 middleware.ts（安全头 + CORS + 路径保护）
- [ ] 核心类型定义 types.ts（含所有接口/响应类型）
- [ ] 号码类型检测器 detectors.ts（自动识别10+种类型）
- [ ] 格式校验器 validators/（swift、aba、sortcode、iban、bsb、ifsc、transit、blz、cnaps、ncc）
- [ ] 本地数据库 local-db.ts（JSON读写 + 内存缓存）
- [ ] 种子数据 banks.json（预置2000+常用银行路由号）
- [ ] 数据源对接 sources/（wise.com、openiban）
- [ ] API路由：/api/lookup（单条）、/api/validate、/api/health、/api/lookup/batch（批量）
- [ ] 速率限制 rate-limiter.ts（滑动窗口 + IP级别）
- [ ] API Key 基础认证（SHA256哈希验证）
- [ ] 前端首页 `/`（输入框 + 自动识别 + 类型卡片 + 快速查询）
- [ ] 查询结果页 `/lookup/[code]`（解析详情 + 银行信息 + 数据来源）
- [ ] API文档页 `/docs`（端点说明 + 示例代码 + 在线测试）
- [ ] 基本布局和导航
- [ ] 部署到 Vercel（域名绑定 + Cloudflare）

### 阶段二：数据增强 + 安全（1周）
- [ ] Reconciler 多源对比合并引擎（取多数 + 记录分歧 + 评分）
- [ ] 增加数据源：bank.codes、razorpay IFSC、bsb.auspaynet
- [ ] 本地数据库增加质量元数据字段（confidence、sources、conflicts、lastVerified）
- [ ] 前端可信度徽章 + 数据来源显示
- [ ] 更多号码类型支持（nuban尼日利亚、HK bank code、Singapore branch code、Italy ABI/CAB、New Zealand NCC）
- [ ] /api/enrich 后台数据丰富接口（定时任务密钥保护）
- [ ] 完整安全防护：CSP头、CSRF Token、输入消毒、错误脱敏
- [ ] API Key 完整管理（生成、验证、配额、tier）
- [ ] 用户反馈按钮（结果页：此信息正确？是/否）

### 阶段三：管理后台（3-5天）
- [ ] 管理后台布局 + 侧边栏导航
- [ ] 管理员登录 `/admin/login`（JWT Cookie认证 + 失败锁定）
- [ ] Dashboard首页 `/admin`（统计卡片 + 趋势图 + 数据源状态）
- [ ] 数据管理 `/admin/data`（搜索、浏览、新增、编辑、删除、批量导入导出、重新验证）
- [ ] API Key管理 `/admin/apikeys`（创建、查看、启用/禁用、吊销、编辑配额）
- [ ] 数据源监控 `/admin/sources`（在线状态、调用统计、手动测试）
- [ ] 管理后台全局认证守卫

### 阶段四：商业化 + SEO（1周）
- [ ] 联盟链接嵌入结果页（Wise、Payoneer等）
- [ ] 网站 SEO 优化（sitemap.xml、meta标签、结构化数据、OG标签）
- [ ] Vercel Analytics 接入
- [ ] 错误页面（404、500 自定义页面）
- [ ] 响应式适配（移动端优化）
- [ ] 性能优化（图片懒加载、代码分割）
- [ ] robots.txt、安全头验证
- [ ] 最终部署 + 上线检查清单

---

## 四、部署步骤

### 4.1 环境准备
```
1. 购买域名（Namecheap/Cloudflare）
2. 注册 Vercel 账号（GitHub登录）
3. 注册 Cloudflare（DNS管理 + CDN）
4. 注册 Stripe（后期付费API用）
5. 注册各联盟平台（Wise Affiliate等）
```

### 4.2 部署流程
```
1. GitHub 创建仓库 banks-lookup
2. 本地代码推送到 GitHub
3. Vercel 连接 GitHub 仓库
   - 自动检测 Next.js 项目
   - 环境变量配置（有需要时）
4. 首次部署（自动获得 vercel.app 域名）
5. Cloudflare 配置：
   - 添加域名 DNS 记录 → CNAME 指向 Vercel
   - 开启 SSL/TLS（Full）
   - 开启 CDN 缓存
6. Vercel 添加自定义域名
7. 验证 HTTPS 正常
```

### 4.3 CI/CD（自动）
- Vercel 默认：每次 push 到 main 分支自动部署
- 预览部署：PR 自动生成预览地址
- 回滚：Vercel Dashboard 一键回滚

---

## 五、上线后运维

### 5.1 监控
| 监控项 | 工具 | 频率 |
|--------|------|------|
| 网站可用性 | Vercel Analytics / UptimeRobot | 实时 |
| API响应时间 | Vercel Analytics | 实时 |
| 错误率 | Vercel Logs + Sentry(免费层) | 实时 |
| 外部数据源可用性 | 自定义健康检查脚本 | 每日 |
| 本地数据覆盖率 | 统计查询 miss 率 | 每周 |

### 5.2 数据维护（关键）
```
每日：
  - 自动统计 "查询未命中" 的号码，加入待丰富队列

每周：
  - 对所有 confidence < 70 的记录重新调用外部API对比
  - 更新 banks.json，提交到 Git 触发部署

每月：
  - 全量数据质量报告（覆盖率、准确率、API源可用率）
  - 搜索并添加新的公开银行路由号数据集
  - 检查各外部API是否有变更

每季度：
  - 数据源增减决策（新增有价值的API源，停用不可靠的）
  - 数据库版本发布（可为付费用户提供下载）
```

### 5.3 数据丰富自动脚本
```bash
# cron 任务（GitHub Actions 免费每月2000分钟）
*/30 * * * * curl -X POST https://yourdomain.com/api/enrich \
  -H "Authorization: Bearer $ENRICH_SECRET"
```

### 5.4 SEO 策略
- **关键词覆盖**：每个支持的路由号类型一个落地页
  - `/swift-code-lookup/` + 热门国家子页 `/swift-code/hsbc/`
  - `/aba-routing-number-check/`
  - `/sort-code-checker/`
  - `/iban-validator/`
- **结构化数据**：FAQ Schema、HowTo Schema
- **站点地图**：自动生成 sitemap.xml
- **博客**：银行路由号科普文章（长尾SEO）

### 5.5 用户反馈渠道
- 页面底部"报告错误"链接（→ GitHub Issue 或邮箱）
- 结果页"此信息正确吗？"是/否按钮
- 每季度分析反馈，优化数据

### 5.6 成本控制
| 阶段 | 月成本 | 控制措施 |
|------|--------|---------|
| MVP期 | $0 | Vercel免费 + 免费API + Cloudflare免费 |
| 增长期 | $0-20 | Vercel Pro仅当超过免费额度 |
| 商业化期 | $20-100 | 按收入增长调整，ROI>0 |

---

## 六、关键风险与应对

| 风险 | 概率 | 应对 |
|------|------|------|
| 外部API源挂掉/收费 | 中 | 多源冗余，至少3个源；核心数据本地化 |
| Swift code数据版权 | 低 | 从多个源对比提取，不直接复制单一源 |
| 竞争（同类工具很多） | 高 | 差异化：多源对比的可信度评分 + API产品 + 数据质量 |
| Vercel免费层超限 | 低 | 流量达阈值前升级Pro，$20/月完全可接受 |
| 法律合规（金融数据） | 低 | 仅提供路由号信息，不涉及账户/交易数据 |

---

---

## 七、部署方案（傻瓜式一步一图）

### 7.1 为什么选 Vercel + Cloudflare

| 对比项 | Vercel | Netlify | 自建VPS | Cloudflare Pages |
|--------|--------|---------|---------|------------------|
| 免费额度 | 100GB带宽/月 | 100GB/月 | 无 | 无限带宽 |
| Next.js支持 | 原生最佳 | 良好 | 需配置 | 一般 |
| 部署难度 | ⭐ 极简 | ⭐ 极简 | ⭐⭐⭐ | ⭐⭐ |
| 自动HTTPS | ✅ | ✅ | 需配置 | ✅ |
| Edge Functions | ✅ | ✅ | ❌ | ✅(Workers) |
| 全球CDN | ✅ | ✅ | ❌ | ✅ |
| 价格(起步) | $0 | $0 | $5-20/月 | $0 |
| 推荐度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**结论：Vercel（免费层） + Cloudflare（DNS/CDN/WAF）是最优组合，零成本启动。**

### 7.2 免费方案详情

```
总月成本：$0

Vercel (Hobby Plan)：
  ✅ 100GB 带宽/月（约50万次页面浏览）
  ✅ 1000 个 Serverless Function 执行/天
  ✅ 自动 HTTPS + 全球 CDN
  ✅ 环境变量管理
  ✅ 自动 CI/CD（Git连接）
  ✅ 预览部署

Cloudflare (Free Plan)：
  ✅ 无限 DDoS 防护
  ✅ WAF（Web Application Firewall）
  ✅ DNS 管理
  ✅ CDN 缓存
  ✅ SSL/TLS 加密
  ✅ 免费速率限制规则（5条）
  ✅ Bot 管理基础版

何时升级：
  - Vercel 带宽超100GB → 升级 Pro ($20/月)
  - 需要更多团队协作 → Pro
  - API调用量超限 → 考虑其他方案或优化
```

### 7.3 零基础部署步骤（逐行命令）

#### Step 1: 注册账号（10分钟）
```
1. 浏览器打开 github.com → Sign Up → 创建账号
2. 浏览器打开 vercel.com → Sign Up → 选择 "Continue with GitHub"
3. 浏览器打开 cloudflare.com → Sign Up → 输入邮箱密码
4. 浏览器打开 namecheap.com → 搜索想要的域名 → 购买（.com约$10/年）
   - 或用 Freenom 免费域名（不稳定，不推荐）
```

#### Step 2: 推送代码到 GitHub（5分钟）
```bash
# 在项目目录下运行（已经在本机）
git init
git add .
git commit -m "feat: initial bank routing lookup tool"
git branch -M main
gh repo create bank-routing-lookup --public --push --source=.
# 或者手动在 GitHub 创建仓库后：
git remote add origin https://github.com/YOUR_USERNAME/bank-routing-lookup.git
git push -u origin main
```

#### Step 3: 部署到 Vercel（5分钟）
```
1. Vercel Dashboard → Add New → Project
2. 选择导入刚才的 GitHub 仓库
3. Framework 自动识别为 Next.js → 一切默认
4. 点击 Deploy → 等待2分钟
5. 获得 https://xxx.vercel.app 域名 → 访问测试
```

#### Step 4: 绑定自定义域名 + Cloudflare（10分钟）
```
Cloudflare 端：
1. 添加站点 → 输入你的域名 → 选择 Free Plan
2. Cloudflare 会扫描你当前的 DNS 记录
3. 把域名服务器（Nameserver）改成 Cloudflare 提供的两个地址
4. 去 Namecheap（域名注册商）修改 Nameserver
5. 等 DNS 生效（1-48小时，通常5分钟）

添加 DNS 记录：
  Type: CNAME
  Name: @ (或 www)
  Target: cname.vercel-dns.com
  Proxy status: Proxied (橙色云朵开启)

SSL/TLS 设置：
  → SSL/TLS → Overview → 选择 "Full (strict)"

Vercel 端：
1. 项目 Settings → Domains → Add
2. 输入 yourdomain.com
3. Vercel 验证后自动配置 SSL
```

#### Step 5: 环境变量配置（5分钟）
```bash
# Vercel Dashboard → 项目 → Settings → Environment Variables
# 添加以下变量：

ENCRYPTION_KEY=(随机生成: openssl rand -hex 32)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=(用 bcrypt 生成)
JWT_SECRET=(随机生成: openssl rand -hex 32)
ENRICH_SECRET=(随机生成: openssl rand -hex 16)
```

#### Step 6: 验证部署（5分钟）
```bash
# 检查 HTTPS
curl -I https://yourdomain.com

# 检查 API
curl https://yourdomain.com/api/health

# 检查安全头
curl -I https://yourdomain.com | grep -i "strict-transport\|x-frame\|x-content"

# 测试查询
curl "https://yourdomain.com/api/lookup?code=DEUTDEFF"
```

---

## 八、扩展性方案

### 8.1 流量分级扩容路线

```
阶段          月PV       月API调用   方案                  月成本
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
冷启动         <10万      <1万       Vercel Free           $0
增长期         10-100万   1-10万     Vercel Pro            $20
规模化         100-1000万 10-100万   Vercel Pro + 优化     $20-100
大规模         >1000万    >100万     Vercel Enterprise     定制
                                    或 迁移到 VPS/专用服务器
```

### 8.2 性能优化清单（低成本高收益）

#### 前端优化
```ts
// next.config.js 优化
- 静态页面生成：首页用 ISR (Incremental Static Regeneration)
- 结果页用 SSG + 客户端查询
- 图片用 next/image 自动优化
- 启用 gzip/brotli 压缩（Vercel默认）
```

#### API 优化
```ts
// 缓存策略
- 本地DB查询结果内存缓存（Map），TTL=1小时
- API查询结果浏览器缓存：Cache-Control: public, max-age=3600
- 热门银行码预加载到内存（Top 1000 常用 SWIFT code）
- 批量查询接口减少 HTTP 往返
```

#### 数据优化
```ts
// 渐进式数据质量
- 高频查询的号码自动预缓存
- 冷门号码异步补全，不阻塞响应
- 后台定时任务只处理低质量数据
```

### 8.3 如果流量暴增怎么办

```
Day 1: 突然从 1000 QPS → 10000 QPS (10x)
  ├── Vercel自动扩容 Serverless Functions（无需人工介入）
  ├── Cloudflare CDN 自动缓存静态资源
  └── API速率限制保护后端不过载

Day 7: 持续高流量，带宽逼近100GB
  ├── 升级 Vercel Pro ($20/月) → 1TB带宽
  └── 无需改代码，一键升级

长期方案（如果需要独立扩展）：
  ├── 分离静态/动态：Cloudflare Pages (静态) + Vercel (API)
  ├── API独立部署：Railway / Fly.io / AWS Lambda
  ├── 数据库外迁：Upstash Redis (缓存) + PlanetScale (如果需要SQL)
  └── 数据文件过大时：改用 SQLite + Turso 边缘数据库
```

### 8.4 迁移备用方案

如果 Vercel 不够用，迁移路径清晰：

```
方案A: 保持 Vercel，只把数据层外迁
  Vercel (计算) + Upstash Redis (缓存) + S3/Cloudflare R2 (数据文件)
  成本：$20 + $0(Redis免费层) + $0(R2免费10GB) = $20/月

方案B: 全部迁到单台VPS
  Hetzner/HostHatch VPS 4GB RAM, 2 vCPU (~$5/月)
  Nginx + Node.js + PM2
  单机可支撑 100-500 QPS

方案C: 容器化
  Docker 镜像 → Fly.io / Railway / Render
  自动扩容，按量付费
```

---

## 九、营销策略

### 9.1 SEO 优化策略

#### 关键词策略（三级体系）

**头部词（难度高，长期目标）：**
| 关键词 | 月搜索量 | 难度 |
|--------|---------|------|
| swift code lookup | 60,500 | 高 |
| aba routing number | 33,100 | 高 |
| iban checker | 18,100 | 中 |
| sort code finder | 9,900 | 中 |
| bank routing number | 8,100 | 中 |

**中腰部词（核心流量来源）：**
| 关键词 | 月搜索量 | 难度 |
|--------|---------|------|
| hsbc swift code | 14,800 | 中 |
| citibank swift code | 12,100 | 中 |
| bank of america aba number | 6,600 | 低 |
| deutsche bank swift code | 5,400 | 低 |
| chase routing number | 8,100 | 中 |
| wells fargo aba | 6,600 | 低 |
| standard chartered swift code | 3,600 | 低 |
| bnp paribas swift | 2,900 | 低 |

**长尾词（容易排名，积少成多）：**
```
模板：[银行名] [国家] swift code
     [银行名] routing number
     [国家] bank code format
     what is [routing type]
     [routing type] example
```

#### 技术SEO实施清单

```html
<!-- 1. 每个路由号类型独立SEO页面 -->
/swift-code-lookup/          → SWIFT/BIC代码查询
/aba-routing-number/         → ABA美国路由号查询
/sort-code-checker/          → 英国Sort Code查询
/iban-validator/             → IBAN国际账号验证
/bsb-number-lookup/          → 澳大利亚BSB查询
/ifsc-code-finder/           → 印度IFSC代码查询

<!-- 2. 结构化数据 (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "BankCode Lookup",
  "description": "Free global bank routing number lookup tool",
  "applicationCategory": "FinanceApplication",
  "offers": { "@type": "Offer", "price": "0" }
}
</script>

<!-- 3. FAQ Schema 在类型页 -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is a SWIFT code?",
    "acceptedAnswer": { "@type": "Answer", "text": "A SWIFT code..." }
  }]
}
</script>

<!-- 4. Sitemap -->
/sitemap.xml   → 所有页面自动生成

<!-- 5. Meta优化 -->
<meta name="description" content="Free SWIFT/BIC code lookup and validation..." />
<meta property="og:title" content="BankCode Lookup - Free Global Bank Routing Number Checker" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://yourdomain.com/" />
```

#### 页面内SEO规范
```
每个页面：
  - H1: 包含主关键词
  - H2: 包含次关键词
  - URL: 简洁含关键词 (不是 /page?id=123)
  - 首段: 100-150字，包含主关键词
  - 图片: alt 属性含关键词
  - 内链: 每个页面至少3条内链到其他相关页
  - 外链: 引用权威来源（SWIFT官网、各国央行等）
```

### 9.2 内容营销

#### 博客内容规划（前12篇）
```
1. What is a SWIFT Code? A Complete Guide (2026)
2. How to Find Your Bank's Routing Number (All Countries)
3. IBAN vs SWIFT: What's the Difference?
4. Complete List of HSBC SWIFT Codes by Country
5. US ABA Routing Numbers Explained: ACH vs Wire Transfer
6. UK Sort Codes: How They Work and How to Find Yours
7. 跨境汇款必看：SWIFT代码和IBAN号码完全指南
8. 印度IFSC代码查询：完整使用教程
9. International Money Transfer: Everything About Bank Codes
10. Top 50 Most Searched SWIFT Codes in 2026
11. Bank Code Formats Around the World: A Visual Guide
12. How to Validate Any Bank Routing Number Instantly
```

### 9.3 外链建设策略

```
白帽手法（长期可持续）：
1. 提交到工具目录站：
   - Product Hunt 发布
   - Hacker News Show HN
   - AlternativeTo.net
   - SaaSHub / G2 / Capterra (免费工具列表)

2. 行业相关：
   - 金融/银行论坛签名
   - Reddit r/Banking, r/Finance 回答问题时引用
   - Quora 回答 SWIFT/IBAN 相关问题 + 链接
   - Stack Exchange (Money & Personal Finance) 高质量回答

3. 开源项目：
   - GitHub README 展示
   - npm 发布核心校验逻辑为独立包

4. 合作伙伴：
   - 与跨境支付博客交换链接
   - 金融科技初创公司互相推荐
```

### 9.4 社交媒体获客

```
Twitter/X:
  - 每天发布银行路由号小知识
  - 热门银行 SWIFT code 卡片图
  - 回复汇款相关问题

LinkedIn:
  - 金融科技/支付行业相关文章
  - B2B API 产品展示

Reddit:
  - r/Banking, r/expats, r/digitalnomad 回答汇款问题
  - 不要纯广告，要真诚帮助

Dev.to / HackerNoon:
  - "How I Built a Free Bank Code Lookup API" 技术文章
  - 获开发者和潜在 API 客户

GitHub:
  - 开源项目引流
  - Awesome列表收录
```

### 9.5 获取第一批用户（冷启动）

```
第1周：
  - 发布到 Product Hunt（选周二/周三）
  - 在 Reddit r/InternetIsBeautiful 发帖
  - 在 Hacker News Show HN 发帖
  - 在你的社交圈分享

第2-4周：
  - 注册所有免费工具目录站
  - 写 3 篇 SEO 文章并发布
  - 开始活跃在 Reddit/Quora 金融话题

第2-3月：
  - SEO 开始带来自然流量（文章被收录）
  - 筛选转换率高的渠道，加大投入
  - 根据用户反馈迭代产品

第4-6月：
  - 自然流量稳定增长
  - 开始接触 API 潜在客户
  - 评估是否加大内容投入
```

### 9.6 联盟营销集成方案

```
结果页嵌入位置（不打扰用户体验）：

查找 DEUTDEFF 的结果
┌──────────────────────────────────────┐
│  [结果卡片]                           │
│  ...银行信息...                       │
├──────────────────────────────────────┤
│  💡 需要进行跨境汇款到德国？           │  ← 仅有当用户查看跨境银行时显示
│  ┌────────────────┐ ┌──────────────┐  │
│  │ Wise           │ │ Payoneer     │  │
│  │ 实时汇率       │ │ 跨境收款     │  │
│  │ 低手续费       │ │ 多币种账户   │  │
│  │ [开始汇款 →]   │ │ [注册 →]     │  │
│  └────────────────┘ └──────────────┘  │
└──────────────────────────────────────┘

联盟平台注册：
  Wise: https://wise.com/affiliates
  Payoneer: https://www.payoneer.com/affiliate/
  Remitly: https://www.remitly.com/affiliate-program
  OFX: https://www.ofx.com/en-au/partners/affiliate/
```

---

## 十、中国市场策略与商业模式深化

### 10.1 中国市场为什么值得做

中国出海和跨境贸易市场规模巨大：
- 中国跨境电商交易额 2025年超 2.5万亿人民币
- 出海企业数量 60万+
- 涉及跨境收款的企业 100万+
- 每年中国留学生 80万+ 需要跨境汇款

**中文市场是蓝海**：现有的SWIFT查询工具几乎没有中文版，百度上搜"SWIFT代码查询"只有零散信息。

### 10.2 中国市场独特需求

| 场景 | 用户 | 需求 |
|------|------|------|
| 跨境电商收款 | 亚马逊/Shopee卖家 | 需要提供SWIFT code给海外平台收款 |
| 留学汇款 | 留学生家长 | 汇学费需要对方学校/房东的SWIFT/IBAN |
| 外贸付款 | 外贸公司 | 给海外供应商汇款需要对方路由号 |
| 海外投资开户 | 投资者 | 开海外银行账户需要了解路由号 |
| 开发者集成 | 中国FinTech公司 | 做跨境支付产品需要API校验银行号 |

### 10.3 中国市场商业模式

#### 三层变现模型

```
第一层：免费工具（流量入口）
     ↓
第二层：付费API（服务中国企业出海）
     ↓
第三层：数据增值服务（高端B2B）
```

#### 第一层：免费Web流量变现
- 百度SEO引流（中文关键词优化）
- 搜索结果页嵌入：Wise/Payoneer跨境汇款联盟
- 微信服务号/小程序引流

#### 第二层：中国B2B API（核心收入）
- **目标客户**：中国跨境支付公司、外贸SaaS、跨境电商ERP
- **定价（人民币）**：
  | 层级 | 月调用量 | 价格 (¥/月) |
  |------|---------|------------|
  | 免费 | 1000次 | 0 |
  | 入门 | 1万次 | ¥99 |
  | 标准 | 10万次 | ¥699 |
  | 专业 | 50万次 | ¥1999 |
  | 企业 | 定制 | 议价 |
- **支付方式**：支付宝/微信支付 + 对公转账开票

#### 第三层：数据增值服务
- 银行路由号清洗数据库：¥999-4999/年（向企业销售）
- 定制化银行数据报告（按需）

### 10.4 中国市场推广渠道

#### 百度SEO（替代Google SEO）
```
中文关键词矩阵：
  头部：SWIFT代码查询、银行国际代码、跨境汇款银行号
  腰部：中国银行swift code、工商银行swift code、招商银行swift code
  长尾：[银行名] swift code 是什么、[银行名] 国际汇款代码
```

#### 微信生态
- 微信公众号：每日推送跨境金融小知识
- 微信搜一搜：优化公众号文章标题
- 小程序：轻量版查询工具（扫码即用）

#### 知乎内容营销
```
文章矩阵：
1. 跨境收款必看：SWIFT代码和IBAN完全指南
2. 2026最全中国各大银行SWIFT代码汇总
3. 留学生汇款：如何填写正确的银行路由号
4. 亚马逊卖家收款：各站点银行路由号填写教程
5. 外贸人必收藏：全球银行代码查询工具推荐
```

#### 小红书
- 留学生/跨境购物场景笔记
- "留学汇款小技巧"类种草内容
- 工具推荐合集

#### B站/抖音
- 短视频教程："30秒查到你需要的SWIFT代码"
- 图解版银行路由号科普

#### 开发者渠道（API推广）
- CSDN/掘金/博客园发技术文章
- 开源中国（oschina）收录
- 阿里云/腾讯云市场API上架

### 10.5 中国市场合规考虑

| 事项 | 要求 |
|------|------|
| ICP备案 | 如果用国内服务器需ICP备案；用Vercel/Cloudflare则是境外服务 |
| 数据合规 | 银行路由号是公开信息，不涉及个人隐私，合规风险低 |
| 支付宝/微信支付 | 需要企业资质才能接入，初期可用个人收款码过渡 |
| 微信小程序 | 需要企业主体认证（¥300/年） |
| 开票 | B2B客户需要发票，需注册一家公司或个体户 |

**建议**：初期以境外运营为主（免备案），中国营销引流。有稳定B2B收入后再注册国内主体。

### 10.6 中国市场竞争格局

现有竞品分析：
| 竞品 | 中文支持 | 数据质量 | API | 备注 |
|------|---------|---------|-----|------|
| theswiftcodes.com | 无 | 中 | 无 | 英文站 |
| bank.codes | 无 | 高 | 有 | 英文站 |
| swiftcodes.cn | 有 | 低 | 无 | 广告多 |
| wise.com | 有 | 高 | 内部 | 查SWIFT但无独立工具 |
| 百度直接搜 | 碎片 | 低 | 无 | 信息分散在论坛 |

**差异点**：
1. 全中文界面 + 专业数据
2. API 可接入（竞品没有面向中国开发者的API）
3. 多源校验可信度（竞品没有）
4. 支持中国CNAPS行号（竞品很少支持）

### 10.7 收入潜力测算（中国市场）

```
Year 1:
  - API客户: 10-30个（入门/标准级）
  - 月经常性: ¥5,000-20,000
  - 年收入: ¥60,000-240,000

Year 2:
  - API客户: 50-100个
  - 月经常性: ¥30,000-80,000
  - 数据服务: ¥50,000-150,000一次性
  - 年收入: ¥400,000-1,000,000

Year 3:
  - 品牌建立，客户稳定增长
  - 月经常性: ¥80,000-200,000
  - 年收入: ¥1,000,000-2,500,000
```

**总体（全球+中国）**：
```
Year 1:  $0 → $30,000 ARR (靠自然增长)
Year 2:  $50,000 → $150,000 ARR
Year 3:  $150,000 → $500,000 ARR
```

---

## 十一、里程碑时间线

```
Week 1-2:  MVP开发完成 + 部署上线
Week 3-4:  增强阶段（多源对比、数据质量、更多号码类型）
Week 5-6:  前两周数据收集，修复bug
Week 7-8:  商业化阶段（API付费、联盟链接、SEO）
Month 3:   开始API销售，评估数据资产价值
Month 6:   复盘，决定是否加大投入
```

---

## 附录：外部API源调研

| API源 | 覆盖类型 | 是否免费 | 限制 |
|-------|---------|---------|------|
| wise.com/gateway | SWIFT | 是 | 无官方文档，非公开API |
| openiban.com | IBAN | 是 | 无限制 |
| iban.com/api | IBAN | 免费层250次/月 | 需注册 |
| bank.codes | SWIFT | 是 | 速率限制 |
| ifsccode.razorpay.com | IFSC | 是 | 无限制 |
| apca.com.au | BSB | 公开列表 | 需下载处理 |
| theswiftcodes.com | SWIFT | 网页 | 可爬取 |
| github datasets | 混合 | 是 | 开源，质量参差 |
