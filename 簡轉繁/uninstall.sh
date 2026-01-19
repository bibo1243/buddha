#!/bin/bash
# ============================================
# 簡轉繁 - 解除安裝腳本
# ============================================

echo "🗑️  正在解除安裝「簡轉繁」..."
echo ""

PLIST_NAME="com.leegary.clipboard-converter.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

# 停止服務
echo "⏹️  停止服務..."
launchctl unload "$LAUNCH_AGENTS_DIR/$PLIST_NAME" 2>/dev/null

# 移除 plist
if [ -f "$LAUNCH_AGENTS_DIR/$PLIST_NAME" ]; then
    echo "📋 移除開機自動啟動設定..."
    rm "$LAUNCH_AGENTS_DIR/$PLIST_NAME"
fi

# 移除 Applications 中的 App
if [ -d "/Applications/簡轉繁.app" ]; then
    echo "📦 移除「應用程式」中的 App..."
    rm -rf "/Applications/簡轉繁.app"
fi

echo ""
echo "============================================"
echo "✅ 解除安裝完成！"
echo "============================================"
echo ""
echo "💡 原始檔案仍保留在:"
echo "   $(dirname "$0")"
echo ""
