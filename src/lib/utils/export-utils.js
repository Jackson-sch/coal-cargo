import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatSoles } from "./formatters";

/**
 * Exportar datos de clientes a Excel
 * @param {Array} clientes - Array de clientes
 * @param {string} filename - Nombre del archivo (sin extensión)
 */
export function exportClientesToExcel(clientes, filename = "clientes") {
  // Preparar datos para Excel
  const data = clientes.map((cliente) => ({
    "Tipo Cliente":
      cliente.tipoDocumento === "DNI" ? "PERSONA NATURAL" : "PERSONA JURIDICA",
    "Tipo Documento": cliente.tipoDocumento,
    "Número Documento": cliente.numeroDocumento,
    "Nombre/Razón Social":
      cliente.tipoDocumento === "DNI"
        ? `${cliente.nombre} ${cliente.apellidos}`
        : cliente.razonSocial,
    Email: cliente.email || "",
    Teléfono: cliente.telefono || "",
    Dirección: cliente.direccion || "",
    Distrito: cliente.distrito?.nombre || "",
    Provincia: cliente.distrito?.provincia?.nombre || "",
    Departamento: cliente.distrito?.provincia?.departamento?.nombre || "",
    Estado: cliente.estado ? "Activo" : "Inactivo",
    "Fecha Creación": new Date(cliente.createdAt).toLocaleDateString("es-PE"),
  }));

  // Crear libro de trabajo
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");

  // Ajustar ancho de columnas
  const maxWidth = 50;
  const columnWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(key.length, ...data.map((row) => String(row[key] || "").length)),
      maxWidth
    ),
  }));
  worksheet["!cols"] = columnWidths;

  // Generar archivo
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Descargar archivo
  const timestamp = new Date().toISOString().split("T")[0];
  saveAs(blob, `${filename}_${timestamp}.xlsx`);
}

/**
 * Preparar página para impresión
 * @param {Object} options - Opciones de impresión
 * @param {string} options.title - Título del documento
 * @param {string} options.subtitle - Subtítulo del documento
 */
