# Oye — Prototipo de entrenamiento auditivo

Prototipo funcional de una Web App móvil (HTML + CSS + JS puro) para personas con dificultades auditivas.
Primera actividad implementada: **"¿Qué veo?"**.

## Estructura del proyecto

```
/index.html         Pantalla principal (home)
/activity.html       Actividad "¿Qué veo?"
/admin.html          Panel de administración
/css/styles.css      Sistema de diseño (tokens + componentes)
/js/supabase-config.js   Credenciales y configuración de Supabase
/js/data-service.js      Capa de acceso a datos (reutilizable entre pantallas)
/js/activity.js          Lógica de la actividad
/js/admin.js             Lógica del panel de administración
/supabase-setup.sql       Script SQL para crear tablas, políticas y buckets
/manifest.json            Manifest básico para comportamiento tipo PWA
```

## 1. Configurar Supabase (una sola vez)

1. Entra al **SQL Editor** de tu proyecto Supabase.
2. Copia y ejecuta el contenido de `supabase-setup.sql`. Esto crea:
   - Tabla `exercises` (ejercicios / imágenes).
   - Tabla `exercise_audios` (audios asociados, con `is_correct`).
   - Políticas RLS abiertas para lectura/escritura con la clave anónima (solo para este prototipo).
   - Buckets de Storage públicos `images` y `audios`.
3. Verifica en **Storage** que los buckets `images` y `audios` existan y estén marcados como **públicos**.

Las credenciales (URL y anon key) ya están integradas en `js/supabase-config.js`. Si cambian, actualízalas ahí.

## 2. Ejecutar el prototipo

Como es HTML/CSS/JS puro, basta con servir la carpeta con cualquier servidor estático (no funciona abriendo el archivo directamente por temas de CORS del SDK de Supabase y carga de módulos):

```bash
# Opción simple con Python
python3 -m http.server 8080

# u opción con Node
npx serve .
```

Luego abre `http://localhost:8080` en el navegador de tu teléfono (o en modo responsive/mobile del navegador de escritorio).

## 3. Cargar contenido desde el panel de administración

1. Ve a `admin.html` (enlace "Panel de administración" al final del home).
2. En la pestaña **Nuevo ejercicio**:
   - Escribe un nombre descriptivo (se usará como retroalimentación, ej. "una fuente con manzanas").
   - Sube la imagen del ejercicio.
   - Sube al menos 2 audios, agrega una etiqueta interna a cada uno (opcional, solo para tu referencia) y marca cuál es la alternativa **correcta**.
   - Presiona **Guardar ejercicio**.
3. En la pestaña **Ejercicios** puedes ver todos los ejercicios cargados, editar el nombre o eliminarlos.

## 4. Probar la actividad

Desde el home, entra a **"¿Qué veo?"**. Se mostrará un ejercicio aleatorio; al tocar una alternativa se reproduce el audio y se registra como respuesta. La app avanza automáticamente al siguiente ejercicio y evita repetir el mismo dos veces seguidas cuando hay más de uno disponible.

## Notas para expansión futura

- El campo `activity_type` en la tabla `exercises` ya está preparado para agregar nuevas actividades sin cambiar el esquema (basta con usar un nuevo valor, ej. `identifica_sonido`).
- `DataService` centraliza toda la lógica de Supabase: nuevas actividades pueden reutilizar `uploadFile`, o agregar nuevos métodos siguiendo el mismo patrón.
- El sistema de diseño (`css/styles.css`) usa variables CSS (tokens) para colores y radios, facilitando mantener consistencia visual al agregar pantallas nuevas.
- Las políticas RLS actuales son abiertas (aptas solo para prototipo/demo). Antes de producción, se debe restringir la escritura del panel de administración a usuarios autenticados (Supabase Auth).
