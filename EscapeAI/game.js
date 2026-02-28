/* ========== GAME ENGINE — EscapeAI ========== */

const Game = (() => {
    // ---- State ----
    const state = {
        currentScreen: 'intro',
        puzzlesCompleted: { cad: false, network: false, code: false },
        inventory: [],
        hintsUsed: 0,
        startTime: null,
        timerInterval: null,
        cableConnected: false,
        wheelAttached: false,
    };

    const hints = {
        room: "Look around the room. The robot on the left is missing a wheel, and there's a 3D printer on the desk to the right.",
        cad: "Assemble the wheel components in order: first the Hub, then the Spokes, then the Rim, and finally the Tire. Ignore the distractor parts!",
        network: "The PC is on subnet 192.168.1.x with mask 255.255.255.0. Set the robot to the same subnet — try 192.168.1.20.",
        code: "The robot needs to: move forward to reach the path, turn right, move forward toward the door, then open the door. Remove the loop block!",
    };

    // ---- Screen Management ----
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id + '-screen');
        if (el) {
            el.classList.add('active');
            state.currentScreen = id;
        }
    }

    function transitionTo(screenId) {
        const overlay = document.createElement('div');
        overlay.className = 'screen-transition';
        document.body.appendChild(overlay);
        setTimeout(() => {
            showScreen(screenId);
            setTimeout(() => overlay.remove(), 600);
        }, 50);
    }

    // ---- Timer ----
    function startTimer() {
        state.startTime = Date.now();
        state.timerInterval = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        if (!state.startTime) return;
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        const el = document.getElementById('timer');
        if (el) el.textContent = `${mins}:${secs}`;
    }

    function getTimeString() {
        if (!state.startTime) return '00:00';
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        return `${mins}:${secs}`;
    }

    function stopTimer() {
        clearInterval(state.timerInterval);
    }

    // ---- Inventory ----
    function addToInventory(item) {
        state.inventory.push(item);
        renderInventory();
    }

    function hasItem(item) {
        return state.inventory.includes(item);
    }

    function removeFromInventory(item) {
        state.inventory = state.inventory.filter(i => i !== item);
        renderInventory();
    }

    function renderInventory() {
        const slots = document.getElementById('inventory-slots');
        if (!slots) return;
        slots.innerHTML = '';
        state.inventory.forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.textContent = item.icon;
            slot.title = item.name;
            slots.appendChild(slot);
        });
    }

    // ---- Progress ----
    function updateProgress() {
        const steps = ['cad', 'network', 'code', 'escape'];
        steps.forEach(step => {
            const el = document.getElementById('prog-' + step);
            if (!el) return;
            el.classList.remove('active', 'complete');
        });

        // Determine current step
        if (!state.puzzlesCompleted.cad) {
            document.getElementById('prog-cad').classList.add('active');
        } else {
            document.getElementById('prog-cad').classList.add('complete');
            if (!state.puzzlesCompleted.network) {
                document.getElementById('prog-network').classList.add('active');
            } else {
                document.getElementById('prog-network').classList.add('complete');
                if (!state.puzzlesCompleted.code) {
                    document.getElementById('prog-code').classList.add('active');
                } else {
                    document.getElementById('prog-code').classList.add('complete');
                    document.getElementById('prog-escape').classList.add('active');
                }
            }
        }
    }

    // ---- Puzzle Completion ----
    function completePuzzle(puzzle) {
        state.puzzlesCompleted[puzzle] = true;
        updateProgress();
        updateHotspots();
    }

    // ---- Dialogue ----
    function showDialogue(text, callback) {
        const box = document.getElementById('dialogue-box');
        const textEl = document.getElementById('dialogue-text');
        textEl.textContent = text;
        box.classList.remove('hidden');

        const closeBtn = document.getElementById('dialogue-close');
        const handler = () => {
            box.classList.add('hidden');
            closeBtn.removeEventListener('click', handler);
            if (callback) callback();
        };
        closeBtn.addEventListener('click', handler);
    }

    // ---- Hints ----
    function getCurrentHint() {
        if (state.currentScreen === 'puzzle-cad') return hints.cad;
        if (state.currentScreen === 'puzzle-network') return hints.network;
        if (state.currentScreen === 'puzzle-code') return hints.code;
        return hints.room;
    }

    function showHint() {
        state.hintsUsed++;
        const modal = document.getElementById('hint-modal');
        const text = document.getElementById('hint-text');
        text.textContent = getCurrentHint();
        modal.classList.remove('hidden');
    }

    // ---- Hotspot management ----
    function updateHotspots() {
        const printer = document.getElementById('hotspot-printer');
        const pc = document.getElementById('hotspot-pc');
        const robot = document.getElementById('hotspot-robot');
        const door = document.getElementById('hotspot-door');

        // Clear all pulses
        document.querySelectorAll('.hotspot').forEach(h => h.classList.remove('pulse'));

        // Set suggested hotspot based on progress
        if (!state.puzzlesCompleted.cad) {
            if (printer) printer.classList.add('pulse');
        } else if (!state.puzzlesCompleted.network) {
            if (pc) pc.classList.add('pulse');
        } else if (!state.puzzlesCompleted.code) {
            if (pc) pc.classList.add('pulse');
        } else {
            if (door) {
                door.classList.add('pulse', 'unlocked');
            }
        }

        // Swap robot image if wheel attached
        if (state.wheelAttached) {
            const img = document.getElementById('robot-img');
            if (img) img.src = 'escapeAIrobotFixed-removebg-preview.png';
        }
    }

    // ---- Escape Sequence ----
    function triggerEscape() {
        stopTimer();

        // Animate robot moving to door
        const robot = document.getElementById('hotspot-robot');
        if (robot) {
            robot.classList.add('robot-moving');
            robot.style.left = '40%';
            robot.style.bottom = '20%';
        }

        setTimeout(() => {
            // Show escape screen
            document.getElementById('final-time').textContent = getTimeString();
            document.getElementById('final-hints').textContent = state.hintsUsed;
            transitionTo('escape');
        }, 2500);
    }

    // ---- Initialize ----
    function init() {
        // Start button
        document.getElementById('btn-start').addEventListener('click', () => {
            transitionTo('room');
            startTimer();
            updateProgress();
            updateHotspots();
            showDialogue("You wake up in an AI research lab. The door is locked. A broken robot sits in the corner — it looks like it's needed to unlock the door. Maybe the 3D printer on the desk can help fix it?");
        });

        // Hotspot clicks
        document.getElementById('hotspot-printer').addEventListener('click', () => {
            if (!state.puzzlesCompleted.cad) {
                transitionTo('puzzle-cad');
            } else {
                showDialogue("The 3D printer has already finished printing the wheel.");
            }
        });

        document.getElementById('hotspot-pc').addEventListener('click', () => {
            if (!state.puzzlesCompleted.cad) {
                showDialogue("The PC shows a network error. Maybe you should fix the robot's wheel first using the 3D printer.");
            } else if (!state.puzzlesCompleted.network) {
                transitionTo('puzzle-network');
            } else if (!state.puzzlesCompleted.code) {
                transitionTo('puzzle-code');
            } else {
                showDialogue("All systems are now operational.");
            }
        });

        document.getElementById('hotspot-robot').addEventListener('click', () => {
            if (!state.puzzlesCompleted.cad) {
                showDialogue("The robot is broken — its left wheel is missing. You'll need to 3D print a replacement. Check the printer on the desk.");
            } else if (!state.wheelAttached) {
                // Attach the wheel
                state.wheelAttached = true;
                removeFromInventory(state.inventory.find(i => i.name === 'Wheel'));
                updateHotspots();
                showDialogue("You attach the 3D-printed wheel to the robot. Now you need to establish a network connection to it. Try the PC.");
            } else if (!state.puzzlesCompleted.network) {
                showDialogue("The robot has its wheel, but there's no network connection. Configure the network from the PC.");
            } else if (!state.puzzlesCompleted.code) {
                showDialogue("The robot is connected but its movement code has a bug — it just goes in circles! Access the programming interface from the PC.");
            } else {
                showDialogue("The robot is fully operational!");
            }
        });

        document.getElementById('hotspot-desk').addEventListener('click', (e) => {
            // Only trigger if not clicking a sub-hotspot
            if (e.target.closest('#hotspot-printer') || e.target.closest('#hotspot-pc')) return;
            showDialogue("A desk with a 3D printer on the left and a desktop PC on the right.");
        });

        document.getElementById('hotspot-door').addEventListener('click', () => {
            if (state.puzzlesCompleted.cad && state.puzzlesCompleted.network && state.puzzlesCompleted.code) {
                triggerEscape();
            } else {
                showDialogue("The door is locked. A sign reads: 'ROBOT KEY REQUIRED'. You need to fix the robot to unlock it.");
            }
        });

        // Back buttons
        document.getElementById('cad-back').addEventListener('click', () => transitionTo('room'));
        document.getElementById('network-back').addEventListener('click', () => transitionTo('room'));
        document.getElementById('code-back').addEventListener('click', () => transitionTo('room'));

        // Hint
        document.getElementById('btn-hint').addEventListener('click', showHint);
        document.getElementById('hint-close').addEventListener('click', () => {
            document.getElementById('hint-modal').classList.add('hidden');
        });

        // Play again
        document.getElementById('btn-play-again').addEventListener('click', () => {
            location.reload();
        });
    }

    // Expose public API
    return {
        init,
        state,
        showScreen,
        transitionTo,
        showDialogue,
        completePuzzle,
        addToInventory,
        hasItem,
        removeFromInventory,
        updateProgress,
        updateHotspots,
        getTimeString,
    };
})();

document.addEventListener('DOMContentLoaded', Game.init);
