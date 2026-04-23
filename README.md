# 胖瘦藍本 · 解答卷閱讀器

> 小六資優集訓 · 第二階段
> **典陸教育 Danlu Education**

一套完全靜態（純 HTML/CSS/JS、無 build step）的線上解答卷閱讀器。涵蓋：

- **胖藍本** — 回家作業 1～80 回（分為三冊）
- **瘦藍本** — 上課講義 26 回（七大主題）

所有解答卷經 PDF → JPEG 拆頁，於瀏覽器中以「書 → 冊／主題 → 回」三層目錄瀏覽，支援解答全文搜尋，可直接部署於 GitHub Pages。

---

## 專案結構

```
panglanpen-web/
├── index.html                 # 入口頁
├── assets/
│   ├── css/style.css          # 樣式（和紙／墨／藍靛／金褐）
│   └── pages/
│       ├── answer/            # 胖藍本解答圖  r01-1.jpg … r80-N.jpg
│       └── slim-answer/       # 瘦藍本解答圖  s01-1.jpg … s26-N.jpg
├── data/
│   ├── manifest.json          # 書 / 冊 / 主題 / 回次 metadata
│   ├── manifest.js            # window.MANIFEST shim（file:// 可用）
│   ├── index.json             # 全文檢索資料
│   └── index.js               # window.SEARCH_INDEX shim
├── src/
│   └── app.js                 # 前端邏輯（導航 / 搜尋 / hash routing）
└── README.md
```

### 資料涵蓋

| 書別 | 分組 | 回次 | 頁面圖 |
|------|------|------|--------|
| 胖藍本 | 第一冊 | 第 1 ～ 30 回 | ✓ |
| 胖藍本 | 第二冊 | 第 31 ～ 60 回 | ✓ |
| 胖藍本 | 第三冊 | 第 61 ～ 80 回 | ✓ |
| 瘦藍本 | 因數與倍數、平面幾何、怎樣解題、數論、百分率、立體幾何、速率 | 各主題 1～N 回，共 26 回 | ✓ |

全部 106 回皆已建立解答全文索引，搜尋涵蓋率 100%。

---

## 本機預覽

資料以 `<script>` 注入 `window.MANIFEST` / `window.SEARCH_INDEX`，可直接雙擊 `index.html` 在 `file://` 協定下開啟。

若要啟用 `fetch()` 後備路徑，以簡易 HTTP server 起服務即可：

```bash
cd panglanpen-web
python3 -m http.server 8080
# 瀏覽 http://localhost:8080
```

---

## 部署至 GitHub Pages

1. 建立空的 GitHub repository `silentcountry0109-hash/fat-thin-blue`（不要勾選 README / .gitignore / license）。
2. 於本地初始化並推送：
   ```bash
   cd panglanpen-web
   git init -b main
   git add .
   git commit -m "feat: dual-book reader (pan 80 + slim 26) answer-only"
   git remote add origin https://github.com/silentcountry0109-hash/fat-thin-blue.git
   git push -u origin main
   ```
3. 於 GitHub repo 的 **Settings → Pages**：
   - Source：`Deploy from a branch`
   - Branch：`main` / root（`/`）
   - Save
4. 稍候 1–2 分鐘後站點會上線於
   `https://silentcountry0109-hash.github.io/fat-thin-blue/`

### 檔案大小

頁面圖片共 **約 36 MB**（胖 454 張 + 瘦 79 張），遠低於 GitHub 建議單 repo 1 GB 上限。

---

## 功能概要

- **左側邊欄**：
  - 第一層 — 胖藍本 / 瘦藍本，可分別展開；預設展開胖藍本。
  - 第二層 — 胖藍本分三冊、瘦藍本分七主題，可逐一摺疊。
  - 第三層 — 回次清單。
- **URL 路由**：`#/pan/r05`、`#/slim/s12` 可分享至特定回次。
- **全文搜尋**：頂部搜尋框對解答文字全文檢索，命中的回次會在邊欄以淡金色高亮。
- **響應式**：≤ 900px 自動收合邊欄，以漢堡按鈕開啟。

---

## 設計語彙

| 元素 | 值 |
|------|----|
| 紙色 | `#f7f4ec`（和紙）／`#e8e2d1`（側欄） |
| 墨色 | `#1f1f22`（正文）／`#3c3c42`（次要） |
| 靛藍 | `#233a64`（Active / 強調） |
| 金褐 | `#a07936`（搜尋命中 / Logo 副標） |
| 字型 | 標題 `Noto Serif TC` · 內文 `Noto Sans TC` · 拉丁 `Cormorant Garamond` |

---

## 更新資料

如需重新生成頁面圖與索引：

1. 置換上層目錄中的原始 PDF。
2. 執行工具腳本：
   - `render_slim.py` — 瘦藍本 PDF → JPEG。
   - `build_index_v2.py` — 建立 manifest 與全文索引。
3. 胖藍本 JPEG 已於前期以 `pdftoppm -r 130 -jpeg -jpegopt quality=82` 產生。

---

## 授權

本專案程式碼以 MIT 授權釋出。解答內容之著作權歸原編輯單位所有，僅供典陸教育內部教學使用。
