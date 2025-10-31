import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth' export async function GET(request) { try { const session = await getServerSession(authOptions) if (!session) { return NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }

    const { searchParams } = new URL(request.url) const page = parseInt(searchParams.get('page')) || 1 const limit = parseInt(searchParams.get('limit')) || 10 const estado = searchParams.get('estado') const skip = (page - 1) * limit const where = {} if (estado) { where.estado = estado }

    const [facturas, total] = await Promise.all([ prisma.factura.findMany({ where, skip, take: limit, include: { cliente: true, items: true }, orderBy: { createdAt: 'desc' }
      }), prisma.factura.count({ where }) ]) return NextResponse.json({ facturas, pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }) } catch (error) {}
}
