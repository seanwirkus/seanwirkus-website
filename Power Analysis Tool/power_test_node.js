// Quick node test to verify power calculation matches baseline (n=30, alpha=0.05, d=0.5 two-tailed)
const { readFileSync } = require('fs');

// load files (assumes power-calculations.js defines PowerCalculations on window/global)
const vm = require('vm');
const code = readFileSync('power-calculations.js', 'utf8');
const sandbox = { console, window: {} };
vm.createContext(sandbox);
vm.runInContext(code + '\nthis.PowerCalculations = PowerCalculations;', sandbox);

const PowerCalculations = sandbox.PowerCalculations;
const pc = new PowerCalculations();

const params = { n: 30, alpha: 0.05, effectSize: 0.5, oneTailed: false, testType: 'two_sample' };
const power = pc.calculateTwoSampleTPower(params);
console.log('Computed power:', power.toFixed(4));
console.log('Expected ~0.4779');
