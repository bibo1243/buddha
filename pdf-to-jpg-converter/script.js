// Configure PDF.js worker
// We need to match the version of the main library.
const PDFJS_VERSION = '3.11.174';
const CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/`;

// We inject the main PDF.js library script dynamically to ensure version matching
const script = document.createElement('script');
script.src = `${CDN_URL}pdf.min.js`;
document.head.appendChild(script);

script.onload = () => {
    // Set worker source after library is loaded
    pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN_URL}pdf.worker.min.js`;
    console.log('PDF.js loaded');
    initApp();
};

let filesQueue = [];
let isProcessing = false;
// Concurrency limit to prevent browser crash
const MAX_CONCURRENT_JOBS = 2;
let activeJobs = 0;

function initApp() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const convertBtn = document.getElementById('convert-all-btn');
    const clearBtn = document.getElementById('clear-all-btn');

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // Click to upload
    browseBtn.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('click', (e) => {
        if(e.target !== browseBtn && e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = ''; // Reset for re-uploading same file if needed
    });

    // Actions
    convertBtn.addEventListener('click', startConversion);
    clearBtn.addEventListener('click', clearAll);
}

function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const validFiles = Array.from(fileList).filter(f => f.type === 'application/pdf');
    if (validFiles.length === 0) {
        alert('請上傳 PDF 檔案');
        return;
    }

    // UI Updates
    document.getElementById('controls-area').classList.remove('hidden');
    document.getElementById('file-list-container').classList.remove('hidden');

    validFiles.forEach(file => {
        const id = 'file-' + Math.random().toString(36).substr(2, 9);
        const fileObj = {
            id,
            file,
            status: 'queued', // queued, processing, done, error
            pages: 0
        };
        filesQueue.push(fileObj);
        addFileToUI(fileObj);
    });

    updateStats();
}

function addFileToUI(fileObj) {
    const list = document.getElementById('file-list');
    const div = document.createElement('div');
    div.className = 'file-item';
    div.id = fileObj.id;
    
    div.innerHTML = `
        <div class="file-name">
            <i class="fa-regular fa-file-pdf file-icon"></i>
            <span class="name-text" title="${fileObj.file.name}">${fileObj.file.name}</span>
        </div>
        <div class="file-pages">-</div>
        <div class="file-status">
            <span class="status-badge status-ready"><i class="fa-regular fa-clock"></i> 等待中</span>
            <div class="progress-container">
                <div class="progress-bar"></div>
            </div>
        </div>
        <div class="file-actions">
            <button class="remove-btn" onclick="removeFile('${fileObj.id}')"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `;
    list.appendChild(div);
}

window.removeFile = function(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
    filesQueue = filesQueue.filter(f => f.id !== id);
    updateStats();
    if (filesQueue.length === 0) {
        document.getElementById('controls-area').classList.add('hidden');
        document.getElementById('file-list-container').classList.add('hidden');
    }
}

function clearAll() {
    if (isProcessing) {
        if (!confirm('正在轉換中，確定要取消所有任務嗎？')) return;
    }
    filesQueue = [];
    document.getElementById('file-list').innerHTML = '';
    updateStats();
    document.getElementById('controls-area').classList.add('hidden');
    document.getElementById('file-list-container').classList.add('hidden');
    activeJobs = 0; // Reset
}

function updateStats() {
    const count = filesQueue.length;
    document.getElementById('file-count').textContent = `${count} 個檔案`;
}

function startConversion() {
    const processingBtn = document.getElementById('convert-all-btn');
    if (activeJobs > 0 || isProcessing) return; // Already running logic

    const pending = filesQueue.filter(f => f.status === 'queued');
    if (pending.length === 0) {
        alert('沒有可轉換的檔案');
        return;
    }

    isProcessing = true;
    processingBtn.disabled = true;
    processingBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 轉換中...';
    
    processNext();
}

