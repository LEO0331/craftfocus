# CraftFocus 架構深度解析（內部版）

## 1) 系統設計總覽

### 目前產品範圍（V2.3）
- 以單一 Expo 程式碼庫實作跨平台 Focus + 社交手作 App。
- 核心循環：專注計時 -> 取得種子（seeds）-> 兌換官方/玩家作品 -> 佈置房間與收藏牆。
- 社交循環：發布自訂作品、按讚留言、好友互訪。

### 高階架構
- 前端：Expo React Native + TypeScript + Expo Router。
- 執行目標：iOS / Android / Web（GitHub Pages 為 Web 通道）。
- 後端：Supabase（Postgres + Auth + Storage + RLS + RPC）。
- 資料權威來源：Postgres + RPC（交易敏感流程優先走伺服器）。
- 交易敏感操作使用目前的伺服器權威 RPC 契約；客戶端不再以 fallback 直接異動錢包或庫存。
- 啟動體驗：Web static export 會先顯示品牌 loading shell；登入頁也有輕量遊戲流程動畫，避免首屏像是空白或卡住。

### 關鍵邊界（bounded contexts）
1. 身分與個人檔案
- Supabase Auth（Web 用 localStorage，Native 用 SecureStore）。
- profile 含顯示名稱與目前使用動物。

2. 專注經濟系統
- `start_focus_session` 先建立伺服器擁有的 run，`award_seeds_for_session` 再以 session ID 結算該 run。
- 種子由 `user_wallets` 管理，驅動後續兌換與成長。
- 可見性策略嚴格：離開 Focus route、切換瀏覽器分頁或 App 進入背景，都會自動停止並以 `given_up` 結算。

3. 物品與房間佈置
- 官方物品兌換後累加 `user_inventory.quantity`。
- 2.5D 等角房間以 anchor 方式放置（`room_placements`）。
- 自訂收藏品放在 5x5 收藏牆（`custom_gallery_placements`）。

4. 手作清單/社群牆
- `craft_posts` 為 listing/feed 主來源。
- `listing_claims` 記錄領取；實體回饋進 `user_inventory` 或 `custom_collectibles`。

5. 夥伴動物系統
- `animal_catalog` + `user_animals` + `active_animal_id`。
- 以 ASCII 動畫呈現，降低跨平台渲染成本。

6. 登入前導/行銷展示
- 登入頁用 React Native view 與 `Animated` 呈現「專注 -> 種子 -> 房間 -> 好友」流程。
- 不載入影片或大型行銷圖，避免影響首屏速度。

### 部署拓樸
- Web 由 static export 部署到 GitHub Pages `/craftfocus`。
- 後端使用 Supabase（免費層為主）。
- PWA 定位為次要通道（殼層離線，資料操作仍需連線）。

---

## 2) 為什麼選這個做法，不選其他？（含替代方案與取捨）

## D1. 單一 Expo 程式碼庫（RN + Router）
**採用做法**
- iOS/Android/Web 共用一套程式碼。

**為什麼不拆成 web/native 兩套**
- MVP 速度快、維護成本低。
- 商業邏輯可重用（獎勵、claim、i18n、驗證）。

**取捨**
- Web 細緻 UX 需額外做 responsive 微調。

**替代方案**
- Next.js + 原生 App 分離。

**暫不採用原因**
- 人力與維護成本顯著增加，迭代速度下降。

## D2. Supabase 優先（Auth + Postgres + RLS + RPC）
**採用做法**
- 使用託管 Postgres 與內建身分/儲存/權限。

**為什麼不自建 Node 後端**
- 成本低、上線快、維運面積小。
- RLS 能就近控管資料權限。

**取捨**
- 需嚴格管理 migration 與 RPC 簽名一致性。

**替代方案**
- Express/Nest + ORM。

**暫不採用原因**
- 基礎設施與安全責任變大，不利 MVP。

## D3. 交易敏感流程走 RPC
**採用做法**
- 種子扣點與發放以 RPC 為主。

**為什麼不全在前端多步驟寫入**
- 原子性更好，減少競態與部分成功問題。

**取捨**
- 若 migration 漂移，可能出現 PostgREST 400。

**替代方案**
- 前端自行串接交易步驟。

