# CraftFocus 架構深度解析（內部版）

## 1) 系統設計總覽

### 目前產品範圍（V2.x）
- 以單一 Expo 程式碼庫實作跨平台 Focus + 社交手作 App。
- 核心循環：專注計時 -> 取得種子（seeds）-> 兌換官方/玩家作品 -> 佈置房間與收藏牆。
- 社交循環：發布自訂作品、按讚留言、好友互訪。

### 高階架構
- 前端：Expo React Native + TypeScript + Expo Router。
- 執行目標：iOS / Android / Web（GitHub Pages 為 Web 通道）。
- 後端：Supabase（Postgres + Auth + Storage + RLS + RPC）。
- 資料權威來源：Postgres + RPC（交易敏感流程優先走伺服器）。
- 客戶端備援：在部分 claim 流程加上 client-first fallback，降低 migration 不一致造成的中斷。

### 關鍵邊界（bounded contexts）
1. 身分與個人檔案
- Supabase Auth（Web 用 localStorage，Native 用 SecureStore）。
- profile 含顯示名稱與目前使用動物。

2. 專注經濟系統
- 專注結算透過 `award_seeds_for_session` RPC。
- 種子由 `user_wallets` 管理，驅動後續兌換與成長。

3. 物品與房間佈置
- 官方物品兌換後累加 `user_inventory.quantity`。
- 等角房間以 anchor 方式放置（`room_placements`）。
- 自訂收藏品放在 5x5 收藏牆（`custom_gallery_placements`）。

4. 手作清單/社群牆
- `craft_posts` 為 listing/feed 主來源。
- `listing_claims` 記錄領取；實體回饋進 `user_inventory` 或 `custom_collectibles`。

5. 夥伴動物系統
- `animal_catalog` + `user_animals` + `active_animal_id`。
- 以 ASCII 動畫呈現，降低跨平台渲染成本。

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

## D4. Claim 流程保留 client fallback
**採用做法**
- `claimOfficialInventoryItem`、`claimListingWithSeeds` 具備 fallback 與多簽名嘗試。

**為什麼不堅持 RPC-only**
- 後端函式版本不一致時，仍可保住主要 UX。

**取捨**
- 邏輯重複，且需補足回滾處理。

**替代方案**
- RPC 失敗就直接中止。

**暫不採用原因**
- 會直接阻斷核心遊戲循環。

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
- 物件放在預定 anchor。

**為什麼不做 free XY 拖放**
- 跨平台穩定、規則可控、存取模型簡單。

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
- 建議答法：RPC 交易為主，fallback 有回滾邏輯，外加唯一鍵。

5. 「如何防止重複 claim？」
- 建議答法：`(user_id, listing_id)` 唯一鍵 + 前後端雙層檢查。

6. 「wallet 衝突怎麼處理？」
- 建議答法：server update + conflict-aware create（處理 23505/409）。

### C. 安全
7. 「RLS 在這個系統實際保護了什麼？」
- 建議答法：個人資料寫權限、claim 可見性、owner-only 操作。

8. 「client fallback 的安全風險？」
- 建議答法：部分成功風險，透過回滾與最終回歸 server-path 降低。

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

15. 「何時可以移除 fallback？」
- 建議答法：當 migration 版本一致、RPC 契約穩定並完成灰度驗證後。

### F. 交付與可靠度
16. 「如何避免 migration 漂移造成 claim 壞掉？」
- 建議答法：版本化 RPC（如 `_v2`）、遷移流程、CI smoke 測試。

17. 「多次改版下如何控風險？」
- 建議答法：safe deprecate、增量 migration、e2e 回歸。

### G. 履歷級 trade-off
18. 「最大架構取捨是什麼？」
- 建議答法：可用性/韌性（fallback）vs 純粹單一路徑（strict RPC-only）。

19. 「你刻意沒做什麼？」
- 建議答法：即時聊天、金流、重 AI 生成、多人即時互動，因成本與 MVP 專注。

20. 「再給你一個月先補什麼？」
- 建議答法：收斂 fallback、加強觀測性、把 schema/RPC 契約檢查前移到 CI。

---

## 5) 履歷敘事模板（可直接背）

1. 問題
- 需要低成本、跨平台、可社交互動的 Focus MVP。

2. 限制
- 免費層後端、避免昂貴 AI、快速交付。

3. 架構選擇
- Expo 單碼 + Supabase RLS/RPC + 增量 migration。

4. 關鍵難題
- migration 漂移下 claim 穩定性，靠 fallback + rollback 維持可用。

5. 產出結果
- 打通 focus -> seeds -> claim -> room/gallery -> 社交 feed 全流程。

6. 下一步
- 回到更嚴格 server-authoritative path，並強化契約測試。

---

## 6) 「為什麼選這個方法」速答表

| 主題 | 採用方法 | 核心原因 | 替代方案 | 接受的取捨 |
|---|---|---|---|---|
| 跨平台 | Expo RN + Router | 單碼高速迭代 | Web/Native 分拆 | Web 客製深度較受限 |
| 後端 | Supabase | 低維運 + RLS | 自建 API | SQL/RPC 契約管理成本 |
| Claim | RPC + fallback | migration 漂移下仍可用 | RPC-only | 暫時存在重複邏輯 |
| 房間 | Anchor 吸附 | 可預測、穩定 | 自由拖曳 | 自由度較低 |
| 夥伴 | ASCII loop | 輕量、跨平台 | 重動畫資產 | 視覺精緻度較低 |
| 遷移策略 | Safe deprecate | 低風險上線 | 破壞式清理 | legacy footprint 暫留 |
| 離線策略 | PWA shell-only | 低風險可安裝 | offline sync | 核心操作需網路 |

