import { NextRequest, NextResponse } from 'next/server'; import * as XLSX from 'xlsx'; import { validarTelefonoPeruano } from '@/lib/validaciones-zod'; import { validarDocumentoPeruano } from '@/lib/utils/documentos.js'; // Función para validar emai l
const isValidEmail = (email) => { if (!email) return true; // Email es opciona l
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return emailRegex.test(email); }; // Función para validar teléfono (centralizad a) const isValidPhone = (phone) => { if (!phone) return false; // Teléfono es requerid o
  return validarTelefonoPeruano(String(phone)); }; // Función para validar document o
const isValidDocument = (tipoDoc, numeroDoc) => { if (!tipoDoc || !numeroDoc) return false; const tipo = tipoDoc.toString().trim().toUpperCase(); const numero = numeroDoc.toString().trim(); if (tipo === 'DNI' || tipo === 'RUC') { return validarDocumentoPeruano(tipo, numero); }

  switch (tipo) { case 'CE': case 'CARNET_EXTRANJERIA': return /^[0-9]{9,12}$/.test(numero); case 'PASAPORTE': return /^[A-Z0-9]{6,12}$/.test(numero); default: return numero.length >= 6 && numero.length <= 20; }
}; // Función para procesar archivo CS V
const processCSV = (buffer) => { const text = buffer.toString('utf-8'); const lines = text.split('\n').filter(line => line.trim()); if (lines.length < 2) { throw new Error('El archivo debe contener al menos una fila de encabezados y una fila de datos'); }

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '')); const data = []; for (let i = 1; i < lines.length; i++) { const values = lines[i].split(',').map(v => v.trim().replace(/"/g, '')); const row = {}; headers.forEach((header, index) => { row[header] = values[index] || ''; }); data.push(row); }

  return data; }; // Función para procesar archivo Exce l
const processExcel = (buffer) => { const workbook = XLSX.read(buffer, { type: 'buffer' }); const sheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[sheetName]; const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }); if (data.length < 2) { throw new Error('El archivo debe contener al menos una fila de encabezados y una fila de datos'); }

  const headers = data[0]; const rows = data.slice(1); return rows.map(row => { const obj = {}; headers.forEach((header, index) => { obj[header] = row[index] || ''; }); return obj; }); }; // Función para validar y normalizar dato s
const validateAndNormalizeRow = (row, rowIndex) => { const errors = []; const warnings = []; // Normalizar campo s
  const normalizedRow = { tipoDocumento: row.tipoDocumento?.toString().trim().toUpperCase() || '', numeroDocumento: row.numeroDocumento?.toString().trim() || '', nombre: row.nombre?.toString().trim() || '', apellidos: row.apellidos?.toString().trim() || '', razonSocial: row.razonSocial?.toString().trim() || '', email: row.email?.toString().trim().toLowerCase() || '', telefono: row.telefono?.toString().trim() || '', direccion: row.direccion?.toString().trim() || '', departamento: row.departamento?.toString().trim() || '', provincia: row.provincia?.toString().trim() || '', distrito: row.distrito?.toString().trim() || '', esEmpresa: row.esEmpresa === 'true' || row.esEmpresa === true || row.esEmpresa === '1' }; // Validaciones requerida s
  if (!normalizedRow.tipoDocumento) { errors.push('Tipo de documento es requerido'); }

  if (!normalizedRow.numeroDocumento) { errors.push('Número de documento es requerido'); } else if (!isValidDocument(normalizedRow.tipoDocumento, normalizedRow.numeroDocumento)) { errors.push(`Número de documento inválido para tipo ${normalizedRow.tipoDocumento}`); }

  if (!normalizedRow.nombre) { errors.push('Nombre es requerido'); }

  if (!normalizedRow.telefono) { errors.push('Teléfono es requerido'); } else if (!isValidPhone(normalizedRow.telefono)) { errors.push('Formato de teléfono inválido'); }

  // Validaciones condicionale s
  if (normalizedRow.esEmpresa) { if (!normalizedRow.razonSocial) { errors.push('Razón social es requerida para empresas'); }
    if (normalizedRow.tipoDocumento !== 'RUC') { warnings.push('Las empresas generalmente usan RUC como tipo de documento'); }
  } else { if (!normalizedRow.apellidos) { errors.push('Apellidos son requeridos para personas naturales'); }
  } // Validaciones opcionale s
  if (normalizedRow.email && !isValidEmail(normalizedRow.email)) { errors.push('Formato de email inválido'); }

  return { ...normalizedRow, valid: errors.length === 0, errors, warnings, rowIndex: rowIndex + 2 // +2 porque empezamos desde fila 1 y los arrays son 0-indexe d
  }; }; export async function POST(request) { try { const formData = await request.formData(); const file = formData.get('file'); if (!file) { return NextResponse.json( { success: false, error: 'No se proporcionó ningún archivo' }, { status: 400 } ); }

    // Validar tipo de archiv o
    const allowedTypes = [ 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ]; const isValidType = allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'); if (!isValidType) { return NextResponse.json( { success: false, error: 'Tipo de archivo no válido. Solo se permiten CSV y Excel.' }, { status: 400 } ); }

    // Validar tamañ o
    if (file.size > 10 * 1024 * 1024) { return NextResponse.json( { success: false, error: 'El archivo es demasiado grande. Máximo 10MB.' }, { status: 400 } ); }

    // Leer archiv o
    const buffer = Buffer.from(await file.arrayBuffer()); let rawData; try { if (file.name.toLowerCase().endsWith('.csv')) { rawData = processCSV(buffer); } else { rawData = processExcel(buffer); }
    } catch (error) { return NextResponse.json( { success: false, error: `Error al procesar archivo: ${error.message}` }, { status: 400 } ); }

    if (rawData.length === 0) { return NextResponse.json( { success: false, error: 'El archivo no contiene datos válidos' }, { status: 400 } ); }

    // Validar y normalizar dato s
    const processedData = rawData.map((row, index) => validateAndNormalizeRow(row, index)); // Detectar duplicados por número de document o
    const documentNumbers = new Set(); const duplicates = []; processedData.forEach((row, index) => { if (row.numeroDocumento) { if (documentNumbers.has(row.numeroDocumento)) { duplicates.push({ row: row.rowIndex, numeroDocumento: row.numeroDocumento, message: `Número de documento duplicado: ${row.numeroDocumento}` }); row.valid = false; row.errors.push('Número de documento duplicado en el archivo'); } else { documentNumbers.add(row.numeroDocumento); }
      } }); // Calcular estadística s
    const validRows = processedData.filter(row => row.valid); const invalidRows = processedData.filter(row => !row.valid); const allErrors = processedData.flatMap(row => row.errors.map(error => ({ row: row.rowIndex, message: error })) ); // Preparar vista previa (máximo 50 registro s) const preview = processedData.slice(0, 50); const validation = { total: processedData.length, valid: validRows.length, invalid: invalidRows.length, duplicates: duplicates.length, errors: allErrors.slice(0, 20), // Máximo 20 errores para mostra r
      hasMoreErrors: allErrors.length > 20 }; return NextResponse.json({ success: true, data: { preview, validation, totalRows: processedData.length, fileName: file.name, fileSize: file.size }
    }); } catch (error) { return NextResponse.json( { success: false, error: 'Error interno del servidor' }, { status: 500 } ); }
}
