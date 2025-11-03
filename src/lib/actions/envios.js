"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calcularCotizacionSucursal } from "@/lib/actions/cotizacion-sucursales";
import { validarDocumentoPeruano } from "../utils/documentos.js";
import { randomInt } from "crypto";
import { generarNumeroGuia as generarGuiaCentralizada } from "@/lib/utils/guia-generator";

/**
 * Obtener todos los envíos con filtros - Versión limpia usando solo campos modernos
 */
export async function getEnvios(filtros = {}) {
  try {
    const {
      estado,
      estados,
      sucursalOrigenId,
      sucursalDestinoId,
      clienteId,
      fechaDesde,
      fechaHasta,
      numeroGuia,
      guia,
      page = 1,
      limit = 8,
    } = filtros;

    // Construir condiciones WHERE
    const whereConditions = {
      deletedAt: null,
    };

    // Manejo de estado único o múltiples estados
    if (estados && Array.isArray(estados) && estados.length > 0) {
      whereConditions.estado = { in: estados };
    } else if (estado && estado !== "all-states") {
      whereConditions.estado = estado;
    }

    if (sucursalOrigenId && sucursalOrigenId !== "all-branches") {
      whereConditions.sucursalOrigenId = sucursalOrigenId;
    }

    if (sucursalDestinoId && sucursalDestinoId !== "all-branches") {
      whereConditions.sucursalDestinoId = sucursalDestinoId;
    }

    if (clienteId && clienteId !== "all-clients") {
      whereConditions.clienteId = clienteId;
    }

    // Manejo de búsqueda por guía (numeroGuia o guia)
    const searchGuia = numeroGuia || guia;
    if (searchGuia) {
      whereConditions.guia = {
        contains: searchGuia,
        mode: "insensitive",
      };
    }

    if (fechaDesde || fechaHasta) {
      whereConditions.fechaRegistro = {};
      if (fechaDesde) {
        whereConditions.fechaRegistro.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        whereConditions.fechaRegistro.lte = new Date(
          fechaHasta + "T23:59:59.999Z"
        );
      }
    }

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Obtener envíos con paginación usando únicamente campos modernos
    const [envios, totalCount] = await Promise.all([
      prisma.envios.findMany({
        where: whereConditions,
        select: {
          // Campos básicos modernos
          id: true,
          guia: true,
          estado: true,
          peso: true,
          descripcion: true,
          valorDeclarado: true,
          total: true,
          progreso: true,
          tipoServicio: true,
          modalidad: true,
          fechaRegistro: true,
          fechaEntrega: true,
          createdAt: true,
          updatedAt: true,
          asignadoA: true,
          // Dimensiones
          alto: true,
          ancho: true,
          profundo: true,

          // Información de remitente y destinatario
          remitenteNombre: true,
          remitenteTelefono: true,
          remitenteEmail: true,
          remitenteDireccion: true,
          destinatarioNombre: true,
          destinatarioTelefono: true,
          destinatarioEmail: true,
          destinatarioDireccion: true,
          // Responsable de recojo (si fue incluido)
          responsableRecojoNombre: true,
          responsableRecojoApellidos: true,
          responsableRecojoTipoDocumento: true,
          responsableRecojoNumeroDocumento: true,
          responsableRecojoTelefono: true,
          responsableRecojoEmail: true,
          responsableRecojoDireccion: true,
          responsableRecojoEmpresa: true,
          responsableRecojoCargo: true,
          // Cliente de facturación (relación y campos embebidos)
          clienteFacturacion: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              email: true,
              telefono: true,
              tipoDocumento: true,
              numeroDocumento: true,
              razonSocial: true,
              ruc: true,
              direccion: true,
              esEmpresa: true,
            },
          },
          clienteFacturacionNombre: true,
          clienteFacturacionApellidos: true,
          clienteFacturacionRazonSocial: true,
          clienteFacturacionTipoDocumento: true,
          clienteFacturacionNumeroDocumento: true,
          clienteFacturacionRuc: true,
          clienteFacturacionDireccion: true,
          clienteFacturacionEmail: true,
          clienteFacturacionTelefono: true,
          clienteFacturacionEsEmpresa: true,

          // Relaciones modernas
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              email: true,
              telefono: true,
              tipoDocumento: true,
              numeroDocumento: true,
              razonSocial: true,
              ruc: true,
              direccion: true,
              esEmpresa: true,
            },
          },
          sucursalOrigen: {
            select: {
              id: true,
              nombre: true,
              provincia: true,
              direccion: true,
            },
          },
          sucursalDestino: {
            select: {
              id: true,
              nombre: true,
              provincia: true,
              direccion: true,
            },
          },
          usuario: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          eventos_envio: {
            orderBy: {
              createdAt: "desc",
            },
            take: 3,
            select: {
              id: true,
              estado: true,
              comentario: true,
              ubicacion: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          fechaRegistro: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.envios.count({
        where: whereConditions,
      }),
    ]);

    // Mapear datos usando únicamente campos modernos
    const enviosMapeados = envios.map((envio) => ({
      ...envio,
      numeroGuia: envio.guia,
      precio: envio.total,
      subtotal: envio.total ? envio.total * 0.847 : 0,
      igv: envio.total ? envio.total * 0.153 : 0,
      // Dimensiones con nombres consistentes en UI
      largo: envio.profundo,
      // Información de remitente
      remitente: {
        nombre: envio.remitenteNombre,
        telefono: envio.remitenteTelefono,
        email: envio.remitenteEmail,
        direccion: envio.remitenteDireccion,
      },
      // Información de destinatario
      destinatario: {
        nombre: envio.destinatarioNombre,
        telefono: envio.destinatarioTelefono,
        email: envio.destinatarioEmail,
        direccion: envio.destinatarioDireccion,
      },
      // Relaciones con nombres compatibles
      sucursal_origen: envio.sucursalOrigen,
      sucursal_destino: envio.sucursalDestino,
      // Eventos mapeados
      eventos: envio.eventos_envio.map((evento) => ({
        ...evento,
        evento: evento.estado,
        descripcion: evento.comentario,
      })),
    }));

    return {
      success: true,
      data: {
        envios: enviosMapeados,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener los envíos",
    };
  }
}

/**
 * Crear nuevo envío basado en cotización
 */
export async function createEnvio(data) {
  try {
    // Debug temporal - mostrar datos recibidos
    console.log("Datos recibidos en createEnvio:", {
      clienteId: data.clienteId,
      sucursalOrigenId: data.sucursalOrigenId,
      sucursalDestinoId: data.sucursalDestinoId,
      peso: data.peso,
      descripcion: data.descripcion,
      destinatarioNombre: data.destinatarioNombre,
      remitenteNombre: data.remitenteNombre,
      remitente: data.remitente,
      incluirRemitente: data.incluirRemitente,
    });

    const {
      clienteId,
      sucursalOrigenId,
      sucursalDestinoId,
      peso,
      descripcion,
      valorDeclarado,
      tipoServicio = "NORMAL",
      modalidad = "SUCURSAL_SUCURSAL",
      largo,
      ancho,
      alto,
      observaciones,
      paquete,
      instruccionesEspeciales,
      requiereConfirmacion,
      direccionEntrega,
      distritoEntregaId,
      quienPaga,
      facturarA,
      remitenteNombre,
      remitenteTelefono,
      remitenteEmail,
      remitenteDireccion,
      destinatarioNombre,
      destinatarioTelefono,
      destinatarioEmail,
      destinatarioDireccion,
      tipoDocumento,
      numeroDocumento,
      responsableRecojo,
      clienteFacturacion,
      incluirResponsableRecojo = false,
      incluirClienteFacturacion = false,
    } = data;

    // Resolver clienteId automáticamente si no fue proporcionado
    async function resolverClienteId() {
      if (clienteId) return clienteId;

      // Función auxiliar para crear cliente
      async function crearNuevoCliente(datos) {
        const { nombre, tipoDoc, numeroDoc, telefono, email, direccion } =
          datos;

        const docValido = validarDocumentoPeruano(tipoDoc, numeroDoc);
        const usarTipo = docValido ? tipoDoc : "DNI";
        const usarNumero = docValido
          ? numeroDoc
          : `TEMP_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        const nuevoCliente = await prisma.clientes.create({
          data: {
            nombre: nombre || "Cliente",
            tipoDocumento: usarTipo,
            numeroDocumento: usarNumero,
            telefono: telefono || "",
            email: email || null,
            direccion: direccion || null,
            esEmpresa: usarTipo === "RUC" ? true : false,
            ruc: usarTipo === "RUC" ? usarNumero : null,
          },
          select: { id: true },
        });

        return nuevoCliente.id;
      }

      // Función auxiliar para buscar cliente existente
      async function buscarClienteExistente(numeroDoc) {
        if (!numeroDoc) return null;

        return await prisma.clientes.findFirst({
          where: { numeroDocumento: String(numeroDoc).trim(), deletedAt: null },
          select: { id: true },
        });
      }

      // Si paga el destinatario y tenemos documento del destinatario
      if (quienPaga === "DESTINATARIO" && numeroDocumento && tipoDocumento) {
        const numDest = String(numeroDocumento).trim();
        const existente = await buscarClienteExistente(numDest);

        if (existente) return existente.id;

        return await crearNuevoCliente({
          nombre: destinatarioNombre,
          tipoDoc: tipoDocumento,
          numeroDoc: numDest,
          telefono: destinatarioTelefono,
          email: destinatarioEmail,
          direccion: destinatarioDireccion,
        });
      }

      // Si paga el remitente o no se especifica quién paga, usar datos del remitente
      if (data.remitente && (quienPaga === "REMITENTE" || !quienPaga)) {
        const remitente = data.remitente;

        // Si el remitente tiene documento, intentar buscarlo primero
        if (remitente.numeroDocumento && remitente.tipoDocumento) {
          const numRem = String(remitente.numeroDocumento).trim();
          const existente = await buscarClienteExistente(numRem);

          if (existente) return existente.id;

          return await crearNuevoCliente({
            nombre: remitente.nombre,
            tipoDoc: remitente.tipoDocumento,
            numeroDoc: numRem,
            telefono: remitente.telefono,
            email: remitente.email,
            direccion: remitente.direccion,
          });
        }

        // Si no tiene documento pero tiene nombre, crear cliente temporal
        if (remitente.nombre) {
          return await crearNuevoCliente({
            nombre: remitente.nombre,
            tipoDoc: "DNI",
            numeroDoc: null, // Se generará uno temporal
            telefono: remitente.telefono,
            email: remitente.email,
            direccion: remitente.direccion,
          });
        }
      }

      // Fallback: usar datos del remitente directo si están disponibles
      if (remitenteNombre) {
        return await crearNuevoCliente({
          nombre: remitenteNombre,
          tipoDoc: "DNI",
          numeroDoc: null,
          telefono: remitenteTelefono,
          email: remitenteEmail,
          direccion: remitenteDireccion,
        });
      }

      return null;
    }

    const clienteIdFinal = await resolverClienteId();

    // Mapear datos desde paquete si existe
    const pesoFinal = paquete?.peso ?? peso;
    const altoFinal = paquete?.alto ?? alto;
    const anchoFinal = paquete?.ancho ?? ancho;
    const largoFinal = paquete?.profundo ?? paquete?.largo ?? largo;
    const descripcionFinal = paquete?.descripcion ?? descripcion;
    const valorDeclaradoFinal = paquete?.valorDeclarado ?? valorDeclarado;

    // Validaciones específicas con mensajes detallados
    const errores = [];

    if (!clienteIdFinal) {
      errores.push(
        "No se pudo identificar o crear el cliente. Verifique los datos del remitente o destinatario."
      );
    }

    if (!sucursalOrigenId) {
      errores.push("Debe seleccionar una sucursal de origen.");
    }

    if (!sucursalDestinoId) {
      errores.push("Debe seleccionar una sucursal de destino.");
    }

    if (!pesoFinal || parseFloat(pesoFinal) <= 0) {
      errores.push("El peso del paquete debe ser mayor a 0.");
    }

    if (!descripcionFinal || !descripcionFinal.trim()) {
      errores.push("Debe ingresar una descripción del paquete.");
    }

    // Validar datos del destinatario si es requerido
    if (!destinatarioNombre || !destinatarioNombre.trim()) {
      errores.push("El nombre del destinatario es requerido.");
    }

    // Validar datos del remitente si se incluye
    if (data.remitente || incluirResponsableRecojo) {
      if (data.remitente && (!remitenteNombre || !remitenteNombre.trim())) {
        errores.push(
          "El nombre del remitente es requerido cuando se incluyen sus datos."
        );
      }

      // Si tiene documento, validar que esté completo
      if (data.remitente?.numeroDocumento && !data.remitente?.tipoDocumento) {
        errores.push("Debe seleccionar el tipo de documento del remitente.");
      }
    }

    // Validar que al menos uno de los contactos tenga teléfono
    const tieneTeléfonoRemitente =
      remitenteTelefono && remitenteTelefono.trim();
    const tieneTeléfonoDestinatario =
      destinatarioTelefono && destinatarioTelefono.trim();

    if (!tieneTeléfonoRemitente && !tieneTeléfonoDestinatario) {
      errores.push(
        "Al menos el remitente o el destinatario debe tener un número de teléfono."
      );
    }

    // Si hay errores, retornarlos
    if (errores.length > 0) {
      return {
        success: false,
        error: "Faltan datos requeridos:",
        details: errores,
        fieldErrors: {
          general: errores.join(" "),
        },
      };
    }

    if (parseFloat(pesoFinal) <= 0) {
      return {
        success: false,
        error: "El peso debe ser mayor a 0",
      };
    }

    if (sucursalOrigenId === sucursalDestinoId) {
      return {
        success: false,
        error: "La sucursal origen no puede ser la misma que la de destino",
      };
    }

    // Verificar que el cliente existe
    const cliente = await prisma.clientes.findFirst({
      where: { id: clienteIdFinal, deletedAt: null },
      select: { id: true, nombre: true, email: true, telefono: true },
    });

    if (!cliente) {
      return {
        success: false,
        error: "Cliente no encontrado",
      };
    }

    // Calcular precio usando la misma cotización del formulario
    let subtotal = 0;
    let igv = 0;
    let total = 0;
    let precioBase = 0;

    const cotizacionResp = await calcularCotizacionSucursal({
      sucursalOrigenId,
      sucursalDestinoId,
      peso: parseFloat(pesoFinal),
      tipoServicio,
      modalidad,
      valorDeclarado: valorDeclaradoFinal,
      largo: largoFinal ? parseFloat(largoFinal) : undefined,
      ancho: anchoFinal ? parseFloat(anchoFinal) : undefined,
      alto: altoFinal ? parseFloat(altoFinal) : undefined,
    });

    if (cotizacionResp?.success) {
      subtotal = cotizacionResp.data.detalles.subtotal;
      igv = cotizacionResp.data.detalles.igv;
      total = cotizacionResp.data.detalles.total;
      precioBase =
        cotizacionResp.data.desglose?.subtotalBase ??
        cotizacionResp.data.detalles?.tarifaBase ??
        0;
    } else {
      // Fallback mínimo para no bloquear creación
      const fallbackPrecioBase = 15.0;
      const fallbackPrecioPorKg = 5.0;
      const fbSubtotal =
        fallbackPrecioBase + parseFloat(pesoFinal) * fallbackPrecioPorKg;
      const fbIgv = fbSubtotal * 0.18;
      subtotal = fbSubtotal;
      igv = fbIgv;
      total = fbSubtotal + fbIgv;
      precioBase = fallbackPrecioBase;
    }

    // Generar y asignar guía con reintentos ante colisión única
    let resultado;
    let intentos = 0;
    const maxIntentos = 5;

    while (intentos < maxIntentos) {
      const numeroGuia = await generarGuiaCentralizada(sucursalOrigenId);

      try {
        const res = await prisma.$transaction(async (tx) => {
          // Preparar datos del responsable de recojo
          let responsableRecojoData = {};
          if (incluirResponsableRecojo && responsableRecojo) {
            const rrTipo = responsableRecojo.tipoDocumento || null;
            const rrNumero = responsableRecojo.numeroDocumento
              ? String(responsableRecojo.numeroDocumento).trim()
              : "";
            const rrValido = validarDocumentoPeruano(rrTipo, rrNumero);

            responsableRecojoData = {
              responsableRecojoNombre: responsableRecojo.nombre || null,
              responsableRecojoApellidos: responsableRecojo.apellidos || null,
              responsableRecojoTipoDocumento: rrValido ? rrTipo : null,
              responsableRecojoNumeroDocumento: rrValido ? rrNumero : null,
              responsableRecojoTelefono: responsableRecojo.telefono || null,
              responsableRecojoEmail: responsableRecojo.email || null,
              responsableRecojoDireccion: responsableRecojo.direccion || null,
              responsableRecojoEmpresa: responsableRecojo.empresa || null,
              responsableRecojoCargo: responsableRecojo.cargo || null,
            };
          }

          // Preparar datos del cliente de facturación
          let clienteFacturacionData = {};
          if (incluirClienteFacturacion && clienteFacturacion) {
            const cfRuc = clienteFacturacion.ruc
              ? String(clienteFacturacion.ruc).trim()
              : "";
            const cfNumDoc = clienteFacturacion.numeroDocumento
              ? String(clienteFacturacion.numeroDocumento).trim()
              : "";
            const rucValido = validarDocumentoPeruano("RUC", cfRuc);
            const tipoDocCf =
              clienteFacturacion.tipoDocumento || (rucValido ? "RUC" : "DNI");
            const numDocValido = validarDocumentoPeruano(tipoDocCf, cfNumDoc);

            clienteFacturacionData = {
              clienteFacturacionNombre: clienteFacturacion.nombre || null,
              clienteFacturacionApellidos: clienteFacturacion.apellidos || null,
              clienteFacturacionRazonSocial:
                clienteFacturacion.razonSocial || null,
              clienteFacturacionTipoDocumento: rucValido
                ? "RUC"
                : numDocValido
                ? tipoDocCf
                : null,
              clienteFacturacionNumeroDocumento: numDocValido ? cfNumDoc : null,
              clienteFacturacionRuc: rucValido ? cfRuc : null,
              clienteFacturacionDireccion: clienteFacturacion.direccion || null,
              clienteFacturacionEmail: clienteFacturacion.email || null,
              clienteFacturacionTelefono: clienteFacturacion.telefono || null,
              clienteFacturacionEsEmpresa:
                clienteFacturacion.esEmpresa || false,
            };
          }

          // Crear envío con campos modernos únicamente
          const nuevoEnvio = await tx.envios.create({
            data: {
              id: `envio_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 11)}`,
              guia: numeroGuia,
              clienteId: clienteIdFinal,
              sucursalOrigenId: sucursalOrigenId,
              sucursalDestinoId: sucursalDestinoId,
              peso: parseFloat(pesoFinal),
              alto: altoFinal ? parseFloat(altoFinal) : null,
              ancho: anchoFinal ? parseFloat(anchoFinal) : null,
              profundo: largoFinal ? parseFloat(largoFinal) : null,
              descripcion: descripcionFinal,
              valorDeclarado: valorDeclaradoFinal
                ? parseFloat(valorDeclaradoFinal)
                : null,
              total: total,
              estado: "REGISTRADO",
              tipoServicio: tipoServicio,
              modalidad: modalidad,
              notas: observaciones || null,
              instruccionesEspeciales: instruccionesEspeciales ?? null,
              requiereConfirmacion: requiereConfirmacion ?? false,
              fechaRegistro: new Date(),
              remitenteNombre: remitenteNombre || null,
              remitenteTelefono: remitenteTelefono || null,
              remitenteEmail: remitenteEmail || null,
              remitenteDireccion: remitenteDireccion || null,
              remitenteTipoDocumento: data.remitente?.tipoDocumento || null,
              remitenteNumeroDocumento: data.remitente?.numeroDocumento || null,
              destinatarioNombre: destinatarioNombre || null,
              destinatarioTelefono: destinatarioTelefono || null,
              destinatarioEmail: destinatarioEmail || null,
              destinatarioDireccion: destinatarioDireccion || null,
              destinatarioTipoDocumento: tipoDocumento || null,
              destinatarioNumeroDocumento: numeroDocumento || null,
              ...responsableRecojoData,
              ...clienteFacturacionData,
            },
            include: {
              cliente: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                  telefono: true,
                },
              },
              sucursalOrigen: {
                select: {
                  id: true,
                  nombre: true,
                  provincia: true,
                  direccion: true,
                },
              },
              sucursalDestino: {
                select: {
                  id: true,
                  nombre: true,
                  provincia: true,
                  direccion: true,
                },
              },
            },
          });

          // Crear evento inicial
          await tx.eventos_envio.create({
            data: {
              id: `evento_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 11)}`,
              envioId: nuevoEnvio.id,
              estado: "REGISTRADO",
              comentario: `Envío creado - Servicio ${tipoServicio} - ${modalidad.replace(
                "_",
                " a "
              )}`,
              ubicacion: nuevoEnvio.sucursalOrigen.nombre,
            },
          });

          return nuevoEnvio;
        });

        resultado = res;
        break;
      } catch (error) {
        if (
          error?.code === "P2002" &&
          (error?.meta?.target?.includes("guia") ||
            String(error?.meta?.target).includes("guia"))
        ) {
          intentos++;
          await new Promise((resolve) => setTimeout(resolve, 10));
          continue;
        }
        throw error;
      }
    }

    if (!resultado) {
      throw new Error("No se pudo generar guía única");
    }

    revalidatePath("/dashboard/envios");

    return {
      success: true,
      data: {
        envio: {
          ...resultado,
          numeroGuia: resultado.guia,
          precio: resultado.total,
          subtotal: subtotal,
          igv: igv,
          sucursal_origen: resultado.sucursalOrigen,
          sucursal_destino: resultado.sucursalDestino,
        },
        cotizacion: cotizacionResp?.success
          ? cotizacionResp.data
          : {
              detalles: {
                costoBase: precioBase,
                tarifaBase: precioBase,
                subtotal,
                igv,
                total,
              },
              tiempoEstimado: "2-3 días hábiles",
            },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al crear el envío",
    };
  }
}

/**
 * Actualizar estado del envío
 */
export async function actualizarEstadoEnvio(
  envioId,
  nuevoEstado,
  descripcion,
  ubicacion,
  fotoUrl = null,
  firmaUrl = null
) {
  try {
    if (!envioId || !nuevoEstado) {
      return {
        success: false,
        error: "ID de envío y nuevo estado son requeridos",
      };
    }

    // Verificar que el envío existe
    const envio = await prisma.envios.findFirst({
      where: { id: envioId, deletedAt: null },
      include: {
        sucursalOrigen: { select: { nombre: true } },
        sucursalDestino: { select: { nombre: true } },
      },
    });

    if (!envio) {
      return {
        success: false,
        error: "Envío no encontrado",
      };
    }

    // Estados válidos
    const estadosValidos = [
      "REGISTRADO",
      "EN_BODEGA",
      "EN_TRANSITO",
      "EN_REPARTO",
      "ENTREGADO",
      "DEVUELTO",
      "ANULADO",
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      return {
        success: false,
        error: "Estado no válido",
      };
    }

    // Calcular progreso basado en el estado
    const calcularProgreso = (estado) => {
      const progresoMap = {
        REGISTRADO: 10,
        EN_BODEGA: 25,
        EN_TRANSITO: 60,
        EN_REPARTO: 90,
        ENTREGADO: 100,
        DEVUELTO: 100,
        ANULADO: 0,
      };
      return progresoMap[estado] || 0;
    };

    // Actualizar envío y crear evento en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar estado del envío
      const envioActualizado = await tx.envios.update({
        where: { id: envioId },
        data: {
          estado: nuevoEstado,
          progreso: calcularProgreso(nuevoEstado),
          fechaEntrega: nuevoEstado === "ENTREGADO" ? new Date() : null,
        },
        include: {
          cliente: { select: { nombre: true, email: true } },
          sucursalOrigen: { select: { nombre: true } },
          sucursalDestino: { select: { nombre: true } },
        },
      });

      // Crear evento de seguimiento
      await tx.eventos_envio.create({
        data: {
          id: `evento_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 11)}`,
          envioId,
          estado: nuevoEstado,
          comentario: descripcion || getDescripcionEstado(nuevoEstado),
          ubicacion:
            ubicacion ||
            (nuevoEstado === "ENTREGADO"
              ? envio.sucursalDestino.nombre
              : envio.sucursalOrigen.nombre),
          fotoUrl: fotoUrl || null,
          firmaUrl: firmaUrl || null,
        },
      });

      return envioActualizado;
    });

    revalidatePath("/dashboard/envios");

    return {
      success: true,
      data: resultado,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al actualizar el estado del envío",
    };
  }
}

/**
 * Asignar envío a usuario/conductor
 */
export async function asignarEnvio(envioId, usuarioId) {
  try {
    if (!envioId || !usuarioId) {
      return {
        success: false,
        error: "ID de envío y usuario son requeridos",
      };
    }

    // Verificar que el envío existe y está en estado válido para asignación
    const envio = await prisma.envios.findFirst({
      where: {
        id: envioId,
        deletedAt: null,
        estado: { in: ["REGISTRADO", "EN_BODEGA"] },
      },
    });

    if (!envio) {
      return {
        success: false,
        error: "Envío no encontrado o no está disponible para asignación",
      };
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuarios.findFirst({
      where: { id: usuarioId, deletedAt: null },
      select: { id: true, name: true, role: true },
    });

    if (!usuario) {
      return {
        success: false,
        error: "Usuario no encontrado",
      };
    }

    // Asignar envío y crear evento de asignación en transacción
    const envioActualizado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.envios.update({
        where: { id: envioId },
        data: {
          asignadoA: usuarioId,
          estado: "EN_BODEGA",
        },
        include: {
          usuario: { select: { name: true } },
          cliente: { select: { nombre: true } },
        },
      });

      await tx.eventos_envio.create({
        data: {
          id: `evento_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 11)}`,
          envioId,
          estado: "EN_BODEGA",
          comentario: `Envío asignado a ${usuario.name}`,
          ubicacion: "Centro de distribución",
        },
      });

      return actualizado;
    });

    revalidatePath("/dashboard/envios");

    return {
      success: true,
      data: envioActualizado,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al asignar el envío",
    };
  }
}

/**
 * Obtener estadísticas de envíos
 */
export async function getEstadisticasEnvios() {
  try {
    const [totalEnvios, enviosPorEstado, enviosHoy, ingresosMes] =
      await Promise.all([
        // Total de envíos
        prisma.envios.count({
          where: { deletedAt: null },
        }),
        // Envíos por estado
        prisma.envios.groupBy({
          by: ["estado"],
          where: { deletedAt: null },
          _count: { estado: true },
        }),
        // Envíos de hoy
        prisma.envios.count({
          where: {
            deletedAt: null,
            fechaRegistro: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        // Ingresos del mes
        prisma.envios.aggregate({
          where: {
            deletedAt: null,
            estado: { not: "ANULADO" },
            fechaRegistro: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
          _sum: { total: true },
        }),
      ]);

    return {
      success: true,
      data: {
        totalEnvios,
        enviosPorEstado: enviosPorEstado.reduce((acc, item) => {
          acc[item.estado] = item._count.estado;
          return acc;
        }, {}),
        enviosHoy,
        ingresosMes: ingresosMes._sum.total || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener estadísticas",
    };
  }
}

/**
 * Generar número de guía único
 */
async function generarNumeroGuia(sucursalOrigenId) {
  const fecha = new Date();
  const año = fecha.getFullYear().toString();
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const dia = fecha.getDate().toString().padStart(2, "0");

  // Obtener provincia de la sucursal para prefijo
  const sucursal = await prisma.sucursales.findUnique({
    where: { id: sucursalOrigenId },
    select: { provincia: true },
  });

  if (!sucursal) {
    throw new Error("Sucursal de origen no encontrada");
  }

  const prefijo = (sucursal.provincia || "UNK").substring(0, 3).toUpperCase();

  // Aleatorio criptográficamente seguro para evitar colisiones
  const aleatorio = randomInt(0, 1_000_000).toString().padStart(6, "0");

  const numeroGuia = `${prefijo}-${año}${mes}${dia}-${aleatorio}`;

  return numeroGuia;
}

/**
 * Obtener descripción del estado
 */
function getDescripcionEstado(estado) {
  const descripciones = {
    REGISTRADO: "Envío registrado, pendiente de confirmación",
    EN_BODEGA: "Envío confirmado y en bodega",
    EN_TRANSITO: "Envío en tránsito hacia destino",
    EN_REPARTO: "Envío en reparto para entrega",
    ENTREGADO: "Envío entregado exitosamente",
    DEVUELTO: "Envío devuelto al remitente",
    ANULADO: "Envío anulado",
  };

  return descripciones[estado] || "Estado actualizado";
}

/**
 * Buscar envío por número de guía para pagos
 */
export async function buscarEnvioPorGuia(numeroGuia) {
  try {
    if (!numeroGuia || numeroGuia.trim().length < 3) {
      return {
        success: false,
        error: "Ingrese al menos 3 caracteres para buscar",
      };
    }

    const envio = await prisma.envios.findFirst({
      where: {
        guia: {
          contains: numeroGuia.trim(),
          mode: "insensitive",
        },
        deletedAt: null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            razonSocial: true,
            tipoDocumento: true,
            numeroDocumento: true,
            esEmpresa: true,
          },
        },
        sucursalOrigen: {
          select: {
            nombre: true,
            provincia: true,
          },
        },
        sucursalDestino: {
          select: {
            nombre: true,
            provincia: true,
          },
        },
        pagos: {
          select: {
            monto: true,
          },
        },
      },
    });

    if (!envio) {
      return {
        success: false,
        error: "No se encontró ningún envío con esa guía",
      };
    }

    // Calcular saldo pendiente
    const totalPagado = envio.pagos.reduce((sum, pago) => sum + pago.monto, 0);
    const saldoPendiente = envio.total - totalPagado;

    const clienteNombre = envio.cliente?.esEmpresa
      ? envio.cliente.razonSocial || envio.cliente.nombre
      : `${envio.cliente?.nombre || ""} ${
          envio.cliente?.apellidos || ""
        }`.trim();

    return {
      success: true,
      data: {
        id: envio.id,
        guia: envio.guia,
        cliente: clienteNombre,
        clienteId: envio.cliente?.id,
        total: envio.total,
        totalPagado,
        saldoPendiente,
        estado: envio.estado,
        fechaRegistro: envio.fechaRegistro,
        sucursalOrigen: envio.sucursalOrigen?.nombre,
        sucursalDestino: envio.sucursalDestino?.nombre,
        destinatario: envio.destinatarioNombre,
        // Información adicional para el voucher
        modalidad: envio.modalidad,
        tipoServicio: envio.tipoServicio,
        peso: envio.peso,
        descripcion: envio.descripcion,
      },
    };
  } catch (error) {
    console.error("Error al buscar envío:", error);
    return {
      success: false,
      error: "Error al buscar el envío",
    };
  }
}

/**
 * Buscar múltiples envíos por guía (para autocompletado)
 */
export async function buscarEnviosParaPago(query) {
  try {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: [],
      };
    }

    const envios = await prisma.envios.findMany({
      where: {
        guia: {
          contains: query.trim(),
          mode: "insensitive",
        },
        deletedAt: null,
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellidos: true,
            razonSocial: true,
            esEmpresa: true,
          },
        },
        pagos: {
          select: {
            monto: true,
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    const enviosConSaldo = envios
      .map((envio) => {
        const totalPagado = envio.pagos.reduce(
          (sum, pago) => sum + pago.monto,
          0
        );
        const saldoPendiente = envio.total - totalPagado;

        const clienteNombre = envio.cliente?.esEmpresa
          ? envio.cliente.razonSocial || envio.cliente.nombre
          : `${envio.cliente?.nombre || ""} ${
              envio.cliente?.apellidos || ""
            }`.trim();

        return {
          id: envio.id,
          guia: envio.guia,
          cliente: clienteNombre,
          total: envio.total,
          saldoPendiente,
          estado: envio.estado,
        };
      })
      .filter((envio) => envio.saldoPendiente > 0); // Solo envíos con saldo pendiente

    return {
      success: true,
      data: enviosConSaldo,
    };
  } catch (error) {
    console.error("Error al buscar envíos:", error);
    return {
      success: false,
      error: "Error al buscar envíos",
    };
  }
}
