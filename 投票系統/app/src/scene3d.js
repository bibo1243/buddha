
import confetti from 'canvas-confetti';

let canvas;
let ctx;
let racers = {};
let isInit = false;
let _groups = [];
let raceMode = false;
let raceData = [];
let raceIndex = 0;
let raceMaxVotes = 1;
let containerRef = null;
let raceFinishTime = 0;

// Cinematic State
let slowMo = false;
let slowMoTimer = 0;
let focusTarget = null;
let globalScale = 1;
let globalTranslateX = 0;
let globalTranslateY = 0;
let celebrationTimer = null;
let globalSpeedMultiplier = 1.0; // Init Speed Multiplier

// Image Helper: Render standard sprite but replace color / handle transparency
let frames = [];
let horseSprites = {}; // { 'hexColor': [c1, c2, c3, c4] }

const AVATARS = [
    { name: '熱血紅馬', color: ['#ef4444', '#991b1b'], emoji: '🔴' },
    { name: '陽光橙馬', color: ['#f97316', '#9a3412'], emoji: '🟠' },
    { name: '財富黃馬', color: ['#eab308', '#854d0e'], emoji: '🟡' },
    { name: '幸運綠馬', color: ['#22c55e', '#166534'], emoji: '🟢' },
    { name: '自由藍馬', color: ['#3b82f6', '#1e40af'], emoji: '🔵' },
];

let loadedImages = {};

export function initScene(container, groups) {
    containerRef = container;
    _groups = groups;

    // Load Animation Frames (4-frame loop)
    const srcs = ['/horse-f1.png', '/horse-f2.png', '/horse-f3.png', '/horse-f4.png'];
    let loadedCount = 0;

    srcs.forEach((src, i) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            frames[i] = img;
            loadedCount++;
            if (loadedCount === 4) {
                generateHorseVariants();
            }
        };
    });

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        ctx = canvas.getContext('2d');

        // Add Speed Slider UI
        const controls = document.createElement('div');
        controls.style.position = 'absolute';
        controls.style.bottom = '10px';
        controls.style.left = '10px';
        controls.style.zIndex = '1000';
        controls.style.background = 'rgba(0,0,0,0.5)';
        controls.style.padding = '10px';
        controls.style.borderRadius = '8px';
        controls.style.color = 'white';
        controls.style.display = 'flex';
        controls.style.alignItems = 'center';
        controls.style.gap = '10px';

        controls.innerHTML = `
            <span style="font-size:14px">⚡ 速度: <span id="speed-val">1.0x</span></span>
            <input type="range" id="speed-slider" min="0" max="4" step="0.1" value="1" style="width:100px; accent-color:#fcd34d;">
        `;
        container.appendChild(controls);

        const slider = controls.querySelector('#speed-slider');
        const label = controls.querySelector('#speed-val');
        slider.oninput = (e) => {
            globalSpeedMultiplier = parseFloat(e.target.value);
            label.innerText = globalSpeedMultiplier.toFixed(1) + 'x';
        };

        const resizeObserver = new ResizeObserver(() => resize(container));
        resizeObserver.observe(container);
    }

    resize(container);

    if (Object.keys(racers).length === 0) {
        const shuffled = [...AVATARS].sort(() => Math.random() - 0.5);
        groups.forEach((g, i) => {
            const avatarData = shuffled[i % shuffled.length];
            racers[g] = {
                group: g,
                x: 50,
                targetX: 50,
                type: avatarData.name,
                avatar: avatarData.emoji || '🐎',
                color: Array.isArray(avatarData.color) ? avatarData.color[0] : avatarData.color, // Fallback for single color logic usage
                lane: i,
                wobble: Math.random() * Math.PI * 2,
                currentVotes: 0,
                rank: i + 1,
                lastUpdateStep: 0,
                frameTimer: Math.random() * 4 // Random start frame
            };
        });
        requestAnimationFrame(animate);
    }

    isInit = true;
}