export function prepareForPrint(options = {}) {
  const { title = "Lista de Clientes", subtitle = "" } = options;

  // Crear una nueva ventana para impresión
  const printWindow = window.open("", "_blank", "width=800,height=600");

  // Obtener el contenido que queremos imprimir
  const clientesContainer = document.querySelector(
    ".container.mx-auto.p-6.space-y-6"
  );
  if (!clientesContainer) {
    return;
  }

  // Clonar el contenido
  const clonedContent = clientesContainer.cloneNode(true);

  // Remover elementos que no queremos imprimir
  const elementsToRemove = clonedContent.querySelectorAll(
    ".no-print, button:not(.print-visible), .dropdown-menu"
  );
  elementsToRemove.forEach((el) => el.remove());

  // Crear el HTML para la ventana de impresión
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: white;
          color: black;
          padding: 20px;
          line-height: 1.4;
        }

        .print-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #ddd;
          padding-bottom: 20px;
        }

        .print-header h1 {
          font-size: 24px;
          margin-bottom: 10px;
          color: #000;
        }

        .print-header p {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        .stats-card {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }

        .stats-card h3 {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .stats-card .number {
          font-size: 24px;
          font-weight: bold;
          color: #000;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          font-size: 10px;
        }

        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }

        /* Hacer iconos más pequeños */
        svg, .lucide, [class*="lucide"] {
          width: 8px !important;
          height: 8px !important;
          display: inline-block;
          vertical-align: middle;
          margin-right: 3px;
        }

        /* Ocultar iconos en las tarjetas de estadísticas */
        .stats-card svg, .stats-card .lucide {
          display: none;
        }

        .no-print {
          display: none !important;
        }

        @media print {
          /* Forzar orientación horizontal por defecto */
          @page {
            size: A4 landscape;
            margin: 15mm;
          }

          body {
            margin: 0;
            width: 100%;
          }

          .stats-cards {
            page-break-inside: avoid;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }

          table {
            page-break-inside: auto;
            width: 100%;
            font-size: 9px;
          }

          tr {
            page-break-inside: avoid;
          }

          th, td {
            padding: 6px;
            font-size: 9px;
          }

          /* Ajustar ancho de columnas para horizontal */
          th:nth-child(1), td:nth-child(1) { width: 20%; }
          th:nth-child(2), td:nth-child(2) { width: 15%; }
          th:nth-child(3), td:nth-child(3) { width: 25%; }
          th:nth-child(4), td:nth-child(4) { width: 30%; }
          th:nth-child(5), td:nth-child(5) { width: 10%; }
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ""}
        <p>Impreso el ${dateStr} a las ${timeStr}</p>
        <p style="font-size: 10px; color: #999; font-style: italic;">
          💡 Recomendado: Orientación horizontal para mejor visualización
        </p>
      </div>
      <div id="content">
        ${clonedContent.innerHTML}
      </div>
      <script>
        window.onload = function() {
          // Limpiar contenido innecesario
          const elementsToHide = document.querySelectorAll('button, .no-print, [class*="dropdown"]');
          elementsToHide.forEach(el => el.style.display = 'none');

          // Hacer iconos más pequeños
          const icons = document.querySelectorAll('svg, .lucide, [class*="lucide"]');
          icons.forEach(icon => {
            icon.style.width = '8px';
            icon.style.height = '8px';
            icon.style.marginRight = '3px';
            icon.style.verticalAlign = 'middle';
          });

          // Ocultar iconos en tarjetas de estadísticas
          const statsIcons = document.querySelectorAll('.stats-card svg, .stats-card .lucide');
          statsIcons.forEach(icon => icon.style.display = 'none');

          // Configurar orientación horizontal y imprimir
          setTimeout(() => {
            // Configurar orientación horizontal si es posible
            if (window.matchMedia) {
              const mediaQueryList = window.matchMedia('print');
              mediaQueryList.addListener(() => {
                // Orientación horizontal configurada
              });
            }

            window.print();
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  // Escribir el contenido en la nueva ventana
  printWindow.document.write(printHTML);
  printWindow.document.close();
}

/**
 * Copiar datos al portapapeles
 * @param {Array} clientes - Array de clientes
 */
export async function copyToClipboard(clientes) {
  const text = clientes
    .map((cliente) => {
      const nombre =
        cliente.tipoDocumento === "DNI"
          ? `${cliente.nombre} ${cliente.apellidos}`
          : cliente.razonSocial;
      return `${cliente.numeroDocumento}\t${nombre}\t${cliente.email || ""}\t${
        cliente.telefono || ""
      }`;
    })
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Formatea el label de estado para mostrar en exportaciones
 * @param {string} val - Valor del estado
 * @returns {string} - Label formateado
 */
function formatEstadoLabel(val) {
  if (!val || val === "todos") return "Todos";
  return val
    .toString()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Transforma un envío a formato para exportación
 * @param {Object} envio - Objeto de envío
 * @returns {Object} - Objeto formateado para exportación
 */
function formatEnvioForExport(envio) {
  return {
    Guia: envio.guia,
    Estado: formatEstadoLabel(envio.estado),
    "Sucursal Origen": envio.sucursalOrigen?.nombre || "",
    "Sucursal Destino": envio.sucursalDestino?.nombre || "",
    Remitente: envio.remitenteNombre || "",
    Destinatario: envio.destinatarioNombre || "",
    "Fecha Registro": envio.fechaRegistro
      ? format(new Date(envio.fechaRegistro), "dd/MM/yyyy HH:mm", {
          locale: es,
        })
      : "",
    "Fecha Entrega": envio.fechaEntrega
      ? format(new Date(envio.fechaEntrega), "dd/MM/yyyy HH:mm", { locale: es })
      : "",
    Total: envio.total ?? 0,
  };
}

/**
 * Exporta envíos a Excel (página actual)
 * @param {Array} envios - Array de envíos a exportar
 * @returns {Object} - { success: boolean, error?: string }
 */
export function exportEnviosToExcel(envios) {
  try {
    const data = envios.map(formatEnvioForExport);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Envios");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const ts = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reportes_envios_${ts}.xlsx`;
    a.click();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Error al exportar reporte",
    };
  }
}

/**
 * Construye parámetros de exportación basados en filtros
 * @param {Object} filters - Objetos con filtros: { searchQuery, estado, fechaFiltro }
 * @param {Function} startOfDay - Función de date-fns para startOfDay
 * @param {Function} endOfDay - Función de date-fns para endOfDay
 * @param {Function} subDays - Función de date-fns para subDays
 * @returns {Object} - Parámetros formateados para la API
 */
export function buildEnviosExportParams(
  filters,
  { startOfDay, endOfDay, subDays }
) {
  const params = { page: 1 };
  if (filters.searchQuery) params.guia = filters.searchQuery;
  if (filters.estado !== "todos") params.estado = filters.estado;
  if (filters.fechaFiltro !== "todos") {
    const hoy = new Date();
    let fechaDesde, fechaHasta;
    switch (filters.fechaFiltro) {
      case "hoy":
        fechaDesde = startOfDay(hoy);
        fechaHasta = endOfDay(hoy);
        break;
      case "semana":
        fechaDesde = startOfDay(subDays(hoy, 7));
        fechaHasta = endOfDay(hoy);
        break;
      case "mes":
        fechaDesde = startOfDay(subDays(hoy, 30));
        fechaHasta = endOfDay(hoy);
        break;
    }
    if (fechaDesde) params.fechaDesde = fechaDesde.toISOString();
    if (fechaHasta) params.fechaHasta = fechaHasta.toISOString();
  }
  return params;
}

/**
 * Exporta todos los envíos a Excel según filtros
 * @param {Function} getEnvios - Función para obtener envíos desde la API
 * @param {Object} filters - Objetos con filtros
 * @param {number} total - Total de envíos (para límite)
 * @param {Function} startOfDay - Función de date-fns
 * @param {Function} endOfDay - Función de date-fns
 * @param {Function} subDays - Función de date-fns
 * @returns {Promise<Object>} - { success: boolean, error?: string }
 */
export async function exportAllEnviosToExcel(
  getEnvios,
  filters,
  total,
  { startOfDay, endOfDay, subDays }
) {
  try {
    const params = buildEnviosExportParams(filters, {
      startOfDay,
      endOfDay,
      subDays,
    });
    params.limit = total || 10000;
    const result = await getEnvios(params);
    if (!result.success) {
      throw new Error(result.error || "Error obteniendo datos");
    }
    const allEnvios = result.data.envios;
    const data = allEnvios.map(formatEnvioForExport);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Envios");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const ts = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reportes_envios_todo_${ts}.xlsx`;
    a.click();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Error al exportar reporte completo",
    };
  }
}

/**
 * Exporta envíos a CSV
 * @param {Array} envios - Array de envíos a exportar
 * @returns {Object} - { success: boolean, error?: string }
 */
export function exportEnviosToCSV(envios) {
  try {
    const headers = [
      "Guia",
      "Estado",
      "Sucursal Origen",
      "Sucursal Destino",
      "Remitente",
      "Destinatario",
      "Fecha Registro",
      "Fecha Entrega",
      "Total",
    ];
    const rows = envios.map((e) => [
      e.guia,
      formatEstadoLabel(e.estado),
      e.sucursalOrigen?.nombre || "",
      e.sucursalDestino?.nombre || "",
      e.remitenteNombre || "",
      e.destinatarioNombre || "",
      e.fechaRegistro
        ? format(new Date(e.fechaRegistro), "dd/MM/yyyy HH:mm", {
            locale: es,
          })
        : "",
      e.fechaEntrega
        ? format(new Date(e.fechaEntrega), "dd/MM/yyyy HH:mm", { locale: es })
        : "",
      e.total ?? 0,
    ]);
    const csvContent = [headers, ...rows]
      .map((r) => r.map((v) => `${String(v).replaceAll('"', '""')}`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const ts = new Date().toISOString().split("T")[0];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `reportes_envios_${ts}.csv`;
    a.click();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Error al exportar CSV" };
  }
}

/**
 * Exporta envíos a PDF (abre ventana de impresión)
 * @param {Array} envios - Array de envíos a exportar
 * @param {Object} empresaConfig - Configuración de la empresa: { nombre, ruc, direccion, telefono }
 * @param {Object} filters - Filtros aplicados: { estado, fechaFiltro }
 * @returns {Object} - { success: boolean, error?: string }
 */
export function exportEnviosToPDF(envios, empresaConfig, filters) {
  try {
    const win = window.open("", "_blank");
    if (!win) {
      throw new Error("No se pudo abrir ventana de impresión");
    }
    const ts = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });
    const totalPage = envios.reduce((acc, e) => acc + (e.total || 0), 0);
    const rows = envios
      .map(
        (e) =>
          ` <tr> <td>${e.guia || "-"}</td> <td>${
            formatEstadoLabel(e.estado) || "-"
          }</td> <td>${e.remitenteNombre || "-"}</td> <td>${
            e.destinatarioNombre || "-"
          }</td> <td>${e.sucursalOrigen?.nombre || "-"}</td> <td>${
            e.sucursalDestino?.nombre || "-"
          }</td> <td>${
            e.fechaRegistro
              ? format(new Date(e.fechaRegistro), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })
              : "-"
          }</td> <td>${
            e.fechaEntrega
              ? format(new Date(e.fechaEntrega), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })
              : "-"
          }</td> <td>${formatSoles(e.total || 0)}</td> </tr>`
      )
      .join("");
    const empresaNombre = (empresaConfig?.nombre || "Mi Empresa").replace(
      /</g,
      "&lt;"
    );
    const empresaRuc = (
      empresaConfig?.ruc ? `RUC ${empresaConfig.ruc}` : ""
    ).replace(/</g, "&lt;");
    const empresaDireccion = (empresaConfig?.direccion || "").replace(
      /</g,
      "&lt;"
    );
    const empresaTelefono = (
      empresaConfig?.telefono ? `Tel: ${empresaConfig.telefono}` : ""
    ).replace(/</g, "&lt;");
    const html = ` <html> <head> <title>Reporte de Envíos</title> <style> body { font-family: Arial, sans-serif; padding: 20px; color: #222; } .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; } .header .logo { height: 48px; width: auto; object-fit: contain; } .header .empresa { line-height: 1.2; } .empresa .nombre { font-size: 18px; font-weight: 700; } .empresa .meta { font-size: 12px; color: #555; } h1 { font-size: 16px; margin: 16px 0 6px 0; } .sub { color: #555; margin-bottom: 12px; font-size: 12px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; } th { background: #f5f5f5; text-align: left; } th:last-child, td:last-child { text-align: right; } thead { display: table-header-group; } tfoot { display: table-row-group; } tr { page-break-inside: avoid; } .hr { height: 1px; background: #e5e7eb; border: 0; margin: 8px 0 12px; } tfoot td { font-weight: 700; background: #fafafa; } .footer { position: fixed; left: 0; right: 0; bottom: 0; font-size: 12px; color: #555; display: flex; justify-content: flex-end; align-items: center; border-top: 1px solid #e5e7eb; padding: 6px 20px; background: #ffffff; } body { padding-bottom: 42px; } .pagenum:before { content: counter(page); } .pagecount:before { content: counter(pages); } @media print { .no-print { display: none; } body { padding: 12mm; } }
            </style> </head> <body> <div class="header"> <img src="/logo.png" class="logo" alt="Logo" onerror="this.style.display='none'" /> <div class="empresa"> <div class="nombre">${empresaNombre}</div> <div class="meta">${empresaRuc}</div> ${
      empresaDireccion ? `<div class="meta">${empresaDireccion}</div>` : ""
    } ${
      empresaTelefono ? `<div class="meta">${empresaTelefono}</div>` : ""
    } </div> </div> <hr class="hr" /> <h1>Reporte de Envíos</h1> <div class="sub">Generado: ${ts} — Filtros: Estado=${formatEstadoLabel(
      filters.estado
    )}, Fecha=${formatEstadoLabel(
      filters.fechaFiltro
    )}</div> <table> <thead> <tr> <th>Guía</th> <th>Estado</th> <th>Remitente</th> <th>Destinatario</th> <th>Origen</th> <th>Destino</th> <th>Registro</th> <th>Entrega</th> <th>Total</th> </tr> </thead> <tbody> ${rows} </tbody> <tfoot> <tr> <td colspan="8" style="text-align:right">Total</td> <td>${formatSoles(
      totalPage
    )}</td> </tr> </tfoot> </table> <div class="footer">Página <span class="pagenum"></span> de <span class="pagecount"></span></div> <script> // Lanzar impresión al cargar
              window.onload = () => setTimeout(() => { window.print(); }, 250); // Cerrar la ventana cuando termine la impresión
              window.onafterprint = () => { try { window.close(); } catch (e) {} }; // Fallback para navegadores que usan media query de print
              try { const mql = window.matchMedia('print'); if (mql && mql.addEventListener) { mql.addEventListener('change', (e) => { if (!e.matches) { setTimeout(() => { try { window.close(); } catch (e) {} }, 150); }
                  }); }
              } catch (_) {} // Fallback adicional por si no se dispara afterprint
              setTimeout(() => { try { window.close(); } catch (e) {} }, 5000); </script> </body> </html>`;
    win.document.write(html);
    win.document.close();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Error al generar PDF" };
  }
}
