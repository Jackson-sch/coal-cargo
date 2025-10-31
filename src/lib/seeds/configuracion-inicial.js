const { prisma } = require("../prisma-cjs");
async function seedConfiguracionInicial() {
  const configuraciones = [
    {
      clave: "empresa_nombre",
      valor: "Encomiendas Express Perú",
      tipo: "string",
      descripcion: "Nombre de la empresa",
    },
    {
      clave: "empresa_ruc",
      valor: "20123456789",
      tipo: "string",
      descripcion: "RUC de la empresa",
    },
    {
      clave: "empresa_direccion",
      valor: "Av. Principal 123, Lima, Perú",
      tipo: "string",
      descripcion: "Dirección fiscal",
    },
    {
      clave: "empresa_telefono",
      valor: "+51 1 234-5678",
      tipo: "string",
      descripcion: "Teléfono principal",
    },
    {
      clave: "empresa_email",
      valor: "info@encomiendas.com.pe",
      tipo: "string",
      descripcion: "Email de contacto",
    },
    {
      clave: "notificaciones_sms_activo",
      valor: "true",
      tipo: "boolean",
      descripcion: "Activar notificaciones SMS",
    },
    {
      clave: "notificaciones_email_activo",
      valor: "true",
      tipo: "boolean",
      descripcion: "Activar notificaciones por email",
    },
    {
      clave: "dias_retencion_agencia",
      valor: "30",
      tipo: "number",
      descripcion: "Días que se retiene un paquete en agencia",
    },
    {
      clave: "peso_maximo_envio",
      valor: "50",
      tipo: "number",
      descripcion: "Peso máximo por envío en kg",
    },
    {
      clave: "valor_maximo_declarado",
      valor: "10000",
      tipo: "number",
      descripcion: "Valor declarado máximo en soles",
    },
    {
      clave: "igv_porcentaje",
      valor: "18",
      tipo: "number",
      descripcion: "Porcentaje de IGV",
    },
    {
      clave: "url_seguimiento_publico",
      valor: "https://encomiendas.com.pe/seguimiento",
      tipo: "string",
      descripcion: "URL pública para seguimiento",
    },
  ];
  try {
    for (const config of configuraciones) {
      await prisma.configuracion.upsert({
        where: { clave: config.clave },
        update: config,
        create: config,
      });
    }
  } catch (error) {
    throw error;
  }
}
module.exports = { seedConfiguracionInicial };