function processNext() {
    if (activeJobs >= MAX_CONCURRENT_JOBS) return;

    const nextFile = filesQueue.find(f => f.status === 'queued');
    if (!nextFile) {
        if (activeJobs === 0) {
            allDone();
        }
        return;
    }

    activeJobs++;
    nextFile.status = 'processing';
    updateFileStatusGUI(nextFile, 'processing');
    
    convertPDF(nextFile)
        .then(() => {
            nextFile.status = 'done';
            updateFileStatusGUI(nextFile, 'done');
        })
        .catch(err => {
            console.error(err);
            nextFile.status = 'error';
            updateFileStatusGUI(nextFile, 'error', err.message);
        })
        .finally(() => {
            activeJobs--;
            processNext();
        });

    // Try to spawn another worker if slot available
    processNext(); 
}

function allDone() {
    isProcessing = false;
    const btn = document.getElementById('convert-all-btn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-bolt"></i> 重新開始';
    alert('所有檔案處理完成！');
}

function updateFileStatusGUI(fileObj, state, msg='') {
    const el = document.getElementById(fileObj.id);
    if (!el) return;

    const statusEl = el.querySelector('.file-status');
    const actionsEl = el.querySelector('.file-actions');
    const badge = statusEl.querySelector('.status-badge');
    const progressBar = statusEl.querySelector('.progress-bar');
    const progressContainer = statusEl.querySelector('.progress-container');

    if (state === 'processing') {
        badge.className = 'status-badge status-processing';
        badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 轉換中';
        progressContainer.style.display = 'block';
    } else if (state === 'done') {
        badge.className = 'status-badge status-done';
        badge.innerHTML = '<i class="fa-solid fa-check"></i> 完成';
        progressContainer.style.display = 'none';
        
        // Add Download Button
        actionsEl.innerHTML = `
            <button onclick="downloadZip('${fileObj.id}')" class="primary-btn" style="font-size:0.8rem; padding: 5px 10px;">
                <i class="fa-solid fa-download"></i> 下載 JPGs
            </button>
        `;
    } else if (state === 'error') {
        badge.className = 'status-badge status-error';
        badge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 失敗';
        progressContainer.style.display = 'none';
    } else if (state === 'page_progress') {
        // Custom state for progress bar updates
         if (fileObj.totalPages) {
             const pct = Math.round((fileObj.processedPages / fileObj.totalPages) * 100);
             progressBar.style.width = `${pct}%`;
             badge.innerHTML = `轉換中 ${pct}%`;
             
             // Update page count in UI
             el.querySelector('.file-pages').textContent = `${fileObj.processedPages} / ${fileObj.totalPages}`;
         }
    }
}

async function convertPDF(fileObj) {
    try {
        const arrayBuffer = await fileObj.file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        fileObj.totalPages = pdf.numPages;
        fileObj.processedPages = 0;
        fileObj.zip = new JSZip(); // Create zip for this file

        // Update total pages UI
        const el = document.getElementById(fileObj.id);
        if(el) el.querySelector('.file-pages').textContent = `0 / ${pdf.numPages}`;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 }); // High quality 2x scale
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            // Convert to Blob (JPG)
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
            
            // Add to Zip
            // pad page number: page-001.jpg
            const pageNum = String(i).padStart(3, '0');
            fileObj.zip.file(`${fileObj.file.name.replace('.pdf','')}_page-${pageNum}.jpg`, blob);

            fileObj.processedPages++;
            updateFileStatusGUI(fileObj, 'page_progress');
            
            // Free memory
            canvas.width = 0;
            canvas.height = 0;
        }

        return true;
    } catch (e) {
        throw e;
    }
}

window.downloadZip = function(id) {
    const fileObj = filesQueue.find(f => f.id === id);
    if (!fileObj || !fileObj.zip) return;

    fileObj.zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, `${fileObj.file.name.replace('.pdf','')}_images.zip`);
    });
}
