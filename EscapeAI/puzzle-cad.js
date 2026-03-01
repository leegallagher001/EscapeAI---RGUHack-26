/* ========== PUZZLE 1: 3D PRINTER / CAD ========== */

const PuzzleCAD = (() => {
    const PARTS = [
        { id: 'hub', name: 'Hub', icon: '⚙️', correct: true, order: 1, desc: 'Central hub connector' },
        { id: 'spokes', name: 'Spokes', icon: '✳️', correct: true, order: 2, desc: 'Structural spokes' },
        { id: 'rim', name: 'Rim', icon: '⭕', correct: true, order: 3, desc: 'Outer rim ring' },
        { id: 'tire', name: 'Tire', icon: '⬛', correct: true, order: 4, desc: 'Rubber tire surface' },
        { id: 'gear', name: 'Gear', icon: '🔩', correct: false, desc: 'Mechanical gear' },
        { id: 'spring', name: 'Spring', icon: '🌀', correct: false, desc: 'Coil spring' },
        { id: 'cube', name: 'Cube', icon: '🧊', correct: false, desc: 'Metal cube' },
        { id: 'bolt', name: 'Bolt', icon: '🔧', correct: false, desc: 'Hex bolt' },
    ];

    const correctOrder = PARTS.filter(p => p.correct).sort((a, b) => a.order - b.order);
    let placedParts = [];
    let draggedPart = null;

    function init() {
        renderPalette();
        setupDropZone();
        setupControls();
    }

    function renderPalette() {
        const palette = document.getElementById('cad-parts');
        if (!palette) return;
        palette.innerHTML = '';

        // Shuffle parts for challenge
        const shuffled = [...PARTS].sort(() => Math.random() - 0.5);
        shuffled.forEach(part => {
            const el = document.createElement('div');
            el.className = 'cad-part';
            el.id = 'cad-part-' + part.id;
            el.draggable = true;
            el.innerHTML = `
                <span class="part-icon">${part.icon}</span>
                <span class="part-name">${part.name}</span>
            `;
            el.title = part.desc;

            el.addEventListener('dragstart', (e) => {
                draggedPart = part;
                e.dataTransfer.setData('text/plain', part.id);
                el.style.opacity = '0.5';
            });
            el.addEventListener('dragend', () => {
                el.style.opacity = '';
            });

            palette.appendChild(el);
        });
    }

    function setupDropZone() {
        const plate = document.getElementById('cad-build-plate');
        if (!plate) return;

        plate.addEventListener('dragover', (e) => {
            e.preventDefault();
            plate.classList.add('drag-over');
        });
        plate.addEventListener('dragleave', () => {
            plate.classList.remove('drag-over');
        });
        plate.addEventListener('drop', (e) => {
            e.preventDefault();
            plate.classList.remove('drag-over');
            if (draggedPart) {
                handlePartDrop(draggedPart);
                draggedPart = null;
            }
        });
    }

    function handlePartDrop(part) {
        const feedback = document.getElementById('cad-feedback');

        // Check if part is correct
        if (!part.correct) {
            feedback.className = 'error';
            feedback.textContent = `✗ "${part.name}" doesn't belong in a wheel assembly!`;
            shakeElement(document.getElementById('cad-build-plate'));
            return;
        }

        // Check if it's the right order
        const expectedIndex = placedParts.length;
        const expectedPart = correctOrder[expectedIndex];

        if (part.id !== expectedPart.id) {
            feedback.className = 'error';
            feedback.textContent = `✗ Wrong order! Think about how a wheel is built from the inside out.`;
            shakeElement(document.getElementById('cad-build-plate'));
            return;
        }

        // Correct placement!
        placedParts.push(part);

        // Mark part as used in palette
        const paletteEl = document.getElementById('cad-part-' + part.id);
        if (paletteEl) paletteEl.classList.add('used');

        // Add to assembly view
        const assembly = document.getElementById('cad-assembly');
        const partEl = document.createElement('div');
        partEl.className = 'assembly-part';
        partEl.textContent = part.icon;
        assembly.appendChild(partEl);

        // Update preview
        updatePreview();

        // Feedback
        feedback.className = 'success';
        feedback.textContent = `✓ ${part.name} placed correctly! (${placedParts.length}/${correctOrder.length})`;

        // Hide drop zone text when parts are placed
        const dropZone = document.getElementById('cad-drop-zone');
        if (dropZone) dropZone.style.display = 'none';

        // Check completion
        if (placedParts.length === correctOrder.length) {
            feedback.textContent = '✓ Assembly complete! Ready to print!';
            document.getElementById('btn-print').disabled = false;
        }
    }

    function updatePreview() {
        const preview = document.getElementById('cad-preview-display');
        if (!preview) return;

        // Build a visual representation of the wheel assembly
        let html = '<div style="text-align:center;">';
        placedParts.forEach((part, i) => {
            const size = 1.2 + (i * 0.3);
            html += `<div style="font-size:${size}rem; line-height:1.2;">${part.icon}</div>`;
        });
        if (placedParts.length < correctOrder.length) {
            html += `<div style="color:var(--text-dim); font-size:0.7rem; margin-top:8px; font-family:var(--font-mono);">
                Next: ${correctOrder[placedParts.length].name}?
            </div>`;
        } else {
            html += `<div style="margin-top:12px; font-size:2.5rem;">🛞</div>
                <div style="color:var(--accent-green); font-size:0.8rem; font-family:var(--font-display); letter-spacing:2px;">COMPLETE</div>`;
        }
        html += '</div>';
        preview.innerHTML = html;
    }

    function setupControls() {
        const printBtn = document.getElementById('btn-print');
        const resetBtn = document.getElementById('btn-cad-reset');

        if (printBtn) {
            printBtn.addEventListener('click', startPrinting);
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', resetCAD);
        }
    }

    function startPrinting() {
        const printOverlay = document.getElementById('print-animation');
        printOverlay.classList.remove('hidden');

        // After animation completes
        setTimeout(() => {
            printOverlay.classList.add('hidden');
            Game.completePuzzle('cad');
            Game.addToInventory({ name: 'Wheel', icon: '🛞' });
            Game.transitionTo('room');
            Game.showDialogue("The 3D printer has finished printing a replacement wheel! It's been added to your inventory. Now attach it to the robot.");
        }, 3500);
    }

    function resetCAD() {
        placedParts = [];
        document.getElementById('cad-assembly').innerHTML = '';
        document.getElementById('cad-preview-display').innerHTML = '';
        document.getElementById('cad-feedback').className = '';
        document.getElementById('cad-feedback').textContent = '';
        document.getElementById('btn-print').disabled = true;
        const dropZone = document.getElementById('cad-drop-zone');
        if (dropZone) dropZone.style.display = '';
        document.querySelectorAll('.cad-part').forEach(el => el.classList.remove('used'));
    }

    function shakeElement(el) {
        el.style.animation = 'none';
        el.offsetHeight; // trigger reflow
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => el.style.animation = '', 400);
    }

    // Add shake keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
        }
    `;
    document.head.appendChild(style);

    document.addEventListener('DOMContentLoaded', init);

    return { init, resetCAD };
})();
