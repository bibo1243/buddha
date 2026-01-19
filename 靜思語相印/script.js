/**
 * 靜思語選擇器 - JavaScript
 * 選擇姓名、生成靜思語、存檔管理
 */

// ======================================
// 靜思語資料庫
// ======================================
// ======================================
// 靜思語/法語資料庫
// ======================================
let quotes = {
    all: [],
    compassion: [],
    wisdom: [],
    gratitude: [],
    diligence: [],
    general: [] // 新增通用類別
};

// 預設靜思語 (備份用，若讀取外部檔案失敗時使用)
const defaultQuotes = [
    { text: "心美，看什麼都順眼。", author: "證嚴法師", category: "compassion" },
    { text: "做好事不能少我一人，做壞事不能多我一人。", author: "證嚴法師", category: "diligence" },
    { text: "太陽光大、父母恩大、君子量大、小人氣大。", author: "證嚴法師", category: "gratitude" },
    { text: "口說好話、心想好意、身行好事、腳走好路。", author: "證嚴法師", category: "general" },
    { text: "原諒別人，就是善待自己。", author: "證嚴法師", category: "compassion" },
    { text: "屋寬不如心寬。", author: "證嚴法師", category: "wisdom" },
    { text: "話多不如話少，話少不如話好。", author: "證嚴法師", category: "wisdom" },
    { text: "心中有愛，才能春暖花開。", author: "靜思語", category: "compassion" },
    { text: "用感恩的心對待每一天。", author: "靜思語", category: "gratitude" }
];

// 初始化資料庫
function initQuotes() {
    // 檢查是否有外部載入的資料 (window.buddhistQuotesData)
    const sourceData = window.buddhistQuotesData || defaultQuotes;

    // 清空現有資料
    quotes = {
        all: [],
        compassion: [],
        wisdom: [],
        gratitude: [],
        diligence: [],
        general: []
    };

    // 分類整理
    sourceData.forEach(item => {
        // 加入 "全部"
        quotes.all.push(item);

        // 加入對應類別
        if (quotes[item.category]) {
            quotes[item.category].push(item);
        } else {
            // 如果類別不存在，歸類到 general
            quotes.general.push(item);
        }
    });

    console.log(`已載入 ${quotes.all.length} 句法語`);
}

// 立即執行初始化
initQuotes();

// ======================================
// 預設姓名列表
// ======================================
const defaultNames = [
    "詹前柏", "王元鼎", "林紀騰", "李冠葦", "廖振杉",
    "廖慧雯", "高靜華", "劉春燕", "熊小蓮", "王芊蓉", "李鳳翎"
];

// ======================================
// 應用狀態
// ======================================
const appState = {
    selectedName: null,
    selectedQuote: null,
    currentCategory: 'all',
    records: JSON.parse(localStorage.getItem('quoteRecords')) || [],
    customNames: JSON.parse(localStorage.getItem('customNames')) || []
};

