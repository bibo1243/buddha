/**
 * 活動企劃管理系統 - JavaScript
 */

// ======================================
// 資料模型
// ======================================
const eventData = {
    basicInfo: {
        name: '',
        date: '',
        time: '',
        location: '',
        purpose: '',
        target: '',
        budget: ''
    },
    preparation: {
        seating: {
            style: 'theater',
            count: 30,
            notes: ''
        },
        refreshments: [],
        tasks: []
    },
    schedule: [],
    content: {
        description: '',
        activities: [],
        materials: '',
        notes: ''
    },
    participants: []
};

// 儲存 Key
const STORAGE_KEY = 'eventPlannerData';

// ======================================
// DOM 元素
// ======================================
const elements = {
    // 導航
    navItems: document.querySelectorAll('.nav-item'),
    sections: document.querySelectorAll('.section'),
    pageTitle: document.querySelector('.page-title'),
    menuToggle: document.getElementById('menuToggle'),
    sidebar: document.querySelector('.sidebar'),

    // 按鈕
    saveBtn: document.getElementById('saveBtn'),
    newEventBtn: document.getElementById('newEventBtn'),
    exportBtn: document.getElementById('exportBtn'),

    // 總覽
    statEventName: document.getElementById('statEventName'),
    statDate: document.getElementById('statDate'),
    statParticipants: document.getElementById('statParticipants'),
    statProgress: document.getElementById('statProgress'),
    overviewPurpose: document.getElementById('overviewPurpose'),
    overviewSchedule: document.getElementById('overviewSchedule'),
    overviewTasks: document.getElementById('overviewTasks'),

    // 基本資訊
    eventName: document.getElementById('eventName'),
    eventDate: document.getElementById('eventDate'),
    eventTime: document.getElementById('eventTime'),
    eventLocation: document.getElementById('eventLocation'),
    eventPurpose: document.getElementById('eventPurpose'),
    eventTarget: document.getElementById('eventTarget'),
    eventBudget: document.getElementById('eventBudget'),

    // 前置準備
    prepTabs: document.querySelectorAll('.prep-tab'),
    prepContents: document.querySelectorAll('.prep-content'),
    seatingStyle: document.getElementById('seatingStyle'),
    seatCount: document.getElementById('seatCount'),
    seatingDiagram: document.getElementById('seatingDiagram'),
    seatingNotes: document.getElementById('seatingNotes'),
    addRefreshmentBtn: document.getElementById('addRefreshmentBtn'),
    refreshmentList: document.getElementById('refreshmentList'),
    refreshmentCount: document.getElementById('refreshmentCount'),
    refreshmentCost: document.getElementById('refreshmentCost'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskList: document.getElementById('taskList'),
    taskProgressBar: document.getElementById('taskProgressBar'),
    taskProgressText: document.getElementById('taskProgressText'),
    taskFilterBtns: document.querySelectorAll('.filter-btn'),

    // 流程規劃
    addScheduleBtn: document.getElementById('addScheduleBtn'),
    timelineRuler: document.getElementById('timelineRuler'),
    timelineBody: document.getElementById('timelineBody'),
    scheduleList: document.getElementById('scheduleList'),

    // 活動內容
    contentDescription: document.getElementById('contentDescription'),
    activityItems: document.getElementById('activityItems'),
    addActivityBtn: document.getElementById('addActivityBtn'),
    contentMaterials: document.getElementById('contentMaterials'),
    contentNotes: document.getElementById('contentNotes'),

    // 參與人員
    addParticipantBtn: document.getElementById('addParticipantBtn'),
    participantSearch: document.getElementById('participantSearch'),
    participantsGrid: document.getElementById('participantsGrid'),
    roleBtns: document.querySelectorAll('.role-btn'),
    hostCount: document.getElementById('hostCount'),
    staffCount: document.getElementById('staffCount'),
    speakerCount: document.getElementById('speakerCount'),
    attendeeCount: document.getElementById('attendeeCount'),

    // Modals
    scheduleModal: document.getElementById('scheduleModal'),
    participantModal: document.getElementById('participantModal'),
    refreshmentModal: document.getElementById('refreshmentModal'),
    taskModal: document.getElementById('taskModal'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ======================================
// 初始化
// ======================================
function init() {
    loadData();
    setupEventListeners();
    renderAll();
    generateTimelineRuler();
    updateSeatingDiagram();
}

// ======================================
// 事件監聽
// ======================================
function setupEventListeners() {
    // 導航
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });

    // 手機版選單
    elements.menuToggle.addEventListener('click', () => {
        elements.sidebar.classList.toggle('active');
    });

    // 儲存按鈕
    elements.saveBtn.addEventListener('click', saveData);

    // 新增活動
    elements.newEventBtn.addEventListener('click', createNewEvent);

    // 匯出按鈕
    elements.exportBtn.addEventListener('click', exportPlan);

    // 基本資訊自動儲存
    const basicInfoInputs = [
        elements.eventName, elements.eventDate, elements.eventTime,
        elements.eventLocation, elements.eventPurpose, elements.eventTarget,
        elements.eventBudget
    ];
    basicInfoInputs.forEach(input => {
        input.addEventListener('input', updateBasicInfo);
    });

    // 前置準備 Tabs
    elements.prepTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchPrepTab(tab.dataset.tab);
        });
    });

    // 座位設定
    elements.seatingStyle.addEventListener('change', updateSeatingDiagram);
    elements.seatCount.addEventListener('input', updateSeatingDiagram);
    elements.seatingNotes.addEventListener('input', () => {
        eventData.preparation.seating.notes = elements.seatingNotes.value;
    });

    // 茶點
    elements.addRefreshmentBtn.addEventListener('click', () => openModal('refreshment'));

    // 待辦
    elements.addTaskBtn.addEventListener('click', () => openModal('task'));
    elements.taskFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.taskFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks(btn.dataset.filter);
        });
    });

    // 流程規劃
    elements.addScheduleBtn.addEventListener('click', () => openModal('schedule'));

    // 活動內容
    elements.contentDescription.addEventListener('input', () => {
        eventData.content.description = elements.contentDescription.value;
    });
    elements.contentMaterials.addEventListener('input', () => {
        eventData.content.materials = elements.contentMaterials.value;
    });
    elements.contentNotes.addEventListener('input', () => {
        eventData.content.notes = elements.contentNotes.value;
    });
    elements.addActivityBtn.addEventListener('click', addActivityItem);

    // 參與人員
    elements.addParticipantBtn.addEventListener('click', () => openModal('participant'));
    elements.participantSearch.addEventListener('input', (e) => {
        renderParticipants(null, e.target.value);
    });
    elements.roleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.roleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderParticipants(btn.dataset.role);
        });
    });

    // Modal 關閉按鈕
    setupModalListeners();
}

