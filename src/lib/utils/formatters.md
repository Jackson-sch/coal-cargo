# Utilidades de Formateo

Este archivo contiene funciones reutilizables para formatear fechas y moneda peruana en el sistema de gestión.

## Funciones de Formateo de Fechas

### `formatDate(date, formatString, options)`

Función principal para formatear fechas con localización en español.

**Parámetros:**
- `date`: Date|string|number - La fecha a formatear
- `formatString`: string - El formato deseado (por defecto: 'dd/MM/yyyy')
- `options`: Object - Opciones adicionales de date-fns

**Ejemplos:**
```javascript
import { formatDate } from '@/lib/utils/formatters';

// Fecha básica
formatDate(new Date()) // "15/01/2024"
formatDate("2024-01-15") // "15/01/2024"
formatDate(1705334400000) // "15/01/2024"

// Con formato personalizado
formatDate(new Date(), 'dd-MM-yyyy') // "15-01-2024"
formatDate(new Date(), 'EEEE, dd MMMM yyyy') // "lunes, 15 enero 2024"
```

### `formatDateLong(date)`

Formatea una fecha en formato largo.

**Ejemplos:**
```javascript
import { formatDateLong } from '@/lib/utils/formatters';

formatDateLong(new Date()) // "15 de enero de 2024"
formatDateLong("2024-12-25") // "25 de diciembre de 2024"
```

### `formatDateShort(date)`

Formatea una fecha en formato corto.

**Ejemplos:**
```javascript
import { formatDateShort } from '@/lib/utils/formatters';

formatDateShort(new Date()) // "15/01/24"
formatDateShort("2024-12-25") // "25/12/24"
```

### `formatDateTime(date)`

Formatea una fecha con hora.

**Ejemplos:**
```javascript
import { formatDateTime } from '@/lib/utils/formatters';

formatDateTime(new Date()) // "15/01/2024 14:30"
formatDateTime("2024-01-15T14:30:00") // "15/01/2024 14:30"
```

### `formatDateTimeFull(date)`

Formatea una fecha con hora completa incluyendo segundos.

**Ejemplos:**
```javascript
import { formatDateTimeFull } from '@/lib/utils/formatters';

formatDateTimeFull(new Date()) // "15/01/2024 14:30:45"
```

### `formatTime(date)`

Formatea solo la hora.

**Ejemplos:**
```javascript
import { formatTime } from '@/lib/utils/formatters';

formatTime(new Date()) // "14:30"
formatTime("2024-01-15T14:30:00") // "14:30"
```

## Funciones de Formateo de Moneda

### `formatCurrency(amount, options)`

Función principal para formatear moneda peruana.

**Parámetros:**
- `amount`: number|string - El monto a formatear
- `options`: Object - Opciones de formateo
  - `showSymbol`: boolean - Mostrar símbolo S/ (por defecto: true)
  - `showCode`: boolean - Mostrar código PEN (por defecto: false)
  - `decimals`: number - Número de decimales (por defecto: 2)

**Ejemplos:**
```javascript
import { formatCurrency } from '@/lib/utils/formatters';

// Básico
formatCurrency(1234.56) // "S/ 1,234.56"
formatCurrency("1234.56") // "S/ 1,234.56"

// Con opciones
formatCurrency(1234.56, { showSymbol: false }) // "1,234.56"
formatCurrency(1234.56, { showCode: true }) // "S/ 1,234.56 PEN"
formatCurrency(1234.56, { decimals: 0 }) // "S/ 1,235"
formatCurrency(1234.56, { showSymbol: false, showCode: true }) // "1,234.56 PEN"
```

### `formatSoles(amount, decimals)`

Formatea un monto con el símbolo S/.

**Ejemplos:**
```javascript
import { formatSoles } from '@/lib/utils/formatters';

formatSoles(1234.56) // "S/ 1,234.56"
formatSoles(1234.56, 0) // "S/ 1,235"
formatSoles(1234.567, 3) // "S/ 1,234.567"
```

### `formatPEN(amount, decimals)`

Formatea un monto con el código PEN.

**Ejemplos:**
```javascript
import { formatPEN } from '@/lib/utils/formatters';

formatPEN(1234.56) // "1,234.56 PEN"
formatPEN(1234.56, 0) // "1,235 PEN"
```

### `formatSolesPEN(amount, decimals)`

Formatea un monto con símbolo S/ y código PEN.

**Ejemplos:**
```javascript
import { formatSolesPEN } from '@/lib/utils/formatters';

formatSolesPEN(1234.56) // "S/ 1,234.56 PEN"
formatSolesPEN(1234.56, 0) // "S/ 1,235 PEN"
```

### `formatNumber(amount, decimals)`

Formatea solo el número sin símbolo ni código.

**Ejemplos:**
```javascript
import { formatNumber } from '@/lib/utils/formatters';

formatNumber(1234.56) // "1,234.56"
formatNumber(1234.56, 0) // "1,235"
formatNumber(1234.567, 3) // "1,234.567"
```

## Uso en Componentes React

### Ejemplo completo en un componente:

```jsx
import React from 'react';
import { 
  formatDate, 
  formatDateTime, 
  formatSoles, 
  formatPEN 
} from '@/lib/utils/formatters';

function EnvioCard({ envio }) {
  return (
    <div className="card">
      <h3>Envío #{envio.id}</h3>
      <p>Fecha: {formatDate(envio.fechaCreacion)}</p>
      <p>Última actualización: {formatDateTime(envio.updatedAt)}</p>
      <p>Costo: {formatSoles(envio.costo)}</p>
      <p>Total: {formatPEN(envio.total)}</p>
    </div>
  );
}
```

### Ejemplo en una tabla:

```jsx
import { formatDateShort, formatSoles } from '@/lib/utils/formatters';

function EnviosTable({ envios }) {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Costo</th>
        </tr>
      </thead>
      <tbody>
        {envios.map(envio => (
          <tr key={envio.id}>
            <td>{envio.id}</td>
            <td>{formatDateShort(envio.fecha)}</td>
            <td>{formatSoles(envio.costo)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Manejo de Errores

Todas las funciones incluyen manejo de errores y devuelven valores por defecto seguros:

- Las funciones de fecha devuelven una cadena vacía `''` si la fecha es inválida
- Las funciones de moneda devuelven `'S/ 0.00'` o `'0.00'` según corresponda si el monto es inválido
- Los errores se registran en la consola con `console.warn()` para facilitar el debugging

## Localización

Las funciones de fecha utilizan la localización en español (`es`) de date-fns, por lo que:
- Los nombres de meses aparecen en español: "enero", "febrero", etc.
- Los nombres de días aparecen en español: "lunes", "martes", etc.
- El formato de números sigue las convenciones peruanas

## Rendimiento

Las funciones están optimizadas para:
- Manejar diferentes tipos de entrada (Date, string, number)
- Validar datos antes del formateo
- Reutilizar configuraciones comunes
- Minimizar las importaciones necesarias