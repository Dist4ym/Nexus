module.exports = {
    // **[CODIGO]** ha enviado una factura `$MONTO (JUSTIFICACION)` a **alguien**.
    facturaPattern: /^\*\*\[([A-Z0-9]+)\]\*\* ha enviado una factura `\$(\d+) \([^)]+\)` a \*\*alguien\*\*\.$/,
  
    // **[CODIGO] NOMBRE** ha (entrado|salido) (en|de) servicio.
    servicioPattern: /^\*\*\[([A-Z0-9]+)\] (.+?)\*\* ha (entrado|salido) (?:en|de) servicio\.$/i,
  
    // **[CODIGO] NOMBRE** ha depsotado en los fondos.
    depositoPattern: /^\*\*\[([A-Z0-9]+)\] (.+?)\*\* ha depositado \`\$(\d+(?:,\d{3})*(?:\.\d{2})?)\` en los fondos\.$/i,
  
    // **[CODIGO] NOMBRE** ha retirado de los fondos.
    retiroPattern: /^\*\*\[([A-Z0-9]+)\] (.+?)\*\* ha retirado \`\$(\d+(?:,\d{3})*(?:\.\d{2})?)\` de los fondos\.$/i,
  };