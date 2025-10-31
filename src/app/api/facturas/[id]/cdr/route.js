import { NextResponse } from "next/server"; import { prisma } from "@/lib/prisma"; import { auth } from "@/lib/auth"; import ApiGoService from "@/lib/services/sunat/api-go"; export async function GET(request, { params }) { try { const session = await auth(); if (!session) { return NextResponse.json({ error: "No autorizado" }, { status: 401 }); }

    const { id } = await params; // Buscar el comprobante en la base de datos const factura = await prisma.comprobantes_electronicos.findUnique({ where: { id: id }, include: { cliente: true, detalles: true, }, }); if (!factura) { return NextResponse.json( { error: "Comprobante no encontrado" }, { status: 404 } ); }

    // Verificar que el comprobante esté aceptado if (factura.estado !== "ACEPTADO" && factura.estado !== "aceptado") { return NextResponse.json( {
          error: "Solo se pueden descargar comprobantes con estado ACEPTADO", }, { status: 400 } ); }

    // Verificar que tenga un ID de PSE if (!factura.pseId) { return NextResponse.json( {
          error: "Este comprobante no tiene un ID de PSE asociado", }, { status: 400 } ); }

    // Usar el servicio API-GO para descargar el CDR const apiGoService = new ApiGoService(); const tipoDocumento = factura.tipoComprobante === "FACTURA" ? "factura" : "boleta"; const resultado = await apiGoService.descargarCDR( factura.pseId, tipoDocumento ); if (!resultado.success) { const match = String(resultado.error || "").match( /\b(401|403|404|422|500)\b/ ); const status = match ? Number(match[1]) : 500; return NextResponse.json({ error: resultado.error }, { status }); }

    const nombreArchivo = `R-${factura.serie}-${factura.numero}.zip`; return new NextResponse(resultado.cdr, { status: 200, headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${nombreArchivo}"`, "Cache-Control": "no-cache, no-store, must-revalidate", Pragma: "no-cache", Expires: "0", }, }); } catch (error) { console.error("Error al descargar CDR:", error); return NextResponse.json( { error: "Error al descargar el CDR" }, { status: 500 } ); }
}
