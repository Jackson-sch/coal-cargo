# Sistema de Gestión de Envíos

Sistema integral de gestión de envíos y logística desarrollado con Next.js 14, Prisma y PostgreSQL.

## Características Principales

- **Gestión de Envíos**: Control completo del ciclo de vida de los envíos
- **Facturación Electrónica**: Integración con SUNAT para comprobantes electrónicos
- **Gestión de Clientes**: Base de datos completa de clientes y destinatarios
- **Dashboard Analítico**: Métricas y reportes en tiempo real
- **Configuración Flexible**: Sistema de configuración modular
- **Autenticación Segura**: Sistema de login con NextAuth.js

## Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: NextAuth.js
- **Facturación**: Integración con API-GO para SUNAT

## Instalación

1. Clona el repositorio:
```bash
git clone [url-del-repositorio]
cd coal_cargo
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env.local
```

4. Configura la base de datos:
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── dashboard/         # Páginas del dashboard
│   ├── login/            # Página de login
│   └── api/              # API Routes
├── components/           # Componentes reutilizables
├── lib/                 # Utilidades y configuraciones
├── hooks/               # Custom hooks
└── styles/              # Estilos globales
```

## Configuración

El sistema incluye un módulo de configuración completo que permite personalizar:

- Información de la empresa
- Configuración de facturación
- Parámetros operacionales
- Notificaciones del sistema

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
