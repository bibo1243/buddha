import './style.css'
import { db, verifyUser } from './db.js'
import QRCode from 'qrcode'
import { initScene, updateData, startRace } from './scene3d.js';

const app = document.querySelector('#app')

// Simple Router
const urlParams = new URLSearchParams(window.location.search)
const isAdmin = urlParams.has('admin')

if (isAdmin) {
  // Simple Password Protection
  const pwd = prompt('🔒 請輸入後台管理密碼：')
  if (pwd === '4321') {
    renderAdmin()
  } else {
    if (pwd !== null) alert('密碼錯誤！(Wrong Password)')
    window.location.href = window.location.pathname
  }
} else {
  renderVoterEntry()
}

// --- Admin Section ---
async function renderAdmin() {
  const groups = await db.getGroups()
  const config = await db.getConfig()

  const statusColor = db.isOnline ? '#10b981' : '#ef4444';
  const statusText = db.isOnline ? '🟢 線上連線模式 (Online)' : '🔴 單機測試模式 (Offline)';
  const statusHint = db.isOnline ? '' : '<p style="color:#ef4444; font-size:0.9em; border:1px solid #ef4444; padding:10px; border-radius:8px; margin-top:5px; background:rgba(239, 68, 68, 0.1);">⚠️ 注意：目前設定不會同步給其他人。<br>請設定 settings/firebase-config.js 以啟用雲端同步。</p>';

  app.innerHTML = `
    <div class="admin-panel">
      <h1>🔧 管理後台 (Admin)</h1>
      <div style="margin-bottom:20px; color:${statusColor}; font-weight:bold;">
          ${statusText}
          ${statusHint}
      </div>
      
      <div class="glass-box" style="padding:20px; margin-bottom:20px; background:rgba(0,0,0,0.3); border-radius:10px;">
        <h3>🔗 投票連結 QR Code</h3>
        <canvas id="qr-canvas"></canvas>
        <p id="qr-url-text" style="color:var(--primary); font-family:monospace; word-break:break-all; margin:5px 0; font-size:0.9em;"></p>
        <p style="color:var(--text-muted)">請掃描此 QR Code 進入投票</p>
      </div>

      <h3>⚙️ 設定 (Settings)</h3>
      <label>每人票數限制 (Votes per person):</label>
      <input type="number" id="max-votes" value="${config.maxVotes || 3}" style="width:100px; display:inline-block; margin-left:10px;">
      <button id="save-config" class="small">儲存設定</button>

      <h3>📝 組別管理 (Groups)</h3>
      <div id="group-list">
        ${groups.map((g, i) => `
          <div class="group-item" style="gap:5px;">
            <input type="text" class="edit-group-input" data-index="${i}" value="${g}" style="margin:0; width:100%; border:1px solid rgba(255,255,255,0.2);">
            <button onclick="window.removeGroup(${i})" style="background:red; color:white; font-size:0.8em; padding:5px 10px;">X</button>
          </div>
        `).join('')}
      </div>
      <button id="save-groups-btn" class="small" style="margin-top:10px; background:#10b981;">💾 保存組別名稱修改</button>
      <div style="margin-top:10px; display:flex; gap:10px;">
        <input type="text" id="new-group-name" placeholder="輸入新組別名稱" style="margin-bottom:0;">
        <button id="add-group-btn" class="primary">新增</button>
      </div>
      <div style="margin-top:20px; border-top:1px solid #444; padding-top:10px;">
          <h3>🧪 模擬測試 (Simulation)</h3>
          <div style="display:flex; gap:10px; align-items:center;">
             <label>模擬人數:</label>
             <input type="number" id="simulate-count" value="50" style="width:80px;">
             <button id="simulate-btn" style="background:#6366f1;">開始模擬</button>
          </div>
          <p style="font-size:0.8em; color:var(--text-muted); margin-top:5px;">*將會清除現有數據並依序生成投票</p>
      </div>

      <hr style="margin:20px 0; border-color:rgba(255,255,255,0.1);">

      <h3>📊 即時戰況 (Results)</h3>
      <div id="results-area">載入中...</div>
      <button id="refresh-results" style="margin-top:10px;">刷新結果</button>
      <button id="reset-data" style="margin-top:10px; background:#b91c1c;">⚠️ 重置所有投票</button>
    </div>
  `

  // Render QR
  const voterUrl = window.location.origin + window.location.pathname; // Ensure clean base URL
  QRCode.toCanvas(document.getElementById('qr-canvas'), voterUrl, { width: 200, color: { dark: '#000000', light: '#ffffff' } })
  document.getElementById('qr-url-text').textContent = voterUrl;

  // Inputs
  const maxVotesInput = document.getElementById('max-votes')
  const newGroupInput = document.getElementById('new-group-name')

  // Handlers
  // --- Results Logic with Real-time 3D ---
  const resultsContainer = document.getElementById('results-area');

  // Initial subscription
  const unsubscribe = db.subscribeVotes((votes) => {
    updateResults3D(votes, groups);
  });

  // Clean up if re-rendered? Admin panel renders once mostly.

  // Handlers (keep defined)
  document.getElementById('refresh-results').style.display = 'none'; // Auto-update now
  document.getElementById('save-config').onclick = async () => {
    await db.setConfig({ ...config, maxVotes: parseInt(maxVotesInput.value) })
    alert('設定已儲存')
  }

  document.getElementById('add-group-btn').onclick = async () => {
    const val = newGroupInput.value.trim()
    if (val) {
      const current = await db.getGroups()
      await db.setGroups([...current, val])
      newGroupInput.value = ''
      renderAdmin() // Re-render
    }
  }

  window.removeGroup = async (idx) => {
    if (!confirm('確定刪除此組別？')) return
    const current = await db.getGroups()
    current.splice(idx, 1)
    await db.setGroups(current)
    renderAdmin()
  }

  document.getElementById('save-groups-btn').onclick = () => {
    const inputs = document.querySelectorAll('.edit-group-input');
    const newGroups = Array.from(inputs).map(input => input.value.trim()).filter(v => v);

    if (newGroups.length === 0) return alert('至少要有一個組別');

    db.setGroups(newGroups).then(() => {
      alert('組別已更新！');
      location.reload();
    }).catch(e => alert(e));
  };

  document.getElementById('add-group-btn').onclick = () => {
    const input = document.getElementById('new-group-name');
    const name = input.value.trim();
    if (name) {
      const newGroups = [...groups, name];
      db.setGroups(newGroups).then(() => {
        input.value = '';
        location.reload();
      });
    }
  };

  // Custom Simulation Logic
  const simBtn = document.getElementById('simulate-btn');
  const simInput = document.getElementById('simulate-count');

  if (simBtn && simInput) {
    simBtn.onclick = async () => {
      const count = parseInt(simInput.value, 10);
      if (isNaN(count) || count <= 0) {
        alert('請輸入有效的數字');
        return;
      }

      if (!confirm(`確定要清除舊資料並生成 ${count} 筆模擬數據嗎？`)) return;

      try {
        simBtn.disabled = true;
        simBtn.innerText = '生成中...';
        await db.simulateVotes(count, groups, true); // true = clear first
        alert(`成功生成 ${count} 筆模擬投票！`);
      } catch (e) {
        alert('生成失敗: ' + e);
      } finally {
        simBtn.disabled = false;
        simBtn.innerText = '🧪 開始模擬';
      }
    };
  }

  // document.getElementById('refresh-results').onclick = (no-op)

  document.getElementById('reset-data').onclick = async () => {
    if (confirm('確定要清空所有人的投票紀錄嗎？此動作無法復原！')) {
      await db.resetVotes()
      alert('已清空')
    }
  }
}

