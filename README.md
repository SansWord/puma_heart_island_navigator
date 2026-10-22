# 沈伯洋 HEART 政策島 導航器

非官方整理。把 [HEART 政策島](https://puma.taipei/heart-island) 的 94 項政見依任期年份排開，每項都附「拜訪政策島」連結（開啟政策島並聚焦到該主題）與政見原文連結。

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
python3 -m http.server 8765
# 開 http://127.0.0.1:8765/
```

## 網址參數

- `?heart=H,E` — 依 HEART 字母篩選
- `?island=transport,sport` — 依主題篩選（id 見 `policies.json` 的 `islands[].id`）
- `?q=公車` — 關鍵字
- `#y2027` … `#y2031`、`#short`、`#mid`、`#long`、`#stage1`–`#stage3`、`#direction`（施政方向） — 跳到該時段

## 年份換算

假設任期自 2026-12-25 起算，任期第 N 年 ≈ 2026 + N 年。對照表在 `assets/app.js` 的 `STAGES`。「短期／中期／長期」與「第一～三階段」依官方原文的期程獨立列出。