function generateHorseVariants() {
    if (frames.length < 4) return;

    const processFrame = (sourceImg, colorOrGradient) => {
        if (!sourceImg) return null;
        const w = sourceImg.width;
        const h = sourceImg.height;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const cx = c.getContext('2d');

        // Draw source
        cx.drawImage(sourceImg, 0, 0);

        // Remove White Background (Aggressive)
        const imgData = cx.getImageData(0, 0, w, h);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // If basically white/light gray
            if (r > 200 && g > 200 && b > 200) {
                data[i + 3] = 0;
            }
        }
        cx.putImageData(imgData, 0, 0);

        // Tint
        const tintC = document.createElement('canvas');
        tintC.width = w;
        tintC.height = h;
        const tCx = tintC.getContext('2d');

        tCx.drawImage(c, 0, 0);
        tCx.globalCompositeOperation = 'source-in';

        if (Array.isArray(colorOrGradient)) {
            // Linear Gradient (Top-Left to Bottom-Right for sheen effect)
            const grd = tCx.createLinearGradient(0, 0, w, h);
            grd.addColorStop(0, colorOrGradient[0]);
            grd.addColorStop(1, colorOrGradient[1]);
            tCx.fillStyle = grd;
        } else {
            tCx.fillStyle = colorOrGradient;
        }

        tCx.fillRect(0, 0, w, h);

        return tintC;
    };

    AVATARS.forEach(av => {
        const c = av.color;
        horseSprites[av.name] = frames.map(f => processFrame(f, c)).filter(f => f);
    });
}


function resize(container) {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.logicalWidth = container.clientWidth;
    canvas.logicalHeight = container.clientHeight;
}

