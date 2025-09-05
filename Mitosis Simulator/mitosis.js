class MitosisStudio extends HTMLElement {
  constructor(){
    super();
    this._root = this.attachShadow({mode:'open'});
    this._root.innerHTML = `
      <link rel="stylesheet" href="mitosis.css">
      <div class="wrap">
        <div class="toolbar">
          <div class="title">🧬 Mitosis Studio</div>
          <div class="chip">
            <button class="icon" id="play" aria-label="Play/Pause">▶️</button>
            <span class="muted">Speed</span>
            <input id="speed" type="range" min="0.25" max="3" step="0.25" value="1"/>
          </div>
          <div class="chip">
            <label class="muted" for="phaseSel">Phase</label>
            <select id="phaseSel">
              <option value="interphase">Interphase</option>
              <option value="prophase">Prophase</option>
              <option value="metaphase">Metaphase</option>
              <option value="anaphase">Anaphase</option>
              <option value="telophase">Telophase</option>
              <option value="cytokinesis">Cytokinesis</option>
            </select>
            <button class="icon" id="reset" title="Reset">🔄</button>
            <button class="icon" id="snap" title="Export PNG">📸</button>
            <button class="icon" id="share" title="Share Simulation">🔗</button>
          </div>
          <div class="grow"></div>
          <div class="muted">Cell Health: <span id="health" class="pill">✅ Stable</span></div>
        </div>

        <div class="stage">
          <canvas id="c"></canvas>
          <div class="badges">
            <span class="pill" id="phaseBadge">Interphase</span>
            <span class="pill" id="chkBadge">G1/S ✔︎</span>
          </div>
        </div>

        <div class="panel">
          <div class="timeline"><div id="progress"></div></div>
              <div class="phases" id="phaseGrid"></div>
              <div class="progress-container"><span class="progress-label">Progress</span><span id="progressLabel" class="pill">0%</span></div>
        </div>

        <div class="panel">
          <div class="row" style="margin-bottom:.4rem;"><strong id="infoTitle">Interphase</strong></div>
          <div class="muted" id="infoBody">DNA replicates in S phase; cell grows in G1 and G2; checkpoints monitor integrity.</div>
        </div>

        <div class="panel">
          <div class="grid">
            <label class="pill"><input type="checkbox" id="mtBlock"> Block microtubules (colchicine)</label>
            <label class="pill"><input type="checkbox" id="actBlock"> Block cytokinesis (latrunculin)</label>
            <label class="pill"><input type="checkbox" id="override"> Override checkpoints</label>
            <label class="pill"><input type="checkbox" id="p53" checked> p53 functional</label>
          </div>
          <div style="margin-top:.5rem;">
            <span class="muted">DNA Damage</span>
            <input id="damage" type="range" min="0" max="100" value="0" />
          </div>
          <div style="margin-top:.5rem;">
            <span class="muted">Temperature (°C)</span>
            <input id="temperature" type="range" min="20" max="45" value="37" />
            <span id="tempDisplay" class="pill">37°C</span>
          </div>
          <div style="margin-top:.5rem;">
            <span class="muted">Nutrients</span>
            <input id="nutrients" type="range" min="0" max="100" value="100" />
            <span id="nutrientDisplay" class="pill">100%</span>
          </div>
          <div style="margin-top:.5rem;">
            <span class="muted">Cell Type</span>
            <select id="cellType">
              <option value="normal">Normal Cell</option>
              <option value="cancer">Cancer Cell</option>
              <option value="senescent">Senescent Cell</option>
            </select>
          </div>
        </div>

        <div class="panel">
          <div class="row">
            <div>
              <div class="muted" style="margin-bottom:.25rem;">Phase Quiz</div>
              <button id="quiz">Start Quiz</button>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="row" style="margin-bottom:.4rem;"><strong>Molecular Status</strong></div>
          <div class="grid">
            <div class="pill">ATP: <span id="atpLevel">100</span>%</div>
            <div class="pill">O₂: <span id="oxygenLevel">80</span>%</div>
            <div class="pill">NADPH: <span id="nadphLevel">50</span>%</div>
            <div class="pill">Proteins: <span id="proteinCount">0</span></div>
          </div>
          <div class="grid" style="margin-top:.4rem;">
            <div class="pill">CDK1: <span id="cdk1Level">0</span>%</div>
            <div class="pill">CDK2: <span id="cdk2Level">0</span>%</div>
            <div class="pill">p53: <span id="p53Level">100</span>%</div>
            <div class="pill">mTOR: <span id="mtorLevel">50</span>%</div>
          </div>
        </div>

        <div class="panel">
          <div class="row" style="margin-bottom:.4rem;"><strong>Keyboard Shortcuts</strong></div>
          <div class="muted" style="font-size:.8rem; line-height:1.4;">
            <div><strong>Space:</strong> Play/Pause</div>
            <div><strong>←/→:</strong> Previous/Next Phase</div>
            <div><strong>R:</strong> Reset</div>
            <div><strong>S:</strong> Screenshot</div>
            <div><strong>Q:</strong> Quiz</div>
            <div><strong>M:</strong> Toggle Sandbox</div>
            <div><strong>T:</strong> Toggle Temperature</div>
            <div><strong>1/2/3:</strong> DNA Damage (0%/50%/100%)</div>
          </div>
        </div>
      </div>

      <div id="quizModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="quizTitle">
        <div class="sheet">
          <h3 id="quizTitle">Phase Quiz</h3>
          <p id="quizQ" style="font-weight:600"></p>
          <div id="quizOpts" style="display:grid;gap:.5rem;margin:.5rem 0;"></div>
          <div class="foot">
            <div id="quizRes" class="muted"></div>
            <button id="quizClose">Close</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div id="narration" class="muted" style="margin-bottom:0.5rem;"></div>
        <button id="nextStep" class="pill">Next Step</button>
      </div>
    `;

    // Instance state
    const $ = sel => this._root.querySelector(sel);
    
    // Configurable chromosome count
    this.chromosomeCount = 2;
    // Centralized size configuration (tweak these to scale the whole visualization)
    this.SIZE = {
      chromLenFactor: 0.28,      // fraction of R used for chromatid length (was ~0.22)
      rodWidth: 10,              // stroke width for chromatid rods (was 8)
      centromereRadius: 8,       // radius for centromere dot (was 6)
      centromereStrokeWidth: 4,  // stroke width for metaphase '=' marks
      kinetochoreRadius: 3,      // small dot size for kinetochores (was ~2)
      poleRadius: 14,            // spindle pole circle radius (was 12)
      spindleWidth: 2.5,         // spindle fiber stroke width
      nucleosomeRadius: 2.5,     // size of nucleosome dots in chromatin fibers (was 1.5)
      metaphasePairs: 7,         // number of pairs drawn on metaphase plate
      metaphaseChromLenFactor: 0.10, // chromatid half-length factor for metaphase plate (was 0.08)
      metaphaseChromLenMin: 18   // minimum chromatid length on metaphase plate (was 14)
    };
    
    this.el = {
      canvas: $('#c'), play: $('#play'), speed: $('#speed'), phaseSel: $('#phaseSel'),
  reset: $('#reset'), snap: $('#snap'), share: $('#share'), progress: $('#progress'), progressLabel: $('#progressLabel'),
      phaseGrid: $('#phaseGrid'), infoTitle: $('#infoTitle'), infoBody: $('#infoBody'),
      phaseBadge: $('#phaseBadge'), chkBadge: $('#chkBadge'), health: $('#health'),
      mtBlock: $('#mtBlock'), actBlock: $('#actBlock'), override: $('#override'), p53: $('#p53'), damage: $('#damage'),
      temperature: $('#temperature'), tempDisplay: $('#tempDisplay'), nutrients: $('#nutrients'), 
      nutrientDisplay: $('#nutrientDisplay'), cellType: $('#cellType'),
      atpLevel: $('#atpLevel'), oxygenLevel: $('#oxygenLevel'), nadphLevel: $('#nadphLevel'), proteinCount: $('#proteinCount'),
      cdk1Level: $('#cdk1Level'), cdk2Level: $('#cdk2Level'), p53Level: $('#p53Level'), mtorLevel: $('#mtorLevel'),
      quiz: $('#quiz'), quizModal: $('#quizModal'), quizQ: $('#quizQ'),
      quizOpts: $('#quizOpts'), quizRes: $('#quizRes'), quizClose: $('#quizClose'),
      nextStep: $('#nextStep'), narration: $('#narration')
    };

    // Phase metadata
    this.PHASES = [
      {key:'interphase', name:'Interphase', tip:'DNA replicates (S); growth (G1/G2); checkpoints ensure integrity.'},
      {key:'prophase',   name:'Prophase',   tip:'Chromosomes condense, spindle starts forming, nucleolus fades.'},
      {key:'metaphase',  name:'Metaphase',  tip:'Chromosomes line up; microtubules attach to kinetochores.'},
      {key:'anaphase',   name:'Anaphase',   tip:'Sister chromatids separate to opposite poles.'},
      {key:'telophase',  name:'Telophase',  tip:'Nuclear envelopes reform; chromosomes decondense.'},
      {key:'cytokinesis',name:'Cytokinesis',tip:'Actin–myosin ring constricts; cell splits.'},
    ];

    // Simulation model
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
    const lerp = (a,b,t)=>a+(b-a)*t;
    const ease = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
    const rand = (min,max)=>Math.random()*(max-min)+min;
    const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

    class Chromosome{
      constructor(angle){ 
        this.angle=angle; 
        this.sep=0; 
        this.condense=0; 
        this.attached=false; 
        this.centromerePos = 0.5; // position along chromosome
        this.telomereLength = 0.8; // telomere health
        this.cohesin = 1; // cohesin ring integrity
        this.kinetochore = {attached: false, tension: 0};
        this.chromatin = []; // chromatin fiber structure
        this.histones = []; // nucleosome positions
        this.geneExpression = Math.random(); // gene activity level
        this.dnaDamage = 0; // localized DNA damage
        this.replicationForks = []; // replication origins
        this.initChromatin();
      }
      
      initChromatin() {
        // Create chromatin fiber structure
        const fiberLength = 200;
        const nucleosomeSpacing = 10;
        const numNucleosomes = Math.floor(fiberLength / nucleosomeSpacing);
        
        for(let i = 0; i < numNucleosomes; i++) {
          this.histones.push({
            x: (i / numNucleosomes) * fiberLength - fiberLength/2,
            y: Math.sin(i * 0.3) * 3,
            z: Math.cos(i * 0.3) * 3,
            active: Math.random() > 0.7, // some nucleosomes are active
            modification: Math.random() // histone modifications
          });
        }
        
        // Create chromatin loops
        for(let i = 0; i < 8; i++) {
          this.chromatin.push({
            start: Math.random() * fiberLength - fiberLength/2,
            end: Math.random() * fiberLength - fiberLength/2,
            size: Math.random() * 20 + 10,
            active: Math.random() > 0.5
          });
        }
      }
      
      updateChromatin(phase, time) {
        // Update chromatin structure based on phase
        this.histones.forEach((histone, i) => {
          if(phase === 'interphase') {
            // Relaxed chromatin
            histone.y = Math.sin(i * 0.2 + time * 2) * 2;
            histone.z = Math.cos(i * 0.2 + time * 2) * 2;
            histone.active = Math.random() > 0.6;
          } else if(phase === 'prophase') {
            // Condensing chromatin
            const condenseFactor = time;
            histone.y *= (1 - condenseFactor * 0.8);
            histone.z *= (1 - condenseFactor * 0.8);
            histone.active = false;
          } else {
            // Fully condensed
            histone.y = 0;
            histone.z = 0;
            histone.active = false;
          }
        });
      }
    }


    class Protein{
      constructor(type, x, y, targetX, targetY) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = 0.5 + Math.random() * 1.5;
        this.active = true;
        this.lifetime = 100 + Math.random() * 200;
        this.age = 0;
        this.rotation = Math.random() * Math.PI * 2;
      }
      
      update() {
        this.age++;
        if(this.age > this.lifetime) {
          this.active = false;
          return;
        }
        
        // Move toward target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if(distance > 2) {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
          this.rotation = Math.atan2(dy, dx);
        }
      }
    }

    this.Sim = {
      init: () => {
        console.log('Sim.init() called');
        const c = this.el.canvas;
        if(!c) {
          console.error('Canvas element not found!');
          return;
        }
        this.ctx = c.getContext('2d');
        if(!this.ctx) {
          console.error('Could not get 2D context!');
          return;
        }
        this.ro = new ResizeObserver(()=>this.Sim.resize());
        this.ro.observe(this.el.canvas);
        this.Sim.reset();
        console.log('Sim.init() completed');
      },
      reset: () => {
        console.log('Sim.reset() called');
        const N = this.chromosomeCount || 6; // Configurable chromosome count
        this.chrom = Array.from({length:2}, (_,i)=> new Chromosome((i/2)*Math.PI*2));
        this.time = 0;
        this.phaseIndex = 0;
        this.playing = false;
        this.loop = this.hasAttribute('autoplay');
        this.speed = 1;
        this.blockMT=false; this.blockActin=false;
        this.checkOverride=false; this.p53=true; this.damage=0;
        this.nuclear=1; this.cleavage=0;
        this.jitterA=rand(-.1,.1); this.jitterB=rand(-.1,.1);
        
        console.log('Chromosomes created:', this.chrom.length);
        
        this.temperature = 37; // Celsius
        this.nutrients = 1.0;
        this.cellType = 'normal'; // normal, cancer, senescent
        
        // Molecular systems
        this.proteins = [];
        this.molecules = [];
        this.vesicles = [];
        this.rna = [];
        this.enzymes = [];
        this.cytoskeleton = [];
        
        // Cell cycle regulators
        this.cyclins = {cdk1: 0, cdk2: 0, cdk4: 0};
        this.checkpoints = {g1s: true, g2m: true, spindle: true};
        this.dnaReplication = {progress: 0, origins: [], forks: []};
        
        // Energy systems
        this.atp = 100;
        this.nadph = 50;
        this.oxygen = 80;
        
        // Signaling pathways
        this.signaling = {
          mtor: 0.5,
          p53: 1.0,
          myc: 0.3,
          rb: 1.0,
          e2f: 0.2
        };
        
        this.Sim.resize();
        this.UI.updateInfo();
      },
      center: () => {
        const r = this.el.canvas.getBoundingClientRect();
        return {x:r.width/2, y:r.height/2};
      },
      radius: () => {
        const r = this.el.canvas.getBoundingClientRect();
        return Math.min(r.width,r.height)*0.38;
      },
      resize: () => {
        const rect = this.el.canvas.getBoundingClientRect();
        const w = Math.max(480, rect.width||this.el.canvas.parentElement.clientWidth||800);
        const h = Math.max(360, rect.height||520);
        this.el.canvas.width  = Math.floor(w*DPR);
        this.el.canvas.height = Math.floor(h*DPR);
        this.el.canvas.style.height = h+'px';
        this.el.canvas.style.width  = '100%';
        this.ctx.setTransform(DPR,0,0,DPR,0,0);
        
        // Debug: Log canvas dimensions
        console.log('Canvas resized:', w, h, 'DPR:', DPR);
      },
      setPhaseByKey: (key)=> {
        if(!this.PHASES) return;
        const idx = this.PHASES.findIndex(p=>p.key===key);
        if(idx<0) return;
        this.phaseIndex = idx; this.time=0; this.UI.updateInfo(); this.UI.syncPhase();
      },
      getPhaseProgress: () => {
        // Calculate progress within current phase (0-1)
        const phaseDuration = 3.0; // Each phase lasts 3 seconds
        const progress = Math.min(this.time / phaseDuration, 1.0);
        return progress;
      },
      step: (dt) => {
  // Time is advanced from the main animation loop to keep timing consistent
  const s = this.speed;
        
        // Debug: Log step calls occasionally
        if(Math.random() < 0.01) {
          console.log('Step called, time:', this.time, 'playing:', this.playing);
        }
        if(this.time>=1 && this.PHASES && this.PHASES[this.phaseIndex]){
          // phase transitions + checkpoints
          const key = this.PHASES[this.phaseIndex].key;
          if(key==='interphase'){
            if(this.shouldArrestAtG2M()){ this.playing=false; this.UI.toast('G2/M arrest (DNA damage)'); }
            else { this.time=0; this.phaseIndex=1; this.UI.updateInfo(); }
          } else if(key==='prophase'){
            if(this.blockMT){ this.playing=false; this.UI.toast('Spindle assembly checkpoint — MT blocked'); }
            else { this.time=0; this.phaseIndex=2; this.UI.updateInfo(); }
          } else if(key==='metaphase'){
            const allAttached = this.chrom.every(ch=>ch.attached);
            if(!allAttached && !this.checkOverride){ this.playing=false; this.UI.toast('Metaphase arrest: no bi-orientation'); }
            else { this.time=0; this.phaseIndex=3; this.UI.updateInfo(); }
          } else if(key==='anaphase'){
            this.time=0; this.phaseIndex=4; this.UI.updateInfo();
          } else if(key==='telophase'){
            if(this.blockActin){ this.playing=false; this.UI.toast('Cytokinesis blocked'); }
            else { this.time=0; this.phaseIndex=5; this.UI.updateInfo(); }
          } else if(key==='cytokinesis'){
            // End of run
            this.time=0; this.phaseIndex=0; this.jitterA=rand(-.1,.1); this.jitterB=rand(-.1,.1); this.UI.updateInfo();
            if(!this.loop && this.hasAttribute('autoplay')) this.playing=false;
          }
        }

        // schedule drawing params per phase
        const k = this.PHASES[this.phaseIndex].key;
        const t = ease(clamp(this.time,0,1));
        const center = this.Sim.center();
  // Poles positioned at top and bottom for canonical spindle orientation
  this.poleTop = {x:center.x + Math.sin(this.jitterA)*20, y:center.y - this.Sim.radius()*0.78};
  this.poleBottom = {x:center.x + Math.sin(this.jitterB)*20, y:center.y + this.Sim.radius()*0.78};
        
        
        // Update molecular systems
        this.Sim.updateMolecularSystems(dt);
        this.Sim.updateCellCycleRegulators();
        this.Sim.updateEnergySystems();
        this.Sim.updateSignalingPathways();

        if(k==='interphase'){
          this.nuclear = 1; this.cleavage=0; this.chrom.forEach(ch=>{ ch.condense=0; ch.sep=0; ch.attached=false; });
          // Advance replication progress (visual only)
          this.dnaReplication.progress = Math.min(1, (this.dnaReplication.progress||0) + (dt * 0.12 * this.nutrients));
        }
        if(k==='prophase'){
          this.nuclear = lerp(1,0,t*.9);
          this.chrom.forEach(ch=>{ ch.condense = lerp(0,1,t); ch.sep=0; ch.attached=!this.blockMT && t>.35; });
        }
        if(k==='metaphase'){
          this.nuclear = 0; this.chrom.forEach(ch=>{ ch.condense=1; ch.sep=0; ch.attached=!this.blockMT; });
        }
        if(k==='anaphase'){
          this.nuclear = 0; this.chrom.forEach(ch=>{ ch.sep = lerp(0,1,t); });
        }
        if(k==='telophase'){
          this.nuclear = lerp(0,1,t); this.chrom.forEach(ch=>{ ch.condense = lerp(1,.25,t); });
        }
        if(k==='cytokinesis'){
          this.cleavage = t;
        }

        // p53 gate
        if(this.p53 && this.damage>.6 && !this.checkOverride){ this.playing=false; this.UI.toast('p53 arrest (high DNA damage)'); }

        // Draw is called from the animation loop, not here
      },
      updateMolecularSystems: (dt) => {
        // Update proteins
        this.proteins = this.proteins.filter(protein => {
          protein.update();
          return protein.active;
        });
        
        // Spawn new proteins based on gene expression
        if(Math.random() < 0.02 * this.nutrients) {
          const center = this.Sim.center();
          const target = {
            x: center.x + (Math.random() - 0.5) * this.Sim.radius() * 1.5,
            y: center.y + (Math.random() - 0.5) * this.Sim.radius() * 1.5
          };
          this.proteins.push(new Protein('generic', center.x, center.y, target.x, target.y));
        }
        
        // Update vesicles
        this.vesicles = this.vesicles.filter(vesicle => {
          vesicle.x += Math.sin(vesicle.angle) * vesicle.speed;
          vesicle.y += Math.cos(vesicle.angle) * vesicle.speed;
          vesicle.lifetime--;
          return vesicle.lifetime > 0;
        });
        
        // Spawn vesicles randomly
        if(Math.random() < 0.01) {
          const center = this.Sim.center();
          this.vesicles.push({
            x: center.x + (Math.random() - 0.5) * this.Sim.radius(),
            y: center.y + (Math.random() - 0.5) * this.Sim.radius(),
            angle: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 1,
            lifetime: 100 + Math.random() * 100,
            type: 'secretory'
          });
        }
        
        // Update RNA molecules
        this.rna = this.rna.filter(rna => {
          rna.x += (Math.random() - 0.5) * 0.5;
          rna.y += (Math.random() - 0.5) * 0.5;
          rna.lifetime--;
          return rna.lifetime > 0;
        });
        
        // Spawn RNA during interphase
        if(this.PHASES && this.PHASES[this.phaseIndex] && this.PHASES[this.phaseIndex].key === 'interphase' && Math.random() < 0.01) {
          const center = this.Sim.center();
          this.rna.push({
            x: center.x + (Math.random() - 0.5) * this.Sim.radius(),
            y: center.y + (Math.random() - 0.5) * this.Sim.radius(),
            lifetime: 50 + Math.random() * 50,
            type: 'mrna'
          });
        }
      },
      updateCellCycleRegulators: () => {
        const phase = this.PHASES && this.PHASES[this.phaseIndex] ? this.PHASES[this.phaseIndex].key : 'interphase';
        
        // Update cyclin levels based on phase
        if(phase === 'interphase') {
          this.cyclins.cdk2 += 0.01 * this.nutrients;
          this.cyclins.cdk4 += 0.005 * this.nutrients;
        } else if(phase === 'prophase' || phase === 'metaphase') {
          this.cyclins.cdk1 += 0.02;
          this.cyclins.cdk2 *= 0.99; // Degraded
        } else if(phase === 'anaphase' || phase === 'telophase') {
          this.cyclins.cdk1 *= 0.95; // Degraded
        }
        
        // Clamp cyclin levels
        Object.keys(this.cyclins).forEach(key => {
          this.cyclins[key] = Math.max(0, Math.min(1, this.cyclins[key]));
        });
        
        // Update checkpoints
        this.checkpoints.g1s = this.damage < 0.3 && this.nutrients > 0.4;
        this.checkpoints.g2m = this.damage < 0.4 && this.cyclins.cdk1 > 0.5;
        this.checkpoints.spindle = this.chrom.every(ch => ch.attached);
      },
      updateEnergySystems: () => {
        // ATP production based on nutrients and oxygen
        const atpProduction = 0.5 * this.nutrients * this.oxygen / 100;
        this.atp = Math.min(100, this.atp + atpProduction);
        
        // ATP consumption
        const atpConsumption = 0.5 + (this.playing ? 0.3 : 0);
        this.atp = Math.max(0, this.atp - atpConsumption);
        
        // Oxygen consumption
        this.oxygen = Math.max(0, this.oxygen - 0.1);
        
        // NADPH production (simplified)
        this.nadph = Math.min(50, this.nadph + 0.05 * this.nutrients);
      },
      updateSignalingPathways: () => {
        // mTOR pathway (nutrient sensing)
        this.signaling.mtor = this.nutrients * 0.8 + 0.2;
        
        // p53 pathway (DNA damage response)
        this.signaling.p53 = this.p53 ? (1 + this.damage * 2) : 0;
        
        // Myc pathway (growth)
        this.signaling.myc = this.nutrients * 0.6 + 0.4;
        
        // Rb pathway (cell cycle control)
        this.signaling.rb = this.damage > 0.5 ? 0.2 : 1.0;
        
        // E2F pathway (S phase entry)
        this.signaling.e2f = this.signaling.rb < 0.5 ? 0.8 : 0.2;
        
        // Additional signaling pathways
        this.signaling.akt = this.nutrients * 0.7 + 0.3; // AKT pathway
        this.signaling.wnt = Math.sin(this.time * 0.5) * 0.3 + 0.5; // Wnt pathway
        this.signaling.notch = this.cyclins.cdk1 > 0.5 ? 0.8 : 0.3; // Notch pathway
        this.signaling.hedgehog = this.temperature > 35 ? 0.6 : 0.2; // Hedgehog pathway
        this.signaling.tgf = this.damage > 0.3 ? 0.9 : 0.4; // TGF-beta pathway
        this.signaling.jak = this.oxygen > 50 ? 0.7 : 0.3; // JAK-STAT pathway
        this.signaling.nfkb = this.damage > 0.4 ? 0.8 : 0.2; // NF-kB pathway
        this.signaling.mapk = this.nutrients * 0.5 + 0.5; // MAPK pathway
        this.signaling.pi3k = this.atp > 50 ? 0.8 : 0.3; // PI3K pathway
        this.signaling.calcium = Math.sin(this.time * 2) * 0.4 + 0.5; // Calcium signaling
      },
      applyTemperatureEffects: () => {
        // Temperature affects enzyme activity and cell cycle progression
        const temp = this.temperature;
        if(temp < 30) {
          this.speed *= 0.3; // Very slow at low temps
          this.UI.toast('Low temperature: slowed metabolism');
        } else if(temp > 42) {
          this.speed *= 0.1; // Heat shock
          this.damage = Math.min(1, this.damage + 0.1);
          this.UI.toast('Heat shock: protein denaturation');
        } else if(temp > 40) {
          this.speed *= 0.5; // Reduced activity
        }
      },
      applyNutrientEffects: () => {
        // Nutrient levels affect cell growth and division
        if(this.nutrients < 0.3) {
          this.playing = false;
          this.UI.toast('Nutrient starvation: cell cycle arrest');
        } else if(this.nutrients < 0.6) {
          this.speed *= 0.7; // Slower growth
        }
      },
      applyCellTypeEffects: () => {
        // Different cell types have different behaviors
        switch(this.cellType) {
          case 'cancer':
            this.checkOverride = true; // Cancer cells bypass checkpoints
            this.p53 = false; // Often p53 deficient
            this.speed *= 1.5; // Faster division
            this.UI.toast('Cancer cell: checkpoint bypass');
            break;
          case 'senescent':
            this.playing = false; // Senescent cells don't divide
            this.UI.toast('Senescent cell: permanent arrest');
            break;
          case 'normal':
            this.checkOverride = false;
            this.p53 = true;
            this.speed = 1;
            this.UI.toast('Normal cell: standard checkpoints');
            break;
        }
      },
      shouldArrestAtG2M: ()=> (this.damage>=.4 && this.p53 && !this.checkOverride),
      draw: ()=>{
        const ctx = this.ctx;
        const {width:w,height:h} = this.el.canvas;
        
        // Debug: Check if canvas and context exist
        if(!ctx || !this.el.canvas) {
          console.error('Canvas or context not available');
          return;
        }
        
        ctx.setTransform(DPR,0,0,DPR,0,0);
        ctx.clearRect(0,0,w,h);

        const center = this.Sim.center(); const R = this.Sim.radius();
        
        // Get current phase key
        const k = this.PHASES && this.PHASES[this.phaseIndex] ? this.PHASES[this.phaseIndex].key : 'interphase';

        // background cell
        const grad = ctx.createRadialGradient(center.x, center.y, R*0.2, center.x, center.y, R*1.08);
        grad.addColorStop(0,'rgba(255,255,255,.12)'); grad.addColorStop(1,'rgba(255,255,255,.02)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(center.x, center.y, R*1.04, 0, Math.PI*2); ctx.fill();

        // membrane - make more visible
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; // More visible
        ctx.beginPath(); ctx.arc(center.x, center.y, R, 0, Math.PI*2); ctx.stroke();

        
        // Draw floating molecules
        this.Sim.drawMolecules();

  // poles - top/bottom orientation
  const top = this.poleTop, bottom = this.poleBottom;
  ctx.fillStyle = 'rgba(96,165,250,0.9)';
  ctx.beginPath(); ctx.arc(top.x, top.y, this.SIZE.poleRadius, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(bottom.x, bottom.y, this.SIZE.poleRadius, 0, Math.PI*2); ctx.fill();
  // Register interactive features (labels shown only on hover)
  this._featureBoxes = this._featureBoxes || [];
  this._featureBoxes.length = 0;
  this._featureBoxes.push({id:'poleTop', x:top.x, y:top.y, r:12, type:'pole', text:'Pole (Spindle)'});
  this._featureBoxes.push({id:'poleBottom', x:bottom.x, y:bottom.y, r:12, type:'pole', text:'Pole (Spindle)'});

        // nucleus - make more visible
        if(this.nuclear>0){
          ctx.save();
          ctx.globalAlpha = this.nuclear*0.9;
          ctx.fillStyle   = 'rgba(147,197,253,0.3)'; // More visible
          ctx.strokeStyle = 'rgba(147,197,253,0.8)'; // More visible
          ctx.lineWidth = 3; // Thicker
          ctx.beginPath(); ctx.arc(center.x, center.y, R*0.56, 0, Math.PI*2); ctx.fill(); ctx.stroke();
          ctx.restore();

          // diffuse chromatin speckles
          for(let i=0;i<70;i++){
            const a = Math.random()*Math.PI*2, rr = Math.random()*(R*0.5 - R*0.06) + R*0.06;
            const x = center.x + Math.cos(a)*rr, y = center.y + Math.sin(a)*rr;
            ctx.globalAlpha = 0.035; ctx.fillStyle='#a78bfa';
            ctx.beginPath(); ctx.arc(x,y, Math.max(1.6, this.SIZE.nucleosomeRadius * (Math.random()*0.6 + 0.8)), 0, Math.PI*2); ctx.fill(); ctx.globalAlpha=1;
          }
        }

        // COMPLETELY REDONE CHROMOSOME LOGIC
        const phase = this.PHASES && this.PHASES[this.phaseIndex] ? this.PHASES[this.phaseIndex].key : 'interphase';
        const progress = this.Sim.getPhaseProgress();
        
        // Enforce exactly two homologous chromosomes for clarity
        const homologCount = 2;
        // Each homolog has two sister chromatids after S-phase; we model sisters when separated
        const showSisters = (phase === 'anaphase' || phase === 'telophase' || phase === 'cytokinesis');

        // Helper to compute colors for homologs
        const homColors = ['#e91e63','#3f51b5'];

        for(let h=0; h<homologCount; h++){
          // For interphase draw chromatin fiber 'squiggles' per homolog
          if(phase === 'interphase'){
            const angle = (h / homologCount) * Math.PI * 2 + (h*0.3);
            const radius = R * 0.22;
            const x = center.x + Math.cos(angle) * radius;
            const y = center.y + Math.sin(angle) * radius;
            // create a temporary Chromosome-like structure for drawing
            const tmp = { chromatin: [], histones: [] };
            // populate loops and histones for visual effect
            for(let i=0;i<20;i++) tmp.chromatin.push({start: (i-10)*4, size: 6 + Math.random()*8, active: Math.random()>0.4});
            for(let i=0;i<80;i++) tmp.histones.push({x:(Math.random()*R*0.22)-R*0.11, y:(Math.random()*R*0.12)-R*0.06, active: Math.random()>0.6, modification: Math.random()});
            this.Sim.drawChromatinFiber(ctx, tmp, x, y, angle + Math.PI/4);
            // register the homolog center as an interactive feature (label on hover only)
            this._featureBoxes.push({id:`hom_${h}`, x:x, y:y, r: Math.max(12, R*0.08), type:'homolog', text:`Homolog ${h+1}`});
            // If replication has started, draw a forming sister chromatin fiber offset from the parent
            const repProg = this.dnaReplication.progress || 0;
            if(repProg > 0.15){
              const off = lerp(0, Math.max(18, R*0.06), clamp((repProg - 0.15)/0.85, 0, 1));
              const sx = x + off;
              // draw a faint duplicate fiber to represent partial sister formation
              ctx.save(); ctx.globalAlpha = 0.6; this.Sim.drawChromatinFiber(ctx, tmp, sx, y, angle + Math.PI/4); ctx.restore();
              this._featureBoxes.push({id:`hom_${h}_sisterform`, x:sx, y:y, r:10, type:'sister_form', text:`Forming sister (${Math.round(repProg*100)}%)`});
            }
            continue;
          }

          // For other phases, compute base positions for the chromosome pair
          let baseX = center.x, baseY = center.y;
          let separatedOffset = 0;

          if(phase === 'prophase'){
            const angle = (h / homologCount) * Math.PI * 2 + (h*0.5);
            const radius = R * (0.32 - progress * 0.12);
            baseX = center.x + Math.cos(angle) * radius;
            baseY = center.y + Math.sin(angle) * radius;
          } else if(phase === 'metaphase'){
            // Align on metaphase plate with small lateral offset per homolog
            const plateX = center.x + (h===0 ? -R*0.06 : R*0.06);
            baseX = plateX;
            baseY = center.y;
          } else if(phase === 'anaphase'){
            const pull = progress * R * 0.46;
            baseX = center.x + (h===0 ? -pull : pull);
            baseY = center.y;
            separatedOffset = progress * 14; // sisters move slightly apart
          } else if(phase === 'telophase' || phase === 'cytokinesis'){
            baseX = center.x + (h===0 ? -R*0.26 : R*0.26);
            baseY = center.y + (h===0 ? -R*0.06 : R*0.06);
            separatedOffset = (phase==='telophase') ? (progress*10) : 0;
          }

          // Draw the two sister chromatids for this homolog
    const chromLen = R * this.SIZE.chromLenFactor; const chromHalf = chromLen/2;
          // kinetochore offsets
          const ktOffsetX = 0; const ktOffsetY = 0;

          // draw each sister
          for(let s=0;s<2;s++){
            const sisterIndex = s; // 0 and 1
            const sisterSide = (s===0) ? -1 : 1;
            const lateral = showSisters ? (12 + (sisterSide*separatedOffset)) : 6;
            const x = baseX + sisterSide * lateral;
            const y = baseY;

            // Determine rod orientation: perpendicular to spindle (horizontal) during metaphase/anaphase/telophase
            const rodAngle = (phase === 'metaphase' || phase === 'anaphase' || phase === 'telophase') ? 0 : Math.PI/2;
            // draw chromatid rod along local x-axis
            ctx.save(); ctx.translate(x,y); ctx.rotate(rodAngle);
            ctx.lineCap = 'round'; ctx.lineWidth = this.SIZE.rodWidth; ctx.strokeStyle = homColors[h%homColors.length];
            ctx.beginPath(); ctx.moveTo(-chromHalf, 0); ctx.lineTo(chromHalf, 0); ctx.stroke();

            // centromere at center
            ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(0,0,this.SIZE.centromereRadius,0,Math.PI*2); ctx.fill();

            // kinetochore marker: place perpendicular to rod (above/below)
            const ktLocal = {x:0, y: 12 * sisterSide};
            ctx.fillStyle = 'rgba(96,165,250,1)';
            ctx.beginPath(); ctx.moveTo(ktLocal.x - this.SIZE.kinetochoreRadius - 2, ktLocal.y - this.SIZE.kinetochoreRadius/2);
            ctx.lineTo(ktLocal.x + this.SIZE.kinetochoreRadius + 2, ktLocal.y);
            ctx.lineTo(ktLocal.x - this.SIZE.kinetochoreRadius - 2, ktLocal.y + this.SIZE.kinetochoreRadius/2);
            ctx.closePath(); ctx.fill();

            // compute world-space positions for centromere and kinetochore
            const cosA = Math.cos(rodAngle), sinA = Math.sin(rodAngle);
            const worldCent = {x: x, y: y};
            const worldKT = {x: x + cosA*ktLocal.x - sinA*ktLocal.y, y: y + sinA*ktLocal.x + cosA*ktLocal.y};

            // register centromere and kinetochore as interactive features (labels show on hover only)
            ctx.restore();
            this._featureBoxes.push({id:`cent_${h}_${s}`, x: worldCent.x, y: worldCent.y, r:this.SIZE.centromereRadius + 4, type:'centromere', text:'Centromere'});
            this._featureBoxes.push({id:`kt_${h}_${s}`, x: worldKT.x, y: worldKT.y, r:this.SIZE.kinetochoreRadius + 4, type:'kinetochore', text:'Kinetochore'});

            // During metaphase/anaphase draw spindle fibers from poles to kinetochores (top->sister0, bottom->sister1)
            if(phase === 'metaphase' || phase === 'anaphase'){
              ctx.strokeStyle = 'rgba(96,165,250,0.95)'; ctx.lineWidth = this.SIZE.spindleWidth;
              const pole = (sisterIndex===0) ? this.poleTop : this.poleBottom;
              ctx.beginPath(); ctx.moveTo(pole.x, pole.y); ctx.lineTo(worldKT.x, worldKT.y); ctx.stroke();
            }
          }
        }
        
  // Compute chromosome count for live view
  const numChromosomes = (phase === 'interphase') ? homologCount : (showSisters ? homologCount*2 : homologCount*2);
  // Enhanced live view with phase-specific information
  this.Sim.drawLiveView(ctx, k, numChromosomes);

  // Draw label for nucleus (poles are labeled above with leader lines)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font='12px Arial'; ctx.textAlign='center';
  if(this.nuclear>0.1) ctx.fillText('Nucleus', center.x, center.y - (R*0.6) - 8);

        // cleavage furrow
        if(k==='cytokinesis'){
          const t = this.cleavage;
          const rr = R * (1 - (1-0.64)*t); // lerp(1,.64,t)
          ctx.strokeStyle='rgba(16,185,129,.75)'; ctx.lineWidth=3.5;
          ctx.beginPath(); ctx.ellipse(center.x, center.y, rr, R*0.98, 0, 0, Math.PI*2); ctx.stroke();
        }

  // HUD + info
  // Map per-phase progress (0..phaseDuration) to normalized 0..1 for the progress bar
  const phaseDuration = 3.0; // seconds per phase (kept in sync with loop)
  const phaseProgress = Math.min(this.time / phaseDuration, 1.0);
        this.UI.setProgress(phaseProgress);
        if(this.PHASES && this.PHASES[this.phaseIndex]) {
        this.UI.setBadges(this.PHASES[this.phaseIndex].name, this.UI.checkLabel());
        }
        this.UI.setHealth(this.UI.healthState());
        this.UI.updateMolecularStatus();

        // Hover-only labels (no leader lines). Labels placed further away from feature for readability.
        if(this._hoverFeature){
          const f = this._hoverFeature;
          ctx.save();
          ctx.globalAlpha = 1.0;
          ctx.font = '12px Arial';
          const side = (f.x < center.x) ? 1 : -1;
          ctx.textAlign = side === 1 ? 'left' : 'right';
          const lx = f.x + side * Math.max(28, R*0.06);
          const ly = f.y - Math.max(18, R*0.04);
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; // 50% opacity label text
          ctx.fillText(f.text, lx, ly);
          ctx.restore();
        }
      },
      drawChromatinFiber: (ctx, chromosome, cx, cy, angle) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        
        // Draw chromatin loops
        chromosome.chromatin.forEach(loop => {
          if(loop.active) {
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.42)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(loop.start, 0, loop.size, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
        
        // Draw nucleosomes (scaled)
        chromosome.histones.forEach(histone => {
          ctx.fillStyle = histone.active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(200, 200, 200, 0.7)';
          ctx.beginPath();
          ctx.arc(histone.x, histone.y, this.SIZE.nucleosomeRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw histone modifications
          if(histone.modification > 0.7) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(histone.x, histone.y, this.SIZE.nucleosomeRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        ctx.restore();
      },
      drawMolecules: () => {
        const ctx = this.ctx;
        
        // Draw proteins
        this.proteins.forEach(protein => {
          ctx.save();
          ctx.translate(protein.x, protein.y);
          ctx.rotate(protein.rotation);
          ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(0, 0, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        
        // Draw vesicles
        this.vesicles.forEach(vesicle => {
          ctx.fillStyle = 'rgba(255, 200, 0, 0.7)';
          ctx.beginPath();
          ctx.arc(vesicle.x, vesicle.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        
        // Draw RNA molecules
        this.rna.forEach(rna => {
          ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
          ctx.beginPath();
          ctx.arc(rna.x, rna.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      },
      drawLiveView: (ctx, phase, chromosomeCount) => {
        const {width:w, height:h} = this.el.canvas;
        
        // Get REAL-TIME phase information
        const realTimeInfo = this.Sim.getRealTimePhaseInfo(phase);
        
        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(10, 10, 360, 280);
        
        // Draw border with phase-specific color
        ctx.strokeStyle = realTimeInfo.statusColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, 360, 280);
        
        // Phase title with real-time progress
        ctx.fillStyle = realTimeInfo.statusColor;
        ctx.font = 'bold 18px Arial';
        ctx.fillText(realTimeInfo.title, 20, 35);
        
        // Real-time description
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = '12px Arial';
        const words = realTimeInfo.description.split(' ');
        let line = '';
        let y = 55;
        for(let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if(metrics.width > 340 && i > 0) {
            ctx.fillText(line, 20, y);
            line = words[i] + ' ';
            y += 15;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 20, y);
        
        // CURRENT processes happening NOW
        y += 25;
        ctx.fillStyle = 'rgba(52, 211, 153, 1.0)'; // Green for active processes
        ctx.font = 'bold 14px Arial';
        ctx.fillText('HAPPENING NOW:', 20, y);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '11px Arial';
        realTimeInfo.currentProcesses.forEach((process, i) => {
          y += 15;
          ctx.fillText(`→ ${process}`, 25, y);
        });
        
        // Real-time molecular status
        y += 20;
        ctx.fillStyle = 'rgba(96, 165, 250, 1.0)'; // Blue for status
        ctx.font = 'bold 12px Arial';
        ctx.fillText('MOLECULAR STATUS:', 20, y);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px Arial';
        ctx.fillText(`Chromosomes: ${chromosomeCount}`, 25, y + 15);
        ctx.fillText(`Spindle: ${realTimeInfo.spindleStatus}`, 25, y + 30);
        ctx.fillText(`Nuclear Envelope: ${realTimeInfo.nuclearStatus}`, 25, y + 45);
        ctx.fillText(`Cohesin: ${realTimeInfo.cohesinStatus}`, 25, y + 60);
        ctx.fillText(`Time: ${this.time.toFixed(2)}s`, 25, y + 75);
        
        // Phase-specific visual indicators
        this.Sim.drawPhaseIndicators(ctx, phase, w, h);
        
        // Progress indicator
        this.Sim.drawProgressIndicator(ctx, phase, w, h);
      },
      
      getRealTimePhaseInfo: (phase) => {
        const progress = this.Sim.getPhaseProgress();
        // Phase-level configuration (can be extended for all phases)
        this.PHASE_CONFIG = this.PHASE_CONFIG || {};
        // Example config for metaphase (centralize logic & visuals)
        if(!this.PHASE_CONFIG.metaphase){
          this.PHASE_CONFIG.metaphase = {
            title: (p)=> `🎯 METAPHASE (${Math.round(p*100)}%)`,
            description: 'Chromosomes aligned at metaphase plate, waiting for checkpoint',
            currentProcesses: (p)=> ['Chromosome alignment', 'Spindle checkpoint', 'Tension monitoring', 'Cohesin intact'],
            statusColor: '#ff0000',
            spindleStatus: 'Active',
            nuclearStatus: 'Absent',
            cohesinStatus: 'Intact',
            drawIndicator: (ctx, center, R, p) => {
              // Draw a stylized metaphase plate populated with sister-chromatid pairs
              const alignmentProgress = Math.min(p * 2, 1);
              const plateHalfWidth = R * 0.86 * alignmentProgress;
              const plateLeft = center.x - plateHalfWidth;
              const plateRight = center.x + plateHalfWidth;

              // subtle plate baseline
              ctx.strokeStyle = 'rgba(96,165,250,0.12)'; ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(plateLeft, center.y); ctx.lineTo(plateRight, center.y); ctx.stroke();

              // number of chromosome pairs to draw across the plate (configurable)
              const pairs = this.SIZE.metaphasePairs || 7;
              const spacing = (plateRight - plateLeft) / (pairs + 1);
              const chromLength = Math.max(this.SIZE.metaphaseChromLenMin, R * this.SIZE.metaphaseChromLenFactor);
              const centWidth = this.SIZE.centromereRadius || 6; // visual '=' half-width

              for(let i=1;i<=pairs;i++){
                const cx = plateLeft + spacing * i;
                const jitter = Math.sin(i*2 + p*6) * 2;
                const y = center.y + jitter;

                // left chromatid (horizontal short rod)
                ctx.strokeStyle = 'rgba(230,50,100,0.96)'; ctx.lineWidth = this.SIZE.rodWidth * 0.9; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(cx - centWidth/2 - chromLength, y); ctx.lineTo(cx - centWidth/2 - (chromLength*0.12), y); ctx.stroke();

                // right chromatid
                ctx.beginPath(); ctx.moveTo(cx + centWidth/2 + (chromLength*0.12), y); ctx.lineTo(cx + centWidth/2 + chromLength, y); ctx.stroke();

                // centromere marker as '=' (two small short strokes)
                ctx.strokeStyle = 'rgba(255,235,59,0.98)'; ctx.lineWidth = this.SIZE.centromereStrokeWidth; ctx.lineCap = 'butt';
                ctx.beginPath(); ctx.moveTo(cx - centWidth/2, y - (this.SIZE.centromereStrokeWidth+1)); ctx.lineTo(cx + centWidth/2, y - (this.SIZE.centromereStrokeWidth+1)); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(cx - centWidth/2, y + (this.SIZE.centromereStrokeWidth+1)); ctx.lineTo(cx + centWidth/2, y + (this.SIZE.centromereStrokeWidth+1)); ctx.stroke();

                // small kinetochore dots for clarity
                ctx.fillStyle = 'rgba(96,165,250,0.98)';
                ctx.beginPath(); ctx.arc(cx - centWidth - 3, y, this.SIZE.kinetochoreRadius, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + centWidth + 3, y, this.SIZE.kinetochoreRadius, 0, Math.PI*2); ctx.fill();
              }

              // optional plate label
              ctx.fillStyle = 'rgba(96,165,250,0.95)'; ctx.font = '13px Arial';
              ctx.fillText('Metaphase Plate', center.x - 54, center.y - 20 - Math.max(0, (1-alignmentProgress)*14));
            }
          };
        }
        const chromosomes = this.chromosomes || [];
        const spindleFormed = this.time > 2.0;
        const nuclearEnvelopeIntact = phase === 'interphase' || phase === 'telophase' || phase === 'cytokinesis';
        const cohesinIntact = phase === 'interphase' || phase === 'prophase' || phase === 'metaphase';
        
        // If phase is configured, use its metadata; otherwise fallback to legacy mapping
        const cfg = this.PHASE_CONFIG[phase];
        if(cfg){
          return {
            title: (typeof cfg.title === 'function') ? cfg.title(progress) : (cfg.title || phase),
            description: (typeof cfg.description === 'function') ? cfg.description(progress) : (cfg.description || ''),
            currentProcesses: (typeof cfg.currentProcesses === 'function') ? cfg.currentProcesses(progress) : (cfg.currentProcesses || []),
            statusColor: cfg.statusColor || '#ffffff',
            spindleStatus: cfg.spindleStatus || 'Unknown',
            nuclearStatus: cfg.nuclearStatus || 'Unknown',
            cohesinStatus: cfg.cohesinStatus || 'Unknown'
          };
        }
        const realTimeData = {
          'interphase': {
            title: `🧬 INTERPHASE (${Math.round(progress * 100)}%)`,
            description: progress < 0.3 ? 'G1 Phase: Cell growth and protein synthesis' : 
                        progress < 0.7 ? 'S Phase: DNA replication in progress' : 
                        'G2 Phase: Final preparations for mitosis',
            currentProcesses: progress < 0.3 ? ['Cell growing', 'Protein synthesis', 'DNA preparation'] :
                             progress < 0.7 ? ['DNA replicating', 'Histone synthesis', 'Checkpoint monitoring'] :
                             ['Spindle preparation', 'Final protein synthesis', 'G2/M checkpoint'],
            statusColor: progress < 0.7 ? '#00ff00' : '#ffff00',
            spindleStatus: 'Preparing',
            nuclearStatus: 'Intact',
            cohesinStatus: 'Intact'
          },
          'prophase': {
            title: `⚡ PROPHASE (${Math.round(progress * 100)}%)`,
            description: progress < 0.5 ? 'Chromosomes condensing, nuclear envelope intact' : 
                        'Nuclear envelope breaking down, spindle forming',
            currentProcesses: progress < 0.5 ? ['Chromosome condensation', 'Kinetochore assembly', 'Centrosome separation'] :
                             ['Nuclear envelope breakdown', 'Spindle microtubule growth', 'Chromosome movement'],
            statusColor: '#ff6600',
            spindleStatus: progress < 0.5 ? 'Forming' : 'Active',
            nuclearStatus: progress < 0.5 ? 'Intact' : 'Breaking down',
            cohesinStatus: 'Intact'
          },
          'metaphase': {
            title: `🎯 METAPHASE (${Math.round(progress * 100)}%)`,
            description: 'Chromosomes aligned at metaphase plate, waiting for checkpoint',
            currentProcesses: ['Chromosome alignment', 'Spindle checkpoint', 'Tension monitoring', 'Cohesin intact'],
            statusColor: '#ff0000',
            spindleStatus: 'Active',
            nuclearStatus: 'Absent',
            cohesinStatus: 'Intact'
          },
          'anaphase': {
            title: `🚀 ANAPHASE (${Math.round(progress * 100)}%)`,
            description: progress < 0.5 ? 'Cohesin cleavage, sister chromatids separating' : 
                        'Chromosomes moving to opposite poles',
            currentProcesses: progress < 0.5 ? ['Cohesin cleavage', 'Sister chromatid separation', 'Kinetochore pulling'] :
                             ['Chromosome movement', 'Cell elongation', 'Pole separation'],
            statusColor: '#ff00ff',
            spindleStatus: 'Pulling',
            nuclearStatus: 'Absent',
            cohesinStatus: 'Cleaved'
          },
          'telophase': {
            title: `🔄 TELOPHASE (${Math.round(progress * 100)}%)`,
            description: progress < 0.5 ? 'Chromosomes arriving at poles, decondensing' : 
                        'Nuclear envelope reforming around chromosome sets',
            currentProcesses: progress < 0.5 ? ['Chromosome decondensation', 'Pole arrival', 'Spindle disassembly'] :
                             ['Nuclear envelope formation', 'Nucleolus reappearance', 'Chromatin formation'],
            statusColor: '#00ffff',
            spindleStatus: 'Disassembling',
            nuclearStatus: progress < 0.5 ? 'Absent' : 'Reforming',
            cohesinStatus: 'Absent'
          },
          'cytokinesis': {
            title: `✂️ CYTOKINESIS (${Math.round(progress * 100)}%)`,
            description: progress < 0.5 ? 'Cleavage furrow forming, actin-myosin ring contracting' : 
                        'Cell division completing, daughter cells separating',
            currentProcesses: progress < 0.5 ? ['Cleavage furrow formation', 'Actin-myosin contraction', 'Membrane invagination'] :
                             ['Cell separation', 'Cytoplasm division', 'Daughter cell formation'],
            statusColor: '#00ff00',
            spindleStatus: 'Absent',
            nuclearStatus: 'Complete',
            cohesinStatus: 'Absent'
          }
        };

        return realTimeData[phase] || realTimeData['interphase'];
      },
      
      getPhaseInfo: (phase) => {
        const phaseData = {
          'interphase': {
            title: '🧬 INTERPHASE',
            description: 'Cell growth, DNA replication, and preparation for division. The longest phase of the cell cycle.',
            processes: [
              'DNA replication (S phase)',
              'Cell growth (G1 & G2)',
              'Protein synthesis',
              'DNA preparation',
              'Checkpoint monitoring'
            ]
          },
          'prophase': {
            title: '⚡ PROPHASE',
            description: 'Chromosomes condense, nuclear envelope breaks down, and spindle apparatus begins to form.',
            processes: [
              'Chromosome condensation',
              'Nuclear envelope breakdown',
              'Spindle formation',
              'Centrosome separation',
              'Kinetochore assembly'
            ]
          },
          'metaphase': {
            title: '📐 METAPHASE',
            description: 'Chromosomes align at the metaphase plate, attached to spindle fibers from both poles.',
            processes: [
              'Chromosome alignment',
              'Metaphase plate formation',
              'Spindle checkpoint',
              'Kinetochore attachment',
              'Tension sensing'
            ]
          },
          'anaphase': {
            title: '🚀 ANAPHASE',
            description: 'Sister chromatids separate and move toward opposite poles of the cell.',
            processes: [
              'Cohesin cleavage',
              'Sister chromatid separation',
              'Chromosome movement',
              'Spindle elongation',
              'Pole separation'
            ]
          },
          'telophase': {
            title: '🔄 TELOPHASE',
            description: 'Nuclear envelopes reform around separated chromosomes, and chromosomes begin to decondense.',
            processes: [
              'Nuclear envelope reformation',
              'Chromosome decondensation',
              'Spindle disassembly',
              'Nucleolus reappearance',
              'Cytokinesis preparation'
            ]
          },
          'cytokinesis': {
            title: '✂️ CYTOKINESIS',
            description: 'The cell membrane pinches inward, dividing the cytoplasm and creating two daughter cells.',
            processes: [
              'Actin-myosin ring formation',
              'Membrane constriction',
              'Cytoplasm division',
              'Cytoplasm division',
              'Cell separation'
            ]
          }
        };
        
        return phaseData[phase] || phaseData['interphase'];
      },
      
      drawPhaseIndicators: (ctx, phase, w, h) => {
        // Draw REAL-TIME phase-specific visual indicators around the cell
        const center = this.Sim.center();
        const R = this.Sim.radius();
        const progress = this.Sim.getPhaseProgress();
        
        ctx.save();
        
        if(phase === 'interphase') {
          // Show DNA replication bubbles with REAL-TIME progress
          const replicationBubbles = Math.floor(progress * 6) + 1;
          for(let i = 0; i < replicationBubbles; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = center.x + Math.cos(angle) * (R + 35);
            const y = center.y + Math.sin(angle) * (R + 35);
            
            // Bubble size increases with progress
            const bubbleSize = 6 + progress * 6;
            ctx.fillStyle = progress < 0.7 ? 'rgba(52, 211, 153, 0.8)' : 'rgba(255, 255, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(x, y, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Replication fork indicator
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 3, y);
            ctx.lineTo(x + 3, y);
            ctx.moveTo(x, y - 3);
            ctx.lineTo(x, y + 3);
            ctx.stroke();
            
            // Phase labels
            if(progress < 0.3) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.font = '10px Arial';
              ctx.fillText('G1', x - 5, y + 15);
            } else if(progress < 0.7) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.font = '10px Arial';
              ctx.fillText('S', x - 3, y + 15);
            } else {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.font = '10px Arial';
              ctx.fillText('G2', x - 5, y + 15);
            }
          }
        } else if(phase === 'prophase') {
          // Show chromosome condensation with REAL-TIME progress
          const condensationLevel = Math.floor(progress * 8) + 1;
          for(let i = 0; i < condensationLevel; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = center.x + Math.cos(angle) * (R + 45);
            ctx.fillStyle = progress < 0.5 ? 'rgba(236, 72, 153, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(x, center.y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if(phase === 'metaphase') {
          // Show chromosome alignment with REAL-TIME tension
          const alignmentProgress = Math.min(progress * 2, 1);
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 5]);
          ctx.beginPath();
          ctx.moveTo(center.x - R * alignmentProgress, center.y);
          ctx.lineTo(center.x + R * alignmentProgress, center.y);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Spindle tension lines
          for(let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = center.x + Math.cos(angle) * R * 0.7;
            const y = center.y + Math.sin(angle) * R * 0.7;
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(center.x, center.y);
            ctx.stroke();
          }
          
          ctx.fillStyle = 'rgba(96, 165, 250, 0.9)';
          ctx.font = '12px Arial';
          ctx.fillText('Metaphase Plate', center.x - 40, center.y - 15);
        } else if(phase === 'anaphase') {
          // Show sister chromatid separation with REAL-TIME movement
          const separationDistance = progress * 50;
          for(let i = 0; i < 3; i++) {
            const y = center.y - 20 + i * 20;
            const x1 = center.x - separationDistance;
            const x2 = center.x + separationDistance;
            
            // Sister chromatids
            ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x1, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x2, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Kinetochore microtubules
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(center.x - 35, center.y - 35);
            ctx.moveTo(x2, y);
            ctx.lineTo(center.x + 35, center.y - 35);
            ctx.stroke();
          }
          
          // Cell elongation
          if(progress > 0.3) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, R + progress * 25, R * 0.8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else if(phase === 'telophase') {
          // Show nuclear envelope reformation with REAL-TIME progress
          const reformationProgress = Math.min(progress * 2, 1);
          ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          
          // Left nucleus
          ctx.beginPath();
          ctx.arc(center.x - R/2, center.y, R/3 * reformationProgress, 0, Math.PI * 2);
          ctx.stroke();
          
          // Right nucleus
          ctx.beginPath();
          ctx.arc(center.x + R/2, center.y, R/3 * reformationProgress, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Chromosome decondensation
          if(progress > 0.3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(center.x - R/2, center.y, 4 + progress * 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(center.x + R/2, center.y, 4 + progress * 6, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if(phase === 'cytokinesis') {
          // Show cleavage furrow with REAL-TIME contraction
          const furrowProgress = progress * 35;
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(center.x, center.y - R + furrowProgress);
          ctx.lineTo(center.x, center.y + R - furrowProgress);
          ctx.stroke();
          ctx.setLineDash([]);
          
          // Actin-myosin ring
          if(progress > 0.2) {
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(center.x, center.y, R - furrowProgress, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // Daughter cell separation
          if(progress > 0.7) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.ellipse(center.x - 20, center.y, R * 0.6, R * 0.8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(center.x + 20, center.y, R * 0.6, R * 0.8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          
          ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
          ctx.font = '12px Arial';
          ctx.fillText('Cleavage Furrow', center.x - 40, center.y - 25);
        }
        
        ctx.restore();
      },
      
      drawProgressIndicator: (ctx, currentPhase, w, h) => {
        const phases = ['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase', 'cytokinesis'];
        const currentIndex = phases.indexOf(currentPhase);
        
        // Draw progress bar at the bottom
        const barWidth = w - 40;
        const barHeight = 20;
        const barX = 20;
        const barY = h - 40;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress segments
        const segmentWidth = barWidth / phases.length;
        phases.forEach((phase, i) => {
          const x = barX + i * segmentWidth;
          const isCurrent = i === currentIndex;
          const isCompleted = i < currentIndex;
          
          if(isCurrent) {
            ctx.fillStyle = 'rgba(52, 211, 153, 0.8)'; // Green for current
          } else if(isCompleted) {
            ctx.fillStyle = 'rgba(96, 165, 250, 0.6)'; // Blue for completed
          } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.4)'; // Gray for future
          }
          
          ctx.fillRect(x, barY, segmentWidth - 2, barHeight);
          
          // Phase labels
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(phase.charAt(0).toUpperCase(), x + segmentWidth/2, barY + 14);
        });
        
        // Current phase progress within the segment
        if(currentIndex >= 0) {
          const progress = this.time; // 0 to 1
          const currentSegmentX = barX + currentIndex * segmentWidth;
          const progressWidth = segmentWidth * progress;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(currentSegmentX, barY, progressWidth, barHeight);
        }
        
        // Reset text alignment
        ctx.textAlign = 'left';
        
        // Next phase indicator
        if(currentIndex < phases.length - 1) {
          const nextPhase = phases[currentIndex + 1];
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '12px Arial';
          ctx.fillText(`Next: ${nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1)}`, barX, barY - 10);
        } else {
          ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
          ctx.font = '12px Arial';
          ctx.fillText('Cycle Complete!', barX, barY - 10);
        }
      },
    };

    const weights = [0, .22,.18,.12,.18,.30]; // time in M phases (interphase weight ignored)
    const progressThroughM = (idx, t)=>{
      const total = weights.slice(1).reduce((a,b)=>a+b,0);
      let sum=0; for(let i=1;i<weights.length;i++){ const w=weights[i]; if(i<idx) sum+=w; else if(i===idx) sum += w*t; }
      return sum/total;
    };

    // UI wiring
    this.UI = {
      syncPlay: ()=> this.el.play.textContent = this.Sim.playing ? '⏸️':'▶️',
      syncPhase: ()=> {
        if(this.PHASES && this.PHASES[this.Sim.phaseIndex]) {
        this.el.phaseSel.value = this.PHASES[this.Sim.phaseIndex].key;
        [...this.el.phaseGrid.children].forEach((el,i)=> el.classList.toggle('active', i===this.Sim.phaseIndex));
        }
      },
      buildPhaseGrid: ()=>{
        // Only show mitosis phases in phase grid
        this.el.phaseGrid.innerHTML = this.PHASES.map((p,i)=>`<div class="phase" data-i="${i}">${p.name}</div>`).join('');
      },
      updateInfo: ()=>{
        if(this.PHASES && this.PHASES[this.Sim.phaseIndex]) {
        const key = this.PHASES[this.Sim.phaseIndex].key;
        this.el.infoTitle.textContent = this.PHASES[this.Sim.phaseIndex].name;
        if(key === 'interphase'){
          // richer interphase info including replication progress
          const prog = Math.round((this.Sim.dnaReplication.progress||0)*100);
          this.el.infoBody.innerHTML = `Interphase: G1 (growth), S (DNA synthesis), G2 (preparation). DNA replication: <strong>${prog}%</strong>. Chromatin is decondensed and wraps around nucleosomes; replication forks duplicate DNA to form sister chromatids.`;
        } else {
          this.el.infoBody.textContent  = this.PHASES[this.Sim.phaseIndex].tip;
        }
        } else {
          this.el.infoTitle.textContent = 'Loading...';
          this.el.infoBody.textContent = 'Initializing simulation...';
        }
      },
      setProgress: (p)=> {
        if(this.el && this.el.progress) this.el.progress.style.width = (p*100).toFixed(1)+'%';
        if(this.el && this.el.progressLabel) this.el.progressLabel.textContent = (p*100).toFixed(0) + '%';
      },
      setBadges: (phase,chk)=> { this.el.phaseBadge.textContent=phase; this.el.chkBadge.textContent=chk; },
      healthState: ()=>{
        if(this.Sim.p53 && this.Sim.damage>.6 && !this.Sim.checkOverride) return {t:'🛑 Arrest', c:'rgba(239,68,68,.9)'};
        if(this.Sim.blockMT) return {t:'⚠️ MT Block', c:'rgba(245,158,11,.9)'};
        if(this.Sim.blockActin) return {t:'⚠️ Cytokinesis Block', c:'rgba(245,158,11,.9)'};
        return {t:'✅ Stable', c:'rgba(16,185,129,.9)'};
      },
      setHealth: ({t,c})=> { this.el.health.textContent=t; this.el.health.style.borderColor=c; },
      checkLabel: ()=> {
        const i=this.Sim.phaseIndex;
        if(i===0) return 'G1/S ✔︎';
        if(i===1||i===2) return 'Spindle ✔︎';
        if(i>=3) return 'M Checkpoint';
        return '—';
      },
      updateMolecularStatus: () => {
        this.el.atpLevel.textContent = Math.round(this.Sim.atp || 0);
        this.el.oxygenLevel.textContent = Math.round(this.Sim.oxygen || 0);
        this.el.nadphLevel.textContent = Math.round(this.Sim.nadph || 0);
        this.el.proteinCount.textContent = this.Sim.proteins ? this.Sim.proteins.length : 0;
        this.el.cdk1Level.textContent = Math.round((this.Sim.cyclins && this.Sim.cyclins.cdk1 ? this.Sim.cyclins.cdk1 : 0) * 100);
        this.el.cdk2Level.textContent = Math.round((this.Sim.cyclins && this.Sim.cyclins.cdk2 ? this.Sim.cyclins.cdk2 : 0) * 100);
        this.el.p53Level.textContent = Math.round((this.Sim.signaling && this.Sim.signaling.p53 ? this.Sim.signaling.p53 : 0) * 100);
        this.el.mtorLevel.textContent = Math.round((this.Sim.signaling && this.Sim.signaling.mtor ? this.Sim.signaling.mtor : 0) * 100);
      },
      toast: (msg)=>{
        // Scoped toast in shadow
        const n = document.createElement('div');
        n.textContent = msg;
        Object.assign(n.style, {position:'fixed',left:'50%',top:'24px',transform:'translateX(-50%)',
          padding:'10px 14px', border:'1px solid rgba(255,255,255,.2)', background:'rgba(0,0,0,.55)',
          backdropFilter:'blur(8px)', borderRadius:'12px', color:'#fff', zIndex:'999999'});
        this._root.appendChild(n);
        setTimeout(()=>{ n.style.transition='all .35s'; n.style.opacity='0'; n.style.transform='translateX(-50%) translateY(-8px)'; }, 1200);
        setTimeout(()=>n.remove(), 1700);
      }
    };

    // Interactions
    this.UI.buildPhaseGrid();
    this._bind = ()=>{
      // Play button animates phase from 0% to 100%, then prompts user
      this.el.play.addEventListener('click', ()=>{
        // Toggle playing state
        if(this.Sim.playing) {
          this.Sim.playing = false;
          this.UI.syncPlay();
          return;
        }
        // Start from beginning of phase
        this.Sim.time = 0;
  this.Sim.playing = true;
  // Hide nextStep UI while playing
  this.el.nextStep.style.display = 'none';
  this.el.narration.textContent = '';
        this.UI.syncPlay();
      });
      // Canvas hover interactions for labels
      this._hoverFeature = null;
      this._featureBoxes = []; // populated each draw: {id, x,y,r, type, text}
      this.el.canvas.addEventListener('mousemove', (e)=>{
        const rect = this.el.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left);
        const my = (e.clientY - rect.top);
        let found = null;
        for(const f of this._featureBoxes){
          const dx = mx - f.x, dy = my - f.y;
          if(Math.hypot(dx,dy) <= (f.r||12) + 6) { found = f; break; }
        }
        if(found && (!this._hoverFeature || this._hoverFeature.id !== found.id)){
          this._hoverFeature = found; this.Sim.draw();
        } else if(!found && this._hoverFeature){ this._hoverFeature=null; this.Sim.draw(); }
      });
      this.el.canvas.addEventListener('mouseleave', ()=>{ this._hoverFeature=null; this.Sim.draw(); });

      // Next Step button advances to next phase and animates again
      this.el.nextStep.addEventListener('click', ()=>{
        this.el.nextStep.style.display = 'none';
        this.Sim.phaseIndex = Math.min(this.Sim.phaseIndex + 1, this.PHASES.length - 1);
        this.Sim.time = 0;
        this.UI.syncPhase();
        this.UI.updateInfo();
        this.Sim.draw();
        // Auto-play next phase
        this.el.play.click();
      });
      this.el.speed.addEventListener('input', e=> this.Sim.speed=parseFloat(e.target.value));
      this.el.phaseSel.addEventListener('change', e=> this.Sim.setPhaseByKey(e.target.value));
      this.el.reset.addEventListener('click', ()=>{ this.Sim.reset(); this.UI.syncPhase(); this.UI.syncPlay(); });
      this.el.snap.addEventListener('click', ()=>{
        const url = this.el.canvas.toDataURL('image/png'); const a=document.createElement('a');
        a.href=url; a.download=`mitosis-${Date.now()}.png`; a.click();
        this.UI.toast('Screenshot saved!');
      });
      this.el.share.addEventListener('click', ()=>{
        const state = {
          phase: this.PHASES[this.Sim.phaseIndex].key,
          time: this.Sim.time,
          speed: this.Sim.speed,
          playing: this.Sim.playing,
          damage: this.Sim.damage,
          temperature: this.Sim.temperature,
          nutrients: this.Sim.nutrients,
          cellType: this.Sim.cellType,
          blockMT: this.Sim.blockMT,
          blockActin: this.Sim.blockActin,
          checkOverride: this.Sim.checkOverride,
          p53: this.Sim.p53
        };
        const encoded = btoa(JSON.stringify(state));
        const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`;
        
        if(navigator.share) {
          navigator.share({
            title: 'Mitosis Simulation',
            text: 'Check out this mitosis simulation!',
            url: url
          });
        } else {
          navigator.clipboard.writeText(url).then(() => {
            this.UI.toast('Simulation link copied to clipboard!');
          });
        }
      });
      // Build phaseGrid from PHASES (same as PhaseSel)
      this.UI.buildPhaseGrid = ()=>{
        this.el.phaseGrid.innerHTML = this.PHASES.map((p,i)=>`<div class="phase" data-i="${i}">${p.name}</div>`).join('');
      };

      // Unified phase selection handler
      const selectPhase = (idx) => {
        // Use canonical setter so all side-effects happen in one place
        const key = this.PHASES[idx] ? this.PHASES[idx].key : null;
        if(key) {
          // stop automatic playback so the user sees the selected phase
          this.Sim.playing = false;
          this.UI.syncPlay();
          // set the phase (this will reset time and sync UI)
          this.Sim.setPhaseByKey(key);
          // force a one-off draw so the canvas reflects the change immediately
          this.Sim.draw();
        }
        // Highlight selected item in grid
        [...this.el.phaseGrid.children].forEach((el, i) => el.classList.toggle('active', i === idx));
      };

      // Phase grid click handler
      this.el.phaseGrid.addEventListener('click', (e)=>{
        const cell = e.target.closest('.phase'); if(!cell) return;
        const i = parseInt(cell.dataset.i,10);
        selectPhase(i);
      });

      // PhaseSel dropdown handler
      this.el.phaseSel.addEventListener('change', (e)=>{
        const key = e.target.value;
        const idx = this.PHASES.findIndex(p=>p.key===key);
        if(idx<0) return;
        selectPhase(idx);
      });

      // Experiments
      this.el.mtBlock.addEventListener('change', e=> this.Sim.blockMT = e.target.checked);
      this.el.actBlock.addEventListener('change', e=> this.Sim.blockActin = e.target.checked);
      this.el.override.addEventListener('change', e=> this.Sim.checkOverride = e.target.checked);
      this.el.p53.addEventListener('change', e=> this.Sim.p53 = e.target.checked);
      this.el.damage.addEventListener('input', e=> this.Sim.damage = parseInt(e.target.value,10)/100);

      // Advanced controls
      this.el.temperature.addEventListener('input', e=> {
        this.Sim.temperature = parseInt(e.target.value,10);
        this.el.tempDisplay.textContent = this.Sim.temperature + '°C';
        this.Sim.applyTemperatureEffects();
      });
      this.el.nutrients.addEventListener('input', e=> {
        this.Sim.nutrients = parseInt(e.target.value,10)/100;
        this.el.nutrientDisplay.textContent = Math.round(this.Sim.nutrients * 100) + '%';
        this.Sim.applyNutrientEffects();
      });
      this.el.cellType.addEventListener('change', e=> {
        this.Sim.cellType = e.target.value;
        this.Sim.applyCellTypeEffects();
      });

      // Enhanced Quiz System
      const quizQuestions = [
        // Interphase questions
        {phase:'interphase', q:'Which sub-phase duplicates DNA?', opts:['G1','S','G2'], a:1, explain:'S phase synthesizes DNA; G1/G2 are growth phases.' },
        {phase:'interphase', q:'What happens during G1 phase?', opts:['DNA replication','Cell growth and protein synthesis','Chromosome condensation'], a:1, explain:'G1 is the first gap phase for growth and preparation.' },
        {phase:'interphase', q:'The G2/M checkpoint monitors:', opts:['Nutrient levels','DNA integrity and replication completion','Cell size'], a:1, explain:'Ensures DNA is intact and fully replicated before mitosis.' },
        
        // Prophase questions
        {phase:'prophase', q:'What forms during prophase?', opts:['Cleavage furrow','Mitotic spindle','Nuclear envelope'], a:1, explain:'Spindle apparatus begins forming; nuclear envelope breaks down later.' },
        {phase:'prophase', q:'Chromosome condensation is driven by:', opts:['Actin filaments','Condensin proteins','Microtubules'], a:1, explain:'Condensin complexes compact chromosomes for proper segregation.' },
        
        // Metaphase questions
        {phase:'metaphase', q:'The mitotic checkpoint verifies:', opts:['DNA fully replicated','Sister chromatids attached to opposite poles','Actin ring assembled'], a:1, explain:'Bi-orientation prevents aneuploidy and ensures proper chromosome segregation.' },
        {phase:'metaphase', q:'Chromosomes align at the:', opts:['Cell poles','Metaphase plate','Nuclear periphery'], a:1, explain:'The metaphase plate is the equatorial plane of the cell.' },
        
        // Anaphase questions
        {phase:'anaphase', q:'Cohesin cleavage triggers:', opts:['Chromosome condensation','Chromatid separation','Nuclear envelope breakdown'], a:1, explain:'Separase cleaves cohesin, allowing sister chromatids to separate.' },
        {phase:'anaphase', q:'What motor proteins move chromosomes?', opts:['Myosin','Kinesin and dynein','Actin'], a:1, explain:'Kinesin moves toward plus ends, dynein toward minus ends.' },
        
        // Telophase questions
        {phase:'telophase', q:'During telophase:', opts:['Chromosomes condense further','Nuclear envelopes reform','Microtubules polymerize at kinetochores'], a:1, explain:'Nuclear envelopes reassemble around separated chromosome sets.' },
        {phase:'telophase', q:'Chromosome decondensation requires:', opts:['Condensin','Histone deacetylation','Phosphorylation'], a:1, explain:'Histone modifications allow chromatin to relax.' },
        
        // Cytokinesis questions
        {phase:'cytokinesis', q:'Cytokinesis is driven by:', opts:['Actin–myosin ring','Spindle only','DNA polymerase'], a:0, explain:'The contractile ring pinches the cell membrane.' },
        {phase:'cytokinesis', q:'In plant cells, cytokinesis involves:', opts:['Actin ring','Cell plate formation','Centrioles'], a:1, explain:'Plant cells form a cell plate instead of a cleavage furrow.' },
        
        // General questions
        {phase:'general', q:'p53 is called the "guardian of the genome" because:', opts:['It repairs DNA','It arrests the cell cycle in response to damage','It promotes cell division'], a:1, explain:'p53 stops the cell cycle when DNA damage is detected.' },
        {phase:'general', q:'Cancer cells often have mutations in:', opts:['Ribosomes','Checkpoint proteins','DNA repair genes'], a:1, explain:'Checkpoint mutations allow uncontrolled cell division.' }
      ];
      
      const quizFor = (k)=>{
        const phaseQuestions = quizQuestions.filter(q => q.phase === k);
        if(phaseQuestions.length > 0) {
          return phaseQuestions[Math.floor(Math.random() * phaseQuestions.length)];
        }
        // Fallback to general questions
        const generalQuestions = quizQuestions.filter(q => q.phase === 'general');
        return generalQuestions[Math.floor(Math.random() * generalQuestions.length)];
      };
      this.el.quiz.addEventListener('click', ()=>{
        const Q = quizFor(this.PHASES && this.PHASES[this.Sim.phaseIndex] ? this.PHASES[this.Sim.phaseIndex].key : 'interphase');
        this.el.quizQ.textContent = Q.q; this.el.quizRes.textContent=''; this.el.quizOpts.innerHTML='';
        Q.opts.forEach((opt,i)=>{
          const b = document.createElement('button'); b.textContent=opt;
          b.addEventListener('click', ()=>{
            const ok = (i===Q.a); this.el.quizRes.textContent = ok? 'Correct ✅' : 'Not quite. '+Q.explain;
            this.el.quizRes.style.color = ok? 'var(--accent)' : 'rgb(239,68,68)';
          });
          this.el.quizOpts.appendChild(b);
        });
        this.el.quizModal.classList.add('show');
      });
      this.el.quizClose.addEventListener('click', ()=> this.el.quizModal.classList.remove('show'));
      this.el.quizModal.addEventListener('click', (e)=>{ if(e.target===this.el.quizModal) this.el.quizModal.classList.remove('show'); });

  // (no-op) Next Step button logic handled earlier; duplicate handler removed to avoid errors
    };

    // animation loop (per instance)
    let last=performance.now();
    let frameCount = 0;
    const loop = (now)=>{
      const dt = (now-last)/1000; last=now; 
      // When playing, advance time according to dt and speed; phase duration 3s
      if(this.Sim.playing) {
        const phaseDuration = 3.0;
        this.Sim.time += dt * this.Sim.speed;
        if(this.Sim.time >= phaseDuration) {
          this.Sim.time = phaseDuration;
          this.Sim.playing = false;
          this.UI.syncPlay();
          // Show unobtrusive toast instead of bottom narration/controls
          this.UI.toast('Phase complete');
        }
      }
      this.Sim.step(dt);
      this.Sim.draw();
      frameCount++;
      this._raf = requestAnimationFrame(loop);
    };

    // Load shared state if present
    this.loadSharedState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const stateParam = urlParams.get('state');
      if(stateParam) {
        try {
          const state = JSON.parse(atob(stateParam));
          this.Sim.phaseIndex = this.PHASES.findIndex(p => p.key === state.phase) || 0;
          this.Sim.time = state.time || 0;
          this.Sim.speed = state.speed || 1;
          this.Sim.playing = state.playing || false;
          this.Sim.damage = state.damage || 0;
          this.Sim.temperature = state.temperature || 37;
          this.Sim.nutrients = state.nutrients || 1;
          this.Sim.cellType = state.cellType || 'normal';
          this.Sim.blockMT = state.blockMT || false;
          this.Sim.blockActin = state.blockActin || false;
          this.Sim.checkOverride = state.checkOverride || false;
          this.Sim.p53 = state.p53 !== undefined ? state.p53 : true;
          
          // Update UI elements
          this.el.damage.value = Math.round(this.Sim.damage * 100);
          this.el.temperature.value = this.Sim.temperature;
          this.el.tempDisplay.textContent = this.Sim.temperature + '°C';
          this.el.nutrients.value = Math.round(this.Sim.nutrients * 100);
          this.el.nutrientDisplay.textContent = Math.round(this.Sim.nutrients * 100) + '%';
          this.el.cellType.value = this.Sim.cellType;
          this.el.mtBlock.checked = this.Sim.blockMT;
          this.el.actBlock.checked = this.Sim.blockActin;
          this.el.override.checked = this.Sim.checkOverride;
          this.el.p53.checked = this.Sim.p53;
          
          this.UI.toast('Shared simulation loaded!');
        } catch(e) {
          console.warn('Failed to load shared state:', e);
        }
      }
    };
    
    // Initialize everything in the correct order
    console.log('Starting initialization...');
    this.Sim.init();
    this.UI.buildPhaseGrid();
    this.UI.syncPlay(); 
    this.UI.syncPhase();
    this.UI.updateInfo();
    this._bind();
    this._raf = requestAnimationFrame(loop);
    console.log('Initialization complete, animation started');
  }

  connectedCallback(){
    // honor attributes after construction
    this.Sim.playing = false;
    this.Sim.loop    = this.hasAttribute('loop');
    this.UI.syncPlay();
  }

  disconnectedCallback(){
    if(this._raf) cancelAnimationFrame(this._raf);
    if(this._keyH) window.removeEventListener('keydown', this._keyH);
    if(this.ro) this.ro.disconnect();
  }
}
customElements.define('mitosis-studio', MitosisStudio);

// Auto-mount for minimal embedding pages: if a container with id `mitosis-root` exists,
// create and append a <mitosis-studio> element inside it.
window.addEventListener('DOMContentLoaded', ()=>{
  const root = document.getElementById('mitosis-root');
  if(root && !root.querySelector('mitosis-studio')){
    const el = document.createElement('mitosis-studio');
    root.appendChild(el);
  }
});