// ======================================
// 導航切換
// ======================================
function switchSection(sectionId) {
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionId);
    });

    elements.sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });

    // 更新標題
    const titles = {
        'overview': '活動企劃總覽',
        'basic-info': '基本資訊',
        'preparation': '前置準備',
        'schedule': '流程規劃',
        'content': '活動內容',
        'participants': '參與人員'
    };
    elements.pageTitle.textContent = titles[sectionId] || '活動企劃';

    // 手機版關閉側邊欄
    elements.sidebar.classList.remove('active');
}

// ======================================
// 前置準備 Tab 切換
// ======================================
function switchPrepTab(tabId) {
    elements.prepTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    elements.prepContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
}

// ======================================
// 基本資訊
// ======================================
function updateBasicInfo() {
    eventData.basicInfo = {
        name: elements.eventName.value,
        date: elements.eventDate.value,
        time: elements.eventTime.value,
        location: elements.eventLocation.value,
        purpose: elements.eventPurpose.value,
        target: elements.eventTarget.value,
        budget: elements.eventBudget.value
    };
    updateOverview();
}

// ======================================
// 總覽更新
// ======================================
function updateOverview() {
    // 統計卡片
    elements.statEventName.textContent = eventData.basicInfo.name || '尚未設定活動';
    elements.statDate.textContent = eventData.basicInfo.date ?
        new Date(eventData.basicInfo.date).toLocaleDateString('zh-TW') : '--';
    elements.statParticipants.textContent = eventData.participants.length;

    // 計算進度
    const totalTasks = eventData.preparation.tasks.length;
    const completedTasks = eventData.preparation.tasks.filter(t => t.completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    elements.statProgress.textContent = `${progress}%`;

    // 活動目的
    elements.overviewPurpose.textContent = eventData.basicInfo.purpose || '請在「基本資訊」中填寫活動目的';
    elements.overviewPurpose.classList.toggle('placeholder-text', !eventData.basicInfo.purpose);

    // 流程預覽
    renderSchedulePreview();

    // 待辦預覽
    renderTaskPreview();
}

function renderSchedulePreview() {
    if (eventData.schedule.length === 0) {
        elements.overviewSchedule.innerHTML = '<p class="placeholder-text">請在「流程規劃」中新增活動流程</p>';
        return;
    }

    const previewItems = eventData.schedule.slice(0, 5);
    elements.overviewSchedule.innerHTML = `
        <div class="timeline-preview">
            ${previewItems.map(item => `
                <div class="preview-item" style="border-left-color: ${item.color}">
                    <span class="time">${item.startTime} - ${item.endTime}</span>
                    <span class="title">${item.title}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTaskPreview() {
    const pendingTasks = eventData.preparation.tasks.filter(t => !t.completed).slice(0, 5);

    if (pendingTasks.length === 0) {
        elements.overviewTasks.innerHTML = '<p class="placeholder-text">請在「前置準備」中新增待辦事項</p>';
        return;
    }

    elements.overviewTasks.innerHTML = `
        <div class="preview-tasks">
            ${pendingTasks.map(task => `
                <div class="preview-task">
                    <div class="checkbox ${task.completed ? 'checked' : ''}"></div>
                    <span class="title">${task.title}</span>
                    <span class="priority task-priority ${task.priority}">${getPriorityLabel(task.priority)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ======================================
// 座位圖
// ======================================
function updateSeatingDiagram() {
    const style = elements.seatingStyle.value;
    const count = parseInt(elements.seatCount.value) || 30;

    eventData.preparation.seating.style = style;
    eventData.preparation.seating.count = count;

    let html = '<div class="stage">講台</div>';

    switch (style) {
        case 'theater':
            html += renderTheaterSeating(count);
            break;
        case 'classroom':
            html += renderClassroomSeating(count);
            break;
        case 'u-shape':
            html += renderUShapeSeating(count);
            break;
        case 'round':
            html += renderRoundSeating(count);
            break;
        case 'banquet':
            html += renderBanquetSeating(count);
            break;
    }

    elements.seatingDiagram.innerHTML = html;
}

function renderTheaterSeating(count) {
    const seatsPerRow = 10;
    const rows = Math.ceil(count / seatsPerRow);
    let html = '';
    let seatNum = 1;

    for (let i = 0; i < rows; i++) {
        html += '<div class="seat-row">';
        for (let j = 0; j < seatsPerRow && seatNum <= count; j++) {
            html += `<div class="seat">${seatNum}</div>`;
            seatNum++;
        }
        html += '</div>';
    }
    return html;
}

function renderClassroomSeating(count) {
    const seatsPerRow = 6;
    const rows = Math.ceil(count / seatsPerRow);
    let html = '';
    let seatNum = 1;

    for (let i = 0; i < rows; i++) {
        html += '<div class="seat-row" style="gap: 24px;">';
        for (let j = 0; j < seatsPerRow && seatNum <= count; j++) {
            if (j === seatsPerRow / 2) {
                html += '<div style="width: 40px;"></div>';
            }
            html += `<div class="seat" style="width: 40px; height: 40px;">${seatNum}</div>`;
            seatNum++;
        }
        html += '</div>';
    }
    return html;
}

function renderUShapeSeating(count) {
    const sideSeats = Math.floor(count / 3);
    const frontSeats = count - (sideSeats * 2);
    let html = '';
    let seatNum = 1;

    // 左側
    html += '<div style="display: flex; justify-content: center; gap: 100px;">';
    html += '<div style="display: flex; flex-direction: column; gap: 8px;">';
    for (let i = 0; i < sideSeats && seatNum <= count; i++) {
        html += `<div class="seat">${seatNum}</div>`;
        seatNum++;
    }
    html += '</div>';

    // 右側
    html += '<div style="display: flex; flex-direction: column; gap: 8px;">';
    for (let i = 0; i < sideSeats && seatNum <= count; i++) {
        html += `<div class="seat">${seatNum}</div>`;
        seatNum++;
    }
    html += '</div>';
    html += '</div>';

    // 底部
    html += '<div class="seat-row" style="margin-top: 12px;">';
    for (let i = 0; i < frontSeats && seatNum <= count; i++) {
        html += `<div class="seat">${seatNum}</div>`;
        seatNum++;
    }
    html += '</div>';

    return html;
}

function renderRoundSeating(count) {
    const tables = Math.ceil(count / 8);
    let html = '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 40px;">';
    let seatNum = 1;

    for (let t = 0; t < tables; t++) {
        html += '<div style="position: relative; width: 100px; height: 100px; background: var(--bg-card-hover); border-radius: 50%; margin: 30px;">';
        const seatsAtTable = Math.min(8, count - (t * 8));
        for (let s = 0; s < seatsAtTable; s++) {
            const angle = (s / seatsAtTable) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 60 - 16;
            const y = 50 + Math.sin(angle) * 60 - 16;
            html += `<div class="seat" style="position: absolute; left: ${x}px; top: ${y}px;">${seatNum}</div>`;
            seatNum++;
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderBanquetSeating(count) {
    const seatsPerTable = 4;
    const tables = Math.ceil(count / seatsPerTable);
    let html = '<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 30px;">';
    let seatNum = 1;

    for (let t = 0; t < tables; t++) {
        html += '<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">';

        // 上排
        html += '<div class="seat-row">';
        for (let s = 0; s < 2 && seatNum <= count; s++) {
            html += `<div class="seat">${seatNum}</div>`;
            seatNum++;
        }
        html += '</div>';

        // 桌子
        html += '<div style="width: 80px; height: 30px; background: var(--bg-card-hover); border-radius: 4px;"></div>';

        // 下排
        html += '<div class="seat-row">';
        for (let s = 0; s < 2 && seatNum <= count; s++) {
            html += `<div class="seat">${seatNum}</div>`;
            seatNum++;
        }
        html += '</div>';

        html += '</div>';
    }
    html += '</div>';
    return html;
}

// ======================================
// 茶點管理
// ======================================
function renderRefreshments() {
    if (eventData.preparation.refreshments.length === 0) {
        elements.refreshmentList.innerHTML = `
            <div class="empty-state" style="padding: 40px;">
                <i class="fas fa-mug-hot"></i>
                <p>尚未新增茶點項目</p>
            </div>
        `;
    } else {
        elements.refreshmentList.innerHTML = eventData.preparation.refreshments.map((item, index) => `
            <div class="refreshment-item">
                <span class="name">${item.name}</span>
                <span class="quantity">${item.quantity} 份</span>
                <span class="price">$${item.price}</span>
                <span class="vendor">${item.vendor || '-'}</span>
                <div class="actions">
                    <button class="btn-delete" onclick="deleteRefreshment(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 更新統計
    elements.refreshmentCount.textContent = eventData.preparation.refreshments.length;
    const totalCost = eventData.preparation.refreshments.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    elements.refreshmentCost.textContent = `$${totalCost.toLocaleString()}`;
}

function addRefreshment(data) {
    eventData.preparation.refreshments.push(data);
    renderRefreshments();
    showToast('茶點項目已新增', 'success');
}

function deleteRefreshment(index) {
    eventData.preparation.refreshments.splice(index, 1);
    renderRefreshments();
    showToast('茶點項目已刪除', 'info');
}

// ======================================
// 待辦管理
// ======================================
function renderTasks(filter = 'all') {
    let tasks = eventData.preparation.tasks;

    if (filter === 'pending') {
        tasks = tasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
        tasks = tasks.filter(t => t.completed);
    }

    if (tasks.length === 0) {
        elements.taskList.innerHTML = `
            <div class="empty-state" style="padding: 40px;">
                <i class="fas fa-list-check"></i>
                <p>尚未新增待辦事項</p>
            </div>
        `;
    } else {
        elements.taskList.innerHTML = tasks.map((task, index) => `
            <div class="task-item" data-index="${index}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${eventData.preparation.tasks.indexOf(task)})"></div>
                <div class="task-info">
                    <div class="title ${task.completed ? 'completed' : ''}">${task.title}</div>
                    <div class="meta">
                        <span><i class="fas fa-user"></i> ${task.assignee || '未指派'}</span>
                        <span><i class="fas fa-calendar"></i> ${task.dueDate || '無期限'}</span>
                    </div>
                </div>
                <span class="task-priority ${task.priority}">${getPriorityLabel(task.priority)}</span>
                <button class="btn-delete" style="background: rgba(239, 68, 68, 0.1); border: none; width: 32px; height: 32px; border-radius: 6px; color: var(--danger); cursor: pointer;" onclick="deleteTask(${eventData.preparation.tasks.indexOf(task)})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    updateTaskProgress();
}

function addTask(data) {
    eventData.preparation.tasks.push({
        ...data,
        completed: false
    });
    renderTasks();
    updateOverview();
    showToast('待辦事項已新增', 'success');
}

function toggleTask(index) {
    eventData.preparation.tasks[index].completed = !eventData.preparation.tasks[index].completed;
    renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
    updateOverview();
}

function deleteTask(index) {
    eventData.preparation.tasks.splice(index, 1);
    renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
    updateOverview();
    showToast('待辦事項已刪除', 'info');
}

function updateTaskProgress() {
    const total = eventData.preparation.tasks.length;
    const completed = eventData.preparation.tasks.filter(t => t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    elements.taskProgressBar.style.width = `${progress}%`;
    elements.taskProgressText.textContent = `${progress}% 完成`;
}

function getPriorityLabel(priority) {
    const labels = { high: '高', medium: '中', low: '低' };
    return labels[priority] || priority;
}

// ======================================
// 流程規劃
// ======================================
function generateTimelineRuler() {
    let html = '';
    for (let h = 8; h <= 20; h++) {
        html += `<div class="time-mark">${String(h).padStart(2, '0')}:00</div>`;
    }
    elements.timelineRuler.innerHTML = html;
}

function renderSchedule() {
    // 時間軸視圖
    if (eventData.schedule.length === 0) {
        elements.timelineBody.innerHTML = `
            <div class="timeline-empty">
                <i class="fas fa-clock"></i>
                <p>點擊「新增流程」來建立活動時程</p>
            </div>
        `;
    } else {
        const startHour = 8;
        const totalHours = 13; // 8:00 - 21:00
        const pixelsPerHour = 60;

        elements.timelineBody.innerHTML = `
            <div class="timeline-row" style="height: 50px; min-width: ${totalHours * pixelsPerHour}px;">
                ${eventData.schedule.map(item => {
            const startParts = item.startTime.split(':');
            const endParts = item.endTime.split(':');
            const startMinutes = (parseInt(startParts[0]) - startHour) * 60 + parseInt(startParts[1]);
            const endMinutes = (parseInt(endParts[0]) - startHour) * 60 + parseInt(endParts[1]);
            const left = (startMinutes / 60) * pixelsPerHour;
            const width = ((endMinutes - startMinutes) / 60) * pixelsPerHour;

            return `<div class="timeline-item" style="left: ${left}px; width: ${width}px; background: ${item.color};">
                        ${item.title}
                    </div>`;
        }).join('')}
            </div>
        `;
    }

    // 清單視圖
    if (eventData.schedule.length === 0) {
        elements.scheduleList.innerHTML = `
            <div class="empty-state" style="padding: 40px;">
                <i class="fas fa-list"></i>
                <p>尚未新增流程項目</p>
            </div>
        `;
    } else {
        const sortedSchedule = [...eventData.schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));
        elements.scheduleList.innerHTML = sortedSchedule.map((item, index) => `
            <div class="schedule-item">
                <div class="time">
                    <span class="color-dot" style="background: ${item.color};"></span>
                    ${item.startTime} - ${item.endTime}
                </div>
                <span class="title">${item.title}</span>
                <span class="host">${item.host || '-'}</span>
                <div class="actions">
                    <button class="btn-edit" onclick="editSchedule(${eventData.schedule.indexOf(item)})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteSchedule(${eventData.schedule.indexOf(item)})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateOverview();
}

let editingScheduleIndex = -1;

function addSchedule(data) {
    if (editingScheduleIndex >= 0) {
        eventData.schedule[editingScheduleIndex] = data;
        editingScheduleIndex = -1;
        showToast('流程已更新', 'success');
    } else {
        eventData.schedule.push(data);
        showToast('流程已新增', 'success');
    }
    renderSchedule();
}

function editSchedule(index) {
    editingScheduleIndex = index;
    const item = eventData.schedule[index];

    document.getElementById('scheduleModalTitle').textContent = '編輯流程';
    document.getElementById('scheduleTitle').value = item.title;
    document.getElementById('scheduleStartTime').value = item.startTime;
    document.getElementById('scheduleEndTime').value = item.endTime;
    document.getElementById('scheduleHost').value = item.host || '';
    document.getElementById('scheduleDescription').value = item.description || '';

    document.querySelectorAll('input[name="scheduleColor"]').forEach(radio => {
        radio.checked = radio.value === item.color;
    });

    openModal('schedule');
}

function deleteSchedule(index) {
    eventData.schedule.splice(index, 1);
    renderSchedule();
    showToast('流程已刪除', 'info');
}

// ======================================
// 活動內容
// ======================================
function renderActivities() {
    if (eventData.content.activities.length === 0) {
        elements.activityItems.innerHTML = '';
    } else {
        elements.activityItems.innerHTML = eventData.content.activities.map((activity, index) => `
            <div class="activity-item">
                <div class="handle"><i class="fas fa-grip-vertical"></i></div>
                <div class="content">
                    <input type="text" value="${activity.title}" placeholder="活動項目名稱" onchange="updateActivity(${index}, 'title', this.value)">
                    <textarea placeholder="活動說明" onchange="updateActivity(${index}, 'description', this.value)">${activity.description || ''}</textarea>
                </div>
                <button class="btn-remove" onclick="removeActivity(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
}

function addActivityItem() {
    eventData.content.activities.push({
        title: '',
        description: ''
    });
    renderActivities();
}

function updateActivity(index, field, value) {
    eventData.content.activities[index][field] = value;
}

function removeActivity(index) {
    eventData.content.activities.splice(index, 1);
    renderActivities();
}

// ======================================
// 參與人員
// ======================================
function renderParticipants(roleFilter = null, searchQuery = '') {
    let participants = eventData.participants;

    if (roleFilter && roleFilter !== 'all') {
        participants = participants.filter(p => p.role === roleFilter);
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        participants = participants.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.department && p.department.toLowerCase().includes(query))
        );
    }

    if (participants.length === 0) {
        elements.participantsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: span 3; padding: 60px;">
                <i class="fas fa-users"></i>
                <p>尚未新增參與人員</p>
            </div>
        `;
    } else {
        elements.participantsGrid.innerHTML = participants.map((p, index) => `
            <div class="participant-card">
                <div class="participant-header">
                    <div class="participant-avatar ${p.role}">${p.name.charAt(0)}</div>
                    <div class="participant-info">
                        <h4>${p.name}</h4>
                        <span class="participant-role ${p.role}">${getRoleLabel(p.role)}</span>
                    </div>
                </div>
                <div class="participant-details">
                    ${p.department ? `<p><i class="fas fa-building"></i> ${p.department}</p>` : ''}
                    ${p.phone ? `<p><i class="fas fa-phone"></i> ${p.phone}</p>` : ''}
                    ${p.email ? `<p><i class="fas fa-envelope"></i> ${p.email}</p>` : ''}
                    ${p.notes ? `<p><i class="fas fa-sticky-note"></i> ${p.notes}</p>` : ''}
                </div>
                <div class="participant-actions">
                    <button class="btn-edit" onclick="editParticipant(${eventData.participants.indexOf(p)})">
                        <i class="fas fa-edit"></i> 編輯
                    </button>
                    <button class="btn-delete" onclick="deleteParticipant(${eventData.participants.indexOf(p)})">
                        <i class="fas fa-trash"></i> 刪除
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateParticipantStats();
}

function updateParticipantStats() {
    const counts = {
        host: 0,
        staff: 0,
        speaker: 0,
        attendee: 0
    };

    eventData.participants.forEach(p => {
        if (counts.hasOwnProperty(p.role)) {
            counts[p.role]++;
        }
    });

    elements.hostCount.textContent = counts.host;
    elements.staffCount.textContent = counts.staff;
    elements.speakerCount.textContent = counts.speaker;
    elements.attendeeCount.textContent = counts.attendee;

    updateOverview();
}

function getRoleLabel(role) {
    const labels = {
        host: '主辦',
        staff: '工作人員',
        speaker: '講者',
        attendee: '參加者'
    };
    return labels[role] || role;
}

let editingParticipantIndex = -1;

function addParticipant(data) {
    if (editingParticipantIndex >= 0) {
        eventData.participants[editingParticipantIndex] = data;
        editingParticipantIndex = -1;
        showToast('人員資料已更新', 'success');
    } else {
        eventData.participants.push(data);
        showToast('人員已新增', 'success');
    }
    renderParticipants();
}

function editParticipant(index) {
    editingParticipantIndex = index;
    const p = eventData.participants[index];

    document.getElementById('participantModalTitle').textContent = '編輯人員';
    document.getElementById('participantName').value = p.name;
    document.getElementById('participantRole').value = p.role;
    document.getElementById('participantDepartment').value = p.department || '';
    document.getElementById('participantPhone').value = p.phone || '';
    document.getElementById('participantEmail').value = p.email || '';
    document.getElementById('participantNotes').value = p.notes || '';

    openModal('participant');
}

function deleteParticipant(index) {
    eventData.participants.splice(index, 1);
    renderParticipants();
    showToast('人員已刪除', 'info');
}

// ======================================
// Modal 處理
// ======================================
function setupModalListeners() {
    // Schedule Modal
    document.getElementById('closeScheduleModal').addEventListener('click', () => closeModal('schedule'));
    document.getElementById('cancelScheduleBtn').addEventListener('click', () => closeModal('schedule'));
    document.getElementById('confirmScheduleBtn').addEventListener('click', () => {
        const data = {
            title: document.getElementById('scheduleTitle').value,
            startTime: document.getElementById('scheduleStartTime').value,
            endTime: document.getElementById('scheduleEndTime').value,
            host: document.getElementById('scheduleHost').value,
            description: document.getElementById('scheduleDescription').value,
            color: document.querySelector('input[name="scheduleColor"]:checked').value
        };

        if (!data.title || !data.startTime || !data.endTime) {
            showToast('請填寫必要欄位', 'warning');
            return;
        }

        addSchedule(data);
        closeModal('schedule');
    });

    // Participant Modal
    document.getElementById('closeParticipantModal').addEventListener('click', () => closeModal('participant'));
    document.getElementById('cancelParticipantBtn').addEventListener('click', () => closeModal('participant'));
    document.getElementById('confirmParticipantBtn').addEventListener('click', () => {
        const data = {
            name: document.getElementById('participantName').value,
            role: document.getElementById('participantRole').value,
            department: document.getElementById('participantDepartment').value,
            phone: document.getElementById('participantPhone').value,
            email: document.getElementById('participantEmail').value,
            notes: document.getElementById('participantNotes').value
        };

        if (!data.name) {
            showToast('請輸入姓名', 'warning');
            return;
        }

        addParticipant(data);
        closeModal('participant');
    });

    // Refreshment Modal
    document.getElementById('closeRefreshmentModal').addEventListener('click', () => closeModal('refreshment'));
    document.getElementById('cancelRefreshmentBtn').addEventListener('click', () => closeModal('refreshment'));
    document.getElementById('confirmRefreshmentBtn').addEventListener('click', () => {
        const data = {
            name: document.getElementById('refreshmentName').value,
            quantity: parseInt(document.getElementById('refreshmentQuantity').value) || 1,
            price: parseInt(document.getElementById('refreshmentPrice').value) || 0,
            vendor: document.getElementById('refreshmentVendor').value,
            notes: document.getElementById('refreshmentNotes').value
        };

        if (!data.name) {
            showToast('請輸入品項名稱', 'warning');
            return;
        }

        addRefreshment(data);
        closeModal('refreshment');
    });

    // Task Modal
    document.getElementById('closeTaskModal').addEventListener('click', () => closeModal('task'));
    document.getElementById('cancelTaskBtn').addEventListener('click', () => closeModal('task'));
    document.getElementById('confirmTaskBtn').addEventListener('click', () => {
        const data = {
            title: document.getElementById('taskTitle').value,
            dueDate: document.getElementById('taskDueDate').value,
            priority: document.getElementById('taskPriority').value,
            assignee: document.getElementById('taskAssignee').value
        };

        if (!data.title) {
            showToast('請輸入待辦事項', 'warning');
            return;
        }

        addTask(data);
        closeModal('task');
    });

    // 點擊背景關閉 Modal
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function openModal(type) {
    const modals = {
        schedule: elements.scheduleModal,
        participant: elements.participantModal,
        refreshment: elements.refreshmentModal,
        task: elements.taskModal
    };

    // 重置表單
    if (type === 'schedule' && editingScheduleIndex < 0) {
        document.getElementById('scheduleModalTitle').textContent = '新增流程';
        document.getElementById('scheduleTitle').value = '';
        document.getElementById('scheduleStartTime').value = '';
        document.getElementById('scheduleEndTime').value = '';
        document.getElementById('scheduleHost').value = '';
        document.getElementById('scheduleDescription').value = '';
        document.querySelector('input[name="scheduleColor"][value="#6366f1"]').checked = true;
    }

    if (type === 'participant' && editingParticipantIndex < 0) {
        document.getElementById('participantModalTitle').textContent = '新增人員';
        document.getElementById('participantName').value = '';
        document.getElementById('participantRole').value = 'attendee';
        document.getElementById('participantDepartment').value = '';
        document.getElementById('participantPhone').value = '';
        document.getElementById('participantEmail').value = '';
        document.getElementById('participantNotes').value = '';
    }

    if (type === 'refreshment') {
        document.getElementById('refreshmentName').value = '';
        document.getElementById('refreshmentQuantity').value = '1';
        document.getElementById('refreshmentPrice').value = '0';
        document.getElementById('refreshmentVendor').value = '';
        document.getElementById('refreshmentNotes').value = '';
    }

    if (type === 'task') {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDueDate').value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskAssignee').value = '';
    }

    modals[type].classList.add('active');
}

function closeModal(type) {
    const modals = {
        schedule: elements.scheduleModal,
        participant: elements.participantModal,
        refreshment: elements.refreshmentModal,
        task: elements.taskModal
    };

    modals[type].classList.remove('active');

    // 重置編輯狀態
    if (type === 'schedule') editingScheduleIndex = -1;
    if (type === 'participant') editingParticipantIndex = -1;
}

// ======================================
// Toast 通知
// ======================================
function showToast(message, type = 'info') {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ======================================
// 資料儲存與載入
// ======================================
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventData));
    showToast('資料已儲存', 'success');
}

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(eventData, parsed);
        } catch (e) {
            console.error('載入資料失敗', e);
        }
    }
}

function createNewEvent() {
    if (confirm('確定要建立新活動嗎？目前的資料將會被清除。')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// ======================================
// 匯出企劃書
// ======================================
function exportPlan() {
    const content = generateExportContent();
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `活動企劃書_${eventData.basicInfo.name || '未命名'}_${new Date().toISOString().split('T')[0]}.html`;
    a.click();

    URL.revokeObjectURL(url);
    showToast('企劃書已匯出', 'success');
}

function generateExportContent() {
    const date = eventData.basicInfo.date ? new Date(eventData.basicInfo.date).toLocaleDateString('zh-TW') : '未定';

    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>活動企劃書 - ${eventData.basicInfo.name || '未命名活動'}</title>
    <style>
        body { font-family: 'Noto Sans TC', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
        h1 { text-align: center; color: #6366f1; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
        h2 { color: #4f46e5; margin-top: 30px; border-left: 4px solid #6366f1; padding-left: 12px; }
        h3 { color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f1f5f9; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .info-item { background: #f8fafc; padding: 16px; border-radius: 8px; }
        .info-item label { color: #64748b; font-size: 14px; display: block; margin-bottom: 4px; }
        .info-item span { font-size: 16px; font-weight: 500; }
        .timeline-item { display: flex; align-items: center; gap: 16px; padding: 12px; border-left: 3px solid #6366f1; margin: 8px 0; background: #f8fafc; }
        .timeline-time { min-width: 100px; color: #6366f1; font-weight: 500; }
        .participant { display: inline-block; background: #e0e7ff; color: #4f46e5; padding: 4px 12px; border-radius: 16px; margin: 4px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <h1>📋 ${eventData.basicInfo.name || '未命名活動'}</h1>
    
    <h2>一、基本資訊</h2>
    <div class="info-grid">
        <div class="info-item">
            <label>活動日期</label>
            <span>${date}</span>
        </div>
        <div class="info-item">
            <label>開始時間</label>
            <span>${eventData.basicInfo.time || '未定'}</span>
        </div>
        <div class="info-item">
            <label>活動地點</label>
            <span>${eventData.basicInfo.location || '未定'}</span>
        </div>
        <div class="info-item">
            <label>目標對象</label>
            <span>${eventData.basicInfo.target || '未定'}</span>
        </div>
        <div class="info-item">
            <label>預算金額</label>
            <span>${eventData.basicInfo.budget ? `$${parseInt(eventData.basicInfo.budget).toLocaleString()}` : '未定'}</span>
        </div>
        <div class="info-item">
            <label>參與人數</label>
            <span>${eventData.participants.length} 人</span>
        </div>
    </div>
    
    <h2>二、活動目的</h2>
    <p>${eventData.basicInfo.purpose || '尚未填寫'}</p>
    
    <h2>三、活動流程</h2>
    ${eventData.schedule.length > 0 ?
            eventData.schedule.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(item => `
            <div class="timeline-item">
                <span class="timeline-time">${item.startTime} - ${item.endTime}</span>
                <span><strong>${item.title}</strong>${item.host ? ` (${item.host})` : ''}</span>
            </div>
        `).join('') : '<p>尚未規劃流程</p>'
        }
    
    <h2>四、活動內容</h2>
    <p>${eventData.content.description || '尚未填寫'}</p>
    ${eventData.content.activities.length > 0 ? `
        <h3>活動項目</h3>
        <ul>
            ${eventData.content.activities.map(a => `<li><strong>${a.title}</strong>: ${a.description || ''}</li>`).join('')}
        </ul>
    ` : ''}
    ${eventData.content.materials ? `
        <h3>所需物資/設備</h3>
        <p>${eventData.content.materials}</p>
    ` : ''}
    ${eventData.content.notes ? `
        <h3>注意事項</h3>
        <p>${eventData.content.notes}</p>
    ` : ''}
    
    <h2>五、前置準備</h2>
    <h3>座位安排</h3>
    <p>座位排列: ${getSeatingStyleLabel(eventData.preparation.seating.style)} / 座位數: ${eventData.preparation.seating.count}</p>
    ${eventData.preparation.seating.notes ? `<p>備註: ${eventData.preparation.seating.notes}</p>` : ''}
    
    ${eventData.preparation.refreshments.length > 0 ? `
        <h3>茶點準備</h3>
        <table>
            <tr><th>品項</th><th>數量</th><th>單價</th><th>供應商</th></tr>
            ${eventData.preparation.refreshments.map(r => `
                <tr><td>${r.name}</td><td>${r.quantity}</td><td>$${r.price}</td><td>${r.vendor || '-'}</td></tr>
            `).join('')}
        </table>
    ` : ''}
    
    ${eventData.preparation.tasks.length > 0 ? `
        <h3>待辦事項</h3>
        <table>
            <tr><th>項目</th><th>負責人</th><th>截止日期</th><th>狀態</th></tr>
            ${eventData.preparation.tasks.map(t => `
                <tr><td>${t.title}</td><td>${t.assignee || '-'}</td><td>${t.dueDate || '-'}</td><td>${t.completed ? '✅ 已完成' : '⏳ 待完成'}</td></tr>
            `).join('')}
        </table>
    ` : ''}
    
    <h2>六、參與人員</h2>
    <h3>主辦人員</h3>
    <p>${eventData.participants.filter(p => p.role === 'host').map(p => `<span class="participant">${p.name}</span>`).join('') || '無'}</p>
    
    <h3>工作人員</h3>
    <p>${eventData.participants.filter(p => p.role === 'staff').map(p => `<span class="participant">${p.name}</span>`).join('') || '無'}</p>
    
    <h3>講者</h3>
    <p>${eventData.participants.filter(p => p.role === 'speaker').map(p => `<span class="participant">${p.name}</span>`).join('') || '無'}</p>
    
    <h3>參加者 (${eventData.participants.filter(p => p.role === 'attendee').length} 人)</h3>
    <p>${eventData.participants.filter(p => p.role === 'attendee').map(p => `<span class="participant">${p.name}</span>`).join('') || '無'}</p>
    
    <hr style="margin-top: 40px;">
    <p style="text-align: center; color: #94a3b8; font-size: 12px;">
        此企劃書由「活動企劃管理系統」於 ${new Date().toLocaleString('zh-TW')} 產出
    </p>
</body>
</html>
    `;
}

function getSeatingStyleLabel(style) {
    const labels = {
        'theater': '劇院式',
        'classroom': '教室式',
        'u-shape': 'U型',
        'round': '圓桌',
        'banquet': '宴會式'
    };
    return labels[style] || style;
}

// ======================================
// 渲染所有內容
// ======================================
function renderAll() {
    // 基本資訊
    elements.eventName.value = eventData.basicInfo.name;
    elements.eventDate.value = eventData.basicInfo.date;
    elements.eventTime.value = eventData.basicInfo.time;
    elements.eventLocation.value = eventData.basicInfo.location;
    elements.eventPurpose.value = eventData.basicInfo.purpose;
    elements.eventTarget.value = eventData.basicInfo.target;
    elements.eventBudget.value = eventData.basicInfo.budget;

    // 座位
    elements.seatingStyle.value = eventData.preparation.seating.style;
    elements.seatCount.value = eventData.preparation.seating.count;
    elements.seatingNotes.value = eventData.preparation.seating.notes;

    // 活動內容
    elements.contentDescription.value = eventData.content.description;
    elements.contentMaterials.value = eventData.content.materials;
    elements.contentNotes.value = eventData.content.notes;

    // 渲染列表
    renderRefreshments();
    renderTasks();
    renderSchedule();
    renderActivities();
    renderParticipants();
    updateOverview();
}

// ======================================
// 啟動應用
// ======================================
document.addEventListener('DOMContentLoaded', init);

// 全域函數（供 HTML onclick 使用）
window.deleteRefreshment = deleteRefreshment;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editSchedule = editSchedule;
window.deleteSchedule = deleteSchedule;
window.updateActivity = updateActivity;
window.removeActivity = removeActivity;
window.editParticipant = editParticipant;
window.deleteParticipant = deleteParticipant;
