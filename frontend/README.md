# Frontend (responsable: Gael)

Lo que el lector ve y usa. Ver el [README del proyecto](../README.md).

## Estado
**Todavía no hay interfaz.** `src/app/page.tsx` es solo una página de relleno. Primero decidimos en equipo cómo va a ser la app; ElevenLabs ya está conectado en el servidor y listo para usarse.

## Lo que la interfaz puede usar
- `POST /api/tts` con `{ "text": "..." }` → devuelve audio MP3 (leer en voz alta). Máximo 2500 caracteres.
- `GET /api/companion/signed-url` → devuelve `{ "signedUrl": "wss://..." }` para hablar con el agente de ElevenLabs.
  - En React: envolver la página en `<ConversationProvider>` de `@elevenlabs/react` (ya instalado) y llamar `useConversation().startSession({ signedUrl, dynamicVariables: { passage, book_title } })`.

## Siguientes tareas
1. Decidir en equipo cómo se ve y qué hace la app.
2. Construir la interfaz en `src/app/` (y `src/components/` si hace falta).

## Para correrlo
`npm install`, copiar `.env.example` a `.env.local` con las claves, `npm run dev` → http://localhost:3000.
