"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * DEPARTAMENTOS
 */

/**
 * Obtener todos los departamentos
 */
export async function getDepartamentos() {
  try {
    // Verificar si la tabla existe y tiene datos
    const count = await prisma.ubigeo_departamentos.count();

    if (count === 0) {
      // Si no hay datos, crear algunos de prueba
      await prisma.ubigeo_departamentos.createMany({
        data: [
          {
            id: "dept_lima",
            codigo: "LIMA",
            nombre: "LIMA",
          },
          {
            id: "dept_arequipa",
            codigo: "AREQUIPA",
            nombre: "AREQUIPA",
          },
          {
            id: "dept_cusco",
            codigo: "CUSCO",
            nombre: "CUSCO",
          },
          {
            id: "dept_la_libertad",
            codigo: "LA_LIBERTAD",
            nombre: "LA LIBERTAD",
          },
          {
            id: "dept_piura",
            codigo: "PIURA",
            nombre: "PIURA",
          },
        ],
        skipDuplicates: true,
      });
    }

    const departamentos = await prisma.ubigeo_departamentos.findMany({
      orderBy: { nombre: "asc" },
      include: {
        _count: {
          select: { provincias: true },
        },
      },
    });

    return {
      success: true,
      data: departamentos,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener departamentos",
    };
  }
}

/**
 * PROVINCIAS
 */

/**
 * Obtener provincias por departamento
 */
export async function getProvincias(departamentoId = null) {
  try {
    const whereClause = departamentoId ? { departamentoId } : {};

    // Verificar si hay provincias
    const count = await prisma.ubigeo_provincias.count({ where: whereClause });

    if (count === 0 && departamentoId) {
      // Crear provincias de prueba para el departamento
      const provinciasData = [];

      if (departamentoId === "dept_lima") {
        provinciasData.push(
          {
            id: "prov_lima",
            codigo: "LIMA",
            nombre: "LIMA",
            departamentoId: "dept_lima",
          },
          {
            id: "prov_callao",
            codigo: "CALLAO",
            nombre: "CALLAO",
            departamentoId: "dept_lima",
          }
        );
      } else if (departamentoId === "dept_arequipa") {
        provinciasData.push({
          id: "prov_arequipa",
          codigo: "AREQUIPA",
          nombre: "AREQUIPA",
          departamentoId: "dept_arequipa",
        });
      }

      if (provinciasData.length > 0) {
        await prisma.ubigeo_provincias.createMany({
          data: provinciasData,
          skipDuplicates: true,
        });
      }
    }

    const provincias = await prisma.ubigeo_provincias.findMany({
      where: whereClause,
      orderBy: { nombre: "asc" },
      include: {
        departamento: {
          select: { nombre: true },
        },
        _count: {
          select: { distritos: true },
        },
      },
    });

    return {
      success: true,
      data: provincias,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener provincias",
    };
  }
}

/**
 * DISTRITOS
 */

/**
 * Obtener distritos por provincia
 */
export async function getDistritos(provinciaId = null) {
  try {
    const whereClause = provinciaId ? { provinciaId } : {};

    // Verificar si hay distritos
    const count = await prisma.ubigeo_distritos.count({ where: whereClause });

    if (count === 0 && provinciaId) {
      // Crear distritos de prueba para la provincia
      const distritosData = [];

      if (provinciaId === "prov_lima") {
        distritosData.push(
          {
            id: "dist_lima",
            codigo: "LIMA",
            nombre: "LIMA",
            provinciaId: "prov_lima",
          },
          {
            id: "dist_miraflores",
            codigo: "MIRAFLORES",
            nombre: "MIRAFLORES",
            provinciaId: "prov_lima",
          },
          {
            id: "dist_san_isidro",
            codigo: "SAN_ISIDRO",
            nombre: "SAN ISIDRO",
            provinciaId: "prov_lima",
          }
        );
      } else if (provinciaId === "prov_arequipa") {
        distritosData.push({
          id: "dist_arequipa",
          codigo: "AREQUIPA",
          nombre: "AREQUIPA",
          provinciaId: "prov_arequipa",
        });
      }

      if (distritosData.length > 0) {
        await prisma.ubigeo_distritos.createMany({
          data: distritosData,
          skipDuplicates: true,
        });
      }
    }

    const distritos = await prisma.ubigeo_distritos.findMany({
      where: whereClause,
      orderBy: { nombre: "asc" },
      include: {
        provincia: {
          select: {
            nombre: true,
            departamento: {
              select: { nombre: true },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: distritos,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al obtener distritos",
    };
  }
}

/**
 * Crear departamento
 */
export async function createDepartamento(data) {
  try {
    const { codigo, nombre } = data;

    if (!codigo || !nombre) {
      return {
        success: false,
        error: "Código y nombre son requeridos",
      };
    }

    const departamento = await prisma.ubigeo_departamentos.create({
      data: {
        id: `dept_${codigo.toLowerCase().replace(/\s+/g, "_")}`,
        codigo: codigo.toUpperCase(),
        nombre: nombre.toUpperCase(),
      },
    });

    revalidatePath("/dashboard/configuracion/ubicaciones");

    return {
      success: true,
      data: departamento,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al crear departamento",
    };
  }
}

/**
 * Crear provincia
 */
export async function createProvincia(data) {
  try {
    const { codigo, nombre, departamentoId } = data;

    if (!codigo || !nombre || !departamentoId) {
      return {
        success: false,
        error: "Código, nombre y departamento son requeridos",
      };
    }

    const provincia = await prisma.ubigeo_provincias.create({
      data: {
        id: `prov_${codigo.toLowerCase().replace(/\s+/g, "_")}`,
        codigo: codigo.toUpperCase(),
        nombre: nombre.toUpperCase(),
        departamentoId,
      },
    });

    revalidatePath("/dashboard/configuracion/ubicaciones");

    return {
      success: true,
      data: provincia,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al crear provincia",
    };
  }
}

/**
 * Crear distrito
 */
export async function createDistrito(data) {
  try {
    const { codigo, nombre, provinciaId } = data;

    if (!codigo || !nombre || !provinciaId) {
      return {
        success: false,
        error: "Código, nombre y provincia son requeridos",
      };
    }

    const distrito = await prisma.ubigeo_distritos.create({
      data: {
        id: `dist_${codigo.toLowerCase().replace(/\s+/g, "_")}`,
        codigo: codigo.toUpperCase(),
        nombre: nombre.toUpperCase(),
        provinciaId,
      },
    });

    revalidatePath("/dashboard/configuracion/ubicaciones");

    return {
      success: true,
      data: distrito,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error al crear distrito",
    };
  }
}
