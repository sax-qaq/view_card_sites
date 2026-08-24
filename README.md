# 2026 日本国庆旅行规划

这个项目用于完成 2026 年国庆日本旅行的目的地研究、朋友投票、同路段比较和最终行程决策。

项目使用 React 19、TypeScript、Vinext/Vite 和 Node.js。生产环境通过阿里云 ACR 构建 Docker 镜像，再部署到阿里云 ECS。

## 核心原则

整个规划严格分成三个有先后顺序的数据阶段：

```text
阶段一：逐个完成 Destination
        ↓ 同路段全部目的地资料齐备
阶段二：统一完成 SegmentAnalysis
        ↓ 朋友完成投票
阶段三：完成 SegmentDecision
```

- `Destination` 只描述目的地本身，可以逐个研究和更新。
- `SegmentAnalysis` 必须同时读取同路段全部 `Destination` 和旅行主表后生成。
- `SegmentDecision` 必须同时读取已完成的 `SegmentAnalysis` 和朋友投票汇总后生成。
- 第一轮卡片和第二轮详情只是代码派生结果，不是允许 AI 填写的数据格式。
- 不确定的数据必须使用格式允许的 `null` 或明确说明缺口，不得猜测。

## 文件说明

### 阶段一：目的地研究

- `destination-research-template.jsonc`：带逐字段中文注释，复制给 AI 阅读和填写。
- `destination-research-template.json`：不带注释的严格 JSON 空白模板。
- `destination.schema.json`：用于校验 AI 返回的 Destination。

### 阶段二：路段统一分析

- `segment-analysis-template.jsonc`：带中文注释的路段分析模板。
- `segment-analysis-template.json`：严格 JSON 模板。
- `segment-analysis.schema.json`：用于校验 SegmentAnalysis。

### 阶段三：最终决策

- `segment-decision-template.jsonc`：带中文注释的最终决策模板。
- `segment-decision-template.json`：严格 JSON 模板。
- `segment-decision.schema.json`：用于校验 SegmentDecision。

### 项目数据和渲染

- `destinations.json`：当前数据集合，包含 `destinations`、`segmentAnalyses` 和 `segmentDecisions`。
- `lib/destinations.ts`：数据类型以及第一轮、第二轮页面派生方法。

## 完整工作流

下面的三个提示词可以直接复制到支持联网搜索的网页对话中。把 `{{...}}` 占位内容替换成真实信息，并在指定位置粘贴对应 JSONC 模板或数据。

---

## 阶段一：研究一个目的地

每次只研究一个目的地。这个阶段不做同路段比较、不计算行程取舍、不参考朋友投票。

### 需要准备

- 目的地名称。
- 目标季节窗口，目前为 9 月 30 日至 10 月 7 日。
- `destination-research-template.jsonc` 的完整内容。

### 可复制提示词

```text
你是一名严谨的日本旅行研究员。请联网搜索并研究下面这个目的地，为“2026 年国庆日本旅行规划”填写一份完整 Destination JSON。

【目的地】
{{填写中文、日文或英文名称}}

【目标季节窗口】
9 月 30 日至 10 月 7 日。季节、气温、景观和穿衣结论必须针对这个窗口，不能拿十月中下旬、樱花季或其他季节的宣传内容代替。

【研究要求】
1. 优先使用景区官网、政府旅游机构、官方交通运营方等一手来源。
2. 动态交通、运营季、预约和营业信息必须注明核验边界，不能把往年信息直接当作 2026 年事实。
3. topExperiences 必须正好填写三项。
4. 所有 1～5 评分都要基于字段定义填写，不要把占位值 1 当成默认结论。
5. typicalRoute.distanceKm 只填写数值，不要把“约”或“km”写进 min/max。
6. sources[].supports 必须明确说明每个来源支持哪些字段或结论。
7. 无法可靠确认的信息要在 research.note 中说明，禁止编造。
8. 这一阶段只研究目的地本身：不要填写所属路段、不要和其他候选比较、不要给出保留或淘汰结论。
9. 必须填写完整 Destination，不得输出第一轮卡片或第二轮详情等精简格式。
10. 最终只输出一个可以直接解析的严格 JSON。不要输出 Markdown 代码围栏，不要保留 // 注释，不要在 JSON 前后添加解释。

【完整字段模板与中文注释】
{{粘贴 destination-research-template.jsonc 的完整内容}}
```

