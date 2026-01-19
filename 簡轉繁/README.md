# 📋 簡轉繁 - 剪貼簿自動簡轉繁工具

<p align="center">
  <img src="簡轉繁.app/Contents/Resources/AppIcon.png" width="128" height="128" alt="簡轉繁 App Icon">
</p>

這是一個 macOS 小程式，可以自動將剪貼簿中的簡體中文轉換為繁體中文（台灣正體）。

## ✨ 功能特色

- 🔄 **自動轉換**：程式運行時，自動監控剪貼簿變化
- 🇹🇼 **台灣用語**：使用 OpenCC 的 `s2twp` 配置，轉換為台灣正體並包含詞彙轉換
  - 例如：`软件` → `軟體`、`内存` → `記憶體`
- 🚀 **即時生效**：複製後約 0.3 秒內完成轉換
- 🖥️ **macOS App**：原生 macOS 應用程式
- ⚡ **開機自動啟動**：使用 LaunchAgent 在開機時自動運行
- 🔇 **靜默運行**：不顯示 Dock 圖示，在背景安靜執行

## 📁 檔案結構

```
簡轉繁/
├── clipboard_converter.py    # 主程式
├── requirements.txt          # Python 依賴
├── setup.py                  # py2app 配置
├── install.sh                # 一鍵安裝腳本
├── uninstall.sh              # 解除安裝腳本
├── com.leegary.clipboard-converter.plist  # LaunchAgent 設定
├── logs/                     # 日誌目錄
│   ├── output.log
│   └── error.log
├── 簡轉繁.app/               # macOS App
│   └── Contents/
│       ├── Info.plist
│       ├── MacOS/簡轉繁
│       └── Resources/
│           ├── AppIcon.png
│           └── clipboard_converter.py
└── README.md
```

## 🛠️ 安裝步驟

### 方法一：一鍵安裝（推薦）

```bash
cd /Users/leegary/小程序/簡轉繁
./install.sh
```

### 方法二：手動安裝

#### 1. 安裝 Python 依賴

```bash
pip3 install -r requirements.txt
```

#### 2. 設定開機自動啟動

```bash
cp com.leegary.clipboard-converter.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.leegary.clipboard-converter.plist
```

#### 3. 複製 App 到應用程式（可選）

```bash
cp -R 簡轉繁.app /Applications/
```

## 🔧 管理指令

### 檢查服務狀態

```bash
launchctl list | grep clipboard-converter
```

### 停止服務

```bash
launchctl unload ~/Library/LaunchAgents/com.leegary.clipboard-converter.plist
```

### 重新啟動服務

```bash
launchctl unload ~/Library/LaunchAgents/com.leegary.clipboard-converter.plist
launchctl load ~/Library/LaunchAgents/com.leegary.clipboard-converter.plist
```

### 查看日誌

```bash
# 查看輸出日誌
tail -f /Users/leegary/小程序/簡轉繁/logs/output.log

# 查看錯誤日誌
tail -f /Users/leegary/小程序/簡轉繁/logs/error.log
```

## 🗑️ 解除安裝

```bash
cd /Users/leegary/小程序/簡轉繁
./uninstall.sh
```

## ⚙️ 進階設定

### 修改轉換模式

編輯 `clipboard_converter.py` 中的 OpenCC 配置：

```python
# 可用配置
converter = OpenCC('s2twp')  # 簡體到繁體（台灣）+ 詞彙轉換 ✅ 預設
converter = OpenCC('s2tw')   # 簡體到繁體（台灣）
converter = OpenCC('s2t')    # 簡體到繁體（基本）
converter = OpenCC('s2hk')   # 簡體到繁體（香港）
```

### 修改檢查頻率

在 `clipboard_converter.py` 中修改 `time.sleep()` 的值（秒）。

## 🐛 常見問題

### Q: 如何確認程式正在運行？

```bash
launchctl list | grep clipboard-converter
```

如果顯示類似 `29150  0  com.leegary.clipboard-converter`，表示正在運行（第一個數字是 PID）。

### Q: 程式沒有反應？

1. 檢查服務狀態
2. 查看錯誤日誌：`cat logs/error.log`
3. 嘗試重新啟動服務

### Q: 如何暫時停用？

```bash
launchctl unload ~/Library/LaunchAgents/com.leegary.clipboard-converter.plist
```

## 📝 更新日誌

### v1.0.0 (2026-01-16)

- 🎉 首次發布
- 支援簡體到繁體（台灣正體）轉換
- 支援開機自動啟動
- macOS App 打包

## 📄 授權

MIT License