function animate() {
    requestAnimationFrame(animate);
    if (!ctx) return;

    const width = canvas.logicalWidth;
    const height = canvas.logicalHeight;
    const laneHeight = height / (_groups.length + 1);

    // Determine state
    const isFinished = !raceMode || raceIndex >= raceData.length;
    let champion = null;

    // Always identify champion even if race running (visual rank 1)
    champion = Object.values(racers).find(r => r.visualRank === 1);

    // Check Zoom Timer
    const timeSinceFinish = Date.now() - raceFinishTime;
    const isZoomPhase = isCinematic && isFinished && raceFinishTime > 0 && timeSinceFinish < 4000;

    // Trigger Celebration (Only in Cinematic)
    if (isCinematic && champion && isFinished && raceFinishTime > 0 && !celebrationTimer) {
        // Start Fireworks Loop
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;

        celebrationTimer = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                clearInterval(celebrationTimer);
                celebrationTimer = null;
                return;
            }

            // Fireworks
            const randomX = Math.random();
            confetti({
                particleCount: 50,
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                origin: { x: randomX, y: Math.random() - 0.2 },
                zIndex: 10001
            });

            if (Math.random() > 0.7) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 10001
                });
            }
        }, 800);
    } else if ((!isFinished || raceFinishTime === 0) && celebrationTimer) {
        clearInterval(celebrationTimer);
        celebrationTimer = null;
    }

    // Camera Logic
    let targetScale = 1;
    let targetTX = 0;
    let targetTY = 0;

    // Force Overview if Paused (Speed 0)
    if (globalSpeedMultiplier <= 0) {
        targetScale = 1.0;
        targetTX = 0;
        targetTY = 0;
    } else {
        // Normal Camera Logic below...
    }

    // Check leader for auto-lock
    const currentLeader = Object.values(racers).sort((a, b) => b.currentVotes - a.currentVotes)[0];

    // Camera logic continues below...

    // If we are in raceMode, and raceIndex is close to end (e.g. last 1 step), lock camera?
    // User says "圖1 (Overtake) -> 圖2 (Full) -> 圖3 (Champion)".
    // This implies Overtake happened, SlowMo finished, Scale went back to 1, then Race Finished.

    // To prevent Scale 1: 
    // If the active 'focusTarget' IS the 'currentLeader' AND we are close to finish, keep zooming/following?

    // Better yet: If slowMo is active, AND focusTarget is moving to rank 1, AND race ends soon...
    // Let's try this: If 'slowMo' is ending, but this horse is the winner, transition DIRECTLY to champion zoom?

    // Override target if we are effectively transitioning to champion
    if (globalSpeedMultiplier > 0) {
        if (champion && isFinished && raceFinishTime > 0) { // Champion Zoom Phase
            if (isZoomPhase) {
                targetScale = 5.0;
                const r = champion;
                const rY = (r.lane * laneHeight) + (laneHeight / 2) + 20;
                targetTX = (width / 2 / targetScale) - r.x;
                targetTY = (height / 2 / targetScale) - rY;
            } else {
                targetScale = 1.0;
                targetTX = 0;
                targetTY = 0;
            }
        } else if (slowMo && focusTarget && racers[focusTarget]) {
            // OVERTAKE MODE
            targetScale = 1.5;
            const r = racers[focusTarget];
            const rY = (r.lane * laneHeight) + (laneHeight / 2) + 20;
            targetTX = (width / 2 / targetScale) - r.x;
            targetTY = (height / 2 / targetScale) - rY;
        } else {
            // Default View
            // Only zoom if cinematic
            if (isCinematic && raceMode && raceIndex >= raceData.length - 1 && currentLeader) {
                targetScale = 2.0;
                const r = currentLeader;
                const rY = (r.lane * laneHeight) + (laneHeight / 2) + 20;
                targetTX = (width / 2 / targetScale) - r.x;
                targetTY = (height / 2 / targetScale) - rY;
            } else {
                targetScale = 1.0;
            }
        }
    } else {
        // Paused: Forced Overview
        targetScale = 1.0;
        targetTX = 0;
        targetTY = 0;
    }

    // Smooth Camera lerp
    let camSpeed = 0.05;
    if (isZoomPhase) {
        const dist = Math.abs(targetScale - globalScale);
        if (dist > 0.5) camSpeed = 0.2;
        else camSpeed = 0.05;
    }

    globalScale += (targetScale - globalScale) * camSpeed;
    globalTranslateX += (targetTX - globalTranslateX) * camSpeed;
    globalTranslateY += (targetTY - globalTranslateY) * camSpeed;


    ctx.save();

    // Clear
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    // Champion Background Effect (Only in Zoom)
    if (champion && isZoomPhase) {
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(Date.now() * 0.0005);
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, width * 1.5);
        gradient.addColorStop(0, '#fcd34d66');
        gradient.addColorStop(0.5, '#ef444422');
        gradient.addColorStop(1, '#00000000');
        ctx.fillStyle = gradient;
        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, width * 2, -0.1, 0.1);
            ctx.fill();
        }
        ctx.restore();
    }

    // Apply Camera
    ctx.scale(globalScale, globalScale);
    ctx.translate(globalTranslateX, globalTranslateY);

    // Track
    const finishX = width - 150;
    ctx.fillStyle = '#374151';
    ctx.fillRect(finishX, 0, 10, height);
    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('FINISH', finishX - 35, 30);

    // Calculate Ranks
    const currentRanks = Object.values(racers).sort((a, b) => {
        if (b.currentVotes !== a.currentVotes) return b.currentVotes - a.currentVotes;
        return a.lastUpdateStep - b.lastUpdateStep;
    });
    currentRanks.forEach((r, i) => r.visualRank = i + 1);

    _groups.forEach((g, i) => {
        const racer = racers[g];
        const y = (i * laneHeight) + (laneHeight / 2) + 20;

        // Physics
        const baseSpeed = slowMo ? 0.02 : (raceMode ? 0.1 : 0.1);
        const speed = baseSpeed * globalSpeedMultiplier; // Apply speed multiplier
        racer.x += (racer.targetX - racer.x) * speed;

        const isMoving = Math.abs(racer.targetX - racer.x) > 1;
        // Reduce wobble for running horse image, add slight bobbing
        const wobbleSpeed = slowMo ? 0.005 : 0.02 * globalSpeedMultiplier;
        const hop = isMoving ? Math.sin(Date.now() * wobbleSpeed + racer.wobble) * (slowMo ? 10 : 8) : 0;

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#374151';
        ctx.beginPath();
        ctx.moveTo(0, y + laneHeight / 2);
        ctx.lineTo(width * 2, y + laneHeight / 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(racer.x, y - hop);

        // Effects
        if (racer.visualRank === 1 && isZoomPhase && racer.currentVotes > 0) {
            const pulse = 40 + Math.sin(Date.now() * 0.01) * 10;
            ctx.shadowBlur = pulse;
            ctx.shadowColor = '#fcd34d';
        } else if (racer.x > finishX) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#fcd34d';
        } else if (focusTarget === g && slowMo) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = racer.color;
        }

        // Draw Horse Animation
        // Determine frames
        const sprites = horseSprites[racer.type];

        if (sprites && sprites.length > 0) {
            // Animate
            const animSpeed = (slowMo ? 0.05 : 0.1) * globalSpeedMultiplier; // Also speed up animation frames
            racer.frameTimer += animSpeed;

            const frameIndex = Math.floor(racer.frameTimer) % sprites.length;
            const frameImg = sprites[frameIndex];

            // Draw
            const size = 100; // Adjust size as needed
            // Since sprite might be wide/short, aspect ratio matters.
            // Our sprite frames are fairly square-ish.
            ctx.drawImage(frameImg, -size / 2, -size / 2, size, size);
        } else {
            // Fallback if not loaded
            ctx.fillStyle = racer.color + '44';
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.font = '50px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = "#fff";
            ctx.shadowBlur = 0;
            ctx.fillText(racer.avatar, 0, 0);
        }

        if (racer.scorePulse > 1) {
            racer.scorePulse -= 0.01; // Slower decay
            if (racer.scorePulse < 1) racer.scorePulse = 1;
        }

        // Draw Label Split (Group Name + Score)
        ctx.save();
        ctx.translate(0, -50);

        // 1. Group Name (Normal)
        ctx.textAlign = 'right';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#fff';
        if (racer.visualRank === 1 && isZoomPhase) ctx.fillStyle = '#fcd34d';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(racer.group + ' ', -5, 0);

        // 2. Score (Animated)
        ctx.textAlign = 'left';
        let scale = 1;
        let color = '#fff';
        if (racer.visualRank === 1 && isZoomPhase) color = '#fcd34d';

        if (racer.scorePulse > 1) {
            // Map pulse (1.0~1.5) to scale (1.0~5.0)
            // (1.5 - 1.0) = 0.5 range. We want 4.0 range boost. factor = 8.
            scale = 1 + (racer.scorePulse - 1) * 8;
            color = '#facc15'; // Yellow
            ctx.shadowColor = '#ef4444'; // Fire Red Glow
            ctx.shadowBlur = 30;
        } else {
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
        }

        ctx.fillStyle = color;
        ctx.font = `bold ${20 * scale}px sans-serif`;
        ctx.fillText(`${racer.currentVotes}票`, 0, 0);

        ctx.restore();

        if (slowMo && focusTarget === g) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold italic 28px sans-serif';
            let msg = '';
            if (racer.visualRank === 1) msg = '⚡️ 你最有機會！';
            else if (racer.visualRank === 2) msg = '⚡️ 你入圍了！';

            if (msg) ctx.fillText(msg, 0, -80);
        }

        // Vote Popups
        if (racer.votePopups) {
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            // Filter out old popups (Extended to 2000ms)
            racer.votePopups = racer.votePopups.filter(p => Date.now() - p.time < 2000);

            racer.votePopups.forEach(p => {
                const age = Date.now() - p.time;
                const progress = age / 2000; // Slower float
                const yOff = progress * 70;
                const alpha = 1 - progress;

                ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
                ctx.fillText('+1 票', 0, -60 - yOff);
            });
        }

        // Rank Texts (Winner & Others)
        if (isFinished && raceFinishTime > 0 && racer.currentVotes > 0) {
            let labelText = '';
            let labelColor = '#fcd34d'; // default gold
            let font = 'bold 24px sans-serif';

            if (racer.visualRank === 1) {
                // Dynamic Winner Title based on currentCategory
                labelText = '🏆 ' + CATEGORIES[currentCategory].name;
                font = 'bold 32px sans-serif';
            } else if (racer.visualRank === 2) {
                labelText = '😅 有點可惜...';
                labelColor = '#94a3b8';
            } else if (racer.visualRank === 3) {
                labelText = '💪 下次再來...';
                labelColor = '#94a3b8';
            } else if (racer.visualRank === 4) {
                labelText = '😲 有點錯愕...';
                labelColor = '#64748b';
            } else if (racer.visualRank === 5) {
                labelText = '啊....怎麼會這樣.....';
                labelColor = '#64748b';
            }

            if (labelText) {
                ctx.font = font;
                ctx.fillStyle = labelColor;
                ctx.shadowColor = 'black';
                ctx.shadowBlur = 3;

                if (racer.visualRank === 1) {
                    ctx.fillText(labelText, 0, 60);
                } else {
                    ctx.fillText(labelText, 0, 50);
                }
            }
        }

        ctx.restore();
    });

    ctx.restore();

    // Vignettes
    if (slowMo) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
        ctx.fillRect(0, 0, width, height);
    }

    if (champion && isZoomPhase) {
        const grd = ctx.createRadialGradient(width / 2, height / 2, height / 3, width / 2, height / 2, height);
        grd.addColorStop(0, "transparent");
        grd.addColorStop(1, "rgba(252, 211, 77, 0.2)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(width / 2, 100);
        ctx.fillStyle = "#fcd34d";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 10;
        ctx.fillText(`🎉 冠軍誕生: ${champion.group} 🎉`, 0, 0);
        ctx.restore();
    }
    // Check Manual Next Button Logic
    if (isFinished && raceFinishTime > 0) {
        const timeSinceFinish = Date.now() - raceFinishTime;

        if (isCinematic) {
            // Cinematic Mode: Wait for Zoom (4s) + Overview (4s)
            // Then SHOW BUTTON
            if (timeSinceFinish > 8000) {
                showNextRaceButton();
                // Enable Background Loop
                if (timeSinceFinish > 12000) {
                    restartRace(false);
                }
            }
        } else {
            // In Plain Mode, force button for safety
            if (timeSinceFinish > 3000) {
                showNextRaceButton();
                // Loop if long enough
                if (timeSinceFinish > 6000) {
                    restartRace(false);
                }
            }
        }
    }

    // Draw Category Title Overlay (Centered Top)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = CATEGORIES[currentCategory].color;
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 5;
    ctx.fillText(CATEGORIES[currentCategory].name, width / 2, 20);
    ctx.restore();
}

