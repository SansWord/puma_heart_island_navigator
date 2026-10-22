# 沈伯洋 HEART 政策島 導覽器

非官方 · 小水滴自主整理。把 [HEART 政策島](https://puma.taipei/heart-island) 的 94 項政見依任期期程排開，每項都附「拜訪政策島」連結（開啟政策島並聚焦到該主題，再從「政策細項」點選該政策）與政見原文連結。

網站：<https://sansword.github.io/puma_heart_island_navigator/>

## 結構

| 路徑 | 用途 |
|---|---|
| `index.html`, `assets/` | 靜態頁面，無建置步驟 |
| `scripts/share_pages.py` | 產生每項政見的分享頁 `p/<id>/` 與預覽圖（見下方「分享連結」）；`p/`、`.cache/` 不進 git |
| `404.html` | 找不到的路徑（例如已下架政見的分享連結）導回首頁 |
| `data/policies.json` | `https://puma.taipei/heart-island-assets/policies.json` 的快照，供本機預覽與部署時的備援 |
| `data/sync.json` | 資料下載時間 |
| `scripts/sync.py` | 手動同步：下載官方資料並列出新增、移除、修改的政見，檢查後再 commit |
| `.github/workflows/pages.yml` | push 到 `main`（或在 Actions 手動執行）時部署 repo 內的 `data/`；部署時不下載官方資料 |

官方 JSON 供 puma.taipei 自身頁面使用（不開放跨站讀取），所以頁面只讀同站的 `data/`。

## 同步官方資料

目前不自動同步：官方資料先在本機檢查，再手動上線。

```sh
python3 scripts/sync.py   # 下載到 data/，列出新增 (+)、移除 (-)、修改 (~) 的政見
git diff data/            # 需要時看完整差異
git commit -am "Sync policies.json" && git push   # push 後部署，分享頁與預覽圖隨之更新
```

下載失敗時 `data/` 保持不變。不想上線就 `git checkout data/` 還原。

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
- `?p=transport-bus` — 捲到該政見並標示（跨兩期的細項每張卡片都會標示）；若同網址的篩選會藏住它，篩選會清空
- `#short`、`#mid`、`#long`、`#stage1`–`#stage3`、`#direction`（施政方向） — 跳到該區段；舊的 `#y2027`–`#y2031`、`#none` 會自動轉到對應區段

## 期程

官方資料用兩種方式描述時程，本站分成兩組呈現：

- **任期期程**：任期年份與官方的「短期／中期／長期」放在同一把尺上。任期第 1–2 年為短期、第 3–4 年為中期、第 5 年起為長期；假設任期自 2026-12-25 起算，任期第 N 年 ≈ 2026 + N 年。跨兩期的細項兩邊都會出現。
- **分階段推動**：「第一～三階段」是各主題內的推動順序，不對應年份，依階段另列，同一階段內依主題排列。

沒有時程代碼的細項列在「施政方向」。對照表在 `assets/app.js` 的 `STAGES`。

## 分享連結

每張卡片的「分享」選單有 Threads、LINE、Facebook、複製連結（手機另有「其他…」開啟系統分享）。分享出去的網址是每項政見自己的頁面：

```
https://sansword.github.io/puma_heart_island_navigator/p/transport-bus/
```

- **為什麼另做頁面**：Threads、LINE、Facebook 產生預覽卡時只讀 HTML 的 `og:` 標籤、不執行 JavaScript，`?p=` 拿到的是同一份 `index.html`，每項政見的預覽會一模一樣。所以每項政見有自己的 `p/<id>/index.html`，帶該政見的標題、說明與預覽圖。
- **導回主頁**：分享頁只用 JavaScript `location.replace("../../?p=<id>")` 導向主頁並標示該卡片。刻意不用 `<meta http-equiv="refresh">`：爬蟲可能會跟著它跳到主頁、讀到通用的預覽；`og:url`、`canonical` 也指向分享頁本身，理由相同。
- **id 從哪來**：官方資料 `islands[].buildings[].id`（例如 `transport-bus`）。官方政策島的 3D 建築也用這些 id 對應，預期不會隨資料更新改變。新增的政見下次部署就有分享頁；已移除的政見連結會 404，由 `404.html` 導回首頁。
- **何時產生**：部署時由 `scripts/share_pages.py --images` 依 repo 內的資料產生 94 個頁面，並用 headless Chrome 畫出每項的 1200×630 預覽圖。畫圖失敗的政見改用 `assets/og.png`。
- **預覽圖快取**：每張圖完全由它的卡片 HTML（政見文字＋版型）決定，所以用該 HTML 的 hash 當檔名存在 `.cache/og/`，部署時以 `actions/cache` 保留。資料沒變的政見直接沿用舊圖，只有新增或改過的政見重畫；改了版型則全部重畫。全部重畫約 2 分鐘，沒變動時幾秒。沒有要畫的圖時，部署也會略過安裝中文字型。`p/`、`.cache/` 都不進 git。
- **本機**：`scripts/serve.sh` 會先產生分享頁（有快取的圖就用，沒有就用 `assets/og.png`）；要畫圖可手動跑 `python3 scripts/share_pages.py --images`。
- **平台快取**：各平台會快取第一次抓到的預覽。改過文字後，舊的分享可能仍顯示舊版；可用 Meta 的 [Sharing Debugger](https://developers.facebook.com/tools/debug/) 重新抓取。

## 到政策島找找 Puma

頁首按鈕與頁尾連到 `https://puma.taipei/heart-island?focus=civil`。官方政策島上有個彩蛋角色 Puma，從 01 市府核心出發、依序走訪 14 座島並在每座島停一下；政策島的 `?focus=` 只接受島的 id，沒有直接聚焦到 Puma 的參數，所以連到他的出發點。
