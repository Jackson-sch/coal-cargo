import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth' export async function GET(request, { params }) { try { const session = await getServerSession(authOptions) if (!session) { return NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }

    const { id } = params const factura = await prisma.factura.findUnique({ where: { id: parseInt(id) }, include: { cliente: true, items: true }
    }) if (!factura) { return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 }) }

    return NextResponse.json(factura) } catch (error) {}
}
