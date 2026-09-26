# Frontend (responsable: Gael)

Lo que el lector ve y usa. Ver el [README del proyecto](../README.md).

## Tecnología
- Una app web (por ejemplo Next.js / React).
- **Clerk**: componentes de inicio de sesión / registro y sesión del usuario.
- Reproductor de audio para la voz de **ElevenLabs** que genera [ai-agents](../ai-agents/README.md).

## Primeras tareas
1. Crear la app y agregar el inicio de sesión con Clerk.
2. Página de biblioteca: ver mis libros y subir uno nuevo.
3. Página de lectura: mostrar el texto y resaltar la frase que se está leyendo.
4. Botones: **Leer en voz alta**, **Explícame esto**, **Resumir capítulo**, **Hazme un quiz**.
5. Reproductor que toca el audio y sigue el texto mientras lee.

## Se comunica con
- [backend](../backend/README.md): todos los datos pasan por su API; acuerden los endpoints desde el principio.

## Claves necesarias (en `.env.local`, nunca se suben a GitHub)
Clave pública de Clerk, URL de la API del backend.
