# 沈伯洋 HEART 政策島 導航器

非官方整理。把 [HEART 政策島](https://puma.taipei/heart-island) 的 94 項政見依任期期程排開，每項都附「拜訪政策島」連結（開啟政策島並聚焦到該主題，再從「政策細項」點選該政策）與政見原文連結。

網站：<https://sansword.github.io/puma_heart_island_navigator/>

## 結構

| 路徑 | 用途 |
|---|---|
| `index.html`, `assets/` | 靜態頁面，無建置步驟 |
| `data/policies.json` | `https://puma.taipei/heart-island-assets/policies.json` 的快照，供本機預覽與部署時的備援 |
| `data/sync.json` | 資料下載時間 |
| `.github/workflows/pages.yml` | push 到 `main` 時與每日 04:17（台北時間）部署：先下載最新官方資料，失敗則沿用 repo 內的快照 |

官方 JSON 供 puma.taipei 自身頁面使用（不開放跨站讀取），所以在部署時下載，頁面只讀同站的 `data/`。

## 本機預覽

```sh
scripts/serve.sh          # 啟動 http://127.0.0.1:8765/ 並開啟瀏覽器，Ctrl-C 停止
scripts/serve.sh 9000     # 改用其他 port
```

頁面用 `fetch` 讀取 `data/`，直接用瀏覽器開 `index.html`（`file://`）無法載入資料，需透過本機伺服器。

## 網址參數

- `?heart=H,E` — 依 HEART 政策願景篩選
- `?island=transport,sport` — 依政策主題篩選（id 見 `policies.json` 的 `islands[].id`）
- `?q=公車` — 關鍵字
- `#short`、`#mid`、`#long`、`#stage1`–`#stage3`、`#direction`（施政方向） — 跳到該區段；舊的 `#y2027`–`#y2031`、`#none` 會自動轉到對應區段

## 期程

官方資料用兩種方式描述時程，本站分成兩組呈現：

- **任期期程**：任期年份與官方的「短期／中期／長期」放在同一把尺上。任期第 1–2 年為短期、第 3–4 年為中期、第 5 年起為長期；假設任期自 2026-12-25 起算，任期第 N 年 ≈ 2026 + N 年。跨兩期的細項兩邊都會出現。
- **分階段推動**：「第一～三階段」是各主題內的推動順序，不對應年份，依階段另列，同一階段內依主題排列。

沒有時程代碼的細項列在「施政方向」。對照表在 `assets/app.js` 的 `STAGES`。
