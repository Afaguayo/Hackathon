# Frontend (responsable: Gael)

Lo que el lector ve y usa. Aplicación basada en el **Sistema de Diseño Reed (V1 · Septiembre 2026 - Innovathon 2.0)** con el sistema de acompañamiento interactivo de Reed. Ver el [README del proyecto](../README.md).

## Estado
**Conectado al backend.** Esta app es la página principal del sitio (https://reefai-app.vercel.app): Vercel la compila y la sirve desde el mismo proyecto que la API, así que todo va por el mismo dominio.

- **Sin sesión** (o sin `VITE_CLERK_PUBLISHABLE_KEY`): modo demo con los libros de `data/sampleBooks.ts` y respuestas de ejemplo.
- **Con sesión de Clerk**: tu biblioteca real, subida de libros, voz de ElevenLabs y Reed con IA real. Todo pasa por `src/services/api.ts`, que añade el token de Clerk a cada llamada.

## Lo que usa del backend (`src/services/api.ts`)
| Función | Endpoint | Para qué |
|---|---|---|
| `listLibrary()` | `GET /api/documents` | Tus libros con su progreso |
| `uploadBook(file, título, autor)` | `POST /api/documents` | Sube EPUB/PDF/TXT/MD (máx. 4 MB); el backend extrae capítulos y párrafos |
| `loadBookContent(book)` | `GET /api/documents/:id/content` | Capítulos y párrafos al abrir un libro |
| `saveProgress(id, posición, %)` | `PUT /api/documents/:id/progress` | Guarda dónde quedaste (automático en el lector) |
| `synthesizeSpeech(texto)` | `POST /api/tts` | Voz de ElevenLabs por párrafo; si se acaba el límite diario, el lector usa la voz del navegador |
| `explainParagraph(párrafo, pregunta)` | `POST /api/ai/explain` | Reed explica un párrafo |
| `summarizeChapter(título, texto)` | `POST /api/ai/summarize` | Resumen del capítulo |
| `generateQuiz(título, texto)` | `POST /api/ai/quiz` | 3–5 preguntas de opción múltiple |

Las respuestas de Reed salen de un agente de ElevenLabs en modo texto. Límites diarios por usuario: 5 000 caracteres de voz, 10 libros, 100 respuestas de Reed.
## Identidad: Reed
> *«El amigo curioso que ya leyó el libro y te lo cuenta con calma.»*
- **Principios**: *Se dobla, no exige*, *El libro manda*, *Preguntar es lo principal*, *Calma, como la música*.
- **Regla de color**: *«Un solo botón verde por vista. El ámbar solo suena.»*
- **Temas**: «Papiro» (Claro) y «Noche» (Oscuro).
- **Tipografía**: `Literata` para el texto de lectura y títulos; `Atkinson Hyperlegible` para la interfaz.

## Modos de Acompañamiento de Reed (Integrados en la Barra Inferior)
El lector decide el nivel de intervención de Reed tocando la burbuja circular integrada en el reproductor de audio:
1. 💤 **Dormido** (*«Déjame solo»*): Reed no interrumpe, no genera resúmenes ni preguntas. El usuario lee a solas.
2. 🙂 **Compañero** (*«Acompáñame»*): Amigo que lee contigo. Resúmenes de página, capítulo o sesión con texto real del libro, y datos curiosos breves.
3. 🎓 **Profesor** (*«Enséñame»*):
   - **Guía socrática**: Ofrece pistas progresivas y preguntas de razonamiento antes de una explicación directa.
   - **Test de sesión**: Evaluaciones formativas de 3 a 6 preguntas basadas exclusivamente en lo leído durante la sesión.
   - **Guía de ritmo personalizada**: Sugerencias de lectura basadas en el tiempo y hábitos.
4. 📚 **Bibliotecario** (*«Ayúdame con mis libros»*):
   - **Libros similares**: Recomendaciones con explicaciones reales basadas en temas, género y autor.
   - **🎲 Recomiéndame algo**: Recomendación aleatoria inteligente de la biblioteca.
   - **Consultas a mi biblioteca**: Búsqueda directa por autor, época, pendientes y género sin IA arbitraria.
5. 🎧 **Lector** (*«Léemelo»*):
   - Lectura de texto en voz alta con controles de audio en ámbar (`ListenBar`).
   - Velocidades soportadas: `0.75×`, `1×`, `1.25×`, `1.5×`, `2×`.
   - Navegación salto de párrafos y sincronización de cursor visual.

## Tecnología implementada
- **React 18 + TypeScript + Vite + Tailwind CSS**
- **Clerk**: Componentes de sesión y autenticación de usuario (`@clerk/clerk-react`).
- **Contexto Global de Reed**: `src/context/ReedContext.tsx` para sincronización de modo y estadísticas de lectura.
- **Reproductor ListenBar & ReedBubble**: Barra de audio con selector de modos flotante.
- **Lucide React**: Iconografía en retícula de 24px con trazo 1.75px.

## Cómo ejecutar el proyecto (dos terminales)
1. **Backend** (en la raíz del repo; necesita el `.env.local` de la raíz, pídeselo a Angel):
   ```bash
   npm install
   npm run dev          # API de Next en http://localhost:3000
   ```
2. **Frontend** (en `frontend/`):
   ```bash
   npm install
   npm run dev          # esta app en http://localhost:5173; /api se reenvía al backend
   ```
   Si solo corres el frontend, funciona en modo demo (sin biblioteca real ni IA).

3. **Compilar todo como en Vercel** (en la raíz): `npm run build` compila esta app en `public/app/` y luego Next.

## Se comunica con
- [backend](../backend/README.md): mediante `src/services/api.ts`.

## Claves necesarias (en `frontend/.env.local`, nunca se suben a GitHub)
```env
# Clave pública de Clerk: la misma que NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY del backend
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```
`VITE_BACKEND_URL` ya no hace falta: la app llama a `/api` en el mismo dominio.
