/* ========== PUZZLE 2: NETWORK CONFIGURATION ========== */

const PuzzleNetwork = (() => {
    let cableConnected = false;
    let cableDragging = false;
    let cableStartPos = null;
    let animatingPackets = false;

    // Network node positions (percentages)
    const nodes = [
        { id: 'pc', label: 'DESKTOP PC', icon: '🖥️', x: 10, y: 40 },
        { id: 'switch', label: 'SWITCH', icon: '🔀', x: 35, y: 40 },
        { id: 'router', label: 'ROUTER', icon: '📡', x: 65, y: 40 },
        { id: 'robot', label: 'ROBOT', icon: '🤖', x: 90, y: 40 },
    ];

    // Connections (cables)
    const cables = [
        { from: 'pc', to: 'switch', connected: true },
        { from: 'switch', to: 'router', connected: true },
        { from: 'router', to: 'robot', connected: false }, // This one needs to be connected
    ];

    function init() {
        renderNodes();
        drawCables();
        setupCableDrag();
        setupTestButton();

        // Handle window resize
        window.addEventListener('resize', () => {
            drawCables();
        });
    }

    function renderNodes() {
        const container = document.getElementById('network-nodes');
        if (!container) return;
        container.innerHTML = '';

        nodes.forEach(node => {
            const el = document.createElement('div');
            el.className = 'net-node';
            el.id = 'net-node-' + node.id;
            el.style.left = node.x + '%';
            el.style.top = node.y + '%';
            el.style.transform = 'translate(-50%, -50%)';
            el.innerHTML = `
                <div class="net-node-icon" id="node-icon-${node.id}">${node.icon}</div>
                <div class="net-node-label">${node.label}</div>
            `;
            container.appendChild(el);
        });
    }

    function drawCables() {
        const canvas = document.getElementById('network-canvas');
        if (!canvas) return;
        const container = document.getElementById('network-diagram');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        cables.forEach(cable => {
            const fromNode = nodes.find(n => n.id === cable.from);
            const toNode = nodes.find(n => n.id === cable.to);
            const fromX = (fromNode.x / 100) * canvas.width;
            const fromY = (fromNode.y / 100) * canvas.height;
            const toX = (toNode.x / 100) * canvas.width;
            const toY = (toNode.y / 100) * canvas.height;

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);

            if (cable.connected || (cable.from === 'router' && cable.to === 'robot' && cableConnected)) {
                // Connected cable — solid line
                ctx.lineTo(toX, toY);
                ctx.strokeStyle = '#39ff14';
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
            } else {
                // Disconnected cable — dashed, stops halfway
                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;
                ctx.lineTo(midX, midY);
                ctx.strokeStyle = '#ff3a3a';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 6]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }

    function setupCableDrag() {
        const container = document.getElementById('network-diagram');
        if (!container) return;

        // Create draggable cable endpoint
        const endpoint = document.createElement('div');
        endpoint.className = 'cable-endpoint';
        endpoint.id = 'cable-endpoint';
        endpoint.title = 'Drag to connect to the robot';
        container.appendChild(endpoint);

        // Position the endpoint at the midpoint of the disconnected cable
        positionEndpoint(endpoint);

        // Create the target drop zone on robot node
        const targetZone = document.createElement('div');
        targetZone.className = 'cable-endpoint';
        targetZone.id = 'cable-target';
        targetZone.style.background = 'transparent';
        targetZone.style.border = '2px dashed var(--accent-yellow)';
        targetZone.style.boxShadow = 'none';
        targetZone.style.animation = 'hotspot-pulse 1.5s infinite';
        targetZone.title = 'Connect cable here';
        container.appendChild(targetZone);

        const robotNode = nodes.find(n => n.id === 'robot');
        targetZone.style.left = `calc(${robotNode.x}% - 10px)`;
        targetZone.style.top = `calc(${robotNode.y}% + 24px)`;

        // Drag logic
        let offsetX, offsetY;
        endpoint.addEventListener('mousedown', (e) => {
            if (cableConnected) return;
            cableDragging = true;
            const rect = endpoint.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            endpoint.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!cableDragging) return;
            const containerRect = container.getBoundingClientRect();
            const x = e.clientX - containerRect.left - offsetX;
            const y = e.clientY - containerRect.top - offsetY;
            endpoint.style.left = x + 'px';
            endpoint.style.top = y + 'px';

            // Redraw cable to follow endpoint
            drawCablesWithDrag(x + 10, y + 10);
        });

        document.addEventListener('mouseup', (e) => {
            if (!cableDragging) return;
            cableDragging = false;
            endpoint.style.cursor = 'grab';

            // Check if dropped near robot
            const targetRect = targetZone.getBoundingClientRect();
            const endpointRect = endpoint.getBoundingClientRect();
            const distance = Math.hypot(
                endpointRect.left - targetRect.left,
                endpointRect.top - targetRect.top
            );

            if (distance < 50) {
                // Connected!
                cableConnected = true;
                Game.state.cableConnected = true;
                endpoint.classList.add('connected');
                endpoint.style.left = targetZone.style.left;
                endpoint.style.top = targetZone.style.top;
                targetZone.style.display = 'none';
                drawCables();

                // Update node icons
                document.getElementById('node-icon-robot').classList.add('connected');
                document.getElementById('node-icon-router').classList.add('connected');
            } else {
                // Snap back
                positionEndpoint(endpoint);
                drawCables();
            }
        });
    }

    function positionEndpoint(endpoint) {
        const routerNode = nodes.find(n => n.id === 'router');
        const robotNode = nodes.find(n => n.id === 'robot');
        const midX = ((routerNode.x + robotNode.x) / 2);
        const midY = ((routerNode.y + robotNode.y) / 2);
        endpoint.style.left = `calc(${midX}% - 10px)`;
        endpoint.style.top = `calc(${midY}% + 24px)`;
    }

    function drawCablesWithDrag(dragX, dragY) {
        const canvas = document.getElementById('network-canvas');
        if (!canvas) return;
        const container = document.getElementById('network-diagram');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        cables.forEach(cable => {
            const fromNode = nodes.find(n => n.id === cable.from);
            const toNode = nodes.find(n => n.id === cable.to);
            const fromX = (fromNode.x / 100) * canvas.width;
            const fromY = (fromNode.y / 100) * canvas.height;
            const toX = (toNode.x / 100) * canvas.width;
            const toY = (toNode.y / 100) * canvas.height;

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);

            if (cable.connected) {
                ctx.lineTo(toX, toY);
                ctx.strokeStyle = '#39ff14';
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
            } else {
                // Draw from router to drag position
                ctx.lineTo(dragX, dragY);
                ctx.strokeStyle = '#ffe600';
                ctx.lineWidth = 3;
                ctx.setLineDash([6, 4]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }

    function setupTestButton() {
        const btn = document.getElementById('btn-test-connection');
        if (!btn) return;

        btn.addEventListener('click', testConnection);
    }

    function testConnection() {
        const feedback = document.getElementById('network-feedback');
        if (animatingPackets) return;

        // Check cable
        if (!cableConnected) {
            feedback.className = 'error';
            feedback.textContent = '✗ Cable not connected! Drag the cable endpoint to connect router → robot.';
            return;
        }

        // Check IP configuration
        const robotIP = [
            document.getElementById('robot-ip-1').value.trim(),
            document.getElementById('robot-ip-2').value.trim(),
            document.getElementById('robot-ip-3').value.trim(),
            document.getElementById('robot-ip-4').value.trim(),
        ];

        const robotMask = [
            document.getElementById('robot-mask-1').value.trim(),
            document.getElementById('robot-mask-2').value.trim(),
            document.getElementById('robot-mask-3').value.trim(),
            document.getElementById('robot-mask-4').value.trim(),
        ];

        const robotGW = [
            document.getElementById('robot-gw-1').value.trim(),
            document.getElementById('robot-gw-2').value.trim(),
            document.getElementById('robot-gw-3').value.trim(),
            document.getElementById('robot-gw-4').value.trim(),
        ];

        // Validate: robot should be on 192.168.1.x subnet with mask 255.255.255.0
        const correctSubnet = robotIP[0] === '192' && robotIP[1] === '168' && robotIP[2] === '1';
        const validHost = parseInt(robotIP[3]) > 0 && parseInt(robotIP[3]) < 255 && robotIP[3] !== '10'; // not same as PC
        const correctMask = robotMask[0] === '255' && robotMask[1] === '255' && robotMask[2] === '255' && robotMask[3] === '0';
        const correctGW = robotGW[0] === '192' && robotGW[1] === '168' && robotGW[2] === '1' && robotGW[3] === '1';

        // Animate packets
        animatingPackets = true;
        animatePackets(() => {
            animatingPackets = false;

            if (correctSubnet && validHost && correctMask && correctGW) {
                // Success!
                feedback.className = 'success';
                feedback.textContent = '✓ CONNECTION ESTABLISHED! Robot is now online.';

                // Mark all inputs as correct
                document.querySelectorAll('.robot-editable').forEach(el => {
                    el.classList.add('correct');
                    el.readOnly = true;
                });

                setTimeout(() => {
                    Game.completePuzzle('network');
                    Game.transitionTo('room');
                    Game.showDialogue("Network connection established! The robot is online, but it's moving in a loop — its code has a bug. Access the programming interface from the PC to fix it.");
                }, 1500);
            } else {
                feedback.className = 'error';
                let msg = '✗ Connection failed! ';
                if (!correctSubnet) msg += 'Robot IP must be on the same network as the PC (192.168.1.x). ';
                else if (!validHost) msg += 'Invalid host address — must be unique and between 1-254. ';
                if (!correctMask) msg += 'Subnet mask should be 255.255.255.0. ';
                if (!correctGW) msg += 'Gateway should match the PC gateway (192.168.1.1). ';
                feedback.textContent = msg;

                // Mark incorrect fields
                document.querySelectorAll('.robot-editable').forEach(el => {
                    el.classList.remove('correct', 'incorrect');
                });
                if (!correctSubnet || !validHost) {
                    ['robot-ip-1', 'robot-ip-2', 'robot-ip-3', 'robot-ip-4'].forEach(id => {
                        document.getElementById(id).classList.add('incorrect');
                    });
                }
                if (!correctMask) {
                    ['robot-mask-1', 'robot-mask-2', 'robot-mask-3', 'robot-mask-4'].forEach(id => {
                        document.getElementById(id).classList.add('incorrect');
                    });
                }
                if (!correctGW) {
                    ['robot-gw-1', 'robot-gw-2', 'robot-gw-3', 'robot-gw-4'].forEach(id => {
                        document.getElementById(id).classList.add('incorrect');
                    });
                }
            }
        });
    }

    function animatePackets(callback) {
        const canvas = document.getElementById('network-canvas');
        const container = document.getElementById('network-diagram');
        if (!canvas || !container) { callback(); return; }

        // Create a packet element
        const packet = document.createElement('div');
        packet.className = 'packet';
        container.appendChild(packet);

        const pcNode = nodes.find(n => n.id === 'pc');
        const robotNode = nodes.find(n => n.id === 'robot');

        const startX = (pcNode.x / 100) * container.offsetWidth;
        const startY = (pcNode.y / 100) * container.offsetHeight;
        const endX = (robotNode.x / 100) * container.offsetWidth;
        const endY = (robotNode.y / 100) * container.offsetHeight;

        packet.style.left = startX + 'px';
        packet.style.top = startY + 'px';

        // Animate across nodes
        const waypoints = nodes.map(n => ({
            x: (n.x / 100) * container.offsetWidth,
            y: (n.y / 100) * container.offsetHeight,
        }));

        let currentWP = 0;
        const speed = 3;

        function movePacket() {
            if (currentWP >= waypoints.length) {
                packet.remove();
                callback();
                return;
            }

            const target = waypoints[currentWP];
            const curX = parseFloat(packet.style.left);
            const curY = parseFloat(packet.style.top);
            const dx = target.x - curX;
            const dy = target.y - curY;
            const dist = Math.hypot(dx, dy);

            if (dist < speed) {
                packet.style.left = target.x + 'px';
                packet.style.top = target.y + 'px';
                currentWP++;
                requestAnimationFrame(movePacket);
            } else {
                packet.style.left = (curX + (dx / dist) * speed) + 'px';
                packet.style.top = (curY + (dy / dist) * speed) + 'px';
                requestAnimationFrame(movePacket);
            }
        }

        requestAnimationFrame(movePacket);
    }

    document.addEventListener('DOMContentLoaded', init);

    return { init };
})();
