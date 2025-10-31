import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
