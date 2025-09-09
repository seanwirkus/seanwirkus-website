import { Debug } from '../utils/Debug.js';

export class MitosisSimulation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Core properties
    this._DPR = window.devicePixelRatio || 1;
    this.el = {};
    
    // Simulation state
    this.Sim = {
      phaseIndex: 1,
      time: 0,
      phaseTime: 0,
      chromosomes: [],
      parentalChromosomes: [],
      nuclearEnvelope: { visible: true, opacity: 1 },
      centrosomes: [],
      dnaDamage: false,
      blockMicrotubules: false
    };
    
    // Visual settings
    this.VIS = {
      chromatidLineWidth: 6,
      chromatidThinLineWidth: 2,
      condensedLengthFactor: 0.15,
      centromereRadius: 4
    };

    // Phase definitions
    this.PHASES = [
      { key: 'prophase', name: 'Prophase', duration: 500, tip: 'Chromosomes condense and become visible.' },
      { key: 'prometaphase', name: 'Prometaphase', duration: 500, tip: 'Nuclear envelope breaks down, spindle fibers attach.' },
      { key: 'metaphase', name: 'Metaphase', duration: 500, tip: 'Chromosomes align at the metaphase plate.' },
      { key: 'anaphase', name: 'Anaphase', duration: 500, tip: 'Sister chromatids separate and move to poles.' },
      { key: 'telophase', name: 'Telophase', duration: 500, tip: 'Nuclear envelope reforms, chromosomes decondense.' }
    ];
    
    this.CHROM_PAIR_COUNT = 2;
  }

  connectedCallback() {
    this.setupUI();
    this.initSimulation();
    Debug.init(this); // Initialize debug tools
  }

  setupUI() {
    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
        }
        .stage {
          width: 100%;
          height: 100%;
          position: relative;
          background: #1a1a1a;
        }
        canvas {
          width: 100%;
          height: 100%;
        }
        .controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          padding: 10px;
          background: rgba(0,0,0,0.7);
          border-radius: 8px;
        }
        button {
          background: #333;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background: #444;
        }
      </style>
      <div class="stage">
        <canvas></canvas>
        <div class="controls">
          <button id="prevPhase">◀ Previous</button>
          <button id="nextPhase">Next ▶</button>
          <input type="range" id="speed" min="0.1" max="2" step="0.1" value="1">
          <span id="speedValue">1.0x</span>
        </div>
      </div>
    \`;

    // Cache elements
    this.el.canvas = this.shadowRoot.querySelector('canvas');
    this.el.speed = this.shadowRoot.querySelector('#speed');
    this.el.speedValue = this.shadowRoot.querySelector('#speedValue');
    
    // Bind events
    this.shadowRoot.querySelector('#prevPhase').addEventListener('click', () => this.prevPhase());
    this.shadowRoot.querySelector('#nextPhase').addEventListener('click', () => this.nextPhase());
    this.el.speed.addEventListener('input', e => {
      const speed = parseFloat(e.target.value);
      this.el.speedValue.textContent = speed.toFixed(1) + 'x';
    });
  }

  initSimulation() {
    if (!this.el.canvas) return;
    
    this.ctx = this.el.canvas.getContext('2d');
    this.setupCanvas();
    this.initChromosomes();
    this.initCentrosomes();
    this.startAnimationLoop();
  }

  setupCanvas() {
    const resize = () => {
      const rect = this.el.canvas.getBoundingClientRect();
      const w = Math.max(400, Math.floor(rect.width));
      const h = Math.max(400, Math.floor(rect.height));
      const dpr = this._DPR;
      
      this.el.canvas.width = w * dpr;
      this.el.canvas.height = h * dpr;
      this.el.canvas.style.width = w + 'px';
      this.el.canvas.style.height = h + 'px';
      this.ctx.scale(dpr, dpr);
    };

    resize();
    new ResizeObserver(resize).observe(this.el.canvas);
  }

  startAnimationLoop() {
    let lastTime = performance.now();
    
    const animate = (now) => {
      const deltaTime = now - lastTime;
      lastTime = now;

      // Update simulation
      const speed = parseFloat(this.el.speed.value);
      this.Sim.time += deltaTime * 0.001 * speed;
      this.Sim.phaseTime += deltaTime * 0.001 * speed;

      // Check phase transition
      const phase = this.PHASES[this.Sim.phaseIndex];
      if (phase && this.Sim.phaseTime >= phase.duration) {
        this.nextPhase();
      }

      this.updatePhase();
      this.draw();
      Debug.get().update();
      
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  prevPhase() {
    if (this.Sim.phaseIndex > 0) {
      this.Sim.phaseIndex--;
      this.Sim.phaseTime = 0;
      this.resetPhaseState();
    }
  }

  nextPhase() {
    if (this.Sim.phaseIndex < this.PHASES.length - 1) {
      this.Sim.phaseIndex++;
      this.Sim.phaseTime = 0;
      this.resetPhaseState();
    }
  }

  resetPhaseState() {
    const phase = this.Sim.phaseIndex;
    
    this.Sim.chromosomes.forEach(chr => {
      chr.condensed = phase >= 1;
      chr.separated = phase >= 4;
      chr.kinetochore.formed = phase >= 2;
      chr.kinetochore.attached = phase >= 3;
    });

    this.Sim.nuclearEnvelope.visible = phase <= 1 || phase >= 5;
    this.Sim.centrosomes.forEach(c => c.active = phase >= 2);
  }

  updatePhase() {
    const phase = this.Sim.phaseIndex;
    const progress = this.Sim.phaseTime / (this.PHASES[phase]?.duration || 1);
    
    this.Sim.chromosomes.forEach((chr, i) => {
      const wave = Math.sin(this.Sim.time * 2 + i * 0.5) * 0.02;
      
      switch (phase) {
        case 1: // Prophase
          chr.angle = (chr.angle || 0) + 0.01;
          chr.x = Math.cos(chr.angle) * 0.35 + wave;
          chr.y = Math.sin(chr.angle) * 0.35;
          break;
          
        case 2: // Prometaphase
          chr.x += (0 - chr.x) * 0.1 + (Math.random() - 0.5) * 0.05;
          chr.y += (0 - chr.y) * 0.1 + (Math.random() - 0.5) * 0.05;
          break;
          
        case 3: // Metaphase
          const spacing = 0.15;
          const targetX = (i - (this.CHROM_PAIR_COUNT - 1) / 2) * spacing;
          chr.x += (targetX - chr.x) * 0.1;
          chr.y += (wave * 0.5 - chr.y) * 0.1;
          break;
          
        case 4: // Anaphase
          if (chr.sisterChromatids) {
            const poleY = 0.4;
            chr.sisterChromatids[0].y += (-poleY - chr.sisterChromatids[0].y) * 0.05;
            chr.sisterChromatids[1].y += (poleY - chr.sisterChromatids[1].y) * 0.05;
          }
          break;
          
        case 5: // Telophase
          chr.condensed = progress < 0.5;
          break;
      }
    });
  }

  draw() {
    if (!this.ctx || !this.el.canvas) return;

    const ctx = this.ctx;
    const canvas = this.el.canvas;
    
    // Clear and setup
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    
    // Debug grid/overlay
    const debug = Debug.get();
    debug.drawGrid(ctx);
    debug.drawChromosomePaths(ctx);
    
    // Draw simulation elements
    this.drawNuclearEnvelope();
    this.drawChromosomes();
    this.drawCentrosomes();
    
    ctx.restore();
  }

  drawNuclearEnvelope() {
    if (!this.Sim.nuclearEnvelope.visible) return;
    
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = \`rgba(255,255,255,\${this.Sim.nuclearEnvelope.opacity})\`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.el.canvas.width * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawChromosomes() {
    this.Sim.chromosomes.forEach((chr, i) => {
      this.drawChromosome(chr, i);
    });
  }

  drawChromosome(chr, index) {
    if (!chr) return;
    
    const ctx = this.ctx;
    const canvas = this.el.canvas;
    const scale = canvas.width * 0.1;
    
    ctx.save();
    ctx.translate(chr.x * scale, chr.y * scale);
    
    if (chr.condensed) {
      // Draw chromatid body
      ctx.strokeStyle = chr.parentalColor;
      ctx.lineWidth = this.VIS.chromatidLineWidth;
      ctx.lineCap = 'round';
      
      if (chr.separated && chr.sisterChromatids) {
        // Draw separated sisters
        chr.sisterChromatids.forEach((sister, i) => {
          ctx.save();
          ctx.translate(sister.x * scale, sister.y * scale);
          ctx.beginPath();
          ctx.moveTo(0, -scale * 0.2);
          ctx.lineTo(0, scale * 0.2);
          ctx.stroke();
          ctx.restore();
        });
      } else {
        // Draw paired chromatids
        const offset = this.VIS.chromatidLineWidth;
        [-offset, offset].forEach(x => {
          ctx.beginPath();
          ctx.moveTo(x, -scale * 0.2);
          ctx.lineTo(x, scale * 0.2);
          ctx.stroke();
        });
      }
      
      // Draw centromere
      if (chr.kinetochore.formed) {
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, this.VIS.centromereRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Draw decondensed chromatin
      ctx.strokeStyle = chr.parentalColor;
      ctx.lineWidth = this.VIS.chromatidThinLineWidth;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const x = (i - 5) * 5;
        const y = Math.sin(i * 0.5) * 5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    
    ctx.restore();
  }

  drawCentrosomes() {
    const ctx = this.ctx;
    const canvas = this.el.canvas;
    const scale = canvas.width * 0.1;
    
    this.Sim.centrosomes.forEach(c => {
      if (!c.active) return;
      
      ctx.save();
      ctx.translate(c.x * scale, c.y * scale);
      
      // Centrosome body
      ctx.fillStyle = '#66bb6a';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Microtubules
      if (!this.Sim.blockMicrotubules) {
        ctx.strokeStyle = 'rgba(102,187,106,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * scale, Math.sin(angle) * scale);
          ctx.stroke();
        }
      }
      
      ctx.restore();
    });
  }

  // Initialize simulation elements
  initChromosomes() {
    this.Sim.chromosomes = [];
    
    for (let i = 0; i < this.CHROM_PAIR_COUNT; i++) {
      const angle = (i / this.CHROM_PAIR_COUNT) * Math.PI * 2;
      const parentalColor = i % 2 === 0 ? '#e91e63' : '#3f51b5';
      
      this.Sim.chromosomes.push({
        id: i,
        x: Math.cos(angle) * 0.35,
        y: Math.sin(angle) * 0.35,
        angle: angle,
        condensed: true,
        separated: false,
        parentalColor: parentalColor,
        parentalOrigin: i % 2 === 0 ? 'Maternal' : 'Paternal',
        sisterChromatids: [
          { x: 0, y: 0, angle: 0, attached: false },
          { x: 0, y: 0, angle: 0, attached: false }
        ],
        kinetochore: { formed: false, attached: false }
      });
    }
  }

  initCentrosomes() {
    this.Sim.centrosomes = [
      { x: 0, y: -0.4, active: false },
      { x: 0, y: 0.4, active: false }
    ];
  }
}