### 返回后交给 Codex

```text
这是目的地 {{目的地名称}} 的完整 Destination JSON，属于旅行 japan-national-day-2026 的路段 {{segmentId / segmentLabel}}。请先按 destination.schema.json 校验，再按 destination.id 写入项目。这个阶段不要生成 SegmentAnalysis 或 SegmentDecision。

{{粘贴 AI 返回的严格 JSON}}
```

对同一路段中的每个候选重复阶段一，直到全部 `Destination` 都已录入。

---

## 阶段二：统一分析一个路段

只有同时满足以下条件才能开始：

- `candidateDestinationIds` 中每个 ID 都有完整并通过校验的 `Destination`。
- 已提供这一段的日期、前一晚住宿、后一晚住宿、已购买交通、必须经过的节点和行李约束。
- 如果新增候选或修改了关键目的地数据，之前的分析必须作废并重新生成。

### 需要准备

- 路段信息和旅行主表上下文。
- 同路段全部 Destination 组成的 JSON 数组。
- `segment-analysis-template.jsonc` 的完整内容。

### 可复制提示词

```text
你是一名负责最终日本旅行规划的行程分析师。现在同一路段的目的地资料已经准备完成，请结合完整旅行上下文，对全部候选进行一次统一、对称、可复核的 SegmentAnalysis。

【旅行与路段】
tripId: japan-national-day-2026
segmentId: {{填写路段 ID}}
segmentLabel: {{填写路段名称，例如“名古屋 → 立山黑部”}}

【旅行主表上下文】
日期：{{填写}}
前一晚住宿：{{填写}}
后一晚住宿：{{填写}}
已购买或已确定交通：{{填写}}
必须经过的节点：{{填写}}
行李约束：{{填写}}
其他不可变约束：{{填写}}

【同路段全部候选的完整 Destination 数组】
{{粘贴同路段所有完整 Destination，不能只粘贴卡片精简数据}}

【分析要求】
1. 先检查每个 candidateDestinationId 是否都有完整 Destination；如果有缺失，停止分析，只报告缺失 ID，不得输出 status=ready。
2. 先检查旅行主表上下文是否足以计算交通、换宿和行李；信息不足时停止正式分析，不得猜测时间或费用。
3. 对每个候选分别填写 destinationEvaluations，包括交通代价、换宿、行李、时间匹配度和路线效率。
4. 对同路段候选做两两比较。每一对只生成一条 comparisons 记录，不能从 A 对 B、B 对 A 重复保存。
5. 比较必须同时写共同点、核心差异，以及两个候选各自的相对优势和劣势。
6. 这个阶段只做客观路段分析，不读取朋友投票，不给出 keep、hold、drop 或最终等级。
7. status=ready 时，destinationProfilesComplete 和 tripContextComplete 必须都为 true，missingDestinationIds 必须为空，analyzedAt 必须填写实际日期。
8. 最终只输出一个可以直接解析的严格 JSON。不要输出 Markdown 代码围栏，不要保留 // 注释，不要在 JSON 前后添加解释。

【完整字段模板与中文注释】
{{粘贴 segment-analysis-template.jsonc 的完整内容}}
```

### 返回后交给 Codex

```text
这是路段 {{segmentId / segmentLabel}} 的完整 SegmentAnalysis。请先按 segment-analysis.schema.json 校验，再确认 candidateDestinationIds 和现有目的地数据一致，最后写入项目并替换同 tripId + segmentId 的旧分析。写入后，该路段已有的 SegmentDecision 必须标记为 stale 或删除后重做。

{{粘贴 AI 返回的严格 JSON}}
```

---

## 阶段三：根据分析和投票作最终决定

只有同时满足以下条件才能开始：

