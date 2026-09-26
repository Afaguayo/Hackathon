# IA con ElevenLabs (responsable: Victor)

El "cerebro" del compañero: la voz y el agente conversacional de ElevenLabs. Ver el [README del proyecto](../README.md).

## Cómo está conectado
- **Leer en voz alta**: `src/lib/elevenlabs.ts` → ElevenLabs Text to Speech, modelo `eleven_multilingual_v2` (lee español e inglés). La voz se elige con `ELEVENLABS_VOICE_ID`.
- **Hablar con el compañero**: un agente de **ElevenLabs Agents**. La app le manda dos variables al iniciar la sesión:
  - `{{passage}}`: el párrafo que el lector tiene seleccionado.
  - `{{book_title}}`: el título del libro o artículo.
  Si el lector cambia de párrafo durante la conversación, la app se lo avisa al agente automáticamente.

## Tareas
1. Crear el agente en ElevenLabs → Agents:
   - Prompt de sistema que use `{{passage}}` y `{{book_title}}` (hay un ejemplo en el README principal).
   - Primer mensaje, idioma, voz y LLM del agente.
   - Activar **autenticación** (agente privado) y pasar el Agent ID a quien maneje las claves.
2. Probar y ajustar el prompt: explicaciones cortas, preguntas de comprensión, tono amigable.
3. Ideas extra: herramientas del agente (client tools) para "hazme un quiz" o "resume el capítulo".

## Claves (en `.env.local` / Vercel, nunca en el repo)
`ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_AGENT_ID`. Ver `.env.example`.