**暫不採用原因**
- 回滾成本與失敗窗更大。

## D4. 伺服器權威的兌換與獎勵流程
**採用做法**
- 官方兌換、作品兌換、房間擺放與專注獎勵都使用具版本管理、由伺服器權威執行的 RPC。

**為什麼不使用 client fallback**
- 避免請求失敗時由客戶端造成錢包或庫存的部分異動。
- 權限、冪等與併發控制都能維持在資料庫交易內。

**取捨**
- 客戶端與已部署 schema 必須協調發布。
- RPC 失敗時需清楚回饋，並在後端恢復後重試。

**替代方案**
- 由客戶端串接的 fallback 寫入。

**暫不採用原因**
- 會削弱伺服器權威邊界，並可能產生不一致的經濟資料。

## D5. 以 `user_wallets` 作為種子餘額權威
**採用做法**
- 單表維護當前餘額。

**為什麼不即時計算 focus session 總和**
- 讀取快（O(1)），也能支援非專注來源的加減點。

**取捨**
- 一致性要靠 upsert、唯一鍵、交易保護。

**替代方案**
- 事件帳本即時計算。

**暫不採用原因**
- MVP 複雜度過高。

## D6. 房間採 anchor 吸附，不做自由拖曳
**採用做法**
- 物件放在 2.5D 等角場景中的預定 anchor。

**為什麼不做 free XY 拖放**
- 跨平台穩定、規則可控、存取模型簡單。
- 可以持續調整房間美術構圖，而不需要引入完整 canvas/物理編輯器。

**取捨**
- 自由度較低。

**替代方案**
- 任意座標 + 碰撞引擎。

**暫不採用原因**
- 幾何/碰撞/手勢成本高。

## D7. 自訂收藏品獨立 5x5 收藏牆
**採用做法**
- 自訂品與房間家具分系統呈現。

**為什麼不全部混入房間 anchor**
- 避免破壞原房間邏輯，並保留 UGC 展示區。

**取捨**
- 維護兩套放置邏輯。

**替代方案**
- 所有物件同一套放置規則。

**暫不採用原因**
- 任意上傳圖要做尺寸/腳印標準化，複雜度高。

## D8. 夥伴動物採 ASCII 動畫
**採用做法**
- Header/Focus 以 ASCII loop 呈現。

**為什麼不全用精細像素動畫**
- 成本低、載入輕、跨平台穩定。

**取捨**
- 視覺精緻度較低。

**替代方案**
- 大量 sprite sheet / Lottie / 影片。

**暫不採用原因**
- 資產重量與動畫管線成本過高。

## D9. Legacy 採安全棄用（safe deprecate）
**採用做法**
- 保留舊表，改由 App 走 V2 canonical model。

**為什麼不直接刪舊表**
- 降低上線風險，保留回滾空間。

**取捨**
- Schema 會暫時較肥。

**替代方案**
- 一次性清空舊結構。

**暫不採用原因**
- 生產風險過高。

## D10. PWA 定位為次要通道
**採用做法**
- 僅做 shell 離線快取，不做離線資料同步。

**為什麼不做 offline-first**
- 先拿到安裝性，避免資料衝突與同步複雜度。

**取捨**
- 核心社交/經濟操作仍需網路。

**替代方案**
- 離線佇列 + 重播同步。

**暫不採用原因**
- 錢包與 claim 一致性風險高。

## D11. 登入頁採輕量行銷動畫
**採用做法**
- 登入頁用 React Native view/text 動畫展示 focus -> seeds -> room -> friends。

**為什麼不用影片、Lottie 或大型 sprite sheet**
- GitHub Pages 首次載入更輕。
- 直接沿用 RN primitives，Web/Native 行為一致。
- 不增加資產 hosting 或動畫套件依賴。

**取捨**
- 視覺不像影片那麼華麗。
- 動態語言刻意保持簡單。

**替代方案**
- MP4/WebM hero video 或 Lottie 動畫。

**暫不採用原因**
- 首屏 bytes 增加、跨平台處理變複雜，也可能拖慢未登入入口。

## D12. 啟動時顯示品牌 loading shell
**採用做法**
- 字型/Auth 啟動期間顯示 CraftFocus 品牌 loading shell。

