// ============================================
// POWER ANALYSIS CALCULATIONS MODULE
// Core power analysis computations
// ============================================

class PowerCalculations {
    constructor() {
        this.stats = new StatisticalFunctions();
    }

    // Calculate power for two-sample t-test
    calculateTwoSampleTPower(params) {
        const { n, alpha, effectSize, oneTailed } = params;
        const df = 2 * n - 2;
        const ncp = effectSize * Math.sqrt(n / 2);

        let criticalValue;
        if (oneTailed) {
            criticalValue = this.stats.tInv(alpha, df);
        } else {
            criticalValue = this.stats.tInv(1 - alpha / 2, df);
        }

        return this.calculateNonCentralTPower(criticalValue, df, ncp);
    }

    // Calculate power for paired t-test
    calculatePairedTPower(params) {
        const { n, alpha, effectSize, oneTailed } = params;
        const df = n - 1;
        const ncp = effectSize * Math.sqrt(n);

        let criticalValue;
        if (oneTailed) {
            criticalValue = this.stats.tInv(alpha, df);
        } else {
            criticalValue = this.stats.tInv(1 - alpha / 2, df);
        }

        return this.calculateNonCentralTPower(criticalValue, df, ncp);
    }

    // Calculate power for ANOVA
    calculateANOVAPower(params) {
        const { n, alpha, effectSizeAnova, k } = params;
        const df1 = k - 1;
        const df2 = k * n - k;
        const ncp = effectSizeAnova * effectSizeAnova * n;

        const criticalValue = this.stats.fInv(alpha, df1, df2);
        return this.calculateFPower(criticalValue, df1, df2, ncp);
    }

    // Calculate power for regression
    calculateRegressionPower(params) {
        const { n, alpha, predictors, r2 } = params;
        const df1 = predictors;
        const df2 = n - predictors - 1;
        const ncp = r2 / (1 - r2) * n;

        const criticalValue = this.stats.fInv(alpha, df1, df2);
        return this.calculateFPower(criticalValue, df1, df2, ncp);
    }

    // Calculate power for one-sample t-test
    calculateOneSampleTPower(params) {
        const { n, alpha, effectSize, oneTailed } = params;
        const df = n - 1;
        const ncp = effectSize * Math.sqrt(n);

        let criticalValue;
        if (oneTailed) {
            criticalValue = this.stats.tInv(alpha, df);
        } else {
            criticalValue = this.stats.tInv(1 - alpha / 2, df);
        }

        return this.calculateNonCentralTPower(criticalValue, df, ncp);
    }

    // Non-central t-distribution power calculation
    calculateNonCentralTPower(criticalT, df, ncp) {
        const power1 = 1 - this.stats.normalCDF(criticalT - ncp);
        const power2 = this.stats.normalCDF(-criticalT - ncp);
        const power = power1 + power2;

        return Math.max(0, Math.min(1, power));
    }

    // Non-central F-distribution power calculation
    calculateFPower(criticalF, df1, df2, ncp) {
        if (df1 <= 0 || df2 <= 0 || criticalF <= 0) return 0;

        // Simplified approximation using normal distribution
        const variance = (2 * df1 + df2 - 2) / (df2 - 2);
        const z = (criticalF - ncp) / Math.sqrt(variance);

        const power = 1 - this.stats.normalCDF(z);
        return Math.max(0, Math.min(1, power));
    }

    // Calculate required sample size for target power
    calculateRequiredSampleSize(params) {
        const { alpha, effectSize, targetPower, oneTailed, testType } = params;

        // Use approximation formulas for sample size calculation
        let requiredN;

        if (testType === 'two_sample') {
            // Two-sample t-test sample size formula
            // Per-group sample size for two-sample (equal n per group): n = 2*(z_alpha + z_beta)^2 / d^2
            const zAlpha = oneTailed ? this.stats.normalInv(1 - alpha) : this.stats.normalInv(1 - alpha/2);
            const zBeta = this.stats.normalInv(targetPower);
            requiredN = Math.ceil(2 * (zAlpha + zBeta) ** 2 / (effectSize ** 2));
        } else if (testType === 'paired') {
            // Paired t-test sample size formula
            // Paired/one-sample uses single-sample formula (no factor 2)
            const zAlpha = oneTailed ? this.stats.normalInv(1 - alpha) : this.stats.normalInv(1 - alpha/2);
            const zBeta = this.stats.normalInv(targetPower);
            requiredN = Math.ceil((zAlpha + zBeta) ** 2 / (effectSize ** 2));
        } else if (testType === 'anova') {
            // ANOVA sample size approximation
            const fCritical = this.stats.fInv(alpha, params.k - 1, 100); // Approximation
            const lambda = targetPower; // Simplified
            requiredN = Math.ceil(lambda / (effectSize ** 2));
        } else {
            // Default approximation
            const zAlpha = oneTailed ? this.stats.normalInv(1 - alpha) : this.stats.normalInv(1 - alpha/2);
            const zBeta = this.stats.normalInv(targetPower);
            requiredN = Math.ceil((zAlpha + zBeta) ** 2 / effectSize ** 2);
        }

        return Math.max(2, Math.min(10000, requiredN));
    }

    // Interpret effect size
    interpretEffectSize(effectSize, testType) {
        if (testType === 'anova') {
            if (effectSize < 0.1) return 'Small';
            if (effectSize < 0.25) return 'Medium';
            return 'Large';
        } else if (testType === 'regression') {
            if (effectSize < 0.02) return 'Small';
            if (effectSize < 0.13) return 'Medium';
            return 'Large';
        } else {
            if (effectSize < 0.2) return 'Small';
            if (effectSize < 0.5) return 'Medium';
            if (effectSize < 0.8) return 'Large';
            return 'Very Large';
        }
    }

    // Interpret power level
    interpretPower(power) {
        if (power >= 0.95) return 'Excellent';
        if (power >= 0.8) return 'Good';
        if (power >= 0.6) return 'Moderate';
        if (power >= 0.5) return 'Low';
        return 'Very Low';
    }
}

// Export for use in other modules
window.PowerCalculations = PowerCalculations;
