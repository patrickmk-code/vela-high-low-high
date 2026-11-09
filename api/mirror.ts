// POST /api/mirror – Vela spiegelt einen Moment in einem kurzen Satz („Lo que escuché“).
import { MODEL, VELA_VOICE, client, errorResponse, json, readBody } from './_shared';

type Step = 'high1' | 'low' | 'ask' | 'high2';

const STEP_HINT: Record<Step, string> = {
  high1: 'La persona acaba de contar el primer momento bueno del día (high).',
  low: 'La persona acaba de contar lo que fue difícil hoy (low). Nómbralo con suavidad, sin minimizar ni dramatizar, sin dar consejos.',
  ask: 'La persona acaba de decir qué le habría sentado bien en ese momento difícil. Recógelo con cariño.',
  high2: 'La persona acaba de contar otro momento bonito o algo que le hace ilusión (segundo high). Ayuda a cerrar el día en un tono cálido.',
};

interface Body {
  step?: Step;
  text?: string;
  context?: { high1?: string; low?: string };
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBody<Body>(request, 6000);
  if (body instanceof Response) return body;
  const step = body.step;
  const text = (body.text || '').trim().slice(0, 1500);
  if (!step || !(step in STEP_HINT) || !text) return json({ error: 'entrada' }, 400);

  const anthropic = client();
  if (!anthropic) return json({ error: 'sin-clave' }, 503);

  const ctx = body.context || {};
  const contextLines = [
    ctx.high1 ? `Antes contó como high: «${ctx.high1.slice(0, 300)}»` : '',
    ctx.low ? `Antes contó como low: «${ctx.low.slice(0, 300)}»` : '',
  ].filter(Boolean).join('\n');

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: `${VELA_VOICE}

Tu tarea ahora: devolver en «Lo que escuché» UNA sola frase (máximo 22 palabras) que refleje con tus palabras lo que la persona dijo. Habla en segunda persona (tú), en pasado o presente. Mantén los detalles concretos que mencionó. No hagas preguntas. No añadas nada que no haya dicho. Responde solo con la frase, sin comillas.`,
      messages: [
        {
          role: 'user',
          content: `${STEP_HINT[step]}${contextLines ? '\n' + contextLines : ''}\n\nLo que dijo (puede venir de un dictado por voz, con pequeños errores):\n«${text}»`,
        },
      ],
    });
    if (response.stop_reason === 'refusal') return json({ error: 'rechazo' }, 422);
    const out = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
      .replace(/^[«"“]+|[»"”]+$/g, '')
      .replace(/!/g, '.');
    if (!out) return json({ error: 'vacio' }, 502);
    return json({ text: out });
  } catch (err) {
    return errorResponse(err);
  }
}
