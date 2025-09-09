/**
 * Scientific Mitosis Simulator
 * A realistic simulation of cell division with proper physics and biology
 */

class MitosisStudio extends HTMLElement {
    constructor() {
    super();
        this.attachShadow({ mode: 'open' });
        this._init();
    }

    _init() {
        this._createHTML();
        this._initCanvas();
        this._initSimulation();
        this._bindEvents();
        this._startAnimation();
    }

    _createHTML() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('mitosis.css');
            </style>
      <div class="wrap">
                <div class="toolbar">
                    <div class="title-group">
                        <h1 class="title">Mitosis Simulator</h1>
                    </div>
                    <div class="controls-group">
                        <div class="phase-nav">
                            <button id="prevPhase" class="phase-nav-btn">‹</button>
                            <div id="currentPhase" class="current-phase">Interphase</div>
                            <button id="nextPhase" class="phase-nav-btn">›</button>
          </div>
          <div class="chip">
                            <span>Speed:</span>
                            <input type="range" id="speed" min="0.1" max="2" step="0.1" value="0.5">
                            <span id="speedValue">0.5x</span>
                        </div>
                        <button id="play" class="icon">▶</button>
                        <button id="reset" class="icon">↻</button>
          </div>
        </div>

        <div class="content-area">
          <div class="stage">
                        <canvas id="canvas"></canvas>
                        <div class="badges">
                            <div id="fps" class="pill">60 FPS</div>
                            <div id="phaseBadge" class="pill">Interphase</div>
                        </div>
          </div>

          <div class="control-section">
                        <div class="panel main-panel">
                            <div class="panel-header">Phase Progress</div>
                            <div class="panel-body">
                                <div id="phaseInfo">
                                    <div class="phase-name">Interphase</div>
                                    <div class="phase-description">DNA replication and centrosome duplication</div>
                                    <div class="timeline">
                                        <div id="progressBar"></div>
                                    </div>
                                    <div class="progress-container">
                                        <span id="progressLabel">0%</span>
                                    </div>
                                </div>
                                
                                <div class="phases">
                                    <div class="phase" data-phase="interphase">Interphase</div>
                                    <div class="phase" data-phase="prophase">Prophase</div>
                                    <div class="phase" data-phase="prometaphase">Prometaphase</div>
                                    <div class="phase" data-phase="metaphase">Metaphase</div>
                                    <div class="phase" data-phase="anaphase">Anaphase</div>
                                    <div class="phase" data-phase="telophase">Telophase</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="panel compact-panel">
                            <div class="panel-header">Cell Status</div>
                            <div class="panel-body">
                                <div class="molecular-grid">
                                    <div class="status-item">
                                        <span>ATP Level:</span>
                                        <span id="atpLevel">100%</span>
                                    </div>
                                    <div class="status-item">
                                        <span>CDK1:</span>
                                        <span id="cdkLevel">Low</span>
                                    </div>
                                    <div class="status-item">
                                        <span>Nuclear Envelope:</span>
                                        <span id="nuclearStatus">Intact</span>
                                    </div>
                                    <div class="status-item">
                                        <span>Spindle Checkpoint:</span>
                                        <span id="checkpointStatus">Inactive</span>
                                    </div>
                                </div>
                            </div>
            </div>