function showNextRaceButton() {
    if (document.getElementById('next-race-btn')) return; // Already shown

    const btn = document.createElement('button');
    btn.id = 'next-race-btn';

    let nextCat = 'warm';
    let nextName = '';
    if (currentCategory === 'warm') { nextCat = 'fun'; nextName = CATEGORIES.fun.name; }
    else if (currentCategory === 'fun') { nextCat = 'creative'; nextName = CATEGORIES.creative.name; }
    else if (currentCategory === 'creative') { nextCat = 'warm'; nextName = CATEGORIES.warm.name; }

    btn.innerText = `進到下一場「${nextName}」大賽 ➡️`;
    btn.style.position = 'absolute';
    btn.style.bottom = '100px';
    btn.style.left = '50%';
    btn.style.transform = 'translateX(-50%)';
    btn.style.padding = '20px 40px';
    btn.style.fontSize = '24px';
    btn.style.background = '#10b981';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '50px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    btn.className = 'pulse';

    btn.onclick = () => {
        currentCategory = nextCat;
        btn.remove();
        restartRace(true);
    };

    if (containerRef) {
        containerRef.appendChild(btn);
    }
}

export function updateData(votes, groups) {
    if (raceMode) return;

    // In updateData (static mode), ensure positions are simple
    // Logic mostly handled by race loop
    return {};
}