function updateResults3D(votes, groups) {
  const container = document.getElementById('results-area');
  if (!container) return;

  // 1. Prepare Container (Once)
  if (!container.classList.contains('scene-initialized')) {
    container.classList.add('scene-initialized');
    container.innerHTML = ''; // Clear "Loading..."
    container.style.position = 'relative'; // For overlay
    container.style.height = '600px'; // Taller for track

    // Canvas Container
    const canvasDiv = document.createElement('div');
    canvasDiv.style.width = '100%';
    canvasDiv.style.height = '100%';
    container.appendChild(canvasDiv);

    // Replay Button Overlay
    const btnDiv = document.createElement('div');
    btnDiv.style.position = 'absolute';
    btnDiv.style.top = '10px';
    btnDiv.style.right = '10px';
    btnDiv.innerHTML = `<button id="replay-race-btn" style="background:#f59e0b; color:black; font-weight:bold;">🐎 投票大比拼</button>`;
    container.appendChild(btnDiv);

    btnDiv.querySelector('button').onclick = () => {
      startRace(votes, groups);
    };

    initScene(canvasDiv, groups);
  }

  // Update button handler with latest data
  const btn = document.getElementById('replay-race-btn');
  if (btn) {
    btn.onclick = () => startRace(votes, groups);
  }

  // 2. Update Scene (Instant Mode)
  const counts = updateData(votes, groups);

  // 3. Update Text Overlay (Removed as per request)
  // updateScoreboard(counts, groups);
}

// updateScoreboard function removed

// --- Voter Section ---
function renderVoterEntry() {
  app.innerHTML = `
    <div class="login-container">
        <h1>慈馨活動<br>線上投票大比拼</h1>
        <p>請輸入您的姓名以開始投票</p>
        <div id="error-msg" style="color:#ef4444; margin-bottom:10px; height:1.5em;"></div>
        <input type="text" id="voter-name" placeholder="您的真實姓名" />
        <button id="start-btn" class="primary" style="width:100%; margin-top:10px;">開始投票</button>
        <p style="font-size:0.8em; color:#666; margin-top:20px;">需符合摸彩名單方可進入</p>
        
        <div class="admin-badge" id="admin-link">🔒 後台</div>
    </div>
  `

  document.getElementById('admin-link').onclick = () => window.location.search = '?admin=1'

  const btn = document.getElementById('start-btn')
  const input = document.getElementById('voter-name')
  const error = document.getElementById('error-msg')

  const handleLogin = async () => {
    const name = input.value.trim()
    if (!name) return

    btn.textContent = '驗證中...'
    btn.disabled = true
    error.textContent = ''

    const exists = await verifyUser(name)
    if (exists) {
      // Check if already voted
      const votes = await db.getVotes()
      if (votes[name]) {
        alert('您已經完成投票囉！謝謝您的參與。')
        btn.textContent = '開始投票'
        btn.disabled = false
        return
      }
      renderVotingInterface(name)
    } else {
      error.textContent = '找不到此姓名，請確認後再試'
      btn.textContent = '開始投票'
      btn.disabled = false
    }
  }

  btn.onclick = handleLogin
}

