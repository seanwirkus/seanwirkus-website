// ============================================
// MAIN POWER ANALYSIS APPLICATION
// UI Controller and Main Application Logic
// ============================================

class PowerAnalysis {
    constructor() {
        // Initialize modular components with error handling
        try {
            this.stats = new StatisticalFunctions();
            this.powerCalc = new PowerCalculations();
            this.plotManager = new PlotManager();
            console.log('Components initialized successfully');
        } catch (error) {
            console.error('Error initializing components:', error);
            // Try with window objects as fallback
            try {
                this.stats = new window.StatisticalFunctions();
                this.powerCalc = new window.PowerCalculations();
                this.plotManager = new window.PlotManager();
                console.log('Components initialized from window objects');
            } catch (fallbackError) {
                console.error('Failed to initialize components from window objects:', fallbackError);
                return;
            }
        }

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

        this.initializeTheme();
        this.initializeEventListeners();
        this.initializeTooltips();
        this.handleTestTypeChange();

        // Set initial slider values to defaults
        ['n','alpha','effectSize','targetPower','k','effectSizeAnova','predictors','r2'].forEach(id => {
            const el = document.getElementById(id);
            if (el && this.defaultValues[id] !== undefined) {
                el.value = this.defaultValues[id];
                this.updateSliderValue(el);
            }
        });

        // Delay initial calculation to ensure Plotly is fully loaded
        setTimeout(() => {
            this.calculatePower();
        }, 1000);
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

        // Input field event listeners
        const inputs = document.querySelectorAll('.slider-input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateFromInput(e.target);
                this.calculatePower();
            });
            input.addEventListener('change', (e) => {
                this.updateFromInput(e.target);
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

        // If present in DOM, wire a single reset button; otherwise ignore
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetToDefaults();
            });
        }

        // Theme toggle (optional)
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Preset selection
        document.getElementById('presetSelect').addEventListener('change', (e) => {
            this.applyPreset(e.target.value);
        });

        // Reset all button
        document.getElementById('resetAllBtn').addEventListener('click', () => {
            this.resetToDefaults();
        });

        // Find required sample size button
        document.getElementById('findSampleSize').addEventListener('click', () => {
            this.findRequiredSampleSize();
        });

        document.getElementById('copyRCode').addEventListener('click', () => {
            this.copyRCode();
        });

        document.getElementById('exportResults').addEventListener('click', () => {
            this.exportResults();
        });

        // Individual reset buttons
        document.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.dataset.target;
                this.resetIndividual(target);
            });
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
            
            // Add animation class
            valueDisplay.classList.add('updated');
            setTimeout(() => {
                valueDisplay.classList.remove('updated');
            }, 500);
        }
    }

    updateFromInput(input) {
        const sliderId = input.id.replace('Input', '');
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(sliderId + 'Value');
        
        if (!slider || !valueDisplay) return;

        let value = parseFloat(input.value);
        
        // Validate input value against slider constraints
        if (isNaN(value)) return;
        
        value = Math.max(parseFloat(slider.min), Math.min(parseFloat(slider.max), value));
        
        // Update slider value
        slider.value = value;
        
        // Update input value (in case it was clamped)
        input.value = value;
        
        // Update display value
        if (sliderId === 'alpha') {
            valueDisplay.textContent = value.toFixed(3);
        } else if (sliderId === 'targetPower' || sliderId === 'r2' || sliderId === 'effectSize') {
            valueDisplay.textContent = value.toFixed(2);
        } else {
            valueDisplay.textContent = value;
        }
        
        // Add animation class
        valueDisplay.classList.add('updated');
        setTimeout(() => {
            valueDisplay.classList.remove('updated');
        }, 500);
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

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const themeToggle = document.getElementById('themeToggle');
        if (savedTheme === 'light') {
            document.documentElement.classList.add('light-theme');
            if (themeToggle) themeToggle.textContent = '☀️ Light';
        } else if (themeToggle) {
            themeToggle.textContent = '🌙 Dark';
        }
    }

    initializeTooltips() {
        // Tooltips disabled to prevent layout issues
        return;
        
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

        // Reset input fields
        const inputs = document.querySelectorAll('.slider-input');
        inputs.forEach(input => {
            const sliderId = input.id.replace('Input', '');
            const defaultValue = this.defaultValues[sliderId];
            if (defaultValue !== undefined) {
                input.value = defaultValue;
            }
        });

        document.getElementById('oneTailed').checked = this.defaultValues.oneTailed;

        this.handleTestTypeChange();
        this.calculatePower();

        // Scroll to top of controls
        document.getElementById('controlsPanel').scrollTop = 0;
    }

    resetIndividual(target) {
        const defaultValue = this.defaultValues[target];
        if (defaultValue !== undefined) {
            const slider = document.getElementById(target);
            const input = document.getElementById(target + 'Input');
            
            if (slider) {
                slider.value = defaultValue;
                this.updateSliderValue(slider);
            }
            
            if (input) {
                input.value = defaultValue;
            }
            
            this.calculatePower();
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const themeToggle = document.getElementById('themeToggle');
        
        if (html.classList.contains('light-theme')) {
            html.classList.remove('light-theme');
            themeToggle.textContent = '🌙 Dark';
            localStorage.setItem('theme', 'dark');
        } else {
            html.classList.add('light-theme');
            themeToggle.textContent = '☀️ Light';
            localStorage.setItem('theme', 'light');
        }
    }

    applyPreset(preset) {
        if (!preset) return;

        const presets = {
            'conservative': {
                alpha: 0.01,
                targetPower: 0.9,
                effectSize: 0.8
            },
            'standard': {
                alpha: 0.05,
                targetPower: 0.8,
                effectSize: 0.8
            },
            'liberal': {
                alpha: 0.1,
                targetPower: 0.7,
                effectSize: 0.8
            },
            'small-effect': {
                effectSize: 0.2,
                alpha: 0.05,
                targetPower: 0.8
            },
            'medium-effect': {
                effectSize: 0.5,
                alpha: 0.05,
                targetPower: 0.8
            },
            'large-effect': {
                effectSize: 0.8,
                alpha: 0.05,
                targetPower: 0.8
            }
        };

        const presetValues = presets[preset];
        if (presetValues) {
            Object.entries(presetValues).forEach(([key, value]) => {
                const slider = document.getElementById(key);
                if (slider) {
                    slider.value = value;
                    this.updateSliderValue(slider);
                }
            });
            this.calculatePower();
        }

        // Reset the select to empty after applying
        document.getElementById('presetSelect').value = '';
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
            // Use modular power calculations
            if (params.testType === 'two_sample') {
                power = this.powerCalc.calculateTwoSampleTPower(params);
                df = 2 * params.n - 2;
                ncp = params.effectSize * Math.sqrt(params.n / 2);
                criticalValue = params.oneTailed ? this.stats.tInv(params.alpha, df) : this.stats.tInv(params.alpha / 2, df);
            } else if (params.testType === 'paired') {
                power = this.powerCalc.calculatePairedTPower(params);
                df = params.n - 1;
                ncp = params.effectSize * Math.sqrt(params.n);
                criticalValue = params.oneTailed ? this.stats.tInv(params.alpha, df) : this.stats.tInv(params.alpha / 2, df);
            } else if (params.testType === 'anova') {
                power = this.powerCalc.calculateANOVAPower(params);
                df = params.k - 1;
                ncp = params.effectSizeAnova * params.effectSizeAnova * params.n;
                criticalValue = this.stats.fInv(params.alpha, df, params.k * params.n - params.k);
            } else if (params.testType === 'regression') {
                power = this.powerCalc.calculateRegressionPower(params);
                df = params.predictors;
                ncp = params.r2 / (1 - params.r2) * params.n;
                criticalValue = this.stats.fInv(params.alpha, df, params.n - params.predictors - 1);
            } else {
                // one_sample
                power = this.powerCalc.calculateOneSampleTPower(params);
                df = params.n - 1;
                ncp = params.effectSize * Math.sqrt(params.n);
                criticalValue = params.oneTailed ? this.stats.tInv(params.alpha, df) : this.stats.tInv(params.alpha / 2, df);
            }

            // Debug for baseline verification
            if (params.n === 30 && params.alpha === 0.05 && params.effectSize === 0.5 && !params.oneTailed && params.testType === 'two_sample') {
                console.log('=== BASELINE VERIFICATION ===');
                console.log('Parameters:', { n: params.n, alpha: params.alpha, effectSize: params.effectSize, oneTailed: params.oneTailed });
                console.log('Calculations:', { df: df, ncp: ncp, criticalValue: criticalValue });
                console.log('Power result:', power);
                console.log('Expected: 0.4779');
                console.log('Difference:', Math.abs(power - 0.4779));
                console.log('===========================');
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
        this.plotManager.createDistributionPlot(params, power, criticalValue, df, ncp);
        this.plotManager.createPowerCurve(params, power);
        this.plotManager.createSampleDataPlot(params);
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

    findRequiredSampleSize() {
        const params = this.getParameters();
        const requiredN = this.calculateRequiredSampleSize(params);
        
        // Update the sample size slider and input
        const slider = document.getElementById('n');
        const input = document.getElementById('nInput');
        
        if (slider && input) {
            slider.value = requiredN;
            input.value = requiredN;
            this.updateSliderValue(slider);
            
            // Recalculate everything with the new sample size
            this.calculatePower();
            
            // Show a notification
            this.showNotification(`Required sample size set to ${requiredN} per group`, 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('sampleSizeNotification');
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
    }

    displayResults(params, power, criticalValue, df) {
        const { testType, n, alpha, effectSize, oneTailed, k, effectSizeAnova, predictors, r2, targetPower } = params;

        const validPower = isFinite(power) && !isNaN(power) ? power : 0.5;
        const powerPercent = (validPower * 100).toFixed(1);
        const alphaDisplay = alpha.toFixed(3);
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
                            <div class="error-value">${alphaDisplay}</div>
                            <div class="error-desc">False Positive - Rejecting H0 when it's true</div>
                        </div>
                        <div class="error-item type2">
                            <div class="error-label">Type II Error (β)</div>
                            <div class="error-value">${betaPercent}%</div>
                            <div class="error-desc">False Negative - Failing to reject H0 when it's false</div>
                        </div>
                        <div class="error-item power">
                            <div class="error-label">Power (1-β)</div>
                            <div class="error-value">${powerPercent}%</div>
                            <div class="error-desc">True Positive - Correctly rejecting H0 when it's false</div>
                        </div>
                        <div class="error-item specificity">
                            <div class="error-label">Specificity (1-α)</div>
                            <div class="error-value">${(100 - parseFloat(alphaPercent)).toFixed(1)}%</div>
                            <div class="error-desc">True Negative - Correctly accepting H0 when it's true</div>
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
                    <div class="parameter-item full-width">
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
                    name: 'Distributions',
                    line: { color: '#e74c3c', width: 2 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(231, 76, 60, 0.1)',
                    showlegend: true
                },
                {
                    x: fValues,
                    y: altDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Distributions',
                    line: { color: '#3498db', width: 2 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(52, 152, 219, 0.1)',
                    showlegend: false
                }
            ];

            data.push({
                x: [criticalValue, criticalValue],
                y: [0, Math.max(...nullDist)],
                type: 'scatter',
                mode: 'lines',
                name: 'Critical Value',
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
                    text: `Critical F = ${isNaN(criticalValue) ? '0.000' : criticalValue.toFixed(3)}<br>p = ${alpha.toFixed(4)}`,
                    showarrow: false,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                }
            ];

        } else {
            const tValues = Array.from({length: 200}, (_, i) => -6 + (i * 12 / 199));

            // Use normal approximation for clearer visualization
            const nullDist = tValues.map(t => this.normalPDF(t));
            const altDist = tValues.map(t => this.normalPDF(t - ncp));

            // Helper to create filled region traces
            const makeRegion = (xs, ys, predicate, name, color) => {
                const xr = [], yr = [];
                for (let i = 0; i < xs.length; i++) {
                    if (predicate(xs[i])) { xr.push(xs[i]); yr.push(ys[i]); }
                }
                if (xr.length === 0) return null;
                // add zero baselines at ends for proper fill
                const x0 = xr[0], x1 = xr[xr.length-1];
                return {
                    x: [x0, ...xr, x1],
                    y: [0, ...yr, 0],
                    type: 'scatter',
                    mode: 'lines',
                    name,
                    line: { width: 0 },
                    fill: 'toself',
                    fillcolor: color,
                    hoverinfo: 'skip',
                    showlegend: true
                };
            };

            data = [
                {
                    x: tValues,
                    y: nullDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Distributions',
                    line: { color: '#e74c3c', width: 2 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(231, 76, 60, 0.08)',
                    showlegend: true
                },
                {
                    x: tValues,
                    y: altDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Distributions',
                    line: { color: '#3498db', width: 2 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(52, 152, 219, 0.08)',
                    showlegend: false
                }
            ];

            if (oneTailed) {
                data.push({
                    x: [criticalValue, criticalValue],
                    y: [0, Math.max(...nullDist)],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Critical Value',
                    line: { color: '#f39c12', width: 2, dash: 'dash' },
                    showlegend: true
                });
            } else {
                data.push({
                    x: [criticalValue, criticalValue],
                    y: [0, Math.max(...nullDist)],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Critical Values',
                    line: { color: '#f39c12', width: 2, dash: 'dash' },
                    showlegend: true
                });
                data.push({
                    x: [-criticalValue, -criticalValue],
                    y: [0, Math.max(...nullDist)],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Critical Values',
                    line: { color: '#f39c12', width: 2, dash: 'dash' },
                    showlegend: false
                });

                // Add decision region fills with consolidated legend
                const alphaLeft = makeRegion(tValues, nullDist, (x)=> x < -criticalValue, 'Decision Regions', 'rgba(231, 76, 60, 0.25)');
                const alphaRight = makeRegion(tValues, nullDist, (x)=> x > criticalValue, 'Decision Regions', 'rgba(231, 76, 60, 0.25)');
                const betaRegion = makeRegion(tValues, altDist, (x)=> x >= -criticalValue && x <= criticalValue, 'Decision Regions', 'rgba(155, 89, 182, 0.25)');
                const powerLeft = makeRegion(tValues, altDist, (x)=> x < -criticalValue, 'Decision Regions', 'rgba(39, 174, 96, 0.25)');
                const powerRight = makeRegion(tValues, altDist, (x)=> x > criticalValue, 'Decision Regions', 'rgba(39, 174, 96, 0.25)');
                [alphaLeft, alphaRight, betaRegion, powerLeft, powerRight].forEach((tr, index) => { 
                    if (tr) {
                        tr.showlegend = index === 0; // Only show legend for first region
                        data.push(tr); 
                    }
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
                    text: `Critical t = ${isNaN(criticalValue) ? '0.00' : criticalValue.toFixed(2)}<br>p = ${alpha.toFixed(4)}`,
                    showarrow: false,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                });
                annotations.push({
                    x: -criticalValue,
                    y: Math.max(...nullDist) * 1.1,
                    text: `Critical t = ${isNaN(criticalValue) ? '0.00' : (-criticalValue).toFixed(2)}<br>p = ${alpha.toFixed(4)}`,
                    showarrow: false,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                });
            }

            // Add current parameters summary (simplified)
            const safeEffectSize = isNaN(effectSize) ? 0.5 : effectSize;
            const safeAlpha = isNaN(alpha) ? 0.05 : alpha;
            const safePower = isNaN(power) ? 0.8 : power;
            
            annotations.push({
                x: 0,
                y: Math.max(...nullDist) * 1.2,
                text: `n=${n}, α=${safeAlpha.toFixed(3)}, d=${safeEffectSize.toFixed(2)}<br>Power: ${(safePower * 100).toFixed(1)}%`,
                showarrow: false,
                bgcolor: 'rgba(44, 62, 80, 0.9)',
                bordercolor: '#2c3e50',
                borderwidth: 1,
                font: { color: 'white', size: 9 }
            });
        }

        const distributionType = testType === 'anova' || testType === 'regression' ? 'F-distribution' : 't-distribution';
        const xAxisTitle = testType === 'anova' || testType === 'regression' ? 'F-statistic' : 't-statistic';

        // Simplified annotations - remove extra callouts that might overlap
        // try {
        //     const powerText = `Power = ${(power).toFixed(3)}`;
        //     annotations.push({
        //         x: tValues ? 0 : criticalValue * 1.1,
        //         y: (testType === 'anova' || testType === 'regression') ? 0.05 : 0.05,
        //         text: powerText,
        //         showarrow: false,
        //         bgcolor: 'rgba(39, 174, 96, 0.9)',
        //         bordercolor: '#27ae60',
        //         borderwidth: 1,
        //         font: { color: 'white', size: 11 }
        //     });
        // } catch (e) {}

        const layout = {
            title: {
                text: `${testType === 'anova' || testType === 'regression' ? 'F-Distribution' : 't-Distribution'} with Test Decision Regions`,
                font: { size: 18, color: '#2c3e50', family: 'Arial, sans-serif' }
            },
            xaxis: {
                title: {
                    text: xAxisTitle,
                    font: { size: 14, color: '#2c3e50' }
                },
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7',
                tickfont: { size: 12, color: '#7f8c8d' },
                showgrid: true,
                autorange: true,
                rangemode: 'normal'
            },
            yaxis: {
                title: {
                    text: 'Density',
                    font: { size: 14, color: '#2c3e50' }
                },
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7',
                tickfont: { size: 12, color: '#7f8c8d' },
                showgrid: true,
                autorange: true,
                rangemode: 'tozero'
            },
            showlegend: true,
            legend: {
                x: 0.98,
                y: 0.98,
                xanchor: 'right',
                yanchor: 'top',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                bordercolor: '#bdc3c7',
                borderwidth: 1,
                font: { size: 11, color: '#2c3e50' }
            },
            margin: { l: 70, r: 40, t: 100, b: 70 },
            autosize: true,
            responsive: true,
            annotations: annotations,
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
            hovermode: 'x unified'
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
            }, {
                name: 'Autoscale',
                icon: Plotly.Icons.autoscale,
                click: function() {
                    Plotly.relayout('distributionPlot', {
                        'xaxis.autorange': true,
                        'yaxis.autorange': true
                    });
                }
            }]
        };

        try {
            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot('distributionPlot', data, layout, config);
            } else {
                console.error('Plotly is not loaded for distribution plot');
                document.getElementById('distributionPlot').innerHTML = '<p>Plotly library not loaded. Please refresh the page.</p>';
            }
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
        const { testType, n, alpha, oneTailed, k, effectSizeAnova, predictors, r2, effectSize, targetPower } = params;
        
        const recommendedPower = targetPower;
        const sampleSizes = [];
        for (let i = 0; i < 150; i++) {
            if (i < 30) {
                // More points at smaller sample sizes where power changes dramatically
                sampleSizes.push(5 + i * 3); // 5, 8, 11, ..., 92
            } else if (i < 80) {
                // Medium range
                sampleSizes.push(90 + (i - 30) * 5); // 95, 100, 105, ..., 430
            } else {
                // Larger range with fewer points
                sampleSizes.push(430 + (i - 80) * 10); // 440, 450, ..., 1000
            }
        }

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
                mode: 'lines+markers',
                name: 'Power Curve',
                line: { 
                    color: '#3498db', 
                    width: 3,
                    shape: 'spline',
                    smoothing: 1.5
                },
                marker: {
                    size: 0,
                    opacity: 0
                },
                fill: 'tozeroy',
                fillcolor: 'rgba(52, 152, 219, 0.1)',
                hovertemplate: 'Sample Size: %{x}<br>Power: %{y:.1%}<extra></extra>',
                connectgaps: true
            },
            {
                x: [sampleSizes[0], sampleSizes[sampleSizes.length - 1]],
                y: [recommendedPower, recommendedPower],
                type: 'scatter',
                mode: 'lines',
                name: 'Recommended Power (80%)',
                line: { 
                    color: '#e74c3c', 
                    width: 2, 
                    dash: 'dash'
                },
                hovertemplate: 'Recommended: %{y:.0%}<extra></extra>',
                showlegend: true
            },
            {
                x: [n],
                y: [currentPower],
                type: 'scatter',
                mode: 'markers+text',
                name: 'Current Sample Size',
                marker: {
                    color: '#27ae60',
                    size: 12,
                    symbol: 'diamond',
                    line: { color: '#229954', width: 2 }
                },
                text: [`n=${n}<br>${(currentPower*100).toFixed(1)}%`],
                textposition: 'top center',
                textfont: { size: 11, color: '#27ae60' },
                hovertemplate: 'Current: n=%{x}, Power=%{y:.1%}<extra></extra>',
                showlegend: true
            }
        ];

        // Add vertical line at current sample size
        data.push({
            x: [n, n],
            y: [0, currentPower],
            type: 'scatter',
            mode: 'lines',
            name: 'Current n',
            line: { 
                color: '#e74c3c', 
                width: 2, 
                dash: 'dash',
                opacity: 0.6
            },
            showlegend: false
        });

        const layout = {
            title: {
                text: 'Statistical Power Curve',
                font: { size: 18, color: '#2c3e50', family: 'Arial, sans-serif' }
            },
            xaxis: {
                title: {
                    text: 'Sample Size (n)',
                    font: { size: 14, color: '#2c3e50' }
                },
                tickfont: { size: 12, color: '#7f8c8d' },
                gridcolor: '#ecf0f1',
                zeroline: false,
                showgrid: true,
                type: 'linear',
                autorange: true,
                rangemode: 'tozero'
            },
            yaxis: {
                title: {
                    text: 'Statistical Power (1-β)',
                    font: { size: 14, color: '#2c3e50' }
                },
                tickfont: { size: 12, color: '#7f8c8d' },
                gridcolor: '#ecf0f1',
                zeroline: false,
                tickformat: '.0%',
                showgrid: true,
                autorange: true,
                rangemode: 'tozero',
                range: [0, Math.max(1.0, Math.max(...powers) * 1.1)] // Ensure we see the full curve
            },
            legend: {
                font: { size: 12, color: '#2c3e50' },
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#bdc3c7',
                borderwidth: 1,
                x: 0.02,
                y: 0.98
            },
            margin: { l: 70, r: 40, t: 80, b: 70 },
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
            hovermode: 'x unified',
            autosize: true,
            responsive: true
        };

        const config = {
            responsive: true,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
            displaylogo: false,
            modeBarButtonsToAdd: [{
                name: 'Autoscale',
                icon: Plotly.Icons.autoscale,
                click: function() {
                    Plotly.relayout('powerCurvePlot', {
                        'xaxis.autorange': true,
                        'yaxis.autorange': true
                    });
                }
            }]
        };

        try {
            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot('powerCurvePlot', data, layout, config);
            } else {
                console.error('Plotly is not loaded for power curve');
                document.getElementById('powerCurvePlot').innerHTML = '<p>Plotly library not loaded. Please refresh the page.</p>';
            }
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

        // Create individual data points for jittered scatter plot
        const scatterData = [];
        group1.forEach((value, index) => {
            scatterData.push({
                x: testType === 'one_sample' ? 'Sample' : 'Group 1',
                y: value,
                type: 'scatter',
                mode: 'markers',
                name: testType === 'one_sample' ? 'Sample Data' : 'Group 1',
                marker: {
                    color: '#3498db',
                    size: 6,
                    opacity: 0.6,
                    symbol: 'circle'
                },
                showlegend: false,
                xaxis: 'x',
                yaxis: 'y'
            });
        });

        if (testType !== 'one_sample') {
            group2.forEach((value, index) => {
                scatterData.push({
                    x: testType === 'paired' ? 'Group 2 (Paired)' : 'Group 2',
                    y: value,
                    type: 'scatter',
                    mode: 'markers',
                    name: testType === 'paired' ? 'Group 2 (Paired)' : 'Group 2',
                    marker: {
                        color: '#e74c3c',
                        size: 6,
                        opacity: 0.6,
                        symbol: 'circle'
                    },
                    showlegend: false,
                    xaxis: 'x',
                    yaxis: 'y'
                });
            });
        }

        const data = [
            // Box plots
            {
                y: group1,
                type: 'box',
                name: testType === 'one_sample' ? 'Sample Data' : 'Group 1',
                marker: {
                    color: '#3498db',
                    outliercolor: '#2980b9'
                },
                boxpoints: false, // Hide individual points since we have scatter
                line: { color: '#2980b9', width: 2 },
                fillcolor: 'rgba(52, 152, 219, 0.3)',
                showlegend: true
            }
        ];

        if (testType !== 'one_sample') {
            data.push({
                y: group2,
                type: 'box',
                name: testType === 'paired' ? 'Group 2 (Paired)' : 'Group 2',
                marker: {
                    color: '#e74c3c',
                    outliercolor: '#c0392b'
                },
                boxpoints: false,
                line: { color: '#c0392b', width: 2 },
                fillcolor: 'rgba(231, 76, 60, 0.3)',
                showlegend: true
            });
        }

        // Add scatter points
        data.push(...scatterData);

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
                text: 'Sample Data Visualization',
                font: { size: 18, color: '#2c3e50', family: 'Arial, sans-serif' },
                subtitle: {
                    text: testType === 'one_sample' ? 'Single sample data' : `Two groups with effect size = ${isNaN(effectSize) ? '0.50' : effectSize.toFixed(2)}`,
                    font: { size: 12, color: '#7f8c8d' }
                }
            },
            yaxis: {
                title: {
                    text: 'Value',
                    font: { size: 14, color: '#2c3e50' }
                },
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7',
                tickfont: { size: 12, color: '#7f8c8d' },
                autorange: true,
                rangemode: 'normal'
            },
            xaxis: {
                title: {
                    text: 'Group',
                    font: { size: 14, color: '#2c3e50' }
                },
                showgrid: false,
                zeroline: false,
                tickfont: { size: 12, color: '#7f8c8d' },
                autorange: true,
                rangemode: 'normal'
            },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#bdc3c7',
                borderwidth: 1,
                font: { size: 12, color: '#2c3e50' }
            },
            margin: { l: 70, r: 40, t: 100, b: 70 },
            autosize: true,
            responsive: true,
            plot_bgcolor: 'transparent',
            paper_bgcolor: 'transparent',
            boxmode: 'group',
            boxgap: 0.2,
            boxgroupgap: 0.1
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
            }, {
                name: 'Autoscale',
                icon: Plotly.Icons.autoscale,
                click: function() {
                    Plotly.relayout('sampleDataPlot', {
                        'xaxis.autorange': true,
                        'yaxis.autorange': true
                    });
                }
            }]
        };

        try {
            if (typeof Plotly !== 'undefined') {
                Plotly.newPlot('sampleDataPlot', data, layout, config);
            } else {
                console.error('Plotly is not loaded for sample data plot');
                document.getElementById('sampleDataPlot').innerHTML = '<p>Plotly library not loaded. Please refresh the page.</p>';
            }
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

            let rCode = `# R code to replicate this power analysis
library(pwr)
library(ggplot2)

# Parameters
n <- ${n} # Sample size per group
d <- ${effectSize} # Effect size (Cohen's d)
alpha <- ${alpha} # Significance level
alternative <- "${oneTailed ? 'one.sided' : 'two.sided'}" # Test direction

# 1. Calculate power
power_result <- pwr.t.test(n = n, d = d, sig.level = alpha, type = "two.sample", alternative = alternative)
print(power_result)

# 2. Generate sample data for visualization
set.seed(123) # For reproducibility
group1 <- rnorm(n, mean = 0, sd = 1)
group2 <- rnorm(n, mean = d, sd = 1)
data <- data.frame(
  value = c(group1, group2),
  group = factor(rep(c("Group 1", "Group 2"), each = n))
)

# 3. Create boxplot with jittered points
ggplot(data, aes(x = group, y = value, fill = group)) +
  geom_boxplot(alpha = 0.7, outlier.shape = NA) +
  geom_jitter(width = 0.2, alpha = 0.5) +
  labs(title = "Sample Data Visualization",
       subtitle = paste0("Two groups with d = ", d),
       x = "Group", y = "Value") +
  theme_minimal() +
  theme(legend.position = "none")

# 4. Create power curve
n_range <- seq(2, max(100, 3*n), by = 1)
power_values <- sapply(n_range, function(n_val) {
  pwr.t.test(n = n_val, d = d, sig.level = alpha, 
            type = "two.sample", alternative = alternative)$power
})

power_df <- data.frame(n = n_range, power = power_values)
ggplot(power_df, aes(x = n, y = power)) +
  geom_line(color = "#3498db", linewidth = 1.5) +
  geom_hline(yintercept = 0.8, linetype = "dashed", color = "#e74c3c") +
  annotate("point", x = n, y = power_result$power, color = "red", size = 4) +
  labs(title = "Power Curve", x = "Sample Size (n)", y = "Power (1-β)") +
  theme_minimal()`;

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

    exportResults() {
        try {
            const params = this.getParameters();
            const results = this.calculatePowerForExport(params);
            
            const exportData = {
                timestamp: new Date().toISOString(),
                parameters: params,
                results: results,
                version: '1.0'
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `power-analysis-results-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show success message
            const button = document.getElementById('exportResults');
            const originalText = button.textContent;
            button.textContent = 'Exported!';
            button.style.background = '#27ae60';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#6c757d';
            }, 2000);
            
        } catch (e) {
            console.error('Error exporting results:', e);
            alert('Error exporting results. Please try again.');
        }
    }

    calculatePowerForExport(params) {
        // This is a simplified version for export - returns key results
        try {
            let power = 0;
            const { testType, n, alpha, effectSize, oneTailed, k, effectSizeAnova, predictors, r2, targetPower } = params;
            
            if (testType === 'two_sample') {
                power = this.calculateTwoSamplePower(n, effectSize, alpha, oneTailed);
            } else if (testType === 'paired') {
                power = this.calculatePairedPower(n, effectSize, alpha, oneTailed);
            } else if (testType === 'anova') {
                power = this.calculateAnovaPower(n, k, effectSizeAnova, alpha);
            } else if (testType === 'regression') {
                power = this.calculateRegressionPower(n, predictors, r2, alpha);
            }
            
            return {
                power: power,
                requiredSampleSize: this.calculateRequiredSampleSize(params),
                effectSize: effectSize,
                alpha: alpha,
                testType: testType
            };
        } catch (e) {
            return { error: 'Calculation failed' };
        }
    }

    showLoadingState() {
        const resultsContent = document.getElementById('powerResults');
        resultsContent.innerHTML = '';
        const plots = ['distributionPlot', 'powerCurvePlot', 'sampleDataPlot'];
        plots.forEach(plotId => {
            const plotElement = document.getElementById(plotId);
            if (plotElement) {
                plotElement.innerHTML = '';
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
