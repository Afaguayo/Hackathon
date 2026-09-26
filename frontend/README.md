# Frontend (responsable: Gael)

Lo que el lector ve y usa: una app Next.js (React + Tailwind) desplegada en Vercel. Ver el [README del proyecto](../README.md).

## Código
- `src/app/page.tsx`: página principal (encabezado + lector).
- `src/components/Reader.tsx`: pegar texto o subir un `.txt`, dividirlo en párrafos, seleccionar uno.
- `src/components/ReadAloudButton.tsx`: botón **Leer en voz alta** → llama a `POST /api/tts` y reproduce el audio.
- `src/components/CompanionPanel.tsx`: botón **Hablar con el compañero** → conversación de voz con el agente de ElevenLabs (`@elevenlabs/react`), le pasa el párrafo actual.

## Ya hecho
- Lector básico con selección de párrafo.
- Leer en voz alta y conversación de voz conectados al backend.

## Siguientes tareas
1. Mejorar el diseño (tipografía de lectura, modo oscuro, móvil).
2. Resaltar la frase que se está leyendo mientras suena el audio.
3. Mostrar la transcripción de la conversación (callback `onMessage` de `useConversation`).
4. Soporte para PDF además de `.txt`.

## Para correrlo
`npm install`, copiar `.env.example` a `.env.local` con las claves, `npm run dev` → http://localhost:3000.
