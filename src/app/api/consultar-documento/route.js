import { NextResponse } from "next/server"; // URLs de las API s
const DNI_API_URL = "https://dniruc.apisperu.com/api/v1/dni"; const RUC_API_URL = "https://dniruc.apisperu.com/api/v1/ruc"; export async function POST(request) { try { const { tipoDocumento, numeroDocumento } = await request.json(); const token = process.env.APIS_PERU_TOKEN; if (!token) { return NextResponse.json( { success: false, error: "Token de API no configurado" }, { status: 500 } ); }

    // Validar parámetro s
    if (!tipoDocumento || !numeroDocumento) { return NextResponse.json( {
          success: false, error: "Parámetros requeridos: tipoDocumento y numeroDocumento", }, { status: 400 } ); }

    let apiUrl; let expectedLength; // Determinar URL y validaciones según tipo de document o
    switch (tipoDocumento) { case "DNI": apiUrl = DNI_API_URL; expectedLength = 8; break; case "RUC": apiUrl = RUC_API_URL; expectedLength = 11; break; default: return NextResponse.json( {
            success: false, error: `Tipo de documento no soportado: ${tipoDocumento}`, }, { status: 400 } ); }

    // Validar formato del número de document o
    if ( numeroDocumento.length !== expectedLength || !/^\d+$/.test(numeroDocumento) ) { return NextResponse.json( {
          success: false, error: `${tipoDocumento} debe tener exactamente ${expectedLength} dígitos numéricos`, }, { status: 400 } ); }// Hacer la petición a la API extern a
    const response = await fetch( `${apiUrl}/${numeroDocumento}?token=${token}`, {
        method: "GET", headers: { Accept: "application/json", "Content-Type": "application/json", }, }
    ); if (!response.ok) {return NextResponse.json( {
          success: false, error: `Error del servidor: ${response.status} ${response.statusText}`, }, { status: response.status } ); }

    const data = await response.json();// Verificar si hay error en la respuesta de la AP I
    if (data.success === false) { return NextResponse.json({ success: false, error: data.message || `${tipoDocumento} no encontrado`, }); }

    // Procesar datos según el tipo de document o
    let processedData; if (tipoDocumento === "DNI") { // Verificar si la respuesta contiene datos válidos para DN I
      if (!data || !data.nombres) { return NextResponse.json({ success: false, error: "DNI no encontrado o datos incompletos", }); }

      processedData = { dni: data.dni || "", nombres: (data.nombres || "").trim(), apellidoPaterno: (data.apellidoPaterno || "").trim(), apellidoMaterno: (data.apellidoMaterno || "").trim(), // Combinar apellido s
        apellidos: [data.apellidoPaterno, data.apellidoMaterno] .filter(Boolean) .join(" ") .trim(), // Datos adicionale s
        codVerifica: data.codVerifica || null, codVerificaLetra: data.codVerificaLetra || null, raw: data, }; } else if (tipoDocumento === "RUC") { // Verificar si la respuesta contiene datos válidos para RU C
      if (!data || !data.razonSocial) { return NextResponse.json({ success: false, error: "RUC no encontrado o datos incompletos", }); }

      processedData = { ruc: data.ruc || "", razonSocial: (data.razonSocial || "").trim(), nombreComercial: (data.nombreComercial || "").trim(), estado: data.estado || "", condicion: data.condicion || "", direccion: (data.direccion || "").trim(), departamento: (data.departamento || "").trim(), provincia: (data.provincia || "").trim(), distrito: (data.distrito || "").trim(), // Datos adicionale s
        tipo: data.tipo || "", telefonos: data.telefonos || [], fechaInscripcion: data.fechaInscripcion || null, sistEmsion: data.sistEmsion || "", sistContabilidad: data.sistContabilidad || "", actExterior: data.actExterior || "", actEconomicas: data.actEconomicas || [], cpPago: data.cpPago || [], sistElectronica: data.sistElectronica || [], fechaEmisorFe: data.fechaEmisorFe || null, cpeElectronico: data.cpeElectronico || [], fechaPle: data.fechaPle || null, padrones: data.padrones || [], fechaBaja: data.fechaBaja || null, profesion: data.profesion || null, ubigeo: data.ubigeo || "", capital: data.capital || "", raw: data, }; }return NextResponse.json({ success: true, data: processedData, }); } catch (error) { return NextResponse.json( {
        success: false, error: "Error de conexión al consultar documento. Intenta nuevamente.", }, { status: 500 } ); }
}