**為什麼不回傳 `null` 或只有 spinner**
- 避免 GitHub Pages 首次載入看起來壞掉或空白。
- Supabase/session 啟動期間仍保有穩定品牌識別。

**取捨**
- 後端很慢時資料仍會延遲，但畫面不再像是無內容。

**替代方案**
- 無限等待 auth session 完成後才渲染 route。

**暫不採用原因**
- 感知效能差，且網路/auth 慢時失敗狀態不清楚。

---

## 3) V2 Canonical Model（面試可直接講）

### 主要資料表
- 身分：`profiles`, `user_animals`, `animal_catalog`
- 經濟：`user_wallets`, `focus_sessions`
- 擁有權：`user_inventory`, `listing_claims`, `custom_collectibles`
- 佈置：`rooms`, `room_placements`, `custom_gallery_placements`
- 社交：`craft_posts`, `likes`, `comments`, `friendships`

### 核心不變條件（invariants）
- 扣種子與給獎勵不可分離。
- 官方物品 claim 必須增加庫存數量。
- 自訂物品 claim 必須寫入 `custom_collectibles`。
- 同一使用者對同一 listing 僅能 claim 一次。
- 收藏牆要同時滿足「同格唯一」與「同物唯一位置」。

### 安全策略
- RLS 管理 user-owned 資料。
- security-definer RPC 管理關鍵狀態轉移。
- Storage policy 以擁有者前綴限制。

---

## 4) 履歷/面試深挖題庫（中文）

### A. 架構敘事
1. 「請 2 分鐘講完 CraftFocus 架構。」
- 建議答法：單碼跨平台 + Supabase + 種子經濟交易 + 等角房間 + 社群 feed。

2. 「為什麼選 Expo？」
- 建議答法：快速迭代、共享邏輯、MVP 成本最低。

3. 「為什麼 Supabase 適合早期產品？」
- 建議答法：Auth/RLS/DB/Storage 一體、維運成本低。

### B. 一致性與資料正確性
4. 「如何確保 claim 不會重複扣點或白拿？」
- 建議答法：由伺服器權威 RPC 完成交易；約束條件提供冪等性，成功後客戶端重新讀取狀態。

5. 「如何防止重複 claim？」
- 建議答法：`(user_id, listing_id)` 唯一鍵 + 前後端雙層檢查。

6. 「wallet 衝突怎麼處理？」
- 建議答法：server update + conflict-aware create（處理 23505/409）。

### C. 安全
7. 「RLS 在這個系統實際保護了什麼？」
- 建議答法：個人資料寫權限、claim 可見性、owner-only 操作。

8. 「為何不讓 client fallback 直接寫入經濟資料？」
- 建議答法：避免部分成功和授權繞過；客戶端顯示錯誤，僅重試伺服器權威 RPC。

9. 「為什麼前端只能用 anon key？」
- 建議答法：service role 不能下放，避免高權限洩漏。

### D. UX 與遊戲化
10. 「為什麼離開畫面就 auto-stop？」
- 建議答法：符合 focus 產品承諾，並降低作弊空間。

11. 「為什麼房間和收藏牆分開？」
- 建議答法：穩定家具系統，同時支援 UGC 展示。

12. 「為什麼用 ASCII 夥伴而非高畫質動畫？」
- 建議答法：低成本、跨平台穩定、回饋清楚。

### E. 擴展與演進
13. 「未來要加 marketplace/payment 怎麼演進？」
- 建議答法：在 listing/claim 旁新增訂單與付款驗證，不破壞既有流程。

14. 「未來如何換到 R2/S3？」
- 建議答法：沿用 `storage.ts` 抽象層，替換 adapter。

15. 「如何避免 schema 漂移破壞 RPC？」
- 建議答法：先部署增量 migration，再發布客戶端；需要時保留版本化 RPC，並以已設定後端驗證已部署版本。

### F. 交付與可靠度
16. 「如何避免 migration 漂移造成 claim 壞掉？」
- 建議答法：版本化 RPC（如 `_v2`）、遷移流程、CI smoke 測試。

17. 「多次改版下如何控風險？」
- 建議答法：safe deprecate、增量 migration、e2e 回歸。

