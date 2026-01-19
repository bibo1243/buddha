"""
py2app 配置檔案
用於將 Python 腳本打包成 macOS App
"""

from setuptools import setup

APP = ['clipboard_converter.py']
DATA_FILES = []
OPTIONS = {
    'argv_emulation': False,
    'plist': {
        'CFBundleName': '簡轉繁',
        'CFBundleDisplayName': '簡轉繁',
        'CFBundleGetInfoString': '剪貼簿自動簡轉繁工具',
        'CFBundleIdentifier': 'com.leegary.clipboard-converter',
        'CFBundleVersion': '1.0.0',
        'CFBundleShortVersionString': '1.0.0',
        'LSBackgroundOnly': True,  # 背景執行，不顯示 Dock 圖示
        'LSUIElement': True,  # 不顯示在 Dock
    },
    'packages': ['opencc'],
    'includes': ['opencc'],
}

setup(
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)