// Variables for loop
let cachedVotes = null;
let cachedGroups = null;
let isCinematic = true;
let currentCategory = 'warm'; // warm, fun, creative

const CATEGORIES = {
    warm: { name: '最滿溫馨獎', color: '#ec4899' },
    fun: { name: '最有趣味獎', color: '#f59e0b' },
    creative: { name: '最富創意獎', color: '#3b82f6' }
};

export function startRace(votes, groups, startVal = 'warm') {
    cachedVotes = votes;
    cachedGroups = groups;
    isCinematic = true;
    currentCategory = startVal;
    restartRace(true);
}

function restartRace(cinematic) {
    if (!cachedVotes || !cachedGroups) return;

    isCinematic = cinematic;
    raceMode = true;
    raceFinishTime = 0;

    if (celebrationTimer) {
        clearInterval(celebrationTimer);
        celebrationTimer = null;
    }

    if (containerRef) {
        containerRef.classList.add('race-fullscreen');
    }

    const groups = cachedGroups;
    const votes = cachedVotes;

    // Tally based on current category
    const counts = tallyVotes(votes, groups, currentCategory);
    raceMaxVotes = Math.max(...Object.values(counts), 1);

    groups.forEach(g => {
        if (racers[g]) {
            racers[g].x = 50;
            racers[g].targetX = 50;
            racers[g].runCount = 0;
            racers[g].currentVotes = 0;
            racers[g].lastUpdateStep = 0;
            racers[g].rank = 0;
            racers[g].votePopups = []; // Init Popups
        }
    });

    let eventQueue = [];
    Object.values(votes).forEach(entry => {
        let choice = null;
        let time = 0;

        // Ensure we handle both "old" (array) and "new" (object) data structure
        // But for this 3-cat logic, we really need the object structure.
        // If array (legacy data), we might just count it for 'warm' or skip?
        // Let's assume new data structure is dominant or mapped.
        // If entry.choices is Array, skip or use index 0 as warm? 
        // Let's just try to read entry.choices[currentCategory] if object.

        let cData = entry.choices;
        if (Array.isArray(cData)) {
            // Legacy fall back: 3 votes, maybe map 0->warm, 1->fun, 2->creative
            if (currentCategory === 'warm') choice = cData[0];
            if (currentCategory === 'fun') choice = cData[1];
            if (currentCategory === 'creative') choice = cData[2];
        } else if (cData && typeof cData === 'object') {
            choice = cData[currentCategory];
        }

        time = entry.timestamp || 0;

        if (choice && groups.includes(choice)) {
            eventQueue.push({ group: choice, time: time });
        }
    });

    eventQueue.sort((a, b) => a.time - b.time);
    raceData = eventQueue;
    raceIndex = 0;

    processRaceStep();
}