                        <div class="panel compact-panel">
                            <div class="panel-header">Controls</div>
                            <div class="panel-body">
                                <div class="nav-controls">
                                    <button id="repeatPhase" class="nav-btn">Repeat Phase</button>
                                    <button id="autoPlay" class="nav-btn">Auto Play</button>
                                </div>
                                <div class="action-buttons">
                                    <button id="showLabels" class="action-btn">Show Labels</button>
                                    <button id="debugMode" class="action-btn">Debug</button>
                                </div>
                            </div>
            </div>
          </div>
        </div>
      </div>
    `;
    }

    _initCanvas() {
        this.canvas = this.shadowRoot.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set up canvas sizing
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());
    }

    _resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height) * 0.9;
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
    }

    _initSimulation() {
        // Simulation state
        this.sim = {
            time: 0,
            phase: 'interphase',
            phaseTime: 0,
            playing: false,
            speed: 0.5,
            autoPlay: false,
            showLabels: true,
            debug: false,
            
            // Cell components
            cell: {
                radius: 150,
                centerX: 0,
                centerY: 0,
                elongation: 0
            },
            
            // Nuclear envelope
            nuclearEnvelope: {
                visible: true,
                radius: 120,
                opacity: 1
            },
            
            // Centrosomes (spindle poles)
            centrosomes: [
                { x: 0, y: -100, active: false, microtubules: [] },
                { x: 0, y: 100, active: false, microtubules: [] }
            ],
            
            // Chromosomes
            chromosomes: [],
            
            // Microtubules
            microtubules: [],
            
            // Checkpoint system
            checkpoint: {
                active: false,
                satisfied: false,
                unsatisfiedCount: 0
            },
            
            // Physics
            physics: {
                dt: 1/60,
                drag: 0.95,
                springConstant: 0.1
            },
            
            // Cleavage furrow
            cleavageFurrow: {
                visible: false,
                progress: 0,
                radius: 0
            }
        };
        
        this._initChromosomes();
        this._initCentrosomes();
    }

    _initChromosomes() {
        // Create 6 pairs of chromosomes (12 total)
        this.sim.chromosomes = [];
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 60;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            // Sister chromatids
            const sisterA = {
                id: `chr${i}A`,
                x: x - 10,
                y: y,
                vx: 0,
                vy: 0,
                color: colors[i],
                parental: 'Maternal',
                condensed: false,
                kinetochore: {
                    formed: false,
                    attached: false,
                    attachedTo: null,
                    tension: 0
                }
            };
            
            const sisterB = {
                id: `chr${i}B`,
                x: x + 10,
                y: y,
                vx: 0,
                vy: 0,
                color: colors[i],
                parental: 'Paternal',
                condensed: false,
                kinetochore: {
                    formed: false,
                    attached: false,
                    attachedTo: null,
                    tension: 0
                }
            };
            
            this.sim.chromosomes.push({
                id: `chr${i}`,
                sisters: [sisterA, sisterB],
                cohesin: {
                    intact: true,
                    strength: 1.0
                },
                originalX: x,
                originalY: y
            });
        }
    }

    _initCentrosomes() {
        // Initialize centrosomes at top and bottom
        this.sim.centrosomes[0].x = 0;
        this.sim.centrosomes[0].y = -120;
        this.sim.centrosomes[1].x = 0;
        this.sim.centrosomes[1].y = 120;
    }

    _bindEvents() {
        // Phase navigation
        this.shadowRoot.getElementById('prevPhase').addEventListener('click', () => this._prevPhase());
        this.shadowRoot.getElementById('nextPhase').addEventListener('click', () => this._nextPhase());
        
        // Controls
        this.shadowRoot.getElementById('play').addEventListener('click', () => this._togglePlay());
        this.shadowRoot.getElementById('reset').addEventListener('click', () => this._reset());
        this.shadowRoot.getElementById('speed').addEventListener('input', (e) => {
            this.sim.speed = parseFloat(e.target.value);
            this.shadowRoot.getElementById('speedValue').textContent = this.sim.speed.toFixed(1) + 'x';
        });
        
        // Phase buttons
        this.shadowRoot.querySelectorAll('.phase').forEach(btn => {
            btn.addEventListener('click', () => this._setPhase(btn.dataset.phase));
        });
        
        // Other controls
        this.shadowRoot.getElementById('repeatPhase').addEventListener('click', () => this._repeatPhase());
        this.shadowRoot.getElementById('autoPlay').addEventListener('click', () => this._toggleAutoPlay());
        this.shadowRoot.getElementById('showLabels').addEventListener('click', () => this._toggleLabels());
        this.shadowRoot.getElementById('debugMode').addEventListener('click', () => this._toggleDebug());
    }

    _startAnimation() {
        const animate = (timestamp) => {
            if (this.sim.playing) {
                this._update(timestamp);
            }
            this._draw();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    _update(timestamp) {
        const dt = this.sim.physics.dt * this.sim.speed;
        this.sim.time += dt;
        this.sim.phaseTime += dt;
        
        this._updatePhase();
        this._updatePhysics(dt);
        this._updateUI();
    }

    _updatePhase() {
        const phases = {
            interphase: { duration: 5, next: 'prophase' },
            prophase: { duration: 3, next: 'prometaphase' },
            prometaphase: { duration: 4, next: 'metaphase' },
            metaphase: { duration: 2, next: 'anaphase' },
            anaphase: { duration: 3, next: 'telophase' },
            telophase: { duration: 4, next: 'interphase' }
        };
        
        const currentPhase = phases[this.sim.phase];
        if (this.sim.phaseTime >= currentPhase.duration) {
            this._transitionToPhase(currentPhase.next);
        }
    }

    _transitionToPhase(newPhase) {
        this.sim.phase = newPhase;
        this.sim.phaseTime = 0;
        this._resetPhaseState();
    }

    _resetPhaseState() {
        switch (this.sim.phase) {
            case 'interphase':
                this.sim.nuclearEnvelope.visible = true;
                this.sim.nuclearEnvelope.opacity = 1;
                this.sim.centrosomes.forEach(c => c.active = false);
                this.sim.chromosomes.forEach(chr => {
                    chr.sisters.forEach(sister => {
                        sister.condensed = false;
                        sister.kinetochore.formed = false;
                        sister.kinetochore.attached = false;
                    });
                });
                break;
                
            case 'prophase':
                this.sim.centrosomes.forEach(c => c.active = true);
                this.sim.chromosomes.forEach(chr => {
                    chr.sisters.forEach(sister => {
                        sister.condensed = true;
                        sister.kinetochore.formed = true;
                    });
                });
                break;
                
            case 'prometaphase':
                this.sim.nuclearEnvelope.visible = false;
                this.sim.checkpoint.active = true;
                break;
                
            case 'metaphase':
                this.sim.checkpoint.satisfied = true;
                break;
                
            case 'anaphase':
                this.sim.chromosomes.forEach(chr => {
                    chr.cohesin.intact = false;
                });
                break;
                
            case 'telophase':
                this.sim.nuclearEnvelope.visible = true;
                this.sim.nuclearEnvelope.opacity = 0.5;
                this.sim.cleavageFurrow.visible = true;
                break;
        }
    }

    _updatePhysics(dt) {
        // Update chromosome positions based on phase
        this._updateChromosomeBehavior(dt);
        
        // Update microtubule dynamics
        this._updateMicrotubules(dt);
        
        // Apply forces
        this._applyForces(dt);
        
        // Update cell shape
        this._updateCellShape(dt);
    }

    _updateChromosomeBehavior(dt) {
        const progress = this.sim.phaseTime / this._getPhaseDuration();
        
        this.sim.chromosomes.forEach(chr => {
            chr.sisters.forEach((sister, index) => {
                switch (this.sim.phase) {
                    case 'prophase':
                        // Condensation
                        sister.condensed = true;
                        break;
                        
                    case 'prometaphase':
                        // Random movement for attachment
                        sister.vx += (Math.random() - 0.5) * 0.1;
                        sister.vy += (Math.random() - 0.5) * 0.1;
                        break;
                        
                    case 'metaphase':
                        // Align at metaphase plate
                        const targetY = 0;
                        sister.vy += (targetY - sister.y) * 0.05;
                        break;
                        
                    case 'anaphase':
                        // Separate sister chromatids
                        const pole = index === 0 ? -1 : 1;
                        const targetY = pole * 80;
                        sister.vy += (targetY - sister.y) * 0.1;
                        break;
                        
                    case 'telophase':
                        // Decondensation
                        sister.condensed = false;
                        break;
                }
                
                // Apply velocity
                sister.x += sister.vx * dt;
                sister.y += sister.vy * dt;
                
                // Apply drag
                sister.vx *= this.sim.physics.drag;
                sister.vy *= this.sim.physics.drag;
            });
        });
    }

    _updateMicrotubules(dt) {
        // Advanced microtubule dynamics with dynamic instability
        if (this.sim.phase === 'prometaphase' || this.sim.phase === 'metaphase' || this.sim.phase === 'anaphase') {
            this.sim.centrosomes.forEach((centrosome, centrosomeIndex) => {
                if (centrosome.active) {
                    // Update existing microtubules
                    centrosome.microtubules = centrosome.microtubules.filter(mt => {
                        // Dynamic instability
                        if (mt.state === 'growing') {
                            mt.length += mt.growthRate * dt;
                            if (Math.random() < mt.catastropheRate * dt) {
                                mt.state = 'shrinking';
                            }
                        } else if (mt.state === 'shrinking') {
                            mt.length -= mt.shrinkRate * dt;
                            if (mt.length <= 0 || Math.random() < mt.rescueRate * dt) {
                                return false; // Remove or rescue
                            }
                        }
                        
                        // Update end position
                        mt.endX = centrosome.x + Math.cos(mt.angle) * mt.length;
                        mt.endY = centrosome.y + Math.sin(mt.angle) * mt.length;
                        
                        return true;
                    });
                    
                    // Add new microtubules
                    if (centrosome.microtubules.length < 20) {
                        const newAngle = Math.random() * Math.PI * 2;
                        centrosome.microtubules.push({
                            angle: newAngle,
                            length: 10,
                            growthRate: 2 + Math.random() * 2,
                            shrinkRate: 5 + Math.random() * 3,
                            catastropheRate: 0.1 + Math.random() * 0.1,
                            rescueRate: 0.05 + Math.random() * 0.05,
                            state: 'growing',
                            attached: false,
                            attachedKinetochore: null,
                            tension: 0,
                            startX: centrosome.x,
                            startY: centrosome.y,
                            endX: centrosome.x + Math.cos(newAngle) * 10,
                            endY: centrosome.y + Math.sin(newAngle) * 10
                        });
                    }
                }
            });
            
            // Attempt kinetochore capture
            this._attemptKinetochoreCapture();
        }
    }

    _attemptKinetochoreCapture() {
        const captureRadius = 15;
        
        this.sim.chromosomes.forEach(chr => {
            chr.sisters.forEach(sister => {
                if (sister.kinetochore.formed && !sister.kinetochore.attached) {
                    // Check for microtubule proximity
                    this.sim.centrosomes.forEach(centrosome => {
                        centrosome.microtubules.forEach(mt => {
                            const dx = sister.x - mt.endX;
                            const dy = sister.y - mt.endY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < captureRadius && !mt.attached) {
                                // Capture!
                                sister.kinetochore.attached = true;
                                sister.kinetochore.attachedTo = centrosome;
                                mt.attached = true;
                                mt.attachedKinetochore = sister;
                                
                                // Pull microtubule end to kinetochore
                                mt.endX = sister.x;
                                mt.endY = sister.y;
                            }
                        });
                    });
                }
            });
        });
    }

    _applyForces(dt) {
        // Apply cohesin spring forces between sister chromatids
        this.sim.chromosomes.forEach(chr => {
            if (chr.cohesin.intact) {
                const sisterA = chr.sisters[0];
                const sisterB = chr.sisters[1];
                const dx = sisterB.x - sisterA.x;
                const dy = sisterB.y - sisterA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const targetDistance = 20;
                
                if (distance > targetDistance) {
                    const force = (distance - targetDistance) * this.sim.physics.springConstant;
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    sisterA.vx += fx * dt;
                    sisterA.vy += fy * dt;
                    sisterB.vx -= fx * dt;
                    sisterB.vy -= fy * dt;
                }
            }
        });
        
        // Apply microtubule pulling forces
        this._applyMicrotubuleForces(dt);
        
        // Apply motor forces (Eg5, dynein)
        this._applyMotorForces(dt);
        
        // Update checkpoint status
        this._updateCheckpointStatus();
    }

    _applyMicrotubuleForces(dt) {
        this.sim.centrosomes.forEach(centrosome => {
            centrosome.microtubules.forEach(mt => {
                if (mt.attached && mt.attachedKinetochore) {
                    const sister = mt.attachedKinetochore;
                    const dx = centrosome.x - sister.x;
                    const dy = centrosome.y - sister.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        // Pulling force towards pole
                        const pullForce = 0.5;
                        const fx = (dx / distance) * pullForce;
                        const fy = (dy / distance) * pullForce;
                        
                        sister.vx += fx * dt;
                        sister.vy += fy * dt;
                        
                        // Calculate tension
                        mt.tension = distance;
                        sister.kinetochore.tension = distance;
                    }
                }
            });
        });
    }

    _applyMotorForces(dt) {
        // Eg5 motor pushes centrosomes apart
        if (this.sim.phase === 'anaphase' || this.sim.phase === 'telophase') {
            const centrosome1 = this.sim.centrosomes[0];
            const centrosome2 = this.sim.centrosomes[1];
            const dx = centrosome2.x - centrosome1.x;
            const dy = centrosome2.y - centrosome1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const pushForce = 0.3;
                const fx = (dx / distance) * pushForce;
                const fy = (dy / distance) * pushForce;
                
                centrosome1.x -= fx * dt;
                centrosome1.y -= fy * dt;
                centrosome2.x += fx * dt;
                centrosome2.y += fy * dt;
            }
        }
    }

    _updateCheckpointStatus() {
        if (this.sim.phase === 'prometaphase' || this.sim.phase === 'metaphase') {
            let satisfiedCount = 0;
            let totalChromosomes = 0;
            
            this.sim.chromosomes.forEach(chr => {
                const sisterA = chr.sisters[0];
                const sisterB = chr.sisters[1];
                totalChromosomes++;
                
                // Check if both sisters are attached to different poles with tension
                const attachedToDifferentPoles = sisterA.kinetochore.attachedTo !== sisterB.kinetochore.attachedTo;
                const hasTension = sisterA.kinetochore.tension > 10 && sisterB.kinetochore.tension > 10;
                
                if (sisterA.kinetochore.attached && sisterB.kinetochore.attached && 
                    attachedToDifferentPoles && hasTension) {
                    satisfiedCount++;
                }
            });
            
            this.sim.checkpoint.satisfied = satisfiedCount === totalChromosomes;
            this.sim.checkpoint.unsatisfiedCount = totalChromosomes - satisfiedCount;
        }
    }

    _updateCellShape(dt) {
        // Cell elongation during anaphase and telophase
        if (this.sim.phase === 'anaphase' || this.sim.phase === 'telophase') {
            this.sim.cell.elongation = Math.min(1, this.sim.phaseTime / 2);
        } else {
            this.sim.cell.elongation = Math.max(0, this.sim.cell.elongation - dt * 0.5);
        }
        
        // Update cleavage furrow
        if (this.sim.cleavageFurrow.visible) {
            this.sim.cleavageFurrow.progress = Math.min(1, this.sim.phaseTime / 3);
            this.sim.cleavageFurrow.radius = this.sim.cell.radius * (1 - this.sim.cleavageFurrow.progress * 0.8);
        }
    }

    _getPhaseDuration() {
        const durations = {
            interphase: 5,
            prophase: 3,
            prometaphase: 4,
            metaphase: 2,
            anaphase: 3,
            telophase: 4
        };
        return durations[this.sim.phase] || 3;
    }

    _draw() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw cell membrane
        this._drawCellMembrane(ctx, centerX, centerY);
        
        // Draw nuclear envelope
        if (this.sim.nuclearEnvelope.visible) {
            this._drawNuclearEnvelope(ctx, centerX, centerY);
        }
        
        // Draw centrosomes
        this._drawCentrosomes(ctx, centerX, centerY);
        
        // Draw microtubules
        this._drawMicrotubules(ctx, centerX, centerY);
        
        // Draw chromosomes
        this._drawChromosomes(ctx, centerX, centerY);
        
        // Draw cleavage furrow
        if (this.sim.cleavageFurrow.visible) {
            this._drawCleavageFurrow(ctx, centerX, centerY);
        }
        
        // Draw labels if enabled
        if (this.sim.showLabels) {
            this._drawLabels(ctx, centerX, centerY);
        }
    }

    _drawCellMembrane(ctx, centerX, centerY) {
        ctx.save();
        ctx.translate(centerX, centerY);
        
        const radiusX = this.sim.cell.radius;
        const radiusY = this.sim.cell.radius * (1 + this.sim.cell.elongation * 0.5);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.restore();
    }

    _drawNuclearEnvelope(ctx, centerX, centerY) {
        ctx.save();
        ctx.translate(centerX, centerY);
        
        ctx.globalAlpha = this.sim.nuclearEnvelope.opacity;
        ctx.beginPath();
        ctx.arc(0, 0, this.sim.nuclearEnvelope.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    _drawCentrosomes(ctx, centerX, centerY) {
        this.sim.centrosomes.forEach(centrosome => {
            if (centrosome.active) {
                ctx.save();
                ctx.translate(centerX + centrosome.x, centerY + centrosome.y);
                
                // Draw centrosome
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#1f2937';
                ctx.fill();
                
                // Draw aster
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const length = 15;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        });
    }

    _drawMicrotubules(ctx, centerX, centerY) {
        ctx.save();
        
        this.sim.centrosomes.forEach(centrosome => {
            if (centrosome.active) {
                centrosome.microtubules.forEach(mt => {
                    // Color based on state and attachment
                    if (mt.attached) {
                        ctx.strokeStyle = '#10b981'; // Green for attached
                        ctx.lineWidth = 3;
                        ctx.setLineDash([]);
                    } else if (mt.state === 'growing') {
                        ctx.strokeStyle = '#a855f7'; // Purple for growing
                        ctx.lineWidth = 2;
                        ctx.setLineDash([5, 5]);
                    } else {
                        ctx.strokeStyle = '#ef4444'; // Red for shrinking
                        ctx.lineWidth = 1;
                        ctx.setLineDash([2, 2]);
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(centerX + mt.startX, centerY + mt.startY);
                    ctx.lineTo(centerX + mt.endX, centerY + mt.endY);
                    ctx.stroke();
                    
                    // Draw plus end
                    ctx.beginPath();
                    ctx.arc(centerX + mt.endX, centerY + mt.endY, 2, 0, Math.PI * 2);
                    ctx.fillStyle = mt.attached ? '#10b981' : '#a855f7';
                    ctx.fill();
                });
            }
        });
        
    ctx.restore();
  }

    _drawChromosomes(ctx, centerX, centerY) {
        this.sim.chromosomes.forEach(chr => {
            chr.sisters.forEach(sister => {
                ctx.save();
                ctx.translate(centerX + sister.x, centerY + sister.y);
                
                if (sister.condensed) {
                    // Draw condensed chromosome (X-shape)
                    ctx.strokeStyle = sister.color;
                    ctx.lineWidth = 3;
                    
                    // Horizontal arms
                    ctx.beginPath();
                    ctx.moveTo(-15, -5);
                    ctx.lineTo(15, 5);
                    ctx.moveTo(-15, 5);
                    ctx.lineTo(15, -5);
                    ctx.stroke();
                    
                    // Vertical arms
                    ctx.beginPath();
                    ctx.moveTo(-5, -15);
                    ctx.lineTo(5, 15);
                    ctx.moveTo(5, -15);
                    ctx.lineTo(-5, 15);
                    ctx.stroke();
                    
                    // Centromere
                    ctx.beginPath();
                    ctx.arc(0, 0, 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();
                    ctx.strokeStyle = sister.color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Kinetochore
                    if (sister.kinetochore.formed) {
                        ctx.beginPath();
                        ctx.arc(0, 0, 2, 0, Math.PI * 2);
                        
                        // Color based on attachment and tension
                        if (sister.kinetochore.attached) {
                            if (sister.kinetochore.tension > 15) {
                                ctx.fillStyle = '#10b981'; // Green for high tension
                            } else {
                                ctx.fillStyle = '#fbbf24'; // Yellow for low tension
                            }
                        } else {
                            ctx.fillStyle = '#ef4444'; // Red for unattached
                        }
                        ctx.fill();
                        
                        // Draw tension indicator
                        if (sister.kinetochore.attached && sister.kinetochore.tension > 0) {
                            ctx.strokeStyle = ctx.fillStyle;
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.arc(0, 0, 6, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                } else {
                    // Draw decondensed chromatin
                    ctx.strokeStyle = sister.color;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for (let i = 0; i < 20; i++) {
                        const x = (i / 20) * 30 - 15;
                        const y = Math.sin(i * 0.5) * 5;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
                
                ctx.restore();
            });
        });
    }

    _drawCleavageFurrow(ctx, centerX, centerY) {
        ctx.save();
        ctx.translate(centerX, centerY);
        
        const progress = this.sim.cleavageFurrow.progress;
        const radius = this.sim.cleavageFurrow.radius;
        
        // Draw constriction ring
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw constriction lines
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const startRadius = radius * 0.8;
            const endRadius = radius * 1.2;
            
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius);
            ctx.lineTo(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        ctx.restore();
    }

    _drawLabels(ctx, centerX, centerY) {
        // Draw phase-specific labels
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        if (this.sim.phase === 'metaphase') {
            ctx.fillText('Metaphase Plate', centerX, centerY + 5);
        } else if (this.sim.phase === 'anaphase') {
            ctx.fillText('Anaphase A & B', centerX, centerY + 5);
        } else if (this.sim.phase === 'telophase') {
            ctx.fillText('Cytokinesis', centerX, centerY + 5);
        }
        
        ctx.restore();
    }

    _updateUI() {
        // Update phase display
        this.shadowRoot.getElementById('currentPhase').textContent = this.sim.phase.charAt(0).toUpperCase() + this.sim.phase.slice(1);
        this.shadowRoot.getElementById('phaseBadge').textContent = this.sim.phase.charAt(0).toUpperCase() + this.sim.phase.slice(1);
        
        // Update progress
        const progress = (this.sim.phaseTime / this._getPhaseDuration()) * 100;
        this.shadowRoot.getElementById('progressBar').style.width = progress + '%';
        this.shadowRoot.getElementById('progressLabel').textContent = Math.round(progress) + '%';
        
        // Update phase buttons
        this.shadowRoot.querySelectorAll('.phase').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.phase === this.sim.phase);
        });
        
        // Update status
        this.shadowRoot.getElementById('nuclearStatus').textContent = 
            this.sim.nuclearEnvelope.visible ? 'Intact' : 'Disassembled';
        
        if (this.sim.checkpoint.active) {
            const status = this.sim.checkpoint.satisfied ? 'Satisfied' : `Active (${this.sim.checkpoint.unsatisfiedCount} remaining)`;
            this.shadowRoot.getElementById('checkpointStatus').textContent = status;
        } else {
            this.shadowRoot.getElementById('checkpointStatus').textContent = 'Inactive';
        }
    }

    // Control methods
    _togglePlay() {
        this.sim.playing = !this.sim.playing;
        this.shadowRoot.getElementById('play').textContent = this.sim.playing ? '⏸' : '▶';
    }

    _prevPhase() {
        const phases = ['interphase', 'prophase', 'prometaphase', 'metaphase', 'anaphase', 'telophase'];
        const currentIndex = phases.indexOf(this.sim.phase);
        if (currentIndex > 0) {
            this._setPhase(phases[currentIndex - 1]);
        }
    }

    _nextPhase() {
        const phases = ['interphase', 'prophase', 'prometaphase', 'metaphase', 'anaphase', 'telophase'];
        const currentIndex = phases.indexOf(this.sim.phase);
        if (currentIndex < phases.length - 1) {
            this._setPhase(phases[currentIndex + 1]);
        }
    }

    _setPhase(phase) {
        this.sim.phase = phase;
        this.sim.phaseTime = 0;
        this._resetPhaseState();
    }

    _reset() {
        this.sim.time = 0;
        this.sim.phase = 'interphase';
        this.sim.phaseTime = 0;
        this.sim.playing = false;
        this._resetPhaseState();
        this._initChromosomes();
    }

    _repeatPhase() {
        this.sim.phaseTime = 0;
    }

    _toggleAutoPlay() {
        this.sim.autoPlay = !this.sim.autoPlay;
        this.shadowRoot.getElementById('autoPlay').classList.toggle('active', this.sim.autoPlay);
    }

    _toggleLabels() {
        this.sim.showLabels = !this.sim.showLabels;
        this.shadowRoot.getElementById('showLabels').classList.toggle('active', this.sim.showLabels);
    }

    _toggleDebug() {
        this.sim.debug = !this.sim.debug;
        this.shadowRoot.getElementById('debugMode').classList.toggle('active', this.sim.debug);
    }
}

// Register the custom element
customElements.define('mitosis-studio', MitosisStudio);
