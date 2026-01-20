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
    btnRandomPick: document.getElementById('btnRandomPick'), // New button
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
    if (elements.btnRandomPick) {
        elements.btnRandomPick.addEventListener('click', triggerRandomPick);
    }
}

function triggerRandomPick() {
    const cards = document.querySelectorAll('.story-card');
    if (cards.length === 0) return;

    // First unzoom any currently zoomed card
    const zoomed = document.querySelector('.story-card.zoomed');
    if (zoomed) {
        zoomed.click(); // Programmatically click to unzoom
    }

    // Pick random
    const randomIndex = Math.floor(Math.random() * cards.length);
    const targetCard = cards[randomIndex];

    // Trigger zoom
    // We can simulate a click, but need to ensure it's not dragging or blocked
    // Directly calling the logic or dispatching event is cleaner
    targetCard.click();
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
    // Clear existing content to prevent duplicates on resize
    elements.playgroundCanvas.innerHTML = '';

    // Add hint back
    const hint = document.createElement('div');
    hint.className = 'playground-hint';
    hint.innerHTML = '<i class="fas fa-hand-pointer"></i> 拖曳照片自由排列';
    elements.playgroundCanvas.appendChild(hint);

    const containerW = window.innerWidth;
    const containerH = window.innerHeight;

    // 1. Calculate Optimal Card Size
    // We want to fit all photos in the view with some breathing room.
    // Total Photos
    const directorCount = appData.directorPhotos ? appData.directorPhotos.length : 0;
    const memberCount = appData.memberPhotos ? appData.memberPhotos.length : 0;
    const totalPhotos = directorCount + memberCount;

    if (totalPhotos === 0) return;

    // Available Area (roughly 80% of screen)
    const availableArea = (containerW * containerH) * 0.8;

    // Area per photo
    const areaPerPhoto = availableArea / totalPhotos;

    // Aspect Ratio ~ 0.8 (Width/Height) -> Area = w * (w/0.8) = w^2 / 0.8
    // w^2 = Area * 0.8
    let idealWidth = Math.sqrt(areaPerPhoto * 0.7);

    // Clamp Size
    const MIN_WIDTH = 80;
    const MAX_WIDTH = 250;
    idealWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, idealWidth));

    const cardWidth = idealWidth;
    const cardHeight = idealWidth * 1.4; // Height includes padding/caption space

    // 2. Setup Grid
    const cols = Math.floor((containerW - 50) / (cardWidth + 20)); // +20 for gap
    if (cols <= 0) return; // Screen too small?

    // Calculate centering offset
    const actualGridWidth = cols * (cardWidth + 20);
    const startX = (containerW - actualGridWidth) / 2 + 10;
    const startY = 80; // Top padding

    let currentRow = 0;
    let currentCol = 0;

    // Helper to place card
    const placeCard = (card, index) => {
        const x = startX + (currentCol * (cardWidth + 20));
        const y = startY + (currentRow * (cardHeight + 20));

        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        card.style.width = `${cardWidth}px`;

        // Slight randomness for rotation for ALL cards now
        card.style.transform = `rotate(${((index % 5) - 2) * 2}deg)`;
        card.dataset.originalTransform = card.style.transform; // Store for reset

        elements.playgroundCanvas.appendChild(card);

        // Advance Grid
        currentCol++;
        if (currentCol >= cols) {
            currentCol = 0;
            currentRow++;
        }
    };

    // 3. Process Director Photos
    if (appData.directorPhotos) {
        appData.directorPhotos.forEach((src, index) => {
            const card = createPolaroid(src);
            card.classList.add('director');
            placeCard(card, index);
        });
    }

    // 4. Process Member Photos
    if (appData.memberPhotos) {
        appData.memberPhotos.forEach((src, index) => {
            const card = createPolaroid(src);
            placeCard(card, index);
        });
    }
}

// Auto-adjust layout on resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initPlayground, 200);
});

function createPolaroid(src) {
    const div = document.createElement('div');
    div.className = 'story-card';
    div.dataset.src = src; // Store src for saving later

    const img = document.createElement('img');
    img.src = src;
    img.draggable = false;

    div.appendChild(img);

    // Initial z-index
    div.style.zIndex = Math.floor(Math.random() * 10);
    div.dataset.originalZIndex = div.style.zIndex;

    setupDrag(div);
    setupZoomClick(div); // Add click-to-zoom

    return div;
}

function setupZoomClick(element) {
    element.addEventListener('click', (e) => {
        if (element.classList.contains('dragging')) return; // Ignore clicks if dragging just finished

        // Toggle Zoom State
        if (element.classList.contains('zoomed')) {
            // Unzoom
            element.classList.remove('zoomed');

            // Restore original styles
            element.style.left = element.dataset.originalLeft;
            element.style.top = element.dataset.originalTop;
            element.style.width = element.dataset.originalWidth;
            element.style.transform = element.dataset.originalTransform;
            element.style.zIndex = element.dataset.originalZIndex;

        } else {
            // Zoom to Center
            // Save current state first
            element.dataset.originalLeft = element.style.left;
            element.dataset.originalTop = element.style.top;
            element.dataset.originalWidth = element.style.width;
            // originalTransform is saved at creation or needs update if changed (usually fixed in grid)

            element.classList.add('zoomed');

            // Calculate center
            const containerW = window.innerWidth;
            const containerH = window.innerHeight;

            // Target size (larger)
            const targetWidth = Math.min(containerW, containerH) * 0.8;

            element.style.width = `${targetWidth}px`;
            element.style.zIndex = 9999; // Topmost

            // Center position (CSS centering often easier, but we use absolute)
            // Centered: (W - targetW)/2
            const targetX = (containerW - targetWidth) / 2;
            const targetY = (containerH - (targetWidth * 1.4)) / 2; // Approx aspect ratio height

            element.style.left = `${targetX}px`;
            element.style.top = `${targetY}px`;
            element.style.transform = 'rotate(0deg) scale(1)'; // Straighten
        }
    });
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
