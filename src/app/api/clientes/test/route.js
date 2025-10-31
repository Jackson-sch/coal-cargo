import { NextResponse } from "next/server"; import { prisma } from "@/lib/prisma"; export async function POST(req) { try {const body = await req.json();// Validación básic a
    if (!body.numeroDocumento || !body.nombre || !body.telefono) { return NextResponse.json( { success: false, error: "Faltan campos obligatorios" }, { status: 400 } ); }

    // Verificar si el documento ya exist e
    const existingCliente = await prisma.clientes.findUnique({ where: { numeroDocumento: body.numeroDocumento }, }); if (existingCliente) { return NextResponse.json( {
          success: false, error: "Ya existe un cliente con este número de documento", }, { status: 409 } ); }

    // Crear client e
    const cliente = await prisma.clientes.create({ data: { tipoDocumento: body.tipoDocumento || "DNI", numeroDocumento: body.numeroDocumento, nombre: body.nombre, apellidos: body.apellidos || "", razonSocial: body.razonSocial || null, email: body.email || null, telefono: body.telefono, direccion: body.direccion || null, distritoId: body.distritoId || null, esEmpresa: body.esEmpresa || false, estado: true, }, });return NextResponse.json( {
        success: true, data: cliente, }, { status: 201 } ); } catch (error) { return NextResponse.json( { success: false, error: error.message }, { status: 500 } ); }
}
