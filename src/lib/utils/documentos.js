import { CONSTANTES_PERU } from "../constants/peru.js";

/*** Valida números de documentos peruanos (DNI o RUC).
 * @param {string} tipo - Tipo de documento ('DNI' | 'RUC').
 * @param {string|number} numero - Número del documento.
 * @returns {boolean} true si es válido, false si no. ***/

export function validarDocumentoPeruano(tipo, numero) {
  if (!tipo || numero === undefined || numero === null) return false;
  const n = String(numero).trim();
  if (tipo === "DNI") return CONSTANTES_PERU.DNI_REGEX.test(n);
  if (tipo === "RUC") return CONSTANTES_PERU.RUC_REGEX.test(n);
  return false;
}
