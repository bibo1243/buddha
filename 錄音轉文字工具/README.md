# 離線語音轉文字網站 (Web UI)

這是一個網頁介面的語音轉文字工具，讓操作更直覺！

## 🚀 第一次安裝 (只需執行一次)

1. **開啟終端機 (Terminal)**
2. **進入資料夾**：
   ```bash
   cd /Users/leegary/小程序/錄音轉文字工具
   ```
3. **安裝必要套件** (使用 pip3)：
   ```bash
   pip3 install -r requirements.txt
   ```
   *(如果電腦沒有 pip3，請先安裝 Python 3)*

## ▶️ 啟動網站

1. **執行指令**：
   ```bash
   python3 -m streamlit run app.py
   ```
   或者：
   ```bash
   streamlit run app.py
   ```

2. **瀏覽器會自動開啟**
   如果沒有自動開啟，請手動複製網址貼上 (通常是 `http://localhost:8501`)。

## ✨ 功能
- **拖放上傳**：直接將錄音檔拖進網頁。
- **即時預覽**：一邊轉錄，一邊在網頁上看到文字。
- **一鍵下載**：完成後點擊按鈕即可下載 `.txt` 檔。
- **離線模型**：模型載入後，完全不需要網路即可運作。

## ⚙️ 常見問題
- **Error: command not found: streamlit**
  請嘗試使用 `python3 -m streamlit run app.py` 來執行。
- **第一次執行很久？**
  首次需要下載 AI 模型 (約 500MB~1.5GB)，請耐心等候，之後就會秒開了。