function processRaceStep() {
    if (!raceMode) return;

    // Pause Logic
    if (globalSpeedMultiplier <= 0) {
        setTimeout(processRaceStep, 100);
        return;
    }

    if (slowMo) {
        slowMoTimer--;
        if (slowMoTimer <= 0) {
            slowMo = false;
            focusTarget = null;
        } else {
            setTimeout(processRaceStep, 100);
            return;
        }
    }

    if (raceIndex >= raceData.length) {
        raceMode = false;
        raceFinishTime = Date.now();
        return;
    }

    const event = raceData[raceIndex];
    const horse = racers[event.group];

    const oldRanks = {};
    Object.values(racers).forEach(r => oldRanks[r.group] = calculateRankScore(r));

    if (horse) {
        horse.runCount = (horse.runCount || 0) + 1;
        horse.currentVotes = horse.runCount;
        horse.lastUpdateStep = raceIndex;

        // Add Popup
        if (horse.votePopups) {
            horse.votePopups.push({ time: Date.now() });
        }
        horse.scorePulse = 1.5; // Trigger pulse

        const trackWidth = canvas.logicalWidth - 200;
        const pct = horse.runCount / (raceMaxVotes * 1.05);
        horse.targetX = 50 + (pct * trackWidth);

        const newRanks = {};
        Object.values(racers).forEach(r => newRanks[r.group] = calculateRankScore(r));

        const myOldRank = getRankFromScore(oldRanks, event.group);
        const myNewRank = getRankFromScore(newRanks, event.group);

        // Only trigger SlowMo if Cinematic Mode is ON
        if (isCinematic && myNewRank < myOldRank && myNewRank <= 2) {
            slowMo = true;
            slowMoTimer = 25;
            focusTarget = event.group;
        }
    }

    raceIndex++;
    const duration = isCinematic ? 5000 : 3000;
    const baseDelay = Math.max(20, duration / (raceData.length || 1));
    const delay = baseDelay / globalSpeedMultiplier; // Apply speed multiplier
    setTimeout(processRaceStep, delay);
}

function calculateRankScore(r) {
    return (r.currentVotes * 1000000) - r.lastUpdateStep;
}

function getRankFromScore(scoreMap, group) {
    const scores = Object.values(scoreMap).sort((a, b) => b - a);
    const myScore = scoreMap[group];
    return scores.indexOf(myScore) + 1;
}

function tallyVotes(votes, groups, category) {
    const c = {};
    groups.forEach(g => c[g] = 0);
    Object.values(votes).forEach(entry => {
        let choice = null;
        let cData = (entry.choices || entry); // Handle raw array or obj
        if (Array.isArray(cData)) {
            if (category === 'warm') choice = cData[0];
            if (category === 'fun') choice = cData[1];
            if (category === 'creative') choice = cData[2];
        } else if (cData && typeof cData === 'object') {
            choice = cData[category];
        }

        if (choice && c[choice] !== undefined) c[choice]++;
    });
    return c;
}

export function exitFullscreen() {
    if (containerRef) {
        containerRef.classList.remove('race-fullscreen');
        resize(containerRef);
    }
}
