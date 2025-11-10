import { NextResponse } from 'next/server'
import { getEstadisticasDashboard } from '@/lib/actions/dashboard'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const periodo = searchParams.get('periodo') || 'mes'
    const fechaDesde = searchParams.get('fechaDesde') || undefined
    const fechaHasta = searchParams.get('fechaHasta') || undefined
    const sucursalId = searchParams.get('sucursalId') || undefined
    const filtroTipo = searchParams.get('filtroTipo') || 'ambos'
    const mes = searchParams.get('mes') || undefined

    const result = await getEstadisticasDashboard({ 
      periodo, 
      fechaDesde, 
      fechaHasta,
      sucursalId,
      filtroTipo,
      mes,
    })
    if (!result?.success) {
      return NextResponse.json({ success: false, error: result?.error || 'Error' }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error en API estadisticas:', error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}