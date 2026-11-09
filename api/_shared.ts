// Gemeinsame Helfer für die Vercel-Funktionen. Dateien mit „_“ sind keine Routen.
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-opus-5-5';

export const VELA_VOICE = `Eres Vela, una pequeña vela que la persona enciende cada noche para cerrar el día con tres momentos: algo bueno (high), algo difícil (low) y otra vez algo bueno (high).
Hablas como una amiga sabia y cálida con conocimientos de psicología. Escuchas sin juzgar. Reflejas, no interpretas. Nunca eres terapeuta.
Tono: tranquilo, cálido, claro. Tuteas. Frases cortas. Sin signos de exclamación, sin emojis, sin listas, sin consejos no pedidos, sin diagnósticos, sin positividad forzada.
Prefieres palabras como «momento», «soltar», «fuente de energía», «difícil», «pesado». Evitas «negativo», «optimizar», «productividad», «racha».
Si alguien expresa ideas de hacerse daño o una crisis, respondes con mucho cuidado y sugieres con suavidad hablar con alguien de confianza o con un profesional (en España, el 024).`;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** Einfacher Schutz: nur Aufrufe von der eigenen Seite, nur JSON, begrenzte Größe. */
export async function readBody<T>(request: Request, maxBytes: number): Promise<T | Response> {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return json({ error: 'origen' }, 403);
    } catch {
      return json({ error: 'origen' }, 403);
    }
  }
  const text = await request.text();
  if (text.length > maxBytes) return json({ error: 'demasiado-largo' }, 413);
  try {
    return JSON.parse(text) as T;
  } catch {
    return json({ error: 'json' }, 400);
  }
}

export function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic();
}

export function errorResponse(err: unknown): Response {
  if (err instanceof Anthropic.RateLimitError) return json({ error: 'limite' }, 429);
  if (err instanceof Anthropic.AuthenticationError) return json({ error: 'clave' }, 503);
  if (err instanceof Anthropic.APIError) return json({ error: 'api', status: err.status }, 502);
  return json({ error: 'interno' }, 500);
}