async function renderVotingInterface(user) {
  const groups = await db.getGroups()

  // State for 3 categories
  // keys: warm, fun, creative
  let choices = {
    warm: null,
    fun: null,
    creative: null
  };

  const categories = [
    { id: 'warm', title: '💖 最滿溫馨獎', desc: '選出最讓您感動的一組' },
    { id: 'fun', title: '🤣 最有趣味獎', desc: '選出最讓您捧腹大笑的一組' },
    { id: 'creative', title: '💡 最富創意獎', desc: '選出最有創意巧思的一組' }
  ];

  const renderCards = (catId) => {
    return groups.map((g, i) => `
          <div class="card choice-card" data-cat="${catId}" data-group="${g}" style="cursor:pointer; opacity: 0.6;">
              <div class="card-face" style="padding:10px;">
                  <span class="card-number" style="font-size:0.8em;">#${i + 1}</span>
                  <div class="card-title" style="font-size:1em;">${g}</div>
                  <div class="check-mark">✔</div>
              </div>
          </div>
      `).join('');
  };

  const updateUI = () => {
    // Check validation
    const allSelected = choices.warm && choices.fun && choices.creative;
    const btn = document.getElementById('submit-vote');
    if (allSelected) {
      btn.style.display = 'inline-block';
      btn.classList.add('pulse');
    } else {
      btn.style.display = 'none';
    }

    // Update Cards Visual State
    ['warm', 'fun', 'creative'].forEach(cat => {
      document.querySelectorAll(`.choice-card[data-cat="${cat}"]`).forEach(card => {
        const g = card.dataset.group;
        if (choices[cat] === g) {
          card.classList.add('selected');
          card.style.opacity = '1';
          card.style.border = '2px solid var(--primary)';
          card.style.transform = 'scale(1.05)';
        } else {
          card.classList.remove('selected');
          card.style.opacity = '0.6';
          card.style.border = 'none';
          card.style.transform = 'scale(1)';
        }
      });
    });
  };

  app.innerHTML = `
    <header style="margin-bottom:20px;">
        <h2 style="font-size:1.5rem">Hello, ${user}</h2>
        <p>請為每個獎項投下一票！(每人共 3 票)</p>
    </header>

    <div style="max-width: 800px; margin: 0 auto; text-align: left;">
        ${categories.map(cat => `
            <div class="category-block" style="margin-bottom: 30px;">
                <h3 style="color: var(--primary); border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">
                    ${cat.title} <span style="font-size:0.8em; color:#bbb; font-weight:normal; margin-left:10px;">${cat.desc}</span>
                </h3>
                <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;">
                    ${renderCards(cat.id)}
                </div>
            </div>
        `).join('')}
    </div>

    <div style="position:fixed; bottom:20px; left:0; right:0; text-align:center; pointer-events:none; z-index:100;">
        <button id="submit-vote" class="primary" style="pointer-events:auto; padding:15px 40px; font-size:1.2rem; display:none; box-shadow:0 10px 20px rgba(0,0,0,0.5);">
            確認送出投票 🚀
        </button>
    </div>
  `

  // Bind Events
  document.querySelectorAll('.choice-card').forEach(card => {
    card.onclick = () => {
      const cat = card.dataset.cat;
      const group = card.dataset.group;

      // Toggle off if clicking same? Or just switch. Usually switch is better UX.
      // Or allow deselect?
      if (choices[cat] === group) {
        choices[cat] = null;
      } else {
        choices[cat] = group;
      }
      updateUI();
    }
  });

  document.getElementById('submit-vote').onclick = async () => {
    if (!confirm(`確認要送出這 3 票嗎？送出後無法修改喔！`)) return

    try {
      // Format: { warm: 'A', fun: 'B', creative: 'C' }
      // DB expects "choices" to be something. 
      // Existing code used ARRAY.
      // We can save OBJECT now.
      await db.submitVote(user, choices);
      renderThanks();
    } catch (e) {
      alert(e)
    }
  }
}

function renderThanks() {
  app.innerHTML = `
        <div style="margin-top:20vh;">
            <h1>🎉 投票成功！</h1>
            <p style="font-size:1.5rem;">感謝您的參與</p>
            <p>請靜候頒獎典禮</p>
            <button onclick="location.reload()" style="margin-top:20px;">回到首頁</button>
        </div>
    `
}
