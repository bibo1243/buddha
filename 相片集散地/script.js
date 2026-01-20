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
    if (elements.btnDirector) {
        elements.btnDirector.addEventListener('click', () => switchView('director'));
    }
    if (elements.btnPlayground) {
        elements.btnPlayground.addEventListener('click', () => switchView('playground'));
    }
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
function savePosition(src, left, top, zIndex, transform, width) {
    const savedData = JSON.parse(localStorage.getItem('photoPositions')) || {};
    savedData[src] = { left, top, zIndex, transform, width };
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
    setupZoomControl(); // Initialize zoom slider

    const containerW = window.innerWidth;

    // Grid Configuration for Deterministic Layout
    const cardWidth = 140; // Approximate space including margin
    const cardHeight = 180;
    const cols = Math.floor((containerW - 100) / cardWidth);

    let currentDirectorRow = 0;
    let currentDirectorCol = 0;

    // Start directors from top center
    const directorStartX = (containerW - Math.min(cols, appData.directorPhotos.length) * cardWidth) / 2 + 50;
    const directorStartY = 100;

    // 1. Process Director Photos
    if (appData.directorPhotos) {
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
                card.style.width = saved.width || '130px';
                if (parseInt(saved.zIndex) > state.maxZIndex) state.maxZIndex = parseInt(saved.zIndex);
            } else {
                // Deterministic Layout (Neat Grid)
                const x = directorStartX + (currentDirectorCol * cardWidth);
                const y = directorStartY + (currentDirectorRow * cardHeight);

                card.style.left = `${x}px`;
                card.style.top = `${y}px`;
                card.style.transform = `rotate(0deg)`;

                // Update grid position
                currentDirectorCol++;
                if (currentDirectorCol >= cols) {
                    currentDirectorCol = 0;
                    currentDirectorRow++;
                }
            }

            elements.playgroundCanvas.appendChild(card);
        });
    }

    // Determine start Y for members
    let memberStartX = 50;
    let memberStartY = directorStartY + (currentDirectorRow + 1) * cardHeight + 50;
    let currentMemberCol = 0;
    let currentMemberRow = 0;

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
                card.style.width = saved.width || '130px';
                if (parseInt(saved.zIndex) > state.maxZIndex) state.maxZIndex = parseInt(saved.zIndex);
            } else {
                // Deterministic Grid Layout
                const x = memberStartX + (currentMemberCol * cardWidth);
                const y = memberStartY + (currentMemberRow * cardHeight);

                card.style.left = `${x}px`;
                card.style.top = `${y}px`;
                card.style.transform = `rotate(${((index % 5) - 2) * 2}deg)`;

                // Update grid position
                currentMemberCol++;
                if (currentMemberCol >= cols) {
                    currentMemberCol = 0;
                    currentMemberRow++;
                }
            }

            elements.playgroundCanvas.appendChild(card);
        });
    }
}

function setupZoomControl() {
    const slider = document.getElementById('zoomSlider');
    if (!slider) return;

    slider.addEventListener('input', (e) => {
        const size = e.target.value;
        const cards = document.querySelectorAll('.story-card');
        cards.forEach(card => {
            card.style.width = `${size}px`;
        });
    });
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
            savePosition(src, element.style.left, element.style.top, element.style.zIndex, element.style.transform, element.style.width);
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
            savePosition(src, element.style.left, element.style.top, element.style.zIndex, element.style.transform, element.style.width);
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
