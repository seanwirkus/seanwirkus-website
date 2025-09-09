// Legacy copy of mitosis-init.js (frozen)
// Original file preserved for historical/reference purposes.

/* Copy preserved */
// Initialize MitosisStudio web component
// Ensure a <mitosis-studio> element exists after the real component is defined.
document.addEventListener('DOMContentLoaded', () => {
  // Wait for the full component to be defined by mitosis.js
  customElements.whenDefined('mitosis-studio').then(() => {
    const root = document.getElementById('mitosis-root');
    if(!root) return;
    if(!root.querySelector('mitosis-studio')){
      const el = document.createElement('mitosis-studio');
      root.appendChild(el);
      console.log('MitosisStudio element instantiated');
    }
  }).catch((err) => {
    // If it never defines, log for debugging
    console.warn('mitosis-studio did not become defined:', err);
  });
});
