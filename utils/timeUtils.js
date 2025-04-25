module.exports = {
    segundosAHoras: (segundos) => {
      if (!segundos) return '0.00';
      const horas = (segundos / 3600).toFixed(2);
      return horas.includes('.00') ? horas.split('.')[0] : horas;
    },

    calcularBono: (horas, facturado) => {
        const horasNum = parseFloat(horas);
        let porcentaje = 0;
    
        if (horasNum < 8) {
          porcentaje = 0.08;
        } else if (horasNum >= 8 && horasNum < 10) {
          porcentaje = 0.10;
        } else if (horasNum >= 10 && horasNum < 14) {
          porcentaje = 0.13;
        } else if (horasNum >= 14 && horasNum < 20) {
          porcentaje = 0.15;
        } else {
          porcentaje = 0.20;
        }

        return {
            monto: facturado * porcentaje,
            porcentaje: porcentaje * 100
          };
        }
      };