// ======================================
// DOM 元素
// ======================================
const elements = {
    nameGrid: document.getElementById('nameGrid'),
    customNameInput: document.getElementById('customNameInput'),
    addCustomNameBtn: document.getElementById('addCustomNameBtn'),
    selectedNameText: document.getElementById('selectedNameText'),
    categoryTags: document.querySelectorAll('.category-tag'),
    generateQuoteBtn: document.getElementById('generateQuoteBtn'),
    quoteText: document.getElementById('quoteText'),
    quoteAuthor: document.getElementById('quoteAuthor'),
    saveRecordBtn: document.getElementById('saveRecordBtn'),
    recordsList: document.getElementById('recordsList'),
    recordCount: document.getElementById('recordCount'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    exportBtn: document.getElementById('exportBtn'),
    toastContainer: document.getElementById('toastContainer'),
    quoteSource: document.getElementById('quoteSource') // 新增
};

// ======================================
// 初始化
// ======================================
function init() {
    renderNameButtons();
    renderRecords();
    setupEventListeners();
}

// ======================================
// 渲染姓名按鈕
// ======================================
function renderNameButtons() {
    // 渲染預設姓名（不帶刪除按鈕）
    const defaultBtns = defaultNames.map(name => `
        <button class="name-btn ${appState.selectedName === name ? 'active' : ''}" data-name="${name}">
            ${name}
        </button>
    `).join('');

    // 渲染自訂姓名（帶刪除按鈕）
    const customBtns = appState.customNames.map(name => `
        <div class="name-btn-wrapper">
            <button class="name-btn custom ${appState.selectedName === name ? 'active' : ''}" data-name="${name}">
                ${name}
            </button>
            <button class="name-delete-btn" data-name="${name}" title="刪除此姓名">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    elements.nameGrid.innerHTML = defaultBtns + customBtns;

    // 綁定選擇事件
    document.querySelectorAll('.name-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectName(btn.dataset.name);
        });
    });

    // 綁定刪除事件
    document.querySelectorAll('.name-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCustomName(btn.dataset.name);
        });
    });
}

// ======================================
// 選擇姓名
// ======================================
function selectName(name) {
    appState.selectedName = name;
    elements.selectedNameText.textContent = name;

    // 更新按鈕狀態
    document.querySelectorAll('.name-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.name === name);
    });

    updateSaveButtonState();
    showToast(`已選擇：${name}`, 'success');
}

// ======================================
// 新增自訂姓名
// ======================================
function addCustomName() {
    const name = elements.customNameInput.value.trim();

    if (!name) {
        showToast('請輸入姓名', 'error');
        return;
    }

    if (defaultNames.includes(name) || appState.customNames.includes(name)) {
        showToast('此姓名已存在', 'error');
        return;
    }

    appState.customNames.push(name);
    localStorage.setItem('customNames', JSON.stringify(appState.customNames));

    elements.customNameInput.value = '';
    renderNameButtons();
    selectName(name);
    showToast(`已新增：${name}`, 'success');
}

// ======================================
// 刪除自訂姓名
// ======================================
function deleteCustomName(name) {
    if (!confirm(`確定要刪除「${name}」嗎？`)) return;

    appState.customNames = appState.customNames.filter(n => n !== name);
    localStorage.setItem('customNames', JSON.stringify(appState.customNames));

    // 如果刪除的是目前選中的姓名，清除選擇
    if (appState.selectedName === name) {
        appState.selectedName = null;
        elements.selectedNameText.textContent = '尚未選擇';
    }

    renderNameButtons();
    updateSaveButtonState();
    showToast(`已刪除：${name}`, 'success');
}

// ======================================
// 生成隨機靜思語
// ======================================
function generateRandomQuote() {
    const categoryQuotes = quotes[appState.currentCategory];
    const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
    const quote = categoryQuotes[randomIndex];

    appState.selectedQuote = quote;

    elements.quoteText.textContent = `「${quote.text}」`;
    elements.quoteAuthor.textContent = `— ${quote.author}`;

    // 更新來源網址
    if (quote.source) {
        elements.quoteSource.href = quote.source;
        elements.quoteSource.style.display = 'inline-block';
    } else {
        elements.quoteSource.style.display = 'none';
    }

    // 動畫效果
    elements.quoteText.classList.remove('fade-in');
    void elements.quoteText.offsetWidth; // 觸發重繪
    elements.quoteText.classList.add('fade-in');

    updateSaveButtonState();
}

// ======================================
// 更新存檔按鈕狀態
// ======================================
function updateSaveButtonState() {
    elements.saveRecordBtn.disabled = !(appState.selectedName && appState.selectedQuote);
}

// ======================================
// 存檔記錄
// ======================================
function saveRecord() {
    if (!appState.selectedName || !appState.selectedQuote) {
        showToast('請先選擇姓名和法語', 'error');
        return;
    }

    const record = {
        id: Date.now(),
        name: appState.selectedName,
        quote: appState.selectedQuote.text,
        author: appState.selectedQuote.author,
        timestamp: new Date().toLocaleString('zh-TW')
    };

    appState.records.unshift(record);
    localStorage.setItem('quoteRecords', JSON.stringify(appState.records));

    renderRecords();
    showToast('已存檔！', 'success');

    // 清除選擇的靜思語（但保留姓名）
    appState.selectedQuote = null;
    elements.quoteText.textContent = '點擊上方按鈕生成法語';
    elements.quoteAuthor.textContent = '';
    elements.quoteSource.style.display = 'none'; // 隱藏來源
    updateSaveButtonState();
}

// ======================================
// 渲染記錄列表
// ======================================
function renderRecords() {
    if (appState.records.length === 0) {
        elements.recordsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>尚無記錄</p>
            </div>
        `;
        elements.exportBtn.style.display = 'none';
    } else {
        elements.recordsList.innerHTML = appState.records.map(record => `
            <div class="record-item" data-id="${record.id}">
                <div class="record-content">
                    <div class="record-name">
                        <i class="fas fa-user"></i>
                        ${record.name}
                    </div>
                    <div class="record-quote">「${record.quote}」</div>
                    <div class="record-meta">
                        <span class="record-author">— ${record.author}</span>
                        <span class="record-time">${record.timestamp}</span>
                    </div>
                </div>
                <button class="btn-delete" data-id="${record.id}" title="刪除">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        elements.exportBtn.style.display = 'block';

        // 綁定刪除事件
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteRecord(parseInt(btn.dataset.id)));
        });
    }

    elements.recordCount.textContent = `${appState.records.length} 筆`;
}

// ======================================
// 刪除記錄
// ======================================
function deleteRecord(id) {
    appState.records = appState.records.filter(r => r.id !== id);
    localStorage.setItem('quoteRecords', JSON.stringify(appState.records));
    renderRecords();
    showToast('已刪除', 'success');
}

// ======================================
// 清除全部記錄
// ======================================
function clearAllRecords() {
    if (!confirm('確定要清除所有記錄嗎？')) return;

    appState.records = [];
    localStorage.setItem('quoteRecords', JSON.stringify(appState.records));
    renderRecords();
    showToast('已清除所有記錄', 'success');
}

// ======================================
// 匯出記錄
// ======================================
function exportRecords() {
    const content = appState.records.map(r =>
        `${r.name}\t「${r.quote}」\t${r.author}\t${r.timestamp}`
    ).join('\n');

    const header = '姓名\t法語\t作者\t時間\n';
    const blob = new Blob([header + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `佛典法語記錄_${new Date().toLocaleDateString('zh-TW')}.txt`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('已匯出記錄', 'success');
}

// ======================================
// 設置事件監聽
// ======================================
function setupEventListeners() {
    // 新增自訂姓名
    elements.addCustomNameBtn.addEventListener('click', addCustomName);
    elements.customNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCustomName();
    });

    // 類別選擇
    elements.categoryTags.forEach(tag => {
        tag.addEventListener('click', () => {
            elements.categoryTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            appState.currentCategory = tag.dataset.category;
        });
    });

    // 生成靜思語
    elements.generateQuoteBtn.addEventListener('click', generateRandomQuote);

    // 存檔
    elements.saveRecordBtn.addEventListener('click', saveRecord);

    // 清除全部
    elements.clearAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setTimeout(() => clearAllRecords(), 10);
    });

    // 匯出
    // 匯出
    elements.exportBtn.addEventListener('click', exportRecords);

}

// 啟動應用
document.addEventListener('DOMContentLoaded', init);
