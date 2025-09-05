


class PowerAnalysis {
    constructor() {
        this.defaultValues = {
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
        
        this.initializeEventListeners();
        this.initializeTooltips();
        this.handleTestTypeChange();
        this.calculatePower();
    }

    initializeEventListeners() {
        document.getElementById('testType').addEventListener('change', () => {
            this.handleTestTypeChange();
            this.calculatePower();
        });

        const sliders = document.querySelectorAll('.slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                this.updateSliderValue(e.target);
                this.calculatePower();
            });
        });

        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuickAdjust(e.target);
            });
        });

        document.getElementById('oneTailed').addEventListener('change', () => {
            this.calculatePower();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetToDefaults();
        });

        document.getElementById('copyRCode').addEventListener('click', () => {
            this.copyRCode();
        });
    }

    updateSliderValue(slider) {
        const valueDisplay = document.getElementById(slider.id + 'Value');
        if (valueDisplay) {
            let value = parseFloat(slider.value);
            if (slider.id === 'alpha') {
                valueDisplay.textContent = value.toFixed(3);
            } else if (slider.id === 'targetPower' || slider.id === 'r2') {
                valueDisplay.textContent = value.toFixed(2);
            } else if (slider.id === 'effectSizeAnova') {
                valueDisplay.textContent = value.toFixed(2);
            } else {
                valueDisplay.textContent = value;
            }
        }
    }

    handleQuickAdjust(button) {
        const target = button.dataset.target;
        const action = button.dataset.action;
        const slider = document.getElementById(target);
        
        if (!slider) return;

        let currentValue = parseFloat(slider.value);
        let step = parseFloat(slider.step);
        let newValue;

        switch (action) {
            case 'decrease':
                newValue = currentValue - (step * 10);
                break;
            case 'decrease-small':
                newValue = currentValue - step;
                break;
            case 'increase-small':
                newValue = currentValue + step;
                break;
            case 'increase':
                newValue = currentValue + (step * 10);
                break;
        }

        newValue = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), newValue));
        
        slider.value = newValue;
        this.updateSliderValue(slider);
        this.calculatePower();
    }

    initializeTooltips() {
        const tooltips = {
            'n': 'Larger sample sizes generally increase statistical power',
            'alpha': 'Lower α reduces Type I errors but requires larger sample sizes',
            'effectSize': 'Larger effect sizes are easier to detect with smaller samples',
            'targetPower': '80% power is commonly recommended for most studies',
            'effectSizeAnova': 'Larger effect sizes are easier to detect with smaller samples',
            'predictors': 'Number of predictors in the regression model',
            'r2': 'Proportion of variance explained by the predictors'
        };

        Object.entries(tooltips).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.title = text;
            }
        });
    }

    resetToDefaults() {
        document.getElementById('testType').value = this.defaultValues.testType;
        
        const sliders = document.querySelectorAll('.slider');
        sliders.forEach(slider => {
            const defaultValue = this.defaultValues[slider.id];
            if (defaultValue !== undefined) {
                slider.value = defaultValue;
                this.updateSliderValue(slider);
            }
        });

        document.getElementById('oneTailed').checked = this.defaultValues.oneTailed;

        this.handleTestTypeChange();
        this.calculatePower();
        
        document.querySelector('.controls-panel').scrollTop = 0;
    }

    getParameters() {
        const params = {
            testType: document.getElementById('testType').value,
            n: parseInt(document.getElementById('n').value),
            alpha: parseFloat(document.getElementById('alpha').value),
            effectSize: parseFloat(document.getElementById('effectSize').value),
            oneTailed: document.getElementById('oneTailed').checked,
            k: parseInt(document.getElementById('k').value),
            effectSizeAnova: parseFloat(document.getElementById('effectSizeAnova').value),
            predictors: parseInt(document.getElementById('predictors').value),
            r2: parseFloat(document.getElementById('r2').value),
            targetPower: parseFloat(document.getElementById('targetPower').value)
        };

        params.n = Math.max(2, Math.min(1000, params.n));
        params.alpha = Math.max(0.001, Math.min(0.5, params.alpha));
        params.effectSize = Math.max(0.1, Math.min(2, params.effectSize));
        params.k = Math.max(2, Math.min(20, params.k));
        params.effectSizeAnova = Math.max(0.1, Math.min(2, params.effectSizeAnova));
        params.predictors = Math.max(1, Math.min(50, params.predictors));
        params.r2 = Math.max(0.01, Math.min(0.99, params.r2));
        params.targetPower = Math.max(0.1, Math.min(0.99, params.targetPower));

        return params;
    }

    calculatePower() {
        this.showLoadingState();
        
        const params = this.getParameters();
        let power, criticalValue, df, ncp;

        try {
            if (params.testType === 'anova' || params.testType === 'regression') {
                if (params.testType === 'anova') {
                    df = params.k - 1;
                    ncp = params.effectSizeAnova * params.effectSizeAnova * params.n;
                } else {
                    df = params.predictors;
                    ncp = params.r2 / (1 - params.r2) * params.n;
                }
                
                criticalValue = this.fInv(params.alpha, df, Math.max(1, params.n - df - 1));
                power = this.calculateFPower(criticalValue, df, Math.max(1, params.n - df - 1), ncp);
            } else {
                if (params.testType === 'paired') {
                    df = params.n - 1;
                } else {
                    df = 2 * params.n - 2;
                }
                
                ncp = params.effectSize * Math.sqrt(params.n / 2);
                
                if (params.oneTailed) {
                    criticalValue = this.tInv(params.alpha, df);
                    power = this.calculateNonCentralTPower(criticalValue, df, ncp);
                } else {
                    criticalValue = this.tInv(params.alpha / 2, df);
                    power = this.calculateNonCentralTPower(criticalValue, df, ncp);
                }
            }
        } catch (e) {
            console.error('Error in power calculation:', e);
            power = 0.5;
            criticalValue = 1.96;
            df = params.n - 1;
            ncp = 0;
        }

        this.hideLoadingState();

        this.displayResults(params, power, criticalValue, df);
        this.createDistributionPlot(params, power, criticalValue, df, ncp);
        this.createPowerCurve(params);
        this.createSampleDataPlot(params);
        this.generateRCode(params);
    }

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
            return 'Large';
        }
    }

    interpretPower(power) {
        if (power >= 0.8) return 'Excellent';
        if (power >= 0.6) return 'Good';
        if (power >= 0.4) return 'Moderate';
        return 'Low';
    }

    getSampleSizeRecommendation(power, requiredSampleSize, currentSampleSize) {
        if (!isFinite(power) || !isFinite(requiredSampleSize) || !isFinite(currentSampleSize)) {
            return 'Unable to calculate recommendation';
        }
        
        if (power >= 0.8) {
            return 'Adequate sample size for good power';
        } else if (currentSampleSize < requiredSampleSize) {
            return `Increase sample size to ${requiredSampleSize} per group`;
        } else {
            return 'Consider increasing effect size or relaxing alpha';
        }
    }

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

    calculateNonCentralTPower(criticalT, df, ncp) {
        const power1 = 1 - this.normalCDF(criticalT - ncp);
        const power2 = this.normalCDF(-criticalT - ncp);
        const power = power1 + power2;
        
        return Math.max(0, Math.min(1, power));
    }

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

    fInv(p, df1, df2) {
        if (df2 <= 2) return 1;
        
        const z = this.normalInv(p);
        const result = Math.exp(2 * z / Math.sqrt(df2));
        
        return Math.max(0.001, Math.min(100, result));
    }

    calculateFPower(criticalF, df1, df2, ncp) {
        if (df1 <= 0 || df2 <= 0 || criticalF <= 0) return 0;
        
        const variance = Math.max(0.001, 2 * (df1 + 2 * ncp) / (df1 * df2));
        const z = (criticalF - ncp) / Math.sqrt(variance);
        const power = 1 - this.normalCDF(z);
        
        return Math.max(0, Math.min(1, power));
    }

    fPDF(f, df1, df2, ncp = 0) {
        if (f <= 0 || df1 <= 0 || df2 <= 0) return 0;
        
        if (ncp === 0) {
            try {
                const numerator = Math.pow(df1 * f, df1) * Math.pow(df2, df2);
                const denominator = Math.pow(df1 * f + df2, df1 + df2);
                const beta = this.beta(df1/2, df2/2);
                const result = (numerator / denominator) / (f * beta);
                return isFinite(result) ? result : 0;
            } catch (e) {
                return 0;
            }
        } else {
            try {
                const variance = Math.max(0.001, 2 * (df1 + 2 * ncp) / (df1 * df2));
                const z = (f - ncp) / Math.sqrt(variance);
                const result = this.normalPDF(z) * Math.sqrt(variance);
                return isFinite(result) ? result : 0;
            } catch (e) {
                return 0;
            }
        }
    }

    beta(a, b) {
        if (a <= 0 || b <= 0) return Infinity;
        
        if (a > 100 || b > 100) {
            return Math.sqrt(2 * Math.PI) * Math.pow(a, a - 0.5) * Math.pow(b, b - 0.5) / Math.pow(a + b, a + b - 0.5);
        }
        
        return (this.gamma(a) * this.gamma(b)) / this.gamma(a + b);
    }

    calculateRequiredSampleSize(params) {
        const { testType, alpha, effectSize, oneTailed, k, effectSizeAnova, predictors, r2, targetPower } = params;
        
        let requiredN;
        
        try {
            if (testType === 'anova') {
                const f = Math.max(0.001, effectSizeAnova * effectSizeAnova);
                requiredN = Math.ceil((k * 15.6) / f);
            } else if (testType === 'regression') {
                const f2 = Math.max(0.001, r2 / (1 - r2));
                requiredN = Math.ceil((predictors * 15.6) / f2) + predictors + 1;
            } else {
                const zAlpha = this.normalInv(oneTailed ? alpha : alpha / 2);
                const zBeta = this.normalInv(1 - targetPower);
                const effectSizeSquared = Math.max(0.001, effectSize * effectSize);
                requiredN = Math.ceil(2 * Math.pow((zAlpha + zBeta) / effectSize, 2));
            }
            
            return Math.max(2, Math.min(10000, requiredN));
        } catch (e) {
            return 30;
        }
    }

    displayResults(params, power, criticalValue, df) {
        const { testType, n, alpha, effectSize, oneTailed, k, effectSizeAnova, predictors, r2, targetPower } = params;
        
        const validPower = isFinite(power) && !isNaN(power) ? power : 0.5;
        const powerPercent = (validPower * 100).toFixed(1);
        const alphaPercent = (alpha * 100).toFixed(1);
        const betaPercent = ((1 - validPower) * 100).toFixed(1);
        
        let interpretation = '';
        
        if (validPower >= 0.8) {
            interpretation = `Excellent! The current power (${powerPercent}%) meets the commonly recommended 80% threshold.`;
        } else if (validPower >= 0.6) {
            interpretation = `The current power (${powerPercent}%) is moderate but below the recommended 80% threshold. Consider increasing sample size.`;
        } else {
            interpretation = `The current power (${powerPercent}%) is below the commonly recommended 80% threshold. Consider increasing sample size or expecting a larger effect size.`;
        }

        const html = `
            <div class="power-result">
                <div class="power-value">${powerPercent}%</div>
                <div class="power-interpretation">${interpretation}</div>
                
                <div class="statistical-errors">
                    <h4>Statistical Error Analysis</h4>
                    <div class="error-grid">
                        <div class="error-item type1">
                            <div class="error-label">Type I Error (α)</div>
                            <div class="error-value">${alphaPercent}%</div>
                            <div class="error-desc">False Positive - Rejecting H₀ when it's true</div>
                        </div>
                        <div class="error-item type2">
                            <div class="error-label">Type II Error (β)</div>
                            <div class="error-value">${betaPercent}%</div>
                            <div class="error-desc">False Negative - Failing to reject H₀ when it's false</div>
                        </div>
                        <div class="error-item power">
                            <div class="error-label">Power (1-β)</div>
                            <div class="error-value">${powerPercent}%</div>
                            <div class="error-desc">True Positive - Correctly rejecting H₀ when it's false</div>
                        </div>
                        <div class="error-item specificity">
                            <div class="error-label">Specificity (1-α)</div>
                            <div class="error-value">${(100 - parseFloat(alphaPercent)).toFixed(1)}%</div>
                            <div class="error-desc">True Negative - Correctly accepting H₀ when it's true</div>
                        </div>
                    </div>
                </div>
                
                <div class="power-details">
                    <div class="detail-item">
                        <span class="detail-label">Power Level:</span>
                        <span class="detail-value ${validPower >= 0.8 ? 'good' : validPower >= 0.6 ? 'moderate' : 'low'}">${this.interpretPower(validPower)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Effect Size:</span>
                        <span class="detail-value">${this.interpretEffectSize(effectSize, testType)} (${effectSize})</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Recommendation:</span>
                        <span class="detail-value">${this.getSampleSizeRecommendation(validPower, this.calculateRequiredSampleSize(params), n)}</span>
                    </div>
                </div>
                
                <div class="parameters-list">
                    <div class="parameter-item">
                        <span class="detail-label">Sample Size per group (n):</span>
                        <span class="parameter-value">${n}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="detail-label">Effect Size (Cohen's d):</span>
                        <span class="parameter-value">${effectSize}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="detail-label">Test type:</span>
                        <span class="parameter-value">${testType === 'two_sample' ? 'Two-tailed' : testType === 'paired' ? 'Paired' : testType === 'anova' ? 'ANOVA' : 'Regression'}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="detail-label">Significance level (α):</span>
                        <span class="parameter-value">${alpha}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="detail-label">P-value threshold:</span>
                        <span class="parameter-value">${alpha}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="detail-label">Required sample size for ${(targetPower * 100)}% power:</span>
                        <span class="parameter-value">${this.calculateRequiredSampleSize(params)}</span>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('powerResults').innerHTML = html;
    }



    createDistributionPlot(params, power, criticalValue, df, ncp) {
        const { testType, n, alpha, oneTailed, k, effectSizeAnova, predictors, r2 } = params;
        
        let data = [];
        let annotations = [];
        
        if (testType === 'anova' || testType === 'regression') {
            const fValues = Array.from({length: 200}, (_, i) => 0.1 + (i * 5.9 / 199));
            
            const nullDist = fValues.map(f => this.fPDF(f, df, params.n - df - 1));
            
            const altDist = fValues.map(f => this.fPDF(f, df, params.n - df - 1, ncp));
            
            data = [
                {
                    x: fValues,
                    y: nullDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Null Hypothesis (H₀)',
                    line: { color: '#e74c3c', width: 2 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(231, 76, 60, 0.1)'
                },
                {
                    x: fValues,
                    y: altDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Alternative Hypothesis (H₁)',
                    line: { color: '#3498db', width: 2 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(52, 152, 219, 0.1)'
                }
            ];
            
            data.push({
                x: [criticalValue, criticalValue],
                y: [0, Math.max(...nullDist)],
                type: 'scatter',
                mode: 'lines',
                name: 'Critical F-value',
                line: { color: '#f39c12', width: 2, dash: 'dash' }
            });
            
            annotations = [
                {
                    x: criticalValue * 0.5,
                    y: Math.max(...nullDist) * 0.8,
                    text: `Type I Error (α)<br>${(alpha * 100).toFixed(1)}%<br>p < ${alpha}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#e74c3c',
                    arrowwidth: 2,
                    arrowsize: 1,
                    ax: -20,
                    ay: -30,
                    bgcolor: 'rgba(231, 76, 60, 0.9)',
                    bordercolor: '#e74c3c',
                    borderwidth: 1,
                    font: { color: 'white', size: 11 }
                },
                {
                    x: criticalValue * 1.5,
                    y: Math.max(...altDist) * 0.7,
                    text: `Power (1-β)<br>${(power * 100).toFixed(1)}%<br>True Positive`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#3498db',
                    arrowwidth: 2,
                    arrowsize: 1,
                    ax: 20,
                    ay: -30,
                    bgcolor: 'rgba(52, 152, 219, 0.9)',
                    bordercolor: '#3498db',
                    borderwidth: 1,
                    font: { color: 'white', size: 11 }
                },
                {
                    x: criticalValue * 0.3,
                    y: Math.max(...nullDist) * 0.9,
                    text: `Type II Error (β)<br>${((1 - power) * 100).toFixed(1)}%<br>False Negative`,
                    showarrow: false,
                    bgcolor: 'rgba(155, 89, 182, 0.9)',
                    bordercolor: '#9b59b6',
                    borderwidth: 1,
                    font: { color: 'white', size: 11 }
                },
                {
                    x: criticalValue,
                    y: Math.max(...nullDist) * 1.1,
                    text: `Critical F = ${criticalValue.toFixed(3)}<br>p = ${alpha.toFixed(4)}`,
                    showarrow: false,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                }
            ];
            
        } else {
            const tValues = Array.from({length: 200}, (_, i) => -6 + (i * 12 / 199));
            
            const nullDist = tValues.map(t => this.tPDF(t, df));
            
            const altDist = tValues.map(t => this.tPDF(t, df, ncp));
            
            data = [
                {
                    x: tValues,
                    y: nullDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Null Hypothesis (H₀)',
                    line: { color: '#e74c3c', width: 2 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(231, 76, 60, 0.1)'
                },
                {
                    x: tValues,
                    y: altDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Alternative Hypothesis (H₁)',
                    line: { color: '#3498db', width: 2 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(52, 152, 219, 0.1)'
                }
            ];

            if (oneTailed) {
                data.push({
                    x: [criticalValue, criticalValue],
                    y: [0, Math.max(...nullDist)],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Critical Value',
                    line: { color: '#f39c12', width: 2, dash: 'dash' }
                });
            } else {
                data.push({
                    x: [criticalValue, criticalValue],
                    y: [0, Math.max(...nullDist)],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Critical Value',
                    line: { color: '#f39c12', width: 2, dash: 'dash' }
                });
                data.push({
                    x: [-criticalValue, -criticalValue],
                    y: [0, Math.max(...nullDist)],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Critical Value',
                    line: { color: '#f39c12', width: 2, dash: 'dash' },
                    showlegend: false
                });
            }

            annotations = [
                {
                    x: -4.5,
                    y: Math.max(...nullDist) * 0.8,
                    text: `Type I Error (α)<br>${(alpha * 100).toFixed(1)}%<br>p < ${alpha}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#e74c3c',
                    arrowwidth: 2,
                    arrowsize: 1,
                    ax: -20,
                    ay: -30,
                    bgcolor: 'rgba(231, 76, 60, 0.9)',
                    bordercolor: '#e74c3c',
                    borderwidth: 1,
                    font: { color: 'white', size: 11 }
                },
                {
                    x: 2.5,
                    y: Math.max(...altDist) * 0.7,
                    text: `Power (1-β)<br>${(power * 100).toFixed(1)}%<br>True Positive`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#3498db',
                    arrowwidth: 2,
                    arrowsize: 1,
                    ax: 20,
                    ay: -30,
                    bgcolor: 'rgba(52, 152, 219, 0.9)',
                    bordercolor: '#3498db',
                    borderwidth: 1,
                    font: { color: 'white', size: 11 }
                },
                {
                    x: 0,
                    y: Math.max(...nullDist) * 0.9,
                    text: `Type II Error (β)<br>${((1 - power) * 100).toFixed(1)}%<br>False Negative`,
                    showarrow: false,
                    bgcolor: 'rgba(155, 89, 182, 0.9)',
                    bordercolor: '#9b59b6',
                    borderwidth: 1,
                    font: { color: 'white', size: 11 }
                }
            ];

            if (oneTailed) {
                annotations.push({
                    x: criticalValue,
                    y: Math.max(...nullDist) * 1.1,
                    text: `Critical t = ${criticalValue.toFixed(2)}<br>p = ${alpha.toFixed(4)}`,
                    showarrow: false,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                });
            } else {
                annotations.push({
                    x: criticalValue,
                    y: Math.max(...nullDist) * 1.1,
                    text: `Critical t = ${criticalValue.toFixed(2)}<br>p = ${alpha.toFixed(4)}`,
                    showarrow: false,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                });
                annotations.push({
                    x: -criticalValue,
                    y: Math.max(...nullDist) * 1.1,
                    text: `Critical t = ${(-criticalValue).toFixed(2)}<br>p = ${alpha.toFixed(4)}`,
                    showarrow: false,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                });
            }
        }

        const distributionType = testType === 'anova' || testType === 'regression' ? 'F-distribution' : 't-distribution';
        const xAxisTitle = testType === 'anova' || testType === 'regression' ? 'F-statistic' : 't-statistic';

        const layout = {
            title: {
                text: `${distributionType} with Power Analysis & P-values`,
                font: { size: 16, color: '#2c3e50' }
            },
            xaxis: { 
                title: xAxisTitle,
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7'
            },
            yaxis: { 
                title: 'Density',
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7'
            },
            showlegend: true,
            legend: { 
                x: 0.02, 
                y: 0.98,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                bordercolor: '#bdc3c7',
                borderwidth: 1
            },
            margin: { l: 80, r: 50, t: 80, b: 80 },
            autosize: true,
            height: 500,
            annotations: annotations,
            plot_bgcolor: '#f8f9fa',
            paper_bgcolor: '#ffffff'
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            modeBarButtonsToAdd: [{
                name: 'Download Plot',
                icon: Plotly.Icons.download,
                click: function() {
                    Plotly.downloadImage('distributionPlot', {format: 'png', filename: 'distribution_plot'});
                }
            }]
        };

        try {
            Plotly.newPlot('distributionPlot', data, layout, config);
        } catch (e) {
            console.error('Error creating distribution plot:', e);
            document.getElementById('distributionPlot').innerHTML = '<p>Error creating plot. Please try adjusting parameters.</p>';
        }
    }

    tPDF(t, df, ncp = 0) {
        if (df <= 0) return 0;
        
        if (ncp === 0) {
            try {
                const result = this.gamma((df + 1) / 2) / (Math.sqrt(df * Math.PI) * this.gamma(df / 2)) * 
                       Math.pow(1 + t * t / df, -(df + 1) / 2);
                return isFinite(result) ? result : 0;
            } catch (e) {
                return 0;
            }
        } else {
            try {
                const z = (t - ncp) / Math.sqrt(1 + t * t / df);
                const result = this.normalPDF(z) * Math.sqrt(1 + t * t / df);
                return isFinite(result) ? result : 0;
            } catch (e) {
                return 0;
            }
        }
    }

    gamma(x) {
        if (x <= 0) return Infinity;
        if (x === 1) return 1;
        if (x < 1) return this.gamma(x + 1) / x;
        
        if (x > 100) {
            return Math.sqrt(2 * Math.PI / x) * Math.pow(x / Math.E, x);
        }
        
        const n = Math.floor(x - 1);
        let result = 1;
        for (let i = 1; i <= n; i++) {
            result *= (x - i);
        }
        return result * Math.sqrt(2 * Math.PI) * Math.pow(x - 0.5, x - 0.5) * Math.exp(-(x - 0.5));
    }

    normalPDF(x) {
        return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
    }

    createPowerCurve(params) {
        const { testType, n, alpha, oneTailed, k, effectSizeAnova, predictors, r2, effectSize } = params;
        
        const sampleSizes = Array.from({length: 50}, (_, i) => 10 + i * 20);
        const powers = sampleSizes.map(sampleN => {
            try {
                let df, ncp;
                if (testType === 'anova') {
                    df = k - 1;
                    ncp = effectSizeAnova * effectSizeAnova * sampleN;
                } else if (testType === 'regression') {
                    df = predictors;
                    ncp = r2 / (1 - r2) * sampleN;
                } else {
                    df = testType === 'paired' ? sampleN - 1 : 2 * sampleN - 2;
                    ncp = effectSize * Math.sqrt(sampleN / 2);
                }
                
                let criticalValue;
                if (testType === 'anova' || testType === 'regression') {
                    criticalValue = this.fInv(alpha, df, Math.max(1, sampleN - df - 1));
                    return this.calculateFPower(criticalValue, df, Math.max(1, sampleN - df - 1), ncp);
                } else {
                    if (oneTailed) {
                        criticalValue = this.tInv(alpha, df);
                    } else {
                        criticalValue = this.tInv(alpha / 2, df);
                    }
                    return this.calculateNonCentralTPower(criticalValue, df, ncp);
                }
            } catch (e) {
                return 0.5;
            }
        });

        let currentPower;
        try {
            if (testType === 'anova') {
                const df = k - 1;
                const ncp = effectSizeAnova * effectSizeAnova * n;
                const criticalValue = this.fInv(alpha, df, Math.max(1, n - df - 1));
                currentPower = this.calculateFPower(criticalValue, df, Math.max(1, n - df - 1), ncp);
            } else if (testType === 'regression') {
                const df = predictors;
                const ncp = r2 / (1 - r2) * n;
                const criticalValue = this.fInv(alpha, df, Math.max(1, n - df - 1));
                currentPower = this.calculateFPower(criticalValue, df, Math.max(1, n - df - 1), ncp);
            } else {
                const df = testType === 'paired' ? n - 1 : 2 * n - 2;
                const ncp = effectSize * Math.sqrt(n / 2);
                if (oneTailed) {
                    const criticalValue = this.tInv(alpha, df);
                    currentPower = this.calculateNonCentralTPower(criticalValue, df, ncp);
                } else {
                    const criticalValue = this.tInv(alpha / 2, df);
                    currentPower = this.calculateNonCentralTPower(criticalValue, df, ncp);
                }
            }
        } catch (e) {
            currentPower = 0.5;
        }

        const data = [
            {
                x: sampleSizes,
                y: powers,
                type: 'scatter',
                mode: 'lines',
                name: 'Power Curve',
                line: { color: '#3498db', width: 3 },
                fill: 'tonexty',
                fillcolor: 'rgba(52, 152, 219, 0.1)'
            }
        ];

        data.push({
            x: [n],
            y: [currentPower],
            type: 'scatter',
            mode: 'markers',
            name: 'Current Sample Size',
            marker: { 
                color: '#e74c3c', 
                size: 12, 
                symbol: 'diamond',
                line: { color: '#c0392b', width: 2 }
            },
            showlegend: false
        });

        const recommendedPower = 0.8;
        data.push({
            x: [sampleSizes[0], sampleSizes[sampleSizes.length - 1]],
            y: [recommendedPower, recommendedPower],
            type: 'scatter',
            mode: 'lines',
            name: 'Recommended Power (80%)',
            line: { color: '#27ae60', width: 2, dash: 'dash' },
            showlegend: false
        });

        const layout = {
            title: {
                text: 'Power Curve: Effect of Sample Size on Statistical Power',
                font: { size: 16, color: '#2c3e50' }
            },
            xaxis: {
                title: 'Sample Size (n)',
                titlefont: { size: 14, color: '#2c3e50' },
                tickfont: { size: 12, color: '#7f8c8d' },
                gridcolor: '#ecf0f1',
                zeroline: false
            },
            yaxis: {
                title: 'Power (1-β)',
                titlefont: { size: 14, color: '#2c3e50' },
                tickfont: { size: 12, color: '#7f8c8d' },
                gridcolor: '#ecf0f1',
                zeroline: false,
                range: [0, 1]
            },
            legend: {
                font: { size: 12, color: '#2c3e50' },
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                bordercolor: '#bdc3c7',
                borderwidth: 1
            },
            margin: { l: 60, r: 30, t: 60, b: 60 },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white',
            hovermode: 'closest',
            autosize: true,
            height: 450,
            responsive: true
        };

        const config = {
            responsive: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
            displaylogo: false
        };

        try {
            Plotly.newPlot('powerCurvePlot', data, layout, config);
        } catch (e) {
            console.error('Error creating power curve plot:', e);
            document.getElementById('powerCurvePlot').innerHTML = '<p>Error creating plot. Please try adjusting parameters.</p>';
        }
    }

    createSampleDataPlot(params) {
        const { testType, n, effectSize, oneTailed } = params;
        
        const group1 = this.generateNormalData(n, 0, 1);
        let group2;
        
        if (testType === 'two_sample') {
            group2 = this.generateNormalData(n, effectSize, 1);
        } else if (testType === 'paired') {
            group2 = group1.map(x => x + effectSize + this.generateNormalData(1, 0, 0.1)[0]);
        } else {
            group2 = this.generateNormalData(n, effectSize, 1);
        }

        const data = [
            {
                y: group1,
                type: 'box',
                name: testType === 'one_sample' ? 'Sample Data' : 'Group 1',
                marker: { color: '#3498db' },
                boxpoints: 'outliers',
                jitter: 0.3,
                pointpos: -1.8
            }
        ];

        if (testType !== 'one_sample') {
            data.push({
                y: group2,
                type: 'box',
                name: testType === 'paired' ? 'Group 2 (Paired)' : 'Group 2',
                marker: { color: '#e74c3c' },
                boxpoints: 'outliers',
                jitter: 0.3,
                pointpos: 1.8
            });
        }

        const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
        const mean2 = testType !== 'one_sample' ? group2.reduce((a, b) => a + b, 0) / group2.length : effectSize;
        const sd1 = Math.sqrt(group1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (group1.length - 1));
        const sd2 = testType !== 'one_sample' ? Math.sqrt(group2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (group2.length - 1)) : 1;

        const annotations = [
            {
                x: 0.5,
                y: Math.max(...group1) + 0.5,
                text: `n = ${n}<br>Mean = ${mean1.toFixed(2)}<br>SD = ${sd1.toFixed(2)}`,
                showarrow: false,
                bgcolor: 'rgba(52, 152, 219, 0.9)',
                bordercolor: '#3498db',
                borderwidth: 1,
                font: { color: 'white', size: 11 }
            }
        ];

        if (testType !== 'one_sample') {
            annotations.push({
                x: 1.5,
                y: Math.max(...group2) + 0.5,
                text: `n = ${n}<br>Mean = ${mean2.toFixed(2)}<br>SD = ${sd2.toFixed(2)}`,
                showarrow: false,
                bgcolor: 'rgba(231, 76, 60, 0.9)',
                bordercolor: '#e74c3c',
                borderwidth: 1,
                font: { color: 'white', size: 11 }
            });
        }

        const layout = {
            title: {
                text: 'Sample Data Distribution with Summary Statistics',
                font: { size: 16, color: '#2c3e50' }
            },
            yaxis: { 
                title: 'Values',
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7'
            },
            xaxis: {
                showgrid: false,
                zeroline: false
            },
            showlegend: true,
            legend: { 
                x: 0.02, 
                y: 0.98,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                bordercolor: '#bdc3c7',
                borderwidth: 1
            },
            margin: { l: 80, r: 50, t: 80, b: 80 },
            autosize: true,
            height: 500,
            annotations: annotations,
            plot_bgcolor: '#f8f9fa',
            paper_bgcolor: '#ffffff'
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            modeBarButtonsToAdd: [{
                name: 'Download Plot',
                icon: Plotly.Icons.download,
                click: function() {
                    Plotly.downloadImage('sampleDataPlot', {format: 'png', filename: 'sample_data'});
                }
            }]
        };

        try {
            Plotly.newPlot('sampleDataPlot', data, layout, config);
        } catch (e) {
            console.error('Error creating sample data plot:', e);
            document.getElementById('sampleDataPlot').innerHTML = '<p>Error creating plot. Please try adjusting parameters.</p>';
        }
    }

    generateNormalData(n, mean, std) {
        const data = [];
        for (let i = 0; i < n; i++) {
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            data.push(mean + std * z);
        }
        return data;
    }

    generateRCode(params) {
        try {
            const { testType, n, effectSize, alpha, oneTailed, k, effectSizeAnova, predictors, r2, targetPower } = params;
            
            let rCode = `# Statistical Power Analysis
# Generated by Statistical Power Analysis Tool

# Load required packages
if (!require(pwr)) install.packages("pwr")
library(pwr)

# Parameters
n <- ${n}          # Sample size per group
d <- ${effectSize}          # Effect size (Cohen's d)
alpha <- ${alpha}    # Significance level
power_target <- ${targetPower}   # Target power
test_type <- "${testType}"      # Test type
direction <- "${oneTailed ? 'one-tailed' : 'two-tailed'}"  # Test direction

# Calculate power for current parameters
if (test_type == "two_sample") {
  power_result <- pwr.t.test(n = n, d = d, sig.level = alpha, 
                            type = "two.sample", alternative = direction)
} else if (test_type == "paired") {
  power_result <- pwr.t.test(n = n, d = d, sig.level = alpha, 
                            type = "paired", alternative = direction)
} else if (test_type == "anova") {
  power_result <- pwr.anova.test(k = k, f = ${effectSizeAnova}, sig.level = alpha, n = n)
} else if (test_type == "regression") {
  power_result <- pwr.f2.test(u = predictors, v = n - predictors - 1, f2 = ${r2} / (1 - ${r2}), sig.level = alpha)
} else {
  power_result <- pwr.t.test(n = n, d = d, sig.level = alpha, 
                            type = "one.sample", alternative = direction)
}

# Display results
cat("Power Analysis Results:\\n")
cat("=====================\\n")
cat("Sample size per group:", n, "\\n")
cat("Effect size (Cohen's d):", d, "\\n")
cat("Significance level (α):", alpha, "\\n")
cat("Test type:", test_type, "\\n")
cat("Test direction:", direction, "\\n")
cat("Computed power:", round(power_result$power, 4), "\\n")

# Calculate required sample size for target power
if (test_type == "two_sample") {
  sample_size_result <- pwr.t.test(d = d, sig.level = alpha, power = power_target,
                                  type = "two.sample", alternative = direction)
} else if (test_type == "paired") {
  sample_size_result <- pwr.t.test(d = d, sig.level = alpha, power = power_target,
                                  type = "paired", alternative = direction)
} else if (test_type == "anova") {
  sample_size_result <- pwr.anova.test(k = k, f = ${effectSizeAnova}, sig.level = alpha, power = power_target, n = n)
} else if (test_type == "regression") {
  sample_size_result <- pwr.f2.test(u = predictors, v = n - predictors - 1, f2 = ${r2} / (1 - ${r2}), sig.level = alpha, power = power_target)
} else {
  sample_size_result <- pwr.t.test(d = d, sig.level = alpha, power = power_target,
                                  type = "one.sample", alternative = direction)
}

cat("\\nRequired sample size for", power_target * 100, "% power:", ceiling(sample_size_result$n), "\\n")

# Power curve
n_range <- seq(10, 200, by = 10)
power_curve <- sapply(n_range, function(n) {
  if (test_type == "two_sample") {
    pwr.t.test(n = n, d = d, sig.level = alpha, type = "two.sample", 
               alternative = direction)$power
  } else if (test_type == "paired") {
    pwr.t.test(n = n, d = d, sig.level = alpha, type = "paired", 
               alternative = direction)$power
  } else if (test_type == "anova") {
    pwr.anova.test(k = k, f = ${effectSizeAnova}, sig.level = alpha, n = n)$power
  } else if (test_type == "regression") {
    pwr.f2.test(u = predictors, v = n - predictors - 1, f2 = ${r2} / (1 - ${r2}), sig.level = alpha)$power
  } else {
    pwr.t.test(n = n, d = d, sig.level = alpha, type = "one.sample", 
               alternative = direction)$power
  }
})

# Plot power curve
plot(n_range, power_curve, type = "l", col = "blue", lwd = 2,
     xlab = "Sample Size per Group", ylab = "Power (1-β)",
     main = "Power Curve")
abline(h = power_target, col = "red", lty = 2)
grid()`;

            document.getElementById('rCodeContent').textContent = rCode;
        } catch (e) {
            console.error('Error generating R code:', e);
            document.getElementById('rCodeContent').textContent = '# Error generating R code. Please try again.';
        }
    }

    copyRCode() {
        try {
            const rCode = document.getElementById('rCodeContent').textContent;
            if (!rCode || rCode.trim() === '') {
                alert('No R code available to copy');
                return;
            }
            
            navigator.clipboard.writeText(rCode).then(() => {
                const button = document.getElementById('copyRCode');
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                button.style.background = '#27ae60';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '#6c757d';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                const textArea = document.createElement('textarea');
                textArea.value = rCode;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    alert('Code copied to clipboard!');
                } catch (fallbackErr) {
                    alert('Failed to copy code. Please select and copy manually.');
                }
                document.body.removeChild(textArea);
            });
        } catch (e) {
            console.error('Error in copy function:', e);
            alert('Error copying code. Please try again.');
        }
    }

    showLoadingState() {
        const resultsContent = document.getElementById('powerResults');
        resultsContent.innerHTML = '<div class="loading">Calculating power...</div>';
        
        const plots = ['distributionPlot', 'powerCurvePlot', 'sampleDataPlot'];
        plots.forEach(plotId => {
            const plotElement = document.getElementById(plotId);
            if (plotElement) {
                plotElement.innerHTML = '<div class="loading">Generating plot...</div>';
            }
        });
    }

    hideLoadingState() {
    }

    handleTestTypeChange() {
        const testType = document.getElementById('testType').value;
        const ttestSettings = document.getElementById('ttestSettings');
        const anovaSettings = document.getElementById('anovaSettings');
        const regressionSettings = document.getElementById('regressionSettings');

        ttestSettings.style.display = 'none';
        anovaSettings.style.display = 'none';
        regressionSettings.style.display = 'none';

        if (testType === 'two_sample' || testType === 'paired') {
            ttestSettings.style.display = 'block';
        } else if (testType === 'anova') {
            anovaSettings.style.display = 'block';
        } else if (testType === 'regression') {
            regressionSettings.style.display = 'block';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PowerAnalysis();
});