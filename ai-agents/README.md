# Agentes de IA y Automatización (responsable: Victor)

El "cerebro" del compañero: voz, explicaciones, resúmenes y quizzes. Ver el [README del proyecto](../README.md).

## Tecnología
- **n8n**: flujos de trabajo que se activan con webhooks desde el [backend](../backend/README.md).
- **ElevenLabs**: texto a voz para que el compañero lea en voz alta con una voz natural.
- Un LLM para explicaciones, resúmenes y preguntas de quiz.
- **Zavu**: por definir; decidir en equipo dónde encaja.

## Primeros flujos
1. **Leer en voz alta**: entra texto → ElevenLabs → archivo de audio (guardado en AWS S3) → sale la URL del audio.
2. **Explícame esto**: entra un fragmento → LLM → sale una explicación sencilla.
3. **Resumir capítulo**: entra el texto del capítulo → sale un resumen corto.
4. **Hazme un quiz**: entra el texto del capítulo → salen 3–5 preguntas con respuestas.
5. **Recordatorio de lectura** (extra): aviso diario para mantener la racha de lectura.

## Se comunica con
- [backend](../backend/README.md): acuerden las URLs de los webhooks y el JSON de entrada/salida de cada flujo.

## Claves necesarias (en `.env`, nunca se suben a GitHub)
API key de ElevenLabs, API key del LLM, credenciales de n8n.
