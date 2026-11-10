// POST /api/patterns – erkennt Kraftquellen, Energieräuber und kleine Impulse aus den eigenen Abenden.
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { MODEL, VELA_VOICE, client, errorResponse, json, readBody } from './_shared.js';

const Item = z.object({
  name: z.string().describe('Nombre corto del tema, 1-3 palabras, p. ej. «Naturaleza»'),
  count: z.number().int().describe('En cuántas noches aparece (número entero)'),
  frequency: z.string().describe('«A menudo» o «A veces», opcionalmente con «· sobre todo …»'),
  when: z.string().describe('Cuándo suele aparecer (días, momentos). Cadena vacía si no hay patrón temporal.'),
  description: z.string().describe('Una o dos frases en tono Vela, sin cifras ni porcentajes'),
  quotes: z.array(z.string()).describe('Para fuentes: momentos reales literales con fecha corta, p. ej. «Un paseo al sol · 3 nov». Para lo que quita energía: lo que según la persona le habría ayudado, entre «»'),
});

const PatternsSchema = z.object({
  sources: z.array(Item).describe('2-4 fuentes de energía que se repiten en los highs'),
  drains: z.array(Item).describe('1-3 cosas que se repiten en los lows'),
  ideas: z.array(z.string()).describe('2-3 impulsos pequeños y concretos, como pregunta suave, basados en lo anterior'),
  mirror: z.string().describe('Solo si hay 14 noches o más: dos frases que resumen estas semanas, en segunda persona («Estas dos semanas te han sostenido…»). Si hay menos de 14 noches, cadena vacía.'),
  questions: z.array(z.object({
    src: z.enum(['highs', 'lows', 'filo']).describe('De dónde sale la pregunta'),
    theme: z.enum(['claridad', 'calma', 'conocerte', 'cuestionar', 'horizonte']),
    q: z.string().describe('Pregunta de introspección, breve, abierta, sin juicio'),
    why: z.string().describe('Por qué esta pregunta, una frase corta basada en sus noches (o «Sin respuestas correctas.» si es filosófica)'),
  })).describe('Solo si hay 14 noches o más: 6 preguntas (2 de highs, 2 de lows, 2 filosóficas). Si hay menos, lista vacía.'),
});

export async function POST(request: Request): Promise<Response> {
  const body = await readBody(request, 80000, 6);
  if (body instanceof Response) return body;
  const raw = Array.isArray(body.entries) ? body.entries : [];
  const entries = raw.filter((e): e is string => typeof e === 'string').slice(-60).map((e) => e.slice(0, 900));
  if (entries.length < 3) return json({ error: 'pocos-datos' }, 400);

  const anthropic = client();
  if (!anthropic) return json({ error: 'sin-clave' }, 503);

  try {
    const response = await anthropic.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(PatternsSchema) },
      system: `${VELA_VOICE}

Tu tarea ahora: leer las noches registradas de una persona y descubrir con cuidado qué se repite. Solo lo que de verdad aparece varias veces. En las descripciones usa «a menudo» o «a veces», nunca porcentajes. El campo count sí es un número. No diagnostiques. Las preguntas de introspección son ligeras, nunca terapia. Escribe todo en español.`,
      messages: [
        {
          role: 'user',
          content: `Número de noches: ${entries.length}.\nEstas son sus noches (fecha | high | low | lo que le habría ayudado | segundo high):\n\n${entries.join('\n')}`,
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
