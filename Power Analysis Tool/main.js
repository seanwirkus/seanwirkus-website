import { PowerMath } from './modules/math.js';
import { PlotService } from './modules/plots.js';
import { ExportService } from './modules/exporters.js';

class PowerAnalysisApp {
  constructor() {
    this.math = new PowerMath();
    this.plots = new PlotService();
    this.exporter = new ExportService();
    this.defaults = {
      testType: 'two_sample',
      n: 30,
      alpha: 0.05,
      effectSize: 0.5,
      oneTailed: false,
      k: 3,
      effectSizeAnova: 0.25,
      predictors: 2,
      r2: 0.2,
      targetPower: 0.8
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Lazy bootstrap; we keep existing behavior inside current script for now.
  window.__powerApp = new PowerAnalysisApp();
});