- 对应 `SegmentAnalysis.status` 为 `ready`。
- 朋友投票已经结束，投票汇总固定。
- 投票中的每个目的地都属于该 SegmentAnalysis 的候选集合。

### 需要准备

- 已完成的完整 SegmentAnalysis。
- 从 SQLite 导出的朋友投票汇总。
- `segment-decision-template.jsonc` 的完整内容。

### 可复制提示词

```text
你是一名负责收敛 2026 年国庆日本旅行方案的决策分析师。请结合已经完成的客观路段分析和朋友投票，生成最终 SegmentDecision。

【已完成的 SegmentAnalysis】
{{粘贴 status=ready 的完整 SegmentAnalysis}}

【朋友投票汇总】
{{粘贴从 SQLite 导出的投票汇总，包含参与人数、每个目的地四档票数和平均分}}

【决策要求】
1. segmentAnalysisAnalyzedAt 必须与输入 SegmentAnalysis.analyzedAt 完全一致，用于防止引用过期分析。
2. voteSummary 必须忠实复制并核对投票数据，不能修改票数来配合结论。
3. 最终结论必须同时考虑路线可行性、交通与换宿代价、体验重叠、季节价值和朋友偏好。
4. 投票不能覆盖硬性可行性约束；即使票数高，如果交通或日期不可行，也必须在 reasons 中明确说明。
5. 每个候选都必须得到 grade、recommendation、summary 和 reasons。
6. recommendation 只能是 keep、hold、drop；grade 只能是 A、B、C、D。
7. status 必须为 decided，decidedAt 填写实际决策日期。
8. 最终只输出一个可以直接解析的严格 JSON。不要输出 Markdown 代码围栏，不要保留 // 注释，不要在 JSON 前后添加解释。

【完整字段模板与中文注释】
{{粘贴 segment-decision-template.jsonc 的完整内容}}
```

### 返回后交给 Codex

```text
这是路段 {{segmentId}} 的完整 SegmentDecision。请按 segment-decision.schema.json 校验，确认 segmentAnalysisAnalyzedAt 与当前 SegmentAnalysis.analyzedAt 一致，并核对 voteSummary 后写入项目。

{{粘贴 AI 返回的严格 JSON}}
```

---

## 数据失效规则

- 修改目的地事实后：包含该目的地的 `SegmentAnalysis` 变为 `stale`，对应 `SegmentDecision` 同时失效。
- 同路段新增或移除候选后：该路段必须重新运行阶段二和阶段三。
- 修改旅行主表、住宿或交通约束后：受影响路段的分析和决策都必须重做。
- 路段分析变化后：旧决策不得继续使用，必须重新读取投票生成阶段三。
- 投票发生变化后：`SegmentAnalysis` 仍有效，但 `SegmentDecision` 必须重新生成。

## 页面数据派生

外部没有第一轮或第二轮 JSON：

- `simplifyDestinationForRoundOne(destination)` 从完整 Destination 提取名称、核心体验、季节摘要、时间和体力，用于朋友独立投票。
- `simplifyDestinationForRoundTwo(destination)` 提取完整目的地详情，并连接当前 SegmentAnalysis 和可用的 SegmentDecision。
- 路段比较尚未完成时，页面明确显示“等待全部候选目的地资料齐备后统一生成”。
- 最终规划结论只有在 SegmentDecision 存在时才展示。

## SQLite 接入后的数据关系

- `destinations`：目的地事实，以 `destination.id` 唯一。
- `segments`：旅行路段，以 `tripId + segmentId` 唯一。
- `segment_analyses`：同路段统一分析结果。
- `segment_destination_evaluations`：每个目的地在路段中的交通和匹配度。
- `destination_comparisons`：同路段候选两两比较。
- `participants` 和 `votes`：朋友昵称与评级。
- `segment_decisions`：投票结束后的最终决策。

## 本地开发

要求 Node.js `>=22.13.0`，本机 Node.js 24 可以直接使用。

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## ECS 部署

生产镜像由阿里云 ACR 海外构建生成，ECS 只拉取成品镜像：

```bash
docker compose pull
docker compose up -d
```

当前生产地址：`http://121.41.79.141`