### G. 履歷級 trade-off
18. 「最大架構取捨是什麼？」
- 建議答法：跨平台交付速度與經濟／社交異動保持完全伺服器權威之間的取捨。

19. 「你刻意沒做什麼？」
- 建議答法：即時聊天、金流、重 AI 生成、多人即時互動，因成本與 MVP 專注。

20. 「再給你一個月先補什麼？」
- 建議答法：補上已部署後端的契約測試，並改善 RPC 失敗的可觀測性。

---

## 5) 履歷敘事模板（可直接背）

1. 問題
- 需要低成本、跨平台、可社交互動的 Focus MVP。

2. 限制
- 免費層後端、避免昂貴 AI、快速交付。

3. 架構選擇
- Expo 單碼 + Supabase RLS/RPC + 增量 migration。

4. 關鍵難題
- 透過增量 migration、伺服器權威 RPC 與資料庫約束維持兌換穩定性。

5. 產出結果
- 打通 focus -> seeds -> claim -> room/gallery -> 社交 feed 全流程。

6. 下一步
- 在不削弱伺服器權威的前提下，加強已部署契約測試與可觀測性。

---

## 6) 「為什麼選這個方法」速答表

| 主題 | 採用方法 | 核心原因 | 替代方案 | 接受的取捨 |
|---|---|---|---|---|
| 跨平台 | Expo RN + Router | 單碼高速迭代 | Web/Native 分拆 | Web 客製深度較受限 |
| 後端 | Supabase | 低維運 + RLS | 自建 API | SQL/RPC 契約管理成本 |
| Claim | 伺服器權威 RPC | 原子化權限與狀態異動 | client fallback 寫入 | 需協調 migration 與客戶端發布 |
| 房間 | Anchor 吸附 | 可預測、穩定 | 自由拖曳 | 自由度較低 |
| 夥伴 | ASCII loop | 輕量、跨平台 | 重動畫資產 | 視覺精緻度較低 |
| 遷移策略 | Safe deprecate | 低風險上線 | 破壞式清理 | legacy footprint 暫留 |
| 離線策略 | PWA shell-only | 低風險可安裝 | offline sync | 核心操作需網路 |


---

## 7) 資料結構選型（原因 + 替代方案 + 取捨）

| 區域 | 採用資料結構 | 採用原因 | 替代方案 | 取捨 |
|---|---|---|---|---|
| 錢包餘額 | `user_wallets` 以 `user_id` 為主鍵 | 餘額讀取 O(1)，更新路徑單純 | 事件帳本即時計算、物化檢視 | 需嚴格控制並發寫入一致性 |
| 官方庫存 | `user_inventory(user_id, item_id) -> quantity`（複合主鍵） | 數量模型精簡，增減直觀 | 每件物品一列（instance-based） | 單件物品的細粒度 metadata 較難掛載 |
| 房間擺放 | `room_placements(room_id, anchor_id)` 唯一 + `item_id` | 渲染可預測，碰撞規則簡單 | 自由 XY 座標 + 碰撞引擎 | 擺放自由度較低 |
| 收藏牆擺放 | `custom_gallery_placements(user_id, listing_id)` + `(user_id, cell_x, cell_y)` 唯一 | 保證「同收藏單一位置」與「同格單一物件」 | 每位使用者用 JSON blob 存整個版面 | JSON 驗證/查詢較弱、約束較難做 |
| 領取去重 | `listing_claims` 唯一 `(user_id, listing_id)` | DB 層保證冪等 | 只靠前端判斷是否已領取 | 更依賴 migration 與唯一索引穩定 |
| 動態作者查表 | 批次抓取後以 `Map<userId, profile>` 合併 | 避免每張卡片做重複查找 | 每張卡片 N+1 查詢 | 前端合併邏輯稍增 |
| 房間錨點資料 | `roomLayout.ts` 常數陣列（typed anchor object） | 前端快速、穩定且易維護不同房型 | 錨點改成 DB 動態配置 | 版面調整需發版 |
| ASCII 夥伴動畫 | 常數字典 `species -> activity -> [frames]` | 載入輕、跨平台一致 | sprite sheet / 影片 / lottie | 視覺精緻度較低 |
