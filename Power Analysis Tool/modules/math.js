export class PowerMath {
  normalPDF(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }
  normalCDF(x) { return 0.5 * (1 + this.erf(x / Math.sqrt(2))); }
  erf(x) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = x >= 0 ? 1 : -1; x = Math.abs(x);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }
  normalInv(p) {
    const a1=-39.6968302866538,a2=220.946098424521,a3=-275.928510446969,a4=138.357751867269,a5=-30.6647980661472,a6=2.50662827745924;
    const b1=-54.4760987982241,b2=161.5858368580409,b3=-155.6989798598866,b4=66.80131188771972,b5=-13.28068155288572;
    const c1=-7.784894002430293e-3,c2=-0.3223964580411365,c3=-2.400758277161838,c4=-2.549732539343734,c5=4.374664141464968,c6=2.938163982698783;
    const d1=7.784695709041462e-3,d2=0.3224671290700398,d3=2.445134137142996,d4=3.754408661907416;
    let x=0,q=p;
    if(q<=0)return -Infinity; if(q>=1)return Infinity; if(q<0.02425){ q=Math.sqrt(-2*Math.log(q)); x=(((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6)/((((d1*q+d2)*q+d3)*q+d4)*q+1);
    } else if(q<0.97575){ q=q-0.5; const r=q*q; x=(((((a1*r+a2)*r+a3)*r+a4)*r+a5)*r+a6)*q/(((((b1*r+b2)*r+b3)*r+b4)*r+b5)*r+1);
    } else { q=Math.sqrt(-2*Math.log(1-q)); x=-(((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6)/((((d1*q+d2)*q+d3)*q+d4)*q+1); }
    return x;
  }
}


