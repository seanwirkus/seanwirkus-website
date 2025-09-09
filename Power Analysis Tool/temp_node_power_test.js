// Temp node test to compute baseline power
const fs = require('fs');
const vm = require('vm');

try {
  const statCode = fs.readFileSync('./statistics.js', 'utf8');
  const powerCode = fs.readFileSync('./power-calculations.js', 'utf8');

  const sandbox = { console, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(statCode + '\nthis.StatisticalFunctions = StatisticalFunctions;', sandbox);
  vm.runInContext(powerCode + '\nthis.PowerCalculations = PowerCalculations;', sandbox);

  const PowerCalculations = sandbox.PowerCalculations;
  const pc = new PowerCalculations();

  const params = { n: 30, alpha: 0.05, effectSize: 0.5, oneTailed: false, testType: 'two_sample' };
  const power = pc.calculateTwoSampleTPower(params);
  console.log('Computed power:', power.toFixed(6));
  console.log('Expected ~0.4779');
} catch (err) {
  console.error('Error running temp node test:', err);
  process.exitCode = 2;
}
