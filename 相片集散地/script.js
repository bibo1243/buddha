// Global State
const state = {
    view: 'director', // 'director' or 'playground'
    directorIndex: 0,
    maxZIndex: 100,
    allPhotos: [], // Combined and shuffled photos
    loadedCount: 0,
    totalCount: 0,
    isZoomed: false // Track if any card is zoomed
};

// DOM Elements
const elements = {
    btnDirector: document.getElementById('btnDirector'),
    btnPlayground: document.getElementById('btnPlayground'),
    btnRandomPick: document.getElementById('btnRandomPick'),
    sectionDirector: document.getElementById('sectionDirector'),
    sectionPlayground: document.getElementById('sectionPlayground'),

    // Director View
    directorImg: document.getElementById('directorImg'),
    directorFrame: document.getElementById('directorFrame'),
    slideCounter: document.getElementById('slideCounter'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),

    // Playground View
    playgroundCanvas: document.getElementById('playgroundCanvas'),

    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    progressBar: document.getElementById('progressBar'),
    loadingPercent: document.getElementById('loadingPercent')
};

// ==========================================
// Initialization
// ==========================================
function init() {
    setupNavigation();
    setupDirectorSlideshow();
    preloadImagesAndInit();
}

// ==========================================
// Preload Images with Progress
// ==========================================
function preloadImagesAndInit() {
    // Combine all photos (directors marked with 'isDirector' flag)
    const directorPhotos = (appData.directorPhotos || []).map(src => ({ src, isDirector: true }));
    const memberPhotos = (appData.memberPhotos || []).map(src => ({ src, isDirector: false }));

    // Combine and Shuffle
    state.allPhotos = [...directorPhotos, ...memberPhotos];
    shuffleArray(state.allPhotos);

    state.totalCount = state.allPhotos.length;
    state.loadedCount = 0;

    if (state.totalCount === 0) {
        hideLoadingOverlay();
        return;
    }

    // Preload each image
    state.allPhotos.forEach(photoData => {
        const img = new Image();
        img.onload = () => onImageLoaded();
        img.onerror = () => onImageLoaded(); // Count errors too
        img.src = photoData.src;
    });
}

function onImageLoaded() {
    state.loadedCount++;
    const percent = Math.round((state.loadedCount / state.totalCount) * 100);

    if (elements.progressBar) {
        elements.progressBar.style.width = `${percent}%`;
    }
    if (elements.loadingPercent) {
        elements.loadingPercent.textContent = `${percent}%`;
    }

    if (state.loadedCount >= state.totalCount) {
        // All loaded, init playground
        setTimeout(() => {
            hideLoadingOverlay();
            initPlayground();
        }, 300);
    }
}

function hideLoadingOverlay() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            elements.loadingOverlay.style.display = 'none';
        }, 500);
    }
}

// Fisher-Yates Shuffle
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
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
    const btn = document.getElementById('btnRandomPick');
    if (btn && btn.classList.contains('brewing')) return;

    const cards = document.querySelectorAll('.story-card');
    if (cards.length === 0) return;

    if (btn) {
        btn.classList.add('brewing');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 祝福集氣中...';

        // Add brewing effect delay
        setTimeout(() => {
            btn.classList.remove('brewing');
            btn.innerHTML = originalText;
            performPick(cards);
        }, 1500);
    } else {
        performPick(cards);
    }
}

function performPick(cards) {
    // First unzoom any currently zoomed card
    const zoomed = document.querySelector('.story-card.zoomed');
    if (zoomed) {
        unzoomCard(zoomed);

        // Small delay to allow unzoom animation to start before zooming new one
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * cards.length);
            const targetCard = cards[randomIndex];
            zoomCard(targetCard);
        }, 300);
    } else {
        // Pick random
        const randomIndex = Math.floor(Math.random() * cards.length);
        const targetCard = cards[randomIndex];
        zoomCard(targetCard);
    }
}

// ==========================================
// Zoom Functions (Separated from Click)
// ==========================================
function zoomCard(element) {
    // Check/Reset other zoomed cards
    const currentZoomed = document.querySelector('.story-card.zoomed');
    if (currentZoomed && currentZoomed !== element) {
        unzoomCard(currentZoomed);
    }

    // Save current state first
    element.dataset.originalLeft = element.style.left;
    element.dataset.originalTop = element.style.top;
    element.dataset.originalWidth = element.style.width;

    element.classList.add('zoomed');
    state.isZoomed = true; // Set zoomed state

    // Calculate center
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;

    // Target size (reduced to be smaller as requested)
    const targetWidth = Math.min(containerW, containerH) * 0.6;

    element.style.width = `${targetWidth}px`;
    element.style.zIndex = 9999; // Topmost

    // Center position
    const targetX = (containerW - targetWidth) / 2;
    const targetY = (containerH - (targetWidth * 1.4)) / 2;

    element.style.left = `${targetX}px`;
    element.style.top = `${targetY}px`;
    element.style.transform = 'rotate(0deg) scale(1)'; // Straighten

    // Move button to left
    const btn = document.getElementById('btnRandomPick');
    if (btn) {
        btn.classList.add('moved-left');
    }
}

