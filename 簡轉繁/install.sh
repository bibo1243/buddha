#!/bin/bash
# ============================================
# 簡轉繁 - 安裝腳本
# ============================================

echo "🔄 正在安裝「簡轉繁」剪貼簿轉換工具..."
echo ""

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_NAME="com.leegary.clipboard-converter.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
APP_PATH="$SCRIPT_DIR/簡轉繁.app"
APPLICATIONS_PATH="/Applications/簡轉繁.app"

# 確保 LaunchAgents 目錄存在
mkdir -p "$LAUNCH_AGENTS_DIR"

# 停止現有服務（如果存在）
if launchctl list | grep -q "com.leegary.clipboard-converter"; then
    echo "⏹️  停止現有服務..."
    launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_NAME" 2>/dev/null
fi

# 複製 plist 到 LaunchAgents
echo "📋 安裝開機自動啟動設定..."
cp "$SCRIPT_DIR/$PLIST_NAME" "$LAUNCH_AGENTS_DIR/"

# 載入服務
echo "🚀 啟動服務..."
launchctl load "$LAUNCH_AGENTS_DIR/$PLIST_NAME"

# 複製 App 到 Applications（可選）
echo ""
read -p "是否要將 App 複製到「應用程式」資料夾？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 複製 App 到「應用程式」..."
    rm -rf "$APPLICATIONS_PATH"
    cp -R "$APP_PATH" "/Applications/"
    echo "✅ App 已複製到「應用程式」"
fi

echo ""
echo "============================================"
echo "✅ 安裝完成！"
echo "============================================"
echo ""
echo "📌 功能說明："
echo "   • 程式已在背景運行"
echo "   • 開機時會自動啟動"
echo "   • 複製簡體中文會自動轉為繁體"
echo ""
echo "📂 檔案位置："
echo "   • 主程式: $SCRIPT_DIR/clipboard_converter.py"
echo "   • App: $APP_PATH"
echo "   • 日誌: $SCRIPT_DIR/logs/"
echo ""
echo "🔧 管理指令："
echo "   • 停止服務: launchctl unload ~/Library/LaunchAgents/$PLIST_NAME"
echo "   • 啟動服務: launchctl load ~/Library/LaunchAgents/$PLIST_NAME"
echo "   • 檢查狀態: launchctl list | grep clipboard-converter"
echo ""
