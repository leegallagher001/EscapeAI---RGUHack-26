/* ========== PUZZLE 3: CODING CHALLENGE ========== */

const PuzzleCode = (() => {
    // Available code blocks
    const BLOCKS = [
        { id: 'fwd3', text: 'move_forward(3)', type: 'move', action: { cmd: 'forward', val: 3 } },
        { id: 'fwd2', text: 'move_forward(2)', type: 'move', action: { cmd: 'forward', val: 2 } },
        { id: 'fwd1', text: 'move_forward(1)', type: 'move', action: { cmd: 'forward', val: 1 } },
        { id: 'left', text: 'turn_left()', type: 'turn', action: { cmd: 'left' } },
        { id: 'right', text: 'turn_right()', type: 'turn', action: { cmd: 'right' } },
        { id: 'open', text: 'open_door()', type: 'action', action: { cmd: 'open_door' } },
        { id: 'loop', text: 'repeat_forever()', type: 'loop', action: { cmd: 'loop' } },
        { id: 'backward1', text: 'move_backward(1)', type: 'move', action: { cmd: 'backward', val: 1 } },
    ];

    // Correct solution: move_forward(3) → turn_right() → move_forward(2) → open_door()
    const SOLUTION = ['fwd3', 'right', 'fwd2', 'open'];

    // Pre-loaded buggy code (going in a loop)
    const BUGGY_CODE = ['fwd1', 'right', 'fwd1', 'right', 'fwd1', 'right', 'fwd1', 'right'];

    let sequence = [];
    let draggedBlock = null;
    let isRunning = false;

    // Grid map for preview
    const GRID_SIZE = 8;
    const CELL_SIZE = 30;
    // Robot starts at bottom-left area, door at top-right area
    const START_POS = { x: 1, y: 6 };
    const DOOR_POS = { x: 4, y: 2 };
    // Path tiles that the robot should follow
    const PATH = [
        { x: 1, y: 6 }, { x: 1, y: 5 }, { x: 1, y: 4 }, { x: 1, y: 3 },
        { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 },
        { x: 4, y: 2 },
    ];

    function init() {
        renderPalette();
        setupSequenceZone();
        setupControls();
        drawPreview();

        // Load buggy code as starting state
        loadBuggyCode();
    }

    function renderPalette() {
        const palette = document.getElementById('code-palette');
        if (!palette) return;
        palette.innerHTML = '';

        BLOCKS.forEach(block => {
            const el = createBlockElement(block, true);
            palette.appendChild(el);
        });
    }

    function createBlockElement(block, fromPalette) {
        const el = document.createElement('div');
        el.className = `code-block block-${block.type}`;
        el.id = fromPalette ? 'palette-' + block.id : '';
        el.draggable = true;
        el.dataset.blockId = block.id;
        el.innerHTML = `
            <div class="block-grip"><span></span><span></span><span></span></div>
            <span>${block.text}</span>
        `;

        el.addEventListener('dragstart', (e) => {
            draggedBlock = block;
            e.dataTransfer.setData('text/plain', block.id);
            el.style.opacity = '0.5';
        });
        el.addEventListener('dragend', () => {
            el.style.opacity = '';
        });

        return el;
    }

    function setupSequenceZone() {
        const seqZone = document.getElementById('code-sequence');
        if (!seqZone) return;

        seqZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            seqZone.classList.add('drag-over');
        });
        seqZone.addEventListener('dragleave', () => {
            seqZone.classList.remove('drag-over');
        });
        seqZone.addEventListener('drop', (e) => {
            e.preventDefault();
            seqZone.classList.remove('drag-over');
            if (draggedBlock) {
                addBlockToSequence(draggedBlock);
                draggedBlock = null;
            }
        });
    }

    function addBlockToSequence(block) {
        sequence.push({ ...block });
        renderSequence();
    }

    function removeBlockFromSequence(index) {
        sequence.splice(index, 1);
        renderSequence();
    }

    function renderSequence() {
        const seqContainer = document.getElementById('code-sequence');
        if (!seqContainer) return;
        seqContainer.innerHTML = '';

        if (sequence.length === 0) {
            seqContainer.innerHTML = '<div id="code-drop-zone"><span>Drop code blocks here in order</span></div>';
            return;
        }

        sequence.forEach((block, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'sequence-block';

            const numEl = document.createElement('div');
            numEl.className = 'seq-number';
            numEl.textContent = index + 1;

            const blockEl = document.createElement('div');
            blockEl.className = `code-block block-${block.type}`;
            blockEl.innerHTML = `
                <div class="block-grip"><span></span><span></span><span></span></div>
                <span>${block.text}</span>
            `;

            // Make sequence blocks draggable for reordering
            wrapper.draggable = true;
            wrapper.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index.toString());
                wrapper.style.opacity = '0.5';
            });
            wrapper.addEventListener('dragend', () => {
                wrapper.style.opacity = '';
            });
            wrapper.addEventListener('dragover', (e) => {
                e.preventDefault();
                wrapper.style.borderTop = '2px solid var(--accent-cyan)';
            });
            wrapper.addEventListener('dragleave', () => {
                wrapper.style.borderTop = '';
            });
            wrapper.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                wrapper.style.borderTop = '';
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                if (!isNaN(fromIndex) && fromIndex !== index) {
                    // Reorder
                    const item = sequence.splice(fromIndex, 1)[0];
                    sequence.splice(index, 0, item);
                    renderSequence();
                }
            });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove';
            removeBtn.textContent = '✕';
            removeBtn.addEventListener('click', () => removeBlockFromSequence(index));

            wrapper.appendChild(numEl);
            wrapper.appendChild(blockEl);
            wrapper.appendChild(removeBtn);
            seqContainer.appendChild(wrapper);
        });

        // Add drop zone at the bottom
        const bottomDrop = document.createElement('div');
        bottomDrop.style.padding = '8px';
        bottomDrop.style.textAlign = 'center';
        bottomDrop.style.color = 'var(--text-dim)';
        bottomDrop.style.fontSize = '0.75rem';
        bottomDrop.style.fontStyle = 'italic';
        bottomDrop.textContent = '+ Drop more blocks here';
        bottomDrop.addEventListener('dragover', (e) => e.preventDefault());
        bottomDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedBlock) {
                addBlockToSequence(draggedBlock);
                draggedBlock = null;
            }
        });
        seqContainer.appendChild(bottomDrop);
    }

    function loadBuggyCode() {
        sequence = BUGGY_CODE.map(id => {
            const block = BLOCKS.find(b => b.id === id);
            return { ...block };
        });
        renderSequence();
    }

    function setupControls() {
        const runBtn = document.getElementById('btn-run-code');
        const resetBtn = document.getElementById('btn-code-reset');

        if (runBtn) runBtn.addEventListener('click', runCode);
        if (resetBtn) resetBtn.addEventListener('click', () => {
            sequence = [];
            renderSequence();
            drawPreview();
            document.getElementById('code-feedback').className = '';
            document.getElementById('code-feedback').textContent = '';
        });
    }

    function drawPreview(robotPos, robotDir, trail) {
        const canvas = document.getElementById('robot-preview-canvas');
        if (!canvas) return;

        const container = canvas.parentElement;
        canvas.width = container.offsetWidth - 28;
        canvas.height = Math.max(container.offsetHeight - 80, 250);

        const ctx = canvas.getContext('2d');
        const offsetX = (canvas.width - GRID_SIZE * CELL_SIZE) / 2;
        const offsetY = (canvas.height - GRID_SIZE * CELL_SIZE) / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const px = offsetX + x * CELL_SIZE;
                const py = offsetY + y * CELL_SIZE;

                // Check if path tile
                const isPath = PATH.some(p => p.x === x && p.y === y);
                const isDoor = x === DOOR_POS.x && y === DOOR_POS.y;
                const isStart = x === START_POS.x && y === START_POS.y;

                if (isDoor) {
                    ctx.fillStyle = '#442200';
                    ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                    // Door icon
                    ctx.fillStyle = '#ff6600';
                    ctx.fillRect(px + 4, py + 2, CELL_SIZE - 8, CELL_SIZE - 4);
                    ctx.fillStyle = '#ffcc00';
                    ctx.beginPath();
                    ctx.arc(px + CELL_SIZE - 10, py + CELL_SIZE / 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (isPath) {
                    ctx.fillStyle = '#1a2a3a';
                    ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                } else {
                    ctx.fillStyle = '#0d1117';
                    ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                }

                // Grid lines
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
            }
        }

        // Draw trail
        if (trail && trail.length > 1) {
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            trail.forEach((pos, i) => {
                const px = offsetX + pos.x * CELL_SIZE + CELL_SIZE / 2;
                const py = offsetY + pos.y * CELL_SIZE + CELL_SIZE / 2;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            });
            ctx.stroke();
        }

        // Draw start marker
        ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
        ctx.fillRect(offsetX + START_POS.x * CELL_SIZE, offsetY + START_POS.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.fillStyle = '#00e5ff';
        ctx.font = '9px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('START', offsetX + START_POS.x * CELL_SIZE + CELL_SIZE / 2, offsetY + START_POS.y * CELL_SIZE + CELL_SIZE / 2 + 3);

        // Draw door label
        ctx.fillStyle = '#ff6600';
        ctx.font = '9px Orbitron';
        ctx.fillText('DOOR', offsetX + DOOR_POS.x * CELL_SIZE + CELL_SIZE / 2, offsetY + DOOR_POS.y * CELL_SIZE - 5);

        // Draw robot
        const rp = robotPos || START_POS;
        const rd = robotDir || 'up';
        const rx = offsetX + rp.x * CELL_SIZE + CELL_SIZE / 2;
        const ry = offsetY + rp.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();
        ctx.translate(rx, ry);
        // Rotate based on direction
        const angles = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };
        ctx.rotate(angles[rd] || 0);

        // Robot body
        ctx.fillStyle = '#c0c8d4';
        ctx.fillRect(-8, -8, 16, 16);
        // Robot head direction arrow
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-5, -6);
        ctx.lineTo(5, -6);
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(-4, -4, 3, 3);
        ctx.fillRect(2, -4, 3, 3);

        ctx.restore();

        // Legend
        ctx.fillStyle = '#7a8ba0';
        ctx.font = '10px Rajdhani';
        ctx.textAlign = 'left';
        ctx.fillText('🟦 Path', offsetX, offsetY + GRID_SIZE * CELL_SIZE + 16);
        ctx.fillText('🟧 Door', offsetX + 60, offsetY + GRID_SIZE * CELL_SIZE + 16);
        ctx.fillText('🤖 Robot', offsetX + 120, offsetY + GRID_SIZE * CELL_SIZE + 16);
    }

    function runCode() {
        if (isRunning || sequence.length === 0) return;
        isRunning = true;

        const feedback = document.getElementById('code-feedback');
        feedback.className = 'info';
        feedback.textContent = 'Running program...';

        // Simulate execution
        let pos = { ...START_POS };
        let dir = 'up'; // initial direction: facing up (toward door)
        const trail = [{ ...pos }];
        let reachedDoor = false;
        let doorOpened = false;
        let error = null;
        let steps = [];

        // Expand sequence (detect infinite loops)
        let expandedSteps = [];
        let hasLoop = false;

        for (const block of sequence) {
            if (block.action.cmd === 'loop') {
                hasLoop = true;
                // If there's a loop block, mark it as looping forever — show 4 iterations
                break;
            }
            expandedSteps.push(block.action);
        }

        if (hasLoop) {
            // Repeat the blocks before 'loop' 4 times to show the loop behavior
            const beforeLoop = sequence.filter(b => b.action.cmd !== 'loop').map(b => b.action);
            for (let i = 0; i < 4; i++) {
                expandedSteps.push(...beforeLoop);
            }
        }

        // Process each step
        function processStep(stepIndex) {
            if (stepIndex >= expandedSteps.length || error) {
                finishExecution();
                return;
            }

            const action = expandedSteps[stepIndex];

            switch (action.cmd) {
                case 'forward': {
                    const count = action.val || 1;
                    moveForward(count, stepIndex);
                    return;
                }
                case 'backward': {
                    const count = action.val || 1;
                    moveBackward(count, stepIndex);
                    return;
                }
                case 'left':
                    dir = turnLeft(dir);
                    drawPreview(pos, dir, trail);
                    setTimeout(() => processStep(stepIndex + 1), 400);
                    break;
                case 'right':
                    dir = turnRight(dir);
                    drawPreview(pos, dir, trail);
                    setTimeout(() => processStep(stepIndex + 1), 400);
                    break;
                case 'open_door':
                    if (pos.x === DOOR_POS.x && pos.y === DOOR_POS.y + 1) {
                        // Adjacent to door
                        doorOpened = true;
                        drawPreview(pos, dir, trail);
                        setTimeout(() => processStep(stepIndex + 1), 400);
                    } else if (pos.x === DOOR_POS.x && pos.y === DOOR_POS.y) {
                        doorOpened = true;
                        drawPreview(pos, dir, trail);
                        setTimeout(() => processStep(stepIndex + 1), 400);
                    } else {
                        error = "open_door() failed — robot is not at the door!";
                        finishExecution();
                    }
                    break;
                case 'loop':
                    // Handled in expansion
                    processStep(stepIndex + 1);
                    break;
                default:
                    processStep(stepIndex + 1);
            }
        }

        function moveForward(count, stepIndex) {
            let moved = 0;
            function doMove() {
                if (moved >= count) {
                    processStep(stepIndex + 1);
                    return;
                }
                const next = getForwardPos(pos, dir);
                if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE) {
                    error = "Robot hit a wall!";
                    finishExecution();
                    return;
                }
                pos = next;
                trail.push({ ...pos });
                if (pos.x === DOOR_POS.x && pos.y === DOOR_POS.y) {
                    reachedDoor = true;
                }
                drawPreview(pos, dir, trail);
                moved++;
                setTimeout(doMove, 350);
            }
            doMove();
        }

        function moveBackward(count, stepIndex) {
            let moved = 0;
            const backDir = { up: 'down', down: 'up', left: 'right', right: 'left' }[dir];
            function doMove() {
                if (moved >= count) {
                    processStep(stepIndex + 1);
                    return;
                }
                const next = getForwardPos(pos, backDir);
                if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE) {
                    error = "Robot hit a wall!";
                    finishExecution();
                    return;
                }
                pos = next;
                trail.push({ ...pos });
                drawPreview(pos, dir, trail);
                moved++;
                setTimeout(doMove, 350);
            }
            doMove();
        }

        function finishExecution() {
            isRunning = false;

            if (error) {
                feedback.className = 'error';
                feedback.textContent = '✗ ' + error;
            } else if (hasLoop) {
                feedback.className = 'error';
                feedback.textContent = '✗ Robot is stuck in an infinite loop! Remove the repeat_forever() block.';
            } else if (doorOpened) {
                feedback.className = 'success';
                feedback.textContent = '✓ Robot reached the door and opened it! Puzzle complete!';
                setTimeout(() => {
                    Game.completePuzzle('code');
                    Game.transitionTo('room');
                    Game.showDialogue("The robot's code is fixed! It navigates to the door and unlocks it. You're free to escape! Head for the door!");
                }, 1500);
            } else if (reachedDoor) {
                feedback.className = 'error';
                feedback.textContent = '✗ Robot reached the door but didn\'t open it! Add open_door() at the end.';
            } else {
                feedback.className = 'error';
                feedback.textContent = '✗ Robot didn\'t reach the door. Try a different sequence!';
            }
        }

        // Start execution
        drawPreview(pos, dir, trail);
        setTimeout(() => processStep(0), 500);
    }

    function getForwardPos(pos, dir) {
        switch (dir) {
            case 'up': return { x: pos.x, y: pos.y - 1 };
            case 'down': return { x: pos.x, y: pos.y + 1 };
            case 'left': return { x: pos.x - 1, y: pos.y };
            case 'right': return { x: pos.x + 1, y: pos.y };
        }
    }

    function turnLeft(dir) {
        const dirs = ['up', 'left', 'down', 'right'];
        return dirs[(dirs.indexOf(dir) + 1) % 4];
    }

    function turnRight(dir) {
        const dirs = ['up', 'right', 'down', 'left'];
        return dirs[(dirs.indexOf(dir) + 1) % 4];
    }

    document.addEventListener('DOMContentLoaded', init);

    return { init };
})();