function unzoomCard(element) {
    element.classList.remove('zoomed');
    element.classList.add('unzooming'); // Add class for smooth transition
    state.isZoomed = false; // Clear zoomed state

    // Restore original styles
    element.style.left = element.dataset.originalLeft;
    element.style.top = element.dataset.originalTop;
    element.style.width = element.dataset.originalWidth;
    element.style.transform = element.dataset.originalTransform;
    element.style.zIndex = element.dataset.originalZIndex;

    // Move button back to center
    const btn = document.getElementById('btnRandomPick');
    if (btn) {
        btn.classList.remove('moved-left');
    }

    // Remove unzooming class after transition completes
    setTimeout(() => {
        element.classList.remove('unzooming');
    }, 500);
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
// Director Slideshow (Removed/Hidden)
// ==========================================
function setupDirectorSlideshow() {
    // Functionality removed as per user request
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
function initPlayground() {
    // Clear existing content to prevent duplicates on resize
    elements.playgroundCanvas.innerHTML = '';

    // Add hint back
    const hint = document.createElement('div');
    hint.className = 'playground-hint';
    hint.innerHTML = '<i class="fas fa-hand-pointer"></i> 拖曳照片自由排列';
    elements.playgroundCanvas.appendChild(hint);

    const containerW = window.innerWidth;
    const containerH = window.innerHeight - 70; // Subtract nav height

    const totalPhotos = state.allPhotos.length;

    if (totalPhotos === 0) return;

    // Calculate Optimal Card Size to fit all cards within viewport
    const availableArea = (containerW * containerH) * 0.75;
    const areaPerPhoto = availableArea / totalPhotos;
    let idealWidth = Math.sqrt(areaPerPhoto * 0.7);

    // Clamp Size
    const MIN_WIDTH = 60;
    const MAX_WIDTH = 200;
    idealWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, idealWidth));

    const cardWidth = idealWidth;
    const cardHeight = idealWidth * 1.4;

    // Setup Grid
    const cols = Math.floor((containerW - 30) / (cardWidth + 15));
    if (cols <= 0) return;

    const actualGridWidth = cols * (cardWidth + 15);
    const startX = (containerW - actualGridWidth) / 2 + 10;
    const startY = 70; // Top padding (reduced from 80)

    let currentRow = 0;
    let currentCol = 0;

    // Process all shuffled photos with scattered positions
    state.allPhotos.forEach((photoData, index) => {
        const card = createPolaroid(photoData.src);
        if (photoData.isDirector) {
            card.classList.add('director');
        }

        // Calculate base grid position
        const baseX = startX + (currentCol * (cardWidth + 15));
        const baseY = startY + (currentRow * (cardHeight + 15));

        // Add random offset for scattered effect
        const randomOffsetX = (Math.random() - 0.5) * 30; // -15 to +15 px
        const randomOffsetY = (Math.random() - 0.5) * 20; // -10 to +10 px

        card.style.left = `${baseX + randomOffsetX}px`;
        card.style.top = `${baseY + randomOffsetY}px`;
        card.style.width = `${cardWidth}px`;

        // More random rotation (-8 to +8 degrees)
        const randomRotation = (Math.random() - 0.5) * 16;
        card.style.transform = `rotate(${randomRotation}deg)`;
        card.dataset.originalTransform = card.style.transform;

        elements.playgroundCanvas.appendChild(card);

        // Advance Grid
        currentCol++;
        if (currentCol >= cols) {
            currentCol = 0;
            currentRow++;
        }
    });
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
    div.dataset.src = src;

    const img = document.createElement('img');
    img.src = src;
    img.draggable = false;

    div.appendChild(img);

    // Initial z-index
    div.style.zIndex = Math.floor(Math.random() * 10);
    div.dataset.originalZIndex = div.style.zIndex;

    setupDrag(div);
    // Click-to-zoom removed per user request
    // Only clicking zoomed card should unzoom
    div.addEventListener('click', (e) => {
        if (div.classList.contains('dragging')) return;

        // If this card is zoomed, unzoom it
        if (div.classList.contains('zoomed')) {
            unzoomCard(div);
            return;
        }

        // If another card is zoomed, ignore clicks on this card
        if (state.isZoomed) return;
    });

    return div;
}

function setupDrag(element) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    const onMouseDown = (e) => {
        if (e.button !== 0) return;

        // If any card is zoomed, disable dragging
        if (state.isZoomed) return;

        isDragging = true;

        // Bring to front
        state.maxZIndex++;
        element.style.zIndex = state.maxZIndex;
        element.classList.add('dragging');

        startX = e.clientX;
        startY = e.clientY;

        const style = window.getComputedStyle(element);
        initialLeft = parseInt(style.left || 0);
        initialTop = parseInt(style.top || 0);

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

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
        // If any card is zoomed, disable dragging
        if (state.isZoomed) return;

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
        e.preventDefault();

        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        element.style.left = `${initialLeft + dx}px`;
        element.style.top = `${initialTop + dy}px`;
    };

    const onTouchEnd = () => {
        if (isDragging) {
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
