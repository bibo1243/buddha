// Global State
const state = {
    view: 'director', // 'director' or 'playground'
    directorIndex: 0,
    maxZIndex: 100
};

// DOM Elements
const elements = {
    btnDirector: document.getElementById('btnDirector'),
    btnPlayground: document.getElementById('btnPlayground'),
    sectionDirector: document.getElementById('sectionDirector'),
    sectionPlayground: document.getElementById('sectionPlayground'),

    // Director View
    directorImg: document.getElementById('directorImg'),
    directorFrame: document.getElementById('directorFrame'),
    slideCounter: document.getElementById('slideCounter'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),

    // Playground View
    playgroundCanvas: document.getElementById('playgroundCanvas')
};

// ==========================================
// Initialization
// ==========================================
function init() {
    setupNavigation();
    setupDirectorSlideshow();
    initPlayground();
}

// ==========================================
// Navigation
// ==========================================
function setupNavigation() {
    elements.btnDirector.addEventListener('click', () => switchView('director'));
    elements.btnPlayground.addEventListener('click', () => switchView('playground'));
}

function switchView(viewName) {
    if (viewName === state.view) return;

    state.view = viewName;

    // Update Buttons
    if (viewName === 'director') {
        elements.btnDirector.classList.add('active');
        elements.btnPlayground.classList.remove('active');

        elements.sectionDirector.classList.add('active');
        elements.sectionPlayground.classList.remove('active');
    } else {
        elements.btnPlayground.classList.add('active');
        elements.btnDirector.classList.remove('active');

        elements.sectionPlayground.classList.add('active');
        elements.sectionDirector.classList.remove('active');
    }
}

// ==========================================
// Director Slideshow
// ==========================================
function setupDirectorSlideshow() {
    if (!appData.directorPhotos || appData.directorPhotos.length === 0) return;

    // Initial Render
    renderDirectorPhoto(0);

    // Event Listeners
    elements.prevBtn.addEventListener('click', () => changeSlide(-1));
    elements.nextBtn.addEventListener('click', () => changeSlide(1));

    // Click image to next
    elements.directorFrame.addEventListener('click', () => changeSlide(1));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (state.view !== 'director') return;
        if (e.key === 'ArrowLeft') changeSlide(-1);
        if (e.key === 'ArrowRight' || e.key === ' ') changeSlide(1);
    });
}

function changeSlide(direction) {
    const total = appData.directorPhotos.length;
    let newIndex = state.directorIndex + direction;

    // Loop
    if (newIndex >= total) newIndex = 0;
    if (newIndex < 0) newIndex = total - 1;

    state.directorIndex = newIndex;
    renderDirectorPhoto(newIndex);
}

function renderDirectorPhoto(index) {
    const src = appData.directorPhotos[index];

    // Reset opacity instantly for transition effect
    elements.directorImg.style.opacity = '0';
    elements.directorFrame.classList.add('loading');

    setTimeout(() => {
        elements.directorImg.onload = () => {
            elements.directorImg.style.opacity = '1';
            elements.directorFrame.classList.remove('loading');
        };

        elements.directorImg.onerror = () => {
            console.error('Image failed to load:', src);
            // Optionally set a placeholder or keep it hidden/low opacity
            elements.directorImg.alt = '圖片載入失敗: ' + src;
            elements.directorImg.style.opacity = '0.5';
            elements.directorFrame.classList.remove('loading');
        };

        elements.directorImg.src = src;
        elements.slideCounter.textContent = `${index + 1} / ${appData.directorPhotos.length}`;

        // If image is already complete (cached), manually trigger load handler logic
        if (elements.directorImg.complete && elements.directorImg.src.indexOf(src) !== -1) {
            elements.directorImg.style.opacity = '1';
            elements.directorFrame.classList.remove('loading');
        }

    }, 200);
}

// ==========================================
// Photo Playground (Draggable)
// ==========================================
function initPlayground() {
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;

    // Combine photos from both sources
    let allPhotos = [];
    if (appData.directorPhotos) allPhotos = allPhotos.concat(appData.directorPhotos);
    if (appData.memberPhotos) allPhotos = allPhotos.concat(appData.memberPhotos);

    if (allPhotos.length === 0) return;

    allPhotos.forEach((src, index) => {
        const card = createPolaroid(src);

        // Random Position
        // ... (rest of logic remains same, just updated variable name if needed)
        // Keep within bounds (kinda)
        const maxLeft = containerW - 250; // approximate width
        const maxTop = containerH - 300; // approximate height

        const randomLeft = Math.floor(Math.random() * maxLeft * 0.8) + (maxLeft * 0.1);
        const randomTop = Math.floor(Math.random() * maxTop * 0.8) + (maxTop * 0.1);
        const randomRot = Math.floor(Math.random() * 40) - 20; // -20 to 20 deg

        card.style.left = `${randomLeft}px`;
        card.style.top = `${randomTop}px`;
        card.style.transform = `rotate(${randomRot}deg)`;

        elements.playgroundCanvas.appendChild(card);
    });
}

function createPolaroid(src) {
    const div = document.createElement('div');
    div.className = 'story-card';

    const img = document.createElement('img');
    img.src = src;
    img.draggable = false; // Disable native drag

    div.appendChild(img);

    // Initial z-index
    div.style.zIndex = Math.floor(Math.random() * 10);

    // Drag Logic
    setupDrag(div);

    return div;
}

function setupDrag(element) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const onMouseDown = (e) => {
        if (e.button !== 0) return; // Only left click
        isDragging = true;

        // Bring to front
        state.maxZIndex++;
        element.style.zIndex = state.maxZIndex;
        element.classList.add('dragging');

        // Get mouse position
        startX = e.clientX;
        startY = e.clientY;

        // Get current element position
        const style = window.getComputedStyle(element);
        initialLeft = parseInt(style.left || 0);
        initialTop = parseInt(style.top || 0);

        // Attach listeners to document to handle fast movements
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Prevent selection
        e.preventDefault();
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        element.style.left = `${initialLeft + dx}px`;
        element.style.top = `${initialTop + dy}px`;
    };

    const onMouseUp = () => {
        isDragging = false;
        element.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };

    // Touch Support
    const onTouchStart = (e) => {
        isDragging = true;
        state.maxZIndex++;
        element.style.zIndex = state.maxZIndex;
        element.classList.add('dragging');

        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;

        const style = window.getComputedStyle(element);
        initialLeft = parseInt(style.left || 0);
        initialTop = parseInt(style.top || 0);

        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);
    };

    const onTouchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Prevent scrolling while dragging

        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        element.style.left = `${initialLeft + dx}px`;
        element.style.top = `${initialTop + dy}px`;
    };

    const onTouchEnd = () => {
        isDragging = false;
        element.classList.remove('dragging');
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
    };

    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('touchstart', onTouchStart, { passive: false });
}

// Start
document.addEventListener('DOMContentLoaded', init);
