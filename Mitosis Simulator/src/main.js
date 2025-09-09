import { MitosisSimulation } from './components/MitosisSimulation.js';

// Register the web component
customElements.define('mitosis-simulation', MitosisSimulation);

// Auto-mount for standalone pages
window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('mitosis-root');
  if (root && !root.querySelector('mitosis-simulation')) {
    root.appendChild(document.createElement('mitosis-simulation'));
  }
});
