// POST /api/patterns – erkennt Kraftquellen, Energieräuber und kleine Impulse aus den eigenen Abenden.
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { MODEL, VELA_VOICE, client, errorResponse, json, readBody } from './_shared.js';

const Item = z.object({
  name: z.string().describe('Nombre corto del tema, 1-3 palabras, p. ej. «Naturaleza»'),
  frequency: z.string().describe('«A menudo» o «A veces», opcionalmente con «· sobre todo …»'),
  when: z.string().describe('Cuándo suele aparecer (días, momentos). Cadena vacía si no hay patrón temporal.'),
  description: z.string().describe('Una o dos frases en tono Vela, sin cifras ni porcentajes'),
  quotes: z.array(z.string()).describe('Para fuentes: momentos reales literales con fecha corta, p. ej. «Un paseo al sol · 3 nov». Para lo que quita energía: lo que según la persona le habría ayudado, entre «»'),
});

const PatternsSchema = z.object({
  sources: z.array(Item).describe('2-4 fuentes de energía que se repiten en los highs'),
  drains: z.array(Item).describe('1-3 cosas que se repiten en los lows'),
  ideas: z.array(z.string()).describe('2-3 impulsos pequeños y concretos, como pregunta suave, basados en lo anterior'),
});

interface Body {
  entries?: string[];
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBody<Body>(request, 60000);
  if (body instanceof Response) return body;
  const entries = (body.entries || []).filter((e) => typeof e === 'string').slice(-60).map((e) => e.slice(0, 900));
  if (entries.length < 3) return json({ error: 'pocos-datos' }, 400);

  const anthropic = client();
  if (!anthropic) return json({ error: 'sin-clave' }, 503);

  try {
    const response = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: zodOutputFormat(PatternsSchema) },
      system: `${VELA_VOICE}

Tu tarea ahora: leer las noches registradas de una persona y descubrir con cuidado qué se repite. Solo lo que de verdad aparece varias veces. Usa «a menudo» o «a veces», nunca porcentajes ni números. No diagnostiques. Escribe todo en español.`,
      messages: [
        {
          role: 'user',
          content: `Estas son sus noches (fecha | high | low | lo que le habría ayudado | segundo high):\n\n${entries.join('\n')}`,
        },
      ],
    });
    if (response.stop_reason === 'refusal') return json({ error: 'rechazo' }, 422);
    const parsed = response.parsed_output;
    if (!parsed) return json({ error: 'vacio' }, 502);
    return json({ patterns: parsed });
  } catch (err) {
    return errorResponse(err);
  }
}
