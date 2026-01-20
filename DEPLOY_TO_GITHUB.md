# 如何發布到 GitHub Pages

您已經成功建立了本地的專案庫。現在，請按照以下步驟將其上傳到 GitHub 並開啟網頁瀏覽功能。

## 步驟 1：在 GitHub 建立新專案

1. 登入 [GitHub](https://github.com/)。
2. 點擊右上角的 **+** 號，選擇 **New repository**。
3. 在 **Repository name** 輸入專案名稱（例如：`buddhist-apps` 或 `miniapps`）。
4. 選擇 **Public**（公開）。
5. **不要** 勾選 "Add a README file" 或其他初始化選項（因為我們已經在本地準備好了）。
6. 點擊 **Create repository**。

## 步驟 2：將本地程式碼推送到 GitHub

在您電腦的終端機（Terminal）中，複製並執行以下指令（請將 `<您的網址>` 替換為剛才 GitHub 提供的網址）：

```bash
# 加入遠端倉庫位置
git remote add origin <您的 GitHub 儲存庫網址>
# 例如：git remote add origin https://github.com/bibo1243/my-apps.git

# 將程式碼推送到 GitHub
git branch -M main
git push -u origin main
```

## 步驟 3：開啟 GitHub Pages

1. 程式碼上傳成功後，在 GitHub 專案頁面上，點擊上方的 **Settings**（設定）。
2. 在左側選單中找到 **Pages**。
3. 在 **Build and deployment** 下的 **Source** 選擇 **Deploy from a branch**。
4. 在 **Branch** 區塊，將 **None** 改為 **main**，資料夾選擇 **/(root)**。
5. 點擊 **Save**。

稍等約 1~2 分鐘，重新整理頁面，您會在上方看到一行網址（例如 `https://bibo1243.github.io/my-apps/`）。
點擊該網址，即可看到您的應用程式！
