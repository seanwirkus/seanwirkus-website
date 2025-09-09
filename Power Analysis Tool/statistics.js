// ============================================
// STATISTICAL FUNCTIONS MODULE
// Core statistical calculations and distributions
// ============================================

class StatisticalFunctions {
    // Normal distribution functions
    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
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

    normalInv(p) {
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

    // Normal distribution PDF
    normalPDF(x) {
        return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
    }

    // t-distribution inverse
    tInv(p, df) {
        if (df > 30) {
            return this.normalInv(p);
        }

        const z = this.normalInv(p);
        const g1 = (z * z * z + z) / (4 * df);
        const g2 = (5 * z * z * z * z + 16 * z * z + 3) / (96 * df * df);
        const g3 = (3 * z * z * z * z * z + 19 * z * z * z + 17 * z) / (384 * df * df * df);
        const g4 = (79 * z * z * z * z * z * z + 776 * z * z * z * z + 1482 * z * z + 1920 * z) / (92160 * df * df * df * df);

        return z + g1 + g2 + g3 + g4;
    }

    // F-distribution inverse (simplified)
    fInv(p, df1, df2) {
        if (df2 <= 2) return 1;

        const z = this.normalInv(p);
        const result = Math.exp(2 * z / Math.sqrt(df2));

        return Math.max(0.001, Math.min(100, result));
    }

    // Generate normal random data
    generateNormalData(n, mean = 0, sd = 1) {
        const data = [];
        for (let i = 0; i < n; i++) {
            // Box-Muller transform
            const u1 = Math.random();
            const u2 = Math.random();
            const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            data.push(mean + z0 * sd);
        }
        return data;
    }
}

// Export for use in other modules
window.StatisticalFunctions = StatisticalFunctions;
