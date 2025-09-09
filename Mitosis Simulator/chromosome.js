(function(){
  // Chromosome helper namespace (added as a non-module global so existing pages work)
  window.Chromosome = {
    initChromosomes: function(sim, CHROM_PAIR_COUNT, UserConfig, cfgForChromosome, applyOverridesFn) {
      sim.chromosomes = [];
      sim.parentalChromosomes = [];

      for (let i = 0; i < CHROM_PAIR_COUNT; i++) {
        const angle = (i / CHROM_PAIR_COUNT) * Math.PI * 2;
        const cfg = cfgForChromosome ? cfgForChromosome(i) : null;
        const origin = cfg?.origin || (i % 2 === 0 ? 'Maternal' : 'Paternal');
        const parentalColor = cfg?.color || (origin === 'Maternal'
          ? (UserConfig?.defaults?.colorMaternal || '#e91e63')
          : (UserConfig?.defaults?.colorPaternal || '#3f51b5'));

        const startX = (cfg?.initial?.x !== undefined) ? cfg.initial.x : Math.cos(angle) * 0.35;
        const startY = (cfg?.initial?.y !== undefined) ? cfg.initial.y : Math.sin(angle) * 0.35;

        const chromosome = {
          id: i,
          x: startX,
          y: startY,
          angle: angle,
          condensed: true, // Start condensed to be visible
          separated: false,
          parentalColor: parentalColor,
          parentalOrigin: origin,
          sisterChromatids: [
            { x: 0, y: 0, angle: 0, attached: false, parentalColor: parentalColor },
            { x: 0, y: 0, angle: 0, attached: false, parentalColor: parentalColor }
          ],
          kinetochore: { formed: false, attached: false },
          targetX: 0,
          targetY: 0,
          originalX: startX,
          originalY: startY
        };

        sim.chromosomes.push(chromosome);
        if (applyOverridesFn) applyOverridesFn(chromosome, i);
        const cfgOnce = cfgForChromosome ? cfgForChromosome(i) : null;
        if (cfgOnce) cfgOnce._applyOnce = true;
        sim.parentalChromosomes.push({...chromosome, originalId: i});
      }

      return sim.chromosomes;
    },

    drawChromosome: function(ctx, R, chromosome, index, isFirstSister, VIS, Sim) {
      if(!chromosome) return;
      const phase = Sim.phaseIndex;
      const condensed = chromosome.condensed;
      const separated = chromosome.separated;

      let color = chromosome.parentalColor;
      if (Sim.dnaDamage) color = '#ef4444';
      if (Sim.blockMicrotubules && phase > 1) color = '#fbbf24';

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = condensed ? VIS.chromatidLineWidth : VIS.chromatidThinLineWidth;
      ctx.lineCap = 'round';

      if (condensed) {
        const length = R * VIS.condensedLengthFactor * 2;
        const armOffset = Math.max(4, VIS.chromatidLineWidth * 1.5) / (window.devicePixelRatio || 1);

        if (separated && phase >= 4) {
          const sisterOffset = isFirstSister ? -armOffset : armOffset;
          ctx.save();
          ctx.translate(sisterOffset, 0);
          ctx.lineWidth = VIS.chromatidLineWidth;
          ctx.beginPath();
          ctx.moveTo(0, -length/2);
          ctx.lineTo(0, length/2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, VIS.centromereRadius, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, VIS.centromereRadius, 0, Math.PI*2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.lineWidth = VIS.chromatidLineWidth;
          ctx.beginPath();
          ctx.moveTo(-armOffset, -length/2);
          ctx.lineTo(-armOffset, length/2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(armOffset, -length/2);
          ctx.lineTo(armOffset, length/2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, VIS.centromereRadius, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, VIS.centromereRadius, 0, Math.PI*2);
          ctx.stroke();

          if (chromosome.kinetochore.formed) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(2, Math.floor(VIS.centromereRadius/2)), 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = color;
          }
        }

        if (phase >= 2 && !separated) {
          ctx.fillStyle = color;
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(chromosome.parentalOrigin[0], 0, -length/2 - 10);
        }
      } else {
        const length = R * 0.06;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const x = -length + (i * length);
          const y = Math.sin(i * 0.5) * 3;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  };
})();
