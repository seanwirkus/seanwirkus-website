// Power Calculation Test
// Baseline: n=30, α=0.05, d=0.5, two-tailed → Power = 0.4779

function testPowerCalculation() {
    const n = 30;
    const alpha = 0.05;
    const effectSize = 0.5;
    const oneTailed = false;

    // Calculate degrees of freedom
    const df = 2 * n - 2; // 58

    // Calculate non-centrality parameter
    const ncp = effectSize * Math.sqrt(n / 2); // 0.5 * sqrt(15) ≈ 1.936

    // Get critical value for two-tailed test (use positive value)
    const criticalValue = Math.abs(normalInv(alpha / 2)); // ≈ 1.96

    // Calculate power for two-tailed test
    const power1 = 1 - normalCDF(criticalValue - ncp);
    const power2 = normalCDF(-criticalValue - ncp);
    const power = power1 - power2; // Subtract for two-tailed

    console.log('=== POWER CALCULATION TEST ===');
    console.log(`Parameters: n=${n}, α=${alpha}, d=${effectSize}, two-tailed=${!oneTailed}`);
    console.log(`df = ${df}`);
    console.log(`ncp = ${ncp.toFixed(3)}`);
    console.log(`critical = ${criticalValue.toFixed(3)}`);
    console.log(`power = ${power.toFixed(4)}`);
    console.log(`expected = 0.4779`);
    console.log(`difference = ${Math.abs(power - 0.4779).toFixed(4)}`);
    console.log('==============================');

    return power;
}

// Normal distribution functions (from our main code)
function normalCDF(x) {
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
}

function normalInv(p) {
    const a1 = -39.6968302866538;
    const a2 = 220.946098424521;
    const a3 = -275.928510446969;
    const a4 = 138.357751867269;
    const a5 = -30.6647980661472;
    const a6 = 2.50662827745924;

    const b1 = -54.4760987982241;
    const b2 = 161.5858368580409;
    const b3 = -155.6989798598866;
    const b4 = 66.80131188771972;
    const b5 = -13.28068155288572;

    const c1 = -7.784894002430293e-3;
    const c2 = -0.3223964580411365;
    const c3 = -2.400758277161838;
    const c4 = -2.549732539343734;
    const c5 = 4.374664141464968;
    const c6 = 2.938163982698783;

    const d1 = 7.784695709041462e-3;
    const d2 = 0.3224671290700398;
    const d3 = 2.445134137142996;
    const d4 = 3.754408661907416;

    let x = 0;
    let q = p;

    if (q <= 0) {
        return -Infinity;
    } else if (q >= 1) {
        return Infinity;
    } else if (q < 0.02425) {
        q = Math.sqrt(-2 * Math.log(q));
        x = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (q < 0.97575) {
        q = q - 0.5;
        const r = q * q;
        x = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
            (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
        q = Math.sqrt(-2 * Math.log(1 - q));
        x = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }

    return x;
}

// Run the test
testPowerCalculation();
