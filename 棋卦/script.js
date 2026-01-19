document.addEventListener('DOMContentLoaded', () => {
    const drawBtn = document.getElementById('draw-btn');
    const resetBtn = document.getElementById('reset-btn');
    const slotsContainer = document.getElementById('chess-slots');
    const interpretationArea = document.getElementById('result-interpretation');
    const interpretationGrid = document.getElementById('interpretation-grid');
    const mode5Btn = document.getElementById('mode-5-btn');
    const mode3Btn = document.getElementById('mode-3-btn');

    // Default Mode
    let currentMode = 5;

    // Positions for 5-piece reading - Cross layout order:
    // Index 0: Top (Career), Index 1: Left (Spouse), Index 2: Center (Self), Index 3: Right (Siblings), Index 4: Bottom (Wealth)
    const POSITIONS_5 = [
        { name: '長輩 / 事業', desc: '上司、貴人與成就', role: 'career', gridArea: 'top' },
        { name: '配偶 / 妻財', desc: '感情與金錢流向', role: 'spouse', gridArea: 'left' },
        { name: '自己', desc: '目前狀態與心境', role: 'self', gridArea: 'center' },
        { name: '朋友 / 手足', desc: '平輩助力與人際', role: 'siblings', gridArea: 'right' },
        { name: '子孫 / 財庫', desc: '投資成果與晚運', role: 'wealth', gridArea: 'bottom' }
    ];

    const POSITIONS_3 = [
        { name: '因 (成因)', desc: '過去的成因、動機', role: 'cause' },
        { name: '緣 (過程)', desc: '現在的狀態、助力/阻力', role: 'process' },
        { name: '果 (結果)', desc: '未來的結果、方向', role: 'result' }
    ];

    // Define the full set of 32 Xiangqi pieces with meanings from the lecture notes
    // Red = Positive energy, Black = Challenges/Warnings (not necessarily bad)
    const PIECES = [
        // Red Pieces (16) - Positive Polarity
        {
            name: '帥', color: 'red', type: 'general', energy: 100,
            meaning: '操之在我',
            detail: '形勢大好，掌控能力強。代表自身狀態最佳，能主導事態發展。',
            advice: '可積極行動，把握主導權。'
        },
        {
            name: '仕', color: 'red', type: 'advisor', energy: 90,
            meaning: '職場順利',
            detail: '代表工作運順暢，上司支持，同事助力。若在配偶位，表示伴侶支持。',
            advice: '貴人運佳，可把握機會升遷或合作。'
        },
        {
            name: '仕', color: 'red', type: 'advisor', energy: 90,
            meaning: '職場順利',
            detail: '代表工作運順暢，上司支持，同事助力。若在配偶位，表示伴侶支持。',
            advice: '貴人運佳，可把握機會升遷或合作。'
        },
        {
            name: '相', color: 'red', type: 'elephant', energy: 80,
            meaning: '吉人天相',
            detail: '有貴人暗中相助，起運良好。代表好的兆頭，事情會往好的方向發展。',
            advice: '放心前行，自有貴人扶持。'
        },
        {
            name: '相', color: 'red', type: 'elephant', energy: 80,
            meaning: '吉人天相',
            detail: '有貴人暗中相助，起運良好。代表好的兆頭，事情會往好的方向發展。',
            advice: '放心前行，自有貴人扶持。'
        },
        {
            name: '俥', color: 'red', type: 'chariot', energy: 70,
            meaning: '面面俱到',
            detail: '思慮周全，考慮得當。代表決策正確，方向對了。車是往前推進的力量。',
            advice: '繼續保持，該出手時就出手，行動力強。'
        },
        {
            name: '俥', color: 'red', type: 'chariot', energy: 70,
            meaning: '面面俱到',
            detail: '思慮周全，考慮得當。代表決策正確，方向對了。車是往前推進的力量。',
            advice: '繼續保持，該出手時就出手，行動力強。'
        },
        {
            name: '傌', color: 'red', type: 'horse', energy: 60,
            meaning: '馬到成功',
            detail: '付出會有成果，努力被看見。代表辛勞會有回報，事業順利。',
            advice: '持續努力，勝利在望。'
        },
        {
            name: '傌', color: 'red', type: 'horse', energy: 60,
            meaning: '馬到成功',
            detail: '付出會有成果，努力被看見。代表辛勞會有回報，事業順利。',
            advice: '持續努力，勝利在望。'
        },
        {
            name: '炮', color: 'red', type: 'cannon', energy: 50,
            meaning: '財運亨通',
            detail: '錢財流通順暢，有偏財運。炮需要有炮架（貴人）才能發揮威力。',
            advice: '可嘗試投資或新的財務計畫，但需有人脈配合。'
        },
        {
            name: '炮', color: 'red', type: 'cannon', energy: 50,
            meaning: '財運亨通',
            detail: '錢財流通順暢，有偏財運。炮需要有炮架（貴人）才能發揮威力。',
            advice: '可嘗試投資或新的財務計畫，但需有人脈配合。'
        },
        {
            name: '兵', color: 'red', type: 'soldier', energy: 40,
            meaning: '遇事無礙',
            detail: '雖非大吉，但過程順暢，水到渠成。代表穩定前進，雖慢但穩。',
            advice: '按部就班，不要急躁，時間會給答案。'
        },
        {
            name: '兵', color: 'red', type: 'soldier', energy: 40,
            meaning: '遇事無礙',
            detail: '雖非大吉，但過程順暢，水到渠成。代表穩定前進，雖慢但穩。',
            advice: '按部就班，不要急躁，時間會給答案。'
        },
        {
            name: '兵', color: 'red', type: 'soldier', energy: 40,
            meaning: '遇事無礙',
            detail: '雖非大吉，但過程順暢，水到渠成。代表穩定前進，雖慢但穩。',
            advice: '按部就班，不要急躁，時間會給答案。'
        },
        {
            name: '兵', color: 'red', type: 'soldier', energy: 40,
            meaning: '遇事無礙',
            detail: '雖非大吉，但過程順暢，水到渠成。代表穩定前進，雖慢但穩。',
            advice: '按部就班，不要急躁，時間會給答案。'
        },
        {
            name: '兵', color: 'red', type: 'soldier', energy: 40,
            meaning: '遇事無礙',
            detail: '雖非大吉，但過程順暢，水到渠成。代表穩定前進，雖慢但穩。',
            advice: '按部就班，不要急躁，時間會給答案。'
        },

        // Black Pieces (16) - Challenging Polarity (Not inherently bad)
        {
            name: '將', color: 'black', type: 'general', energy: -100,
            meaning: '形勢不利',
            detail: '需謹慎行事，目前非主導方。代表處於被動，需等待時機。',
            advice: '低調蓄力，勿強出頭，養精蓄銳。'
        },
        {
            name: '士', color: 'black', type: 'advisor', energy: -90,
            meaning: '職場不順',
            detail: '工作上可能有波折，或與上司意見相左。需注意人事變動。',
            advice: '韜光養晦，專注本職，減少議論。'
        },
        {
            name: '士', color: 'black', type: 'advisor', energy: -90,
            meaning: '職場不順',
            detail: '工作上可能有波折，或與上司意見相左。需注意人事變動。',
            advice: '韜光養晦，專注本職，減少議論。'
        },
        {
            name: '象', color: 'black', type: 'elephant', energy: -80,
            meaning: '小人常現',
            detail: '可能有閒言碎語、是非，或遭人嫉妒。優秀表現可能引發不適。',
            advice: '低調做事，不解釋不爭辯，用成果說話。'
        },
        {
            name: '象', color: 'black', type: 'elephant', energy: -80,
            meaning: '小人常現',
            detail: '可能有閒言碎語、是非，或遭人嫉妒。優秀表現可能引發不適。',
            advice: '低調做事，不解釋不爭辯，用成果說話。'
        },
        {
            name: '車', color: 'black', type: 'chariot', energy: -70,
            meaning: '考慮欠妥',
            detail: '決策可能有疏漏，思慮不夠周全。或行動過於衝動。',
            advice: '三思而後行，多請教他人意見。'
        },
        {
            name: '車', color: 'black', type: 'chariot', energy: -70,
            meaning: '考慮欠妥',
            detail: '決策可能有疏漏，思慮不夠周全。或行動過於衝動。',
            advice: '三思而後行，多請教他人意見。'
        },
        {
            name: '馬', color: 'black', type: 'horse', energy: -60,
            meaning: '辛勞無果',
            detail: '付出辛苦卻難見成效，感覺事倍功半。但這也代表需要調整方向。',
            advice: '檢視方法，調整策略，勿執著於舊路。'
        },
        {
            name: '馬', color: 'black', type: 'horse', energy: -60,
            meaning: '辛勞無果',
            detail: '付出辛苦卻難見成效，感覺事倍功半。但這也代表需要調整方向。',
            advice: '檢視方法，調整策略，勿執著於舊路。'
        },
        {
            name: '包', color: 'black', type: 'cannon', energy: -50,
            meaning: '財運不佳',
            detail: '錢財流動受阻，或有破財之象。平輩間可能有資源爭奪。',
            advice: '謹慎理財，避免借貸，減少投機。'
        },
        {
            name: '包', color: 'black', type: 'cannon', energy: -50,
            meaning: '財運不佳',
            detail: '錢財流動受阻，或有破財之象。平輩間可能有資源爭奪。',
            advice: '謹慎理財，避免借貸，減少投機。'
        },
        {
            name: '卒', color: 'black', type: 'soldier', energy: -40,
            meaning: '外援不足',
            detail: '助力較少，需靠自己。或代表阻礙較多，進展緩慢。',
            advice: '自力更生，穩紮穩打，一步一腳印。'
        },
        {
            name: '卒', color: 'black', type: 'soldier', energy: -40,
            meaning: '外援不足',
            detail: '助力較少，需靠自己。或代表阻礙較多，進展緩慢。',
            advice: '自力更生，穩紮穩打，一步一腳印。'
        },
        {
            name: '卒', color: 'black', type: 'soldier', energy: -40,
            meaning: '外援不足',
            detail: '助力較少，需靠自己。或代表阻礙較多，進展緩慢。',
            advice: '自力更生，穩紮穩打，一步一腳印。'
        },
        {
            name: '卒', color: 'black', type: 'soldier', energy: -40,
            meaning: '外援不足',
            detail: '助力較少，需靠自己。或代表阻礙較多，進展緩慢。',
            advice: '自力更生，穩紮穩打，一步一腳印。'
        },
        {
            name: '卒', color: 'black', type: 'soldier', energy: -40,
            meaning: '外援不足',
            detail: '助力較少，需靠自己。或代表阻礙較多，進展緩慢。',
            advice: '自力更生，穩紮穩打，一步一腳印。'
        }
    ];

    // Mode Switching Logic
    mode5Btn.addEventListener('click', () => setMode(5));
    mode3Btn.addEventListener('click', () => setMode(3));

    function setMode(mode) {
        if (currentMode === mode && !resetBtn.classList.contains('hidden')) return;

        currentMode = mode;

        if (mode === 5) {
            mode5Btn.classList.add('active');
            mode3Btn.classList.remove('active');
        } else {
            mode5Btn.classList.remove('active');
            mode3Btn.classList.add('active');
        }

        resetBoard();
    }

    drawBtn.addEventListener('click', () => {
        const count = currentMode;

        const shuffled = [...PIECES].sort(() => 0.5 - Math.random());
        const drawn = shuffled.slice(0, count);

        renderBoard(drawn);
        renderInterpretation(drawn);

        drawBtn.classList.add('hidden');
        resetBtn.classList.remove('hidden');
        interpretationArea.classList.remove('hidden');
    });

    resetBtn.addEventListener('click', resetBoard);

    function resetBoard() {
        const count = currentMode;
        slotsContainer.innerHTML = '';
        interpretationGrid.innerHTML = '';

        if (currentMode === 5) {
            // Cross layout for 5-piece mode
            slotsContainer.classList.add('cross-layout');
            slotsContainer.classList.remove('row-layout');
            const positions = POSITIONS_5;
            positions.forEach((pos, i) => {
                const div = document.createElement('div');
                div.className = `slot-placeholder slot-${pos.gridArea}`;
                div.innerHTML = `<span class="slot-char">?</span><span class="slot-label">${pos.name}</span>`;
                slotsContainer.appendChild(div);
            });
        } else {
            // Row layout for 3-piece mode
            slotsContainer.classList.remove('cross-layout');
            slotsContainer.classList.add('row-layout');
            for (let i = 0; i < count; i++) {
                const div = document.createElement('div');
                div.className = 'slot-placeholder';
                div.textContent = '?';
                slotsContainer.appendChild(div);
            }
        }
        interpretationArea.classList.add('hidden');
        drawBtn.classList.remove('hidden');
        resetBtn.classList.add('hidden');
    }

    function renderBoard(pieces) {
        const positions = currentMode === 5 ? POSITIONS_5 : POSITIONS_3;
        slotsContainer.innerHTML = '';

        if (currentMode === 5) {
            slotsContainer.classList.add('cross-layout');
            slotsContainer.classList.remove('row-layout');
        } else {
            slotsContainer.classList.remove('cross-layout');
            slotsContainer.classList.add('row-layout');
        }

        pieces.forEach((piece, index) => {
            const pieceEl = document.createElement('div');
            const gridArea = currentMode === 5 ? positions[index].gridArea : '';
            pieceEl.className = `chess-piece piece-${piece.color} animate-piece${gridArea ? ` slot-${gridArea}` : ''}`;
            pieceEl.style.animationDelay = `${index * 0.15}s`;
            pieceEl.innerHTML = `<span class="piece-char">${piece.name}</span><span class="piece-label">${positions[index].name}</span>`;
            pieceEl.title = `${positions[index].name}: ${piece.name} (${piece.meaning})`;
            slotsContainer.appendChild(pieceEl);
        });
    }

    function renderInterpretation(pieces) {
        const positions = currentMode === 5 ? POSITIONS_5 : POSITIONS_3;
        interpretationGrid.innerHTML = '';

        // Calculate total energy for summary
        const totalEnergy = pieces.reduce((sum, p) => sum + p.energy, 0);

        pieces.forEach((piece, index) => {
            const card = document.createElement('div');
            card.className = 'interp-card';

            const colorName = piece.color === 'red' ? '紅' : '黑';
            const polarity = piece.color === 'red' ? '吉' : '需留意';

            card.innerHTML = `
                <span class="interp-title">${positions[index].name}</span>
                <div class="interp-piece" style="color: ${piece.color === 'red' ? '#b91c1c' : '#111827'}">
                    ${colorName}【${piece.name}】
                </div>
                <div class="interp-meaning">
                    ${piece.meaning}
                </div>
                <div class="interp-detail">
                    ${piece.detail}
                </div>
                <div class="interp-advice">
                    💡 ${piece.advice}
                </div>
            `;
            interpretationGrid.appendChild(card);
        });

        // Add Summary Card
        const summaryCard = document.createElement('div');
        summaryCard.className = 'summary-card';
        const energyClass = totalEnergy > 0 ? 'positive' : (totalEnergy < 0 ? 'negative' : 'neutral');
        const summaryText = generateSummary(pieces, totalEnergy, positions);

        summaryCard.innerHTML = `
            <h4>📜 整體卦象總結</h4>
            <div class="energy-score ${energyClass}">
                能量總分：${totalEnergy > 0 ? '+' : ''}${totalEnergy}
            </div>
            <p class="summary-text">${summaryText}</p>
            <p class="summary-reminder">⚠️ 紅黑無絕對好壞，重點在於自我覺察與調整。</p>
        `;
        interpretationGrid.appendChild(summaryCard);
    }

    function generateSummary(pieces, totalEnergy, positions) {
        const redCount = pieces.filter(p => p.color === 'red').length;
        const blackCount = pieces.filter(p => p.color === 'black').length;

        let summary = '';

        if (currentMode === 3) {
            // Three-piece causal reading
            const causeP = pieces[0];
            const processP = pieces[1];
            const resultP = pieces[2];

            summary += `<strong>因：</strong>${causeP.color === 'red' ? '起因正向' : '起因有阻礙'}，${causeP.meaning.replace('職場', '過去').replace('財運', '資源')}。`;
            summary += `<br><strong>緣：</strong>過程中${processP.color === 'red' ? '順利推進' : '需多費心思'}，${processP.meaning}。`;
            summary += `<br><strong>果：</strong>結果${resultP.color === 'red' ? '趨吉' : '需謹慎'}，${resultP.meaning}。`;

            if (resultP.color === 'red') {
                summary += '<br><br>整體走向正向，按部就班即可收穫成果。';
            } else {
                summary += '<br><br>雖有阻礙，但透過調整策略與心態，仍可化解。';
            }
        } else {
            // Five-piece palace reading
            if (totalEnergy > 100) {
                summary = '整體運勢大吉！各方面能量充沛，貴人運強，可積極把握機會。';
            } else if (totalEnergy > 0) {
                summary = '整體運勢平順偏吉，雖有小阻礙但不影響大局，穩步前行即可。';
            } else if (totalEnergy > -100) {
                summary = '運勢平平，需多留意人際與財務。保持低調、穩紮穩打是關鍵。';
            } else {
                summary = '運勢較為挑戰，宜韜光養晦，避免衝動決策，專注於累積個人實力與修行。';
            }

            // Add specific palace insights (adjusted for new order: career, spouse, self, siblings, wealth)
            const careerPiece = pieces[0]; // Top
            const spousePiece = pieces[1]; // Left
            const selfPiece = pieces[2];   // Center
            const siblingsPiece = pieces[3]; // Right
            const wealthPiece = pieces[4]; // Bottom

            summary += `<br><br><strong>重點提示：</strong>`;
            summary += `<br>• 自身狀態「${selfPiece.meaning}」，${selfPiece.color === 'red' ? '心態穩定' : '需調整心態'}。`;
            summary += `<br>• 感情/財務「${spousePiece.meaning}」，${spousePiece.color === 'red' ? '順暢' : '需多溝通與留意'}。`;
            summary += `<br>• 事業/貴人「${careerPiece.meaning}」，${careerPiece.color === 'red' ? '助力充足' : '需靠自己更多'}。`;
        }

        return summary;
    }

    // Initialize
    resetBoard();
});
