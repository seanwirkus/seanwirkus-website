// Debug utility for mitosis simulation
export class Debug {
  static instance;
  overlayEl;
  simRef;
  enabled = true;
  showStats = true;
  showPhase = true;
  showChromosomes = true;
  showGrid = false;
  showPaths = false;
  frameCount = 0;
  lastTime = 0;
  fps = 0;

  static init(simRef) {
    Debug.instance = new Debug(simRef);
    return Debug.instance;
  }

  static get() {
    return Debug.instance;
  }

  constructor(simRef) {
    this.simRef = simRef;
    this.createOverlay();
    this.createControls();
    
    // FPS calculation
    this.lastTime = performance.now();
    this.frameCount = 0;
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      padding: 10px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(overlay);
    this.overlayEl = overlay;
  }

  createControls() {
    const controls = document.createElement('div');
    controls.id = 'debug-controls';
    controls.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 15px;
      background: rgba(0,0,0,0.9);
      border: 1px solid #666;
      border-radius: 4px;
      color: #fff;
      font-family: monospace;
      z-index: 10000;
    `;

    const toggles = [
      { id: 'enabled', label: 'Debug Mode' },
      { id: 'showStats', label: 'Show Stats' },
      { id: 'showPhase', label: 'Show Phase' },
      { id: 'showChromosomes', label: 'Show Chromosomes' },
      { id: 'showGrid', label: 'Show Grid' },
      { id: 'showPaths', label: 'Show Paths' }
    ];

    toggles.forEach(({ id, label }) => {
      const row = document.createElement('div');
      row.style.marginBottom = '8px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `debug-${id}`;
      checkbox.checked = this[id];
      checkbox.addEventListener('change', () => {
        this[id] = checkbox.checked;
        if (id === 'enabled') this.overlayEl.style.display = checkbox.checked ? 'block' : 'none';
      });

      const labelEl = document.createElement('label');
      labelEl.htmlFor = `debug-${id}`;
      labelEl.textContent = label;
      labelEl.style.marginLeft = '8px';
      labelEl.style.color = '#fff';

      row.appendChild(checkbox);
      row.appendChild(labelEl);
      controls.appendChild(row);
    });

    document.body.appendChild(controls);
  }

  update() {
    if (!this.enabled || !this.overlayEl) return;

    this.frameCount++;
    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastTime = now;
    }

    const sim = this.simRef;
    if (!sim?.Sim) return;

    let debug = '';

    if (this.showStats) {
      debug += `FPS: ${this.fps}\n`;
      debug += `Time: ${sim.Sim.time.toFixed(2)}s\n`;
    }

    if (this.showPhase) {
      const phase = sim.PHASES?.[sim.Sim.phaseIndex];
      debug += `Phase: ${phase?.name} (${(sim.Sim.phaseTime || 0).toFixed(2)}s)\n`;
      debug += `Progress: ${((sim.Sim.phaseTime / (phase?.duration || 1)) * 100).toFixed(1)}%\n`;
    }

    if (this.showChromosomes) {
      const chr = sim.Sim.chromosomes?.[0];
      if (chr) {
        debug += '\nChromosome 0:\n';
        debug += `Position: (${chr.x.toFixed(2)}, ${chr.y.toFixed(2)})\n`;
        debug += `Condensed: ${chr.condensed}\n`;
        debug += `Separated: ${chr.separated}\n`;
        if (chr.kinetochore) {
          debug += `Kinetochore: formed=${chr.kinetochore.formed} attached=${chr.kinetochore.attached}\n`;
        }
      }
    }

    this.overlayEl.innerHTML = debug.replace(/\n/g, '<br>');
  }

  drawGrid(ctx) {
    if (!this.enabled || !this.showGrid) return;
    
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const step = 50;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;

    // Draw grid
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw center crosshair
    ctx.strokeStyle = 'rgba(255,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(w/2, 0);
    ctx.lineTo(w/2, h);
    ctx.moveTo(0, h/2);
    ctx.lineTo(w, h/2);
    ctx.stroke();

    ctx.restore();
  }

  drawChromosomePaths(ctx) {
    if (!this.enabled || !this.showPaths || !this.simRef?.Sim?.chromosomes) return;

    ctx.save();
    this.simRef.Sim.chromosomes.forEach((chr, i) => {
      if (!chr) return;
      
      ctx.strokeStyle = `hsla(${i * 60}, 100%, 50%, 0.3)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(chr.x * ctx.canvas.width/2 + ctx.canvas.width/2, 
              chr.y * ctx.canvas.height/2 + ctx.canvas.height/2, 
              5, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }
}
