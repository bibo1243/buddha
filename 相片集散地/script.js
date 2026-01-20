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
// ==========================================
// Director Slideshow (Removed/Hidden)
// ==========================================
function setupDirectorSlideshow() {
    // Functionality removed as per user request
    // Keeping function stub to prevent init errors if called
}

// ==========================================
// Persistence Logic (Local Storage)
// ==========================================
function savePosition(src, left, top, zIndex, transform) {
    const savedData = JSON.parse(localStorage.getItem('photoPositions')) || {};
    savedData[src] = { left, top, zIndex, transform };
    localStorage.setItem('photoPositions', JSON.stringify(savedData));
}

function loadPosition(src) {
    const savedData = JSON.parse(localStorage.getItem('photoPositions')) || {};
    return savedData[src];
}

// ==========================================
// Photo Playground (Draggable)
// ==========================================
// ==========================================
// Photo Playground (Draggable)
// ==========================================
function initPlayground() {
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;

    // Load saved settings
    loadCardSize();

    // Size Control Listener
    const sizeInput = document.getElementById('cardSizeRange');
    if (sizeInput) {
        sizeInput.addEventListener('input', (e) => {
            const size = e.target.value;
            document.documentElement.style.setProperty('--card-size', `${size}px`);
            localStorage.setItem('cardSize', size);
        });
    }

    // 1. Process Director Photos (Right Area)
    if (appData.directorPhotos) {
        const rightMargin = 100;
        appData.directorPhotos.forEach((src, index) => {
            const card = createPolaroid(src);
            card.classList.add('director');

            // Check for saved position
            const saved = loadPosition(src);
            if (saved) {
                card.style.left = saved.left;
                card.style.top = saved.top;
                card.style.zIndex = saved.zIndex || 10;
                card.style.transform = saved.transform || 'rotate(0deg)';
                if (parseInt(saved.zIndex) > state.maxZIndex) state.maxZIndex = parseInt(saved.zIndex);
            } else {
                // Default Right Grid Layout
                const cardW = 180;
                const cardH = 220;

                // Arrange 2 columns on the right
                const cols = 2;
                const c = index % cols;
                const r = Math.floor(index / cols);

                // Position relative to right side
                // x = Width - (Columns * Width) - Margin + (Col Index * Width)
                // Let's anchor to right: 200px from right edge is center of rightmost col

                const baseX = containerW - 350; // Base start X
                const baseY = (containerH / 2) - 300; // Center Y offset

                const x = baseX + (c * 160);
                const y = baseY + (r * 220);

                card.style.left = `${x}px`;
                card.style.top = `${y}px`;
                card.style.transform = `rotate(${Math.random() * 4 - 2}deg)`; // Slight tilt
            }

            elements.playgroundCanvas.appendChild(card);
        });
    }

    // 2. Process Member Photos
    if (appData.memberPhotos) {
        appData.memberPhotos.forEach((src, index) => {
            const card = createPolaroid(src);

            // Check for saved position
            const saved = loadPosition(src);
            if (saved) {
                card.style.left = saved.left;
                card.style.top = saved.top;
                card.style.zIndex = saved.zIndex || 10;
                card.style.transform = saved.transform || 'rotate(0deg)';
                if (parseInt(saved.zIndex) > state.maxZIndex) state.maxZIndex = parseInt(saved.zIndex);
            } else {
                // Default Random Layout (Left/Center area)
                const safeW = containerW - 450; // Leave space for Director area
                const maxLeft = safeW - 150;
                const maxTop = containerH - 250;

                const randomLeft = Math.floor(Math.random() * maxLeft * 0.9) + 20;
                const randomTop = Math.floor(Math.random() * maxTop * 0.8) + 50;
                const randomRot = Math.floor(Math.random() * 40) - 20;

                card.style.left = `${randomLeft}px`;
                card.style.top = `${randomTop}px`;
                card.style.transform = `rotate(${randomRot}deg)`;
            }

            elements.playgroundCanvas.appendChild(card);
        });
    }
}

function loadCardSize() {
    const savedSize = localStorage.getItem('cardSize');
    if (savedSize) {
        document.documentElement.style.setProperty('--card-size', `${savedSize}px`);
        const input = document.getElementById('cardSizeRange');
        if (input) input.value = savedSize;
    }
}

function createPolaroid(src) {
    const div = document.createElement('div');
    div.className = 'story-card';
    div.dataset.src = src; // Store src for saving later

    const img = document.createElement('img');
    img.src = src;
    img.draggable = false;

    div.appendChild(img);

    // Initial z-index (random only if not loaded)
    if (!div.style.zIndex) {
        div.style.zIndex = Math.floor(Math.random() * 10);
    }

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
        if (isDragging) {
            // Save position on end
            const src = element.dataset.src;
            savePosition(src, element.style.left, element.style.top, element.style.zIndex, element.style.transform);
        }

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
        if (isDragging) {
            // Save position on end
            const src = element.dataset.src;
            savePosition(src, element.style.left, element.style.top, element.style.zIndex, element.style.transform);
        }

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
