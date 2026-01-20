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
// Photo Playground (Draggable)
// ==========================================
function initPlayground() {
    const containerW = window.innerWidth;
    const containerH = window.innerHeight;
    const centerX = containerW / 2;
    const centerY = containerH / 2;

    // 1. Process Director Photos (Grouped in center/top area)
    if (appData.directorPhotos) {
        // Arrange in a circle or grid
        const radius = 200; // Radius for circular arrangement
        const totalDirectors = appData.directorPhotos.length;
        const angleStep = (2 * Math.PI) / totalDirectors;

        appData.directorPhotos.forEach((src, index) => {
            const card = createPolaroid(src);
            card.classList.add('director'); // Add gold style

            // Arrange in a circle around center, or a specific area
            // Let's put them in a nice arc or circle in the upper center
            const angle = index * angleStep;
            // Center position for the director group
            const groupCenterX = containerW / 2;
            const groupCenterY = containerH / 2;

            const x = groupCenterX + radius * Math.cos(angle) - 100; // -100 to center the card center
            const y = groupCenterY + radius * Math.sin(angle) - 150; // -150 to center vertically

            card.style.left = `${x}px`;
            card.style.top = `${y}px`;
            card.style.transform = `rotate(0deg)`; // Straight for dignity

            elements.playgroundCanvas.appendChild(card);
        });
    }

    // 2. Process Member Photos (Randomly scattered)
    if (appData.memberPhotos) {
        appData.memberPhotos.forEach((src, index) => {
            const card = createPolaroid(src);

            const maxLeft = containerW - 250;
            const maxTop = containerH - 300;

            let randomLeft = Math.floor(Math.random() * maxLeft * 0.8) + (maxLeft * 0.1);
            let randomTop = Math.floor(Math.random() * maxTop * 0.8) + (maxTop * 0.1);

            // Avoid the exact center where directors are (optional, but simple random is usually fine)

            const randomRot = Math.floor(Math.random() * 40) - 20;

            card.style.left = `${randomLeft}px`;
            card.style.top = `${randomTop}px`;
            card.style.transform = `rotate(${randomRot}deg)`;

            elements.playgroundCanvas.appendChild(card);
        });
    }
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
