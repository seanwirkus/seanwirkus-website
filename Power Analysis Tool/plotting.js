// ============================================
// PLOTTING MODULE
// Graph generation and visualization
// ============================================

class PlotManager {
    constructor() {
        this.stats = new StatisticalFunctions();
        this.powerCalc = new PowerCalculations();
    }

    // Create distribution plot
    createDistributionPlot(params, power, criticalValue, df, ncp) {
        const { testType, alpha, effectSize, oneTailed, k, effectSizeAnova, predictors, r2 } = params;

        let data = [
            {
                x: [params.n, params.n],
                y: [0, power],
                type: 'scatter',
                mode: 'lines',
                name: 'Current Sample Size Line',
                line: {
                    color: '#3498db',
                    width: 2,
                    dash: 'dot'
                },
                hovertemplate: 'Current Sample Size: %{x}<extra></extra>',
                showlegend: false
            },
            {
                x: [params.n],
                y: [power],
                type: 'scatter',
                mode: 'markers+text',
                name: 'Current Power',
                marker: {
                    color: '#3498db',
                    size: 18,
                    symbol: 'circle-open',
                    line: { color: '#3498db', width: 4 }
                },
                text: [`${(power * 100).toFixed(1)}%`],
                textposition: 'top center',
                textfont: { size: 14, color: '#3498db', weight: 'bold' },
                hovertemplate: 'Current Sample Size: %{x}<br>Current Power: %{y:.1%}<br><b>This is your current setting!</b><extra></extra>',
                showlegend: true
            }
        ];

        let annotations = [];

        if (testType === 'anova' || testType === 'regression') {
            // F-distribution plot
            const fValues = Array.from({length: 250}, (_, i) => i * 0.15); // Extended range for full visibility

            // Generate F-distribution data (simplified approximation)
            const nullDist = fValues.map(f => {
                // Simplified F-distribution approximation
                if (f <= 0) return 0;
                return Math.exp(-f/2) / Math.sqrt(f);
            });

            const altDist = fValues.map(f => {
                // Non-central F-distribution approximation
                if (f <= 0) return 0;
                const shift = ncp / (df + 1);
                const fShifted = Math.max(0, f - shift);
                return Math.exp(-fShifted/2) / Math.sqrt(fShifted) * 0.8;
            });

            // Normalize
            const maxNull = Math.max(...nullDist);
            const maxAlt = Math.max(...altDist);
            const scale = Math.max(maxNull, maxAlt);

            data = [
                {
                    x: fValues,
                    y: nullDist.map(y => y / scale),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Null Distribution (H0)',
                    line: { color: '#e74c3c', width: 3 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(231, 76, 60, 0.08)',
                    showlegend: true
                },
                {
                    x: fValues,
                    y: altDist.map(y => y / scale),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Alternative Distribution (H1)',
                    line: { color: '#3498db', width: 3 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(52, 152, 219, 0.08)',
                    showlegend: true
                }
            ];

            data.push({
                x: [criticalValue, criticalValue],
                y: [0, Math.max(...nullDist) / scale],
                type: 'scatter',
                mode: 'lines',
                name: 'Critical Value',
                line: { color: '#f39c12', width: 2, dash: 'dash' }
            });

            annotations = [
                {
                    x: criticalValue * 0.5,
                    y: Math.max(...nullDist) / scale * 0.8,
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
                    y: Math.max(...altDist) / scale * 0.7,
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
                }
            ];
        } else {
            // t-distribution plot
            const tValues = Array.from({length: 300}, (_, i) => -8 + (i * 16 / 299)); // Extended range for full visibility

            // Use normal PDF for proper bell-shaped curves
            const nullDist = tValues.map(t => this.stats.normalPDF(t));
            const altDist = tValues.map(t => this.stats.normalPDF(t - ncp));

            data = [
                {
                    x: tValues,
                    y: nullDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Null Distribution (H0)',
                    line: { color: '#e74c3c', width: 3 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(231, 76, 60, 0.08)',
                    showlegend: true
                },
                {
                    x: tValues,
                    y: altDist,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Alternative Distribution (H1)',
                    line: { color: '#3498db', width: 3 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(52, 152, 219, 0.08)',
                    showlegend: true
                }
            ];

            if (oneTailed) {
                data.push({
                    x: [criticalValue, criticalValue],
                    y: [0, Math.max(...nullDist) * 1.1],
                    type: 'scatter',
                    mode: 'lines',
                    name: `Critical Value (α = ${alpha})`,
                    line: { color: '#f39c12', width: 3, dash: 'dash' },
                    showlegend: true
                });
                // Add critical value annotation
                annotations.push({
                    x: criticalValue,
                    y: Math.max(...nullDist) * 1.05,
                    text: `Critical Value<br>t = ${criticalValue.toFixed(2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#f39c12',
                    arrowwidth: 2,
                    ax: 0,
                    ay: -40,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                });
            } else {
                data.push({
                    x: [criticalValue, criticalValue],
                    y: [0, Math.max(...nullDist) * 1.1],
                    type: 'scatter',
                    mode: 'lines',
                    name: `Critical Values (±${criticalValue.toFixed(2)})`,
                    line: { color: '#f39c12', width: 3, dash: 'dash' },
                    showlegend: true
                });
                data.push({
                    x: [-criticalValue, -criticalValue],
                    y: [0, Math.max(...nullDist) * 1.1],
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Critical Values',
                    line: { color: '#f39c12', width: 3, dash: 'dash' },
                    showlegend: false
                });
                // Add critical value annotations
                annotations.push({
                    x: criticalValue,
                    y: Math.max(...nullDist) * 1.05,
                    text: `+t = ${criticalValue.toFixed(2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#f39c12',
                    arrowwidth: 2,
                    ax: 20,
                    ay: -30,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
                });
                annotations.push({
                    x: -criticalValue,
                    y: Math.max(...nullDist) * 1.05,
                    text: `-t = ${(-criticalValue).toFixed(2)}`,
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#f39c12',
                    arrowwidth: 2,
                    ax: -20,
                    ay: -30,
                    bgcolor: 'rgba(243, 156, 18, 0.9)',
                    bordercolor: '#f39c12',
                    borderwidth: 1,
                    font: { color: 'white', size: 10 }
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
                    y: Math.max(...nullDist) * 1.2,
                    text: `n=${n}, α=${alpha.toFixed(3)}, d=${isNaN(effectSize) ? '0.50' : effectSize.toFixed(2)}<br>Power: ${(power * 100).toFixed(1)}%`,
                    showarrow: false,
                    bgcolor: 'rgba(44, 62, 80, 0.9)',
                    bordercolor: '#2c3e50',
                    borderwidth: 1,
                    font: { color: 'white', size: 9 }
                }
            ];
        }

        const distributionType = testType === 'anova' || testType === 'regression' ? 'F-distribution' : 't-distribution';
        const xAxisTitle = testType === 'anova' || testType === 'regression' ? 'F-statistic' : 't-statistic';

        const layout = {
            title: {
                text: `${distributionType} with Test Decision Regions`,
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
                range: testType === 'anova' || testType === 'regression' ? [0, 15] : [-8, 8], // Ensure full visibility of both curves
                autorange: false
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
                range: [0, 1.1]
            },
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                bordercolor: '#bdc3c7',
                borderwidth: 1,
                font: { size: 11, color: '#2c3e50' }
            },
            margin: { l: 60, r: 40, t: 80, b: 60 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: true,
            annotations: annotations
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

        Plotly.newPlot('distributionPlot', data, layout, config);
    }

    // Create power curve plot
    createPowerCurve(params, currentPower) {
        const { testType, n, alpha, effectSize, oneTailed, k, effectSizeAnova, predictors, r2, targetPower } = params;

        // First get an approximate recommended n with analytic formula as a starting point
        const recommendedN = this.powerCalc.calculateRequiredSampleSize({
            alpha,
            effectSize,
            targetPower,
            oneTailed,
            testType,
            k: k || 3,
            predictors: predictors || 1,
            r2: r2 || 0.1
        });

        // Generate sample sizes focused around the recommended n
        const sampleSizes = [];
        const minN = Math.max(2, Math.floor(recommendedN * 0.1)); // Start from 10% of recommended n, minimum 2
        const maxN = Math.ceil(recommendedN * 2.5); // Go up to 2.5x recommended n

        // Dense sampling around recommended n
        for (let i = 0; i <= 150; i++) {
            if (i < 30) {
                // Fine sampling from minN to recommendedN
                const ratio = i / 29;
                const sampleN = Math.round(minN + (recommendedN - minN) * ratio);
                if (!sampleSizes.includes(sampleN)) sampleSizes.push(sampleN);
            } else if (i < 100) {
                // Medium sampling from recommendedN to recommendedN*1.5
                const ratio = (i - 30) / 69;
                const sampleN = Math.round(recommendedN + (recommendedN * 0.5) * ratio);
                if (!sampleSizes.includes(sampleN)) sampleSizes.push(sampleN);
            } else {
                // Coarse sampling from recommendedN*1.5 to maxN
                const ratio = (i - 100) / 50;
                const sampleN = Math.round(recommendedN * 1.5 + (maxN - recommendedN * 1.5) * ratio);
                if (!sampleSizes.includes(sampleN)) sampleSizes.push(sampleN);
            }
        }

        // Ensure we have the exact recommended n in the array
        if (!sampleSizes.includes(recommendedN)) {
            sampleSizes.push(recommendedN);
            sampleSizes.sort((a, b) => a - b);
        }

        // Ensure we have the current sample size n in the array for intersection
        if (!sampleSizes.includes(n)) {
            sampleSizes.push(n);
            sampleSizes.sort((a, b) => a - b);
        }

        // Compute power for each sample size using PowerCalculations, clip to [0,1]
        const powersRaw = sampleSizes.map(sampleN => {
            try {
                let df, ncp;
                if (testType === 'anova') {
                    df = k - 1;
                    ncp = effectSizeAnova * effectSizeAnova * sampleN;
                    const criticalValue = this.stats.fInv(alpha, df, Math.max(1, sampleN - df - 1));
                    return this.powerCalc.calculateFPower(criticalValue, df, Math.max(1, sampleN - df - 1), ncp);
                } else if (testType === 'regression') {
                    df = predictors;
                    ncp = r2 / (1 - r2) * sampleN;
                    const criticalValue = this.stats.fInv(alpha, df, Math.max(1, sampleN - df - 1));
                    return this.powerCalc.calculateFPower(criticalValue, df, Math.max(1, sampleN - df - 1), ncp);
                } else {
                    df = testType === 'paired' ? sampleN - 1 : 2 * sampleN - 2;
                    ncp = effectSize * Math.sqrt(sampleN / 2);
                    let criticalValue;
                    if (oneTailed) {
                        criticalValue = this.stats.tInv(alpha, df);
                    } else {
                        criticalValue = this.stats.tInv(alpha / 2, df);
                    }
                    return this.powerCalc.calculateNonCentralTPower(criticalValue, df, ncp);
                }
            } catch (e) {
                return 0; // treat failures as zero power for plotting
            }
        });

        // Compute recommended power at the exactRecommendedN (must run before mapping powersRaw)
        let recommendedPower = targetPower;
        try {
            if (recommendedN > 0) {
                if (testType === 'anova') {
                    const df = k - 1;
                    const ncp = effectSizeAnova * effectSizeAnova * recommendedN;
                    const criticalValue = this.stats.fInv(alpha, df, Math.max(1, recommendedN - df - 1));
                    recommendedPower = this.powerCalc.calculateFPower(criticalValue, df, Math.max(1, recommendedN - df - 1), ncp);
                } else if (testType === 'regression') {
                    const df = predictors;
                    const ncp = r2 / (1 - r2) * recommendedN;
                    const criticalValue = this.stats.fInv(alpha, df, Math.max(1, recommendedN - df - 1));
                    recommendedPower = this.powerCalc.calculateFPower(criticalValue, df, Math.max(1, recommendedN - df - 1), ncp);
                } else {
                    const df = testType === 'paired' ? recommendedN - 1 : 2 * recommendedN - 2;
                    const ncp = effectSize * Math.sqrt(recommendedN / 2);
                    const criticalValue = oneTailed ? this.stats.tInv(alpha, df) : this.stats.tInv(alpha / 2, df);
                    recommendedPower = this.powerCalc.calculateNonCentralTPower(criticalValue, df, ncp);
                }
            }
        } catch (e) {
            recommendedPower = targetPower;
        }

        // Ensure numeric and selectively clipped based on sample size relative to recommended
        // Power curve: monotonic, capped at 100% only at/after recommendedN
        let maxPowerReached = false;
        const powers = powersRaw.map((p, index) => {
            const sampleN = sampleSizes[index];
            let power = Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
            // Force intersection at current sample size
            if (sampleN === n) {
                power = currentPower;
            }
            // Force intersection at required sample size
            if (sampleN === recommendedN) {
                power = recommendedPower;
            }
            // Cap at 100% for n > required
            if (sampleN > recommendedN) {
                power = 1.0;
            }
            return power;
        });

        // Start curve from minimum sample size with 0% power for visual effect
        const minSampleSize = Math.min(...sampleSizes);
        if (minSampleSize > 2) {
            sampleSizes.unshift(2);
            powers.unshift(0);
        }

        // Ensure arrays are sorted after modifications
        // Create a combined array of [sampleSize, power] pairs, sort by sampleSize, then split back
        const combined = sampleSizes.map((size, index) => ({ size, power: powers[index] }));
        combined.sort((a, b) => a.size - b.size);
        for (let i = 0; i < combined.length; i++) {
            sampleSizes[i] = combined[i].size;
            powers[i] = combined[i].power;
        }

        // Enforce monotonic non-decreasing power values and exact intersections
        // (Set exact points for current and recommended sample sizes, then remove dips)
        const currentIndex = sampleSizes.indexOf(n);
        const recommendedIndex = sampleSizes.indexOf(recommendedN);

        if (currentIndex !== -1) {
            powers[currentIndex] = currentPower;
        }
        if (recommendedIndex !== -1) {
            powers[recommendedIndex] = recommendedPower;
        }

        // Sweep left-to-right enforcing non-decreasing sequence
        for (let i = 1; i < powers.length; i++) {
            if (powers[i] < powers[i - 1]) {
                powers[i] = powers[i - 1];
            }
        }

        // Ensure values after recommendedIndex are at least recommendedPower and capped at 1
        if (recommendedIndex !== -1) {
            for (let i = recommendedIndex + 1; i < powers.length; i++) {
                if (powers[i] < powers[i - 1]) powers[i] = powers[i - 1];
                if (powers[i] < recommendedPower) powers[i] = recommendedPower;
                if (powers[i] > 1) powers[i] = 1;
            }
        }

        const data = [
            {
                x: sampleSizes,
                y: powers,
                type: 'scatter',
                mode: 'lines',
                name: 'Power Curve',
                line: {
                    color: '#3498db',
                    width: 5,
                    shape: 'linear'
                },
                fill: 'tozeroy',
                fillcolor: 'rgba(52, 152, 219, 0.15)',
                hovertemplate: 'Sample Size: %{x}<br>Power: %{y:.1%}<extra></extra>',
                connectgaps: true,
                showlegend: true
            },
            {
                x: [0, Math.max(...sampleSizes)],
                y: [targetPower, targetPower],
                type: 'scatter',
                mode: 'lines',
                name: `Target Power (${(targetPower * 100).toFixed(0)}%)`,
                line: {
                    color: '#e74c3c',
                    width: 4,
                    dash: 'dot'
                },
                hovertemplate: 'Target Power: %{y:.0%}<extra></extra>',
                showlegend: true
            },
            {
                x: [recommendedN, recommendedN],
                y: [0, recommendedPower],
                type: 'scatter',
                mode: 'lines',
                name: `Required n (per group) = ${recommendedN}`,
                line: {
                    color: '#f39c12',
                    width: 4,
                    dash: 'solid'
                },
                hovertemplate: 'Required Sample Size: %{x}<br>Power: %{y:.1%}<extra></extra>',
                showlegend: true
            },
            {
                x: [recommendedN],
                y: [recommendedPower],
                type: 'scatter',
                mode: 'markers+text',
                name: 'Required Point',
                marker: {
                    color: '#f39c12',
                    size: 14,
                    symbol: 'star',
                    line: { color: '#e67e22', width: 3 }
                },
                text: [`Required n=${recommendedN}<br>${(recommendedPower * 100).toFixed(1)}%`],
                textposition: 'top center',
                textfont: { size: 11, color: '#f39c12', weight: 'bold' },
                hovertemplate: 'Recommended n: %{x}<br>Power: %{y:.1%}<extra></extra>',
                showlegend: false
            },
            {
                x: [n, n],
                y: [0, currentPower],
                type: 'scatter',
                mode: 'lines',
                name: 'Current Sample Size Line',
                line: {
                    color: '#3498db',
                    width: 2,
                    dash: 'dot'
                },
                hovertemplate: 'Current Sample Size: %{x}<extra></extra>',
                showlegend: false
            },
            {
                x: [n],
                y: [currentPower],
                type: 'scatter',
                mode: 'markers+text',
                name: 'Current Power',
                marker: {
                    color: '#3498db',
                    size: 18,
                    symbol: 'circle-open',
                    line: { color: '#3498db', width: 4 }
                },
                text: [`${(currentPower * 100).toFixed(1)}%`],
                textposition: 'top center',
                textfont: { size: 14, color: '#3498db', weight: 'bold' },
                hovertemplate: 'Current Sample Size: %{x}<br>Current Power: %{y:.1%}<br><b>This is your current setting!</b><extra></extra>',
                showlegend: true
            }
        ];

        // If recommendedN is outside sampleSizes, add it to arrays for consistent plotting
        if (!sampleSizes.includes(recommendedN)) {
            // insert sorted
            const idx = sampleSizes.findIndex(s => s > recommendedN);
            if (idx === -1) {
                sampleSizes.push(recommendedN);
                powers.push(recommendedPower);
            } else {
                sampleSizes.splice(idx, 0, recommendedN);
                powers.splice(idx, 0, recommendedPower);
            }
        }

        // Add annotation near the recommended point (will attach after layout is defined)
            const _recommendedAnnotation = {
            x: recommendedN,
            y: recommendedPower,
            xanchor: 'center',
            yanchor: 'bottom',
            text: `Required n (per group) = ${recommendedN}\nPower ${(recommendedPower * 100).toFixed(1)}%`,
            showarrow: true,
            arrowhead: 3,
            ax: 0,
            ay: -40,
            bgcolor: 'rgba(243, 156, 18, 0.95)',
            bordercolor: '#f39c12',
            font: { color: 'white', size: 11 }
        };

        const layout = {
            title: {
                text: 'Power Curve: Sample Size vs Statistical Power',
                font: { size: 18, color: '#2c3e50', family: 'Arial, sans-serif' }
            },
            xaxis: {
                title: {
                    text: 'Sample Size (n)',
                    font: { size: 14, color: '#2c3e50' }
                },
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7',
                tickfont: { size: 12, color: '#7f8c8d' },
                showgrid: true,
                range: [0, Math.max(...sampleSizes)],
                autorange: false
            },
            yaxis: {
                title: {
                    text: 'Statistical Power (1-β)',
                    font: { size: 15, color: '#2c3e50', weight: 'bold' }
                },
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7',
                zerolinewidth: 2,
                tickfont: { size: 12, color: '#7f8c8d' },
                tickformat: '.0%',
                showgrid: true,
                gridwidth: 1,
                range: [0, 1],
                autorange: false,
                rangemode: 'tozero'
            },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                xanchor: 'left',
                yanchor: 'top',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                bordercolor: '#bdc3c7',
                borderwidth: 1,
                font: { size: 11, color: '#2c3e50' }
            },
            margin: { l: 70, r: 40, t: 80, b: 70 },
            autosize: true,
            responsive: true,
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
                    Plotly.downloadImage('powerCurvePlot', {format: 'png', filename: 'power_curve'});
                }
            }, {
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

        Plotly.newPlot('powerCurvePlot', data, layout, config);
        // push annotation after layout exists
        if (_recommendedAnnotation) {
            if (!layout.annotations) layout.annotations = [];
            layout.annotations.push(_recommendedAnnotation);
            // update plot to show annotation
            Plotly.relayout('powerCurvePlot', { annotations: layout.annotations });
        }
    }

    // Helper methods for power calculations (same as in PowerCalculations)
    calculateNonCentralTPower(criticalT, df, ncp) {
        const power1 = 1 - this.stats.normalCDF(criticalT - ncp);
        const power2 = this.stats.normalCDF(-criticalT - ncp);
        const power = power1 + power2;

        return Math.max(0, Math.min(1, power));
    }

    calculateFPower(criticalF, df1, df2, ncp) {
        if (df1 <= 0 || df2 <= 0 || criticalF <= 0) return 0;

        const variance = (2 * df1 + df2 - 2) / (df2 - 2);
        const z = (criticalF - ncp) / Math.sqrt(variance);

        const power = 1 - this.stats.normalCDF(z);
        return Math.max(0, Math.min(1, power));
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

        // Create individual data points for jittered scatter plot with better styling
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
                    size: 8,
                    opacity: 0.7,
                    symbol: 'circle',
                    line: { color: '#2980b9', width: 1 }
                },
                showlegend: false,
                xaxis: 'x',
                yaxis: 'y',
                hovertemplate: `Value: %{y:.2f}<extra></extra>`
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
                        size: 8,
                        opacity: 0.7,
                        symbol: 'circle',
                        line: { color: '#c0392b', width: 1 }
                    },
                    showlegend: false,
                    xaxis: 'x',
                    yaxis: 'y',
                    hovertemplate: `Value: %{y:.2f}<extra></extra>`
                });
            });
        }

        const data = [
            // Enhanced box plots
            {
                y: group1,
                type: 'box',
                name: testType === 'one_sample' ? 'Sample Data' : 'Group 1',
                marker: {
                    color: '#3498db',
                    outliercolor: '#2980b9',
                    size: 6
                },
                boxpoints: false, // Hide individual points since we have scatter
                line: { color: '#2980b9', width: 3 },
                fillcolor: 'rgba(52, 152, 219, 0.4)',
                showlegend: true,
                hovertemplate: `Group 1<br>Median: %{median:.2f}<br>Q1: %{q1:.2f}<br>Q3: %{q3:.2f}<extra></extra>`
            }
        ];

        if (testType !== 'one_sample') {
            data.push({
                y: group2,
                type: 'box',
                name: testType === 'paired' ? 'Group 2 (Paired)' : 'Group 2',
                marker: {
                    color: '#e74c3c',
                    outliercolor: '#c0392b',
                    size: 6
                },
                boxpoints: false,
                line: { color: '#c0392b', width: 3 },
                fillcolor: 'rgba(231, 76, 60, 0.4)',
                showlegend: true,
                hovertemplate: `${testType === 'paired' ? 'Group 2 (Paired)' : 'Group 2'}<br>Median: %{median:.2f}<br>Q1: %{q1:.2f}<br>Q3: %{q3:.2f}<extra></extra>`
            });
        }

        // Add scatter points
        data.push(...scatterData);

        const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
        const mean2 = testType !== 'one_sample' ? group2.reduce((a, b) => a + b, 0) / group2.length : effectSize;
        const sd1 = Math.sqrt(group1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (group1.length - 1));
        const sd2 = testType !== 'one_sample' ? Math.sqrt(group2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (group2.length - 1)) : 1;

        // Calculate effect size for display
        const observedEffectSize = testType !== 'one_sample' ? Math.abs(mean2 - mean1) : effectSize;

        const annotations = [
            {
                x: 0.5,
                y: Math.max(...group1) + 0.8,
                text: `Group 1<br>n = ${n}<br>Mean = ${mean1.toFixed(2)}<br>SD = ${sd1.toFixed(2)}<br>95% CI: [${(mean1 - 1.96 * sd1 / Math.sqrt(n)).toFixed(2)}, ${(mean1 + 1.96 * sd1 / Math.sqrt(n)).toFixed(2)}]`,
                showarrow: false,
                bgcolor: 'rgba(52, 152, 219, 0.95)',
                bordercolor: '#3498db',
                borderwidth: 2,
                font: { color: 'white', size: 11, weight: 'bold' }
            }
        ];

        if (testType !== 'one_sample') {
            annotations.push({
                x: 1.5,
                y: Math.max(...group2) + 0.8,
                text: `${testType === 'paired' ? 'Group 2 (Paired)' : 'Group 2'}<br>n = ${n}<br>Mean = ${mean2.toFixed(2)}<br>SD = ${sd2.toFixed(2)}<br>95% CI: [${(mean2 - 1.96 * sd2 / Math.sqrt(n)).toFixed(2)}, ${(mean2 + 1.96 * sd2 / Math.sqrt(n)).toFixed(2)}]`,
                showarrow: false,
                bgcolor: 'rgba(231, 76, 60, 0.95)',
                bordercolor: '#e74c3c',
                borderwidth: 2,
                font: { color: 'white', size: 11, weight: 'bold' }
            });

            // Add effect size annotation
            annotations.push({
                x: 1,
                y: Math.max(Math.max(...group1), Math.max(...group2)) + 1.5,
                text: `Effect Size (Cohen's d)<br>Observed: ${observedEffectSize.toFixed(2)}<br>Theoretical: ${effectSize.toFixed(2)}`,
                showarrow: false,
                bgcolor: 'rgba(155, 89, 182, 0.95)',
                bordercolor: '#9b59b6',
                borderwidth: 2,
                font: { color: 'white', size: 10 }
            });
        }

        const layout = {
            title: {
                text: 'Sample Data Visualization',
                font: { size: 20, color: '#2c3e50', family: 'Arial, sans-serif', weight: 'bold' },
                subtitle: {
                    text: testType === 'one_sample'
                        ? 'Single sample distribution with summary statistics'
                        : `Two-group comparison with effect size d = ${isNaN(effectSize) ? '0.50' : effectSize.toFixed(2)}`,
                    font: { size: 13, color: '#7f8c8d' }
                }
            },
            yaxis: {
                title: {
                    text: 'Value / Measurement',
                    font: { size: 15, color: '#2c3e50', weight: 'bold' }
                },
                gridcolor: '#ecf0f1',
                zeroline: true,
                zerolinecolor: '#bdc3c7',
                zerolinewidth: 2,
                tickfont: { size: 12, color: '#7f8c8d' },
                autorange: true,
                rangemode: 'normal',
                showgrid: true,
                gridwidth: 1
            },
            xaxis: {
                title: {
                    text: 'Groups',
                    font: { size: 15, color: '#2c3e50', weight: 'bold' }
                },
                showgrid: false,
                zeroline: false,
                tickfont: { size: 13, color: '#2c3e50', weight: 'bold' },
                autorange: true,
                rangemode: 'normal'
            },
            showlegend: true,
            legend: {
                x: 0.02,
                y: 0.98,
                xanchor: 'left',
                yanchor: 'top',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                bordercolor: '#bdc3c7',
                borderwidth: 2,
                font: { size: 12, color: '#2c3e50', weight: 'bold' }
            },
            margin: { l: 80, r: 50, t: 120, b: 80 },
            autosize: true,
            responsive: true,
            plot_bgcolor: 'rgba(255, 255, 255, 0.1)',
            paper_bgcolor: 'transparent',
            boxmode: 'group',
            boxgap: 0.3,
            boxgroupgap: 0.1,
            annotations: annotations,
            hovermode: 'closest'
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
}

// Export for use in other modules
window.PlotManager = PlotManager;
