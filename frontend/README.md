# Frontend (responsable: Gael)

Lo que el lector ve y usa. Aplicación basada en el **Sistema de Diseño Reed (V1 · Septiembre 2026 - Innovathon 2.0)** con el sistema de acompañamiento interactivo de Reed. Ver el [README del proyecto](../README.md).

## Estado
**Todavía no hay interfaz.** `src/app/page.tsx` es solo una página de relleno. Primero decidimos en equipo cómo va a ser la app; ElevenLabs ya está conectado en el servidor y listo para usarse.

## Lo que la interfaz puede usar
- `POST /api/tts` con `{ "text": "..." }` → devuelve audio MP3 (leer en voz alta). Máximo 2500 caracteres.
- `GET /api/companion/signed-url` → devuelve `{ "signedUrl": "wss://..." }` para hablar con el agente de ElevenLabs.
  - En React: envolver la página en `<ConversationProvider>` de `@elevenlabs/react` (ya instalado) y llamar `useConversation().startSession({ signedUrl, dynamicVariables: { passage, book_title } })`.
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

## Cómo ejecutar el proyecto
1. Instalar dependencias (ya configuradas):
   ```bash
   npm install
   ```
2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abrirá la app en `http://localhost:3000`.

3. Compilar para producción:
   ```bash
   npm run build
   ```

## Siguientes tareas
1. Decidir en equipo cómo se ve y qué hace la app.
2. Construir la interfaz en `src/app/` (y `src/components/` si hace falta).
## Se comunica con
- [backend](../backend/README.md): Conectado mediante `src/services/api.ts` hacia la API de Emmanuel.

## Para correrlo
`npm install`, copiar `.env.example` a `.env.local` con las claves, `npm run dev` → http://localhost:3000.
## Claves necesarias (en `.env.local`, nunca se suben a GitHub)
```env
# Clave pública de Clerk (dashboard.clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# URL de la API del backend
VITE_BACKEND_URL=http://localhost:8000
```
