#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
剪貼簿自動簡轉繁工具
當程式運行時，自動將剪貼簿中的簡體中文轉換為繁體中文
"""

import time
import subprocess
import sys
from opencc import OpenCC

# 初始化 OpenCC，使用 s2twp（簡體到繁體台灣正體，含詞彙轉換）
# 可選配置:
# - s2t: 簡體到繁體
# - s2tw: 簡體到繁體（台灣）
# - s2twp: 簡體到繁體（台灣），含詞彙轉換（如「軟體」而非「軟件」）
# - s2hk: 簡體到繁體（香港）
converter = OpenCC('s2twp')

def get_clipboard():
    """使用 macOS pbpaste 取得剪貼簿內容"""
    try:
        result = subprocess.run(
            ['pbpaste'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout
    except Exception as e:
        print(f"取得剪貼簿內容時發生錯誤: {e}")
        return None

def set_clipboard(text):
    """使用 macOS pbcopy 設定剪貼簿內容"""
    try:
        process = subprocess.Popen(
            ['pbcopy'],
            stdin=subprocess.PIPE,
            text=True
        )
        process.communicate(input=text)
        return True
    except Exception as e:
        print(f"設定剪貼簿內容時發生錯誤: {e}")
        return False

def contains_simplified_chinese(text):
    """
    檢查文字是否包含簡體中文
    透過比較轉換前後是否相同來判斷
    """
    if not text:
        return False
    converted = converter.convert(text)
    return converted != text

def main():
    print("=" * 50)
    print("🔄 剪貼簿簡轉繁工具已啟動")
    print("=" * 50)
    print("• 程式會自動監控剪貼簿")
    print("• 當偵測到簡體中文時，會自動轉換為繁體")
    print("• 按 Ctrl+C 可停止程式")
    print("=" * 50)
    print()

    last_content = get_clipboard()
    conversion_count = 0

    try:
        while True:
            current_content = get_clipboard()
            
            # 檢查剪貼簿是否有變化
            if current_content != last_content and current_content:
                # 檢查是否包含簡體中文
                if contains_simplified_chinese(current_content):
                    # 轉換為繁體
                    converted = converter.convert(current_content)
                    
                    # 設定新的剪貼簿內容
                    if set_clipboard(converted):
                        conversion_count += 1
                        print(f"✅ 轉換成功 (第 {conversion_count} 次)")
                        print(f"   原文: {current_content[:50]}{'...' if len(current_content) > 50 else ''}")
                        print(f"   繁體: {converted[:50]}{'...' if len(converted) > 50 else ''}")
                        print()
                        # 更新 last_content 為轉換後的內容
                        last_content = converted
                    else:
                        last_content = current_content
                else:
                    # 沒有簡體中文，直接更新
                    last_content = current_content
            
            # 每 0.3 秒檢查一次
            time.sleep(0.3)
            
    except KeyboardInterrupt:
        print()
        print("=" * 50)
        print(f"🛑 程式已停止，共完成 {conversion_count} 次轉換")
        print("=" * 50)

if __name__ == "__main__":
    main()
