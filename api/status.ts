// GET /api/status – zeigt nur, ob ein Claude-Schlüssel konfiguriert ist (nie den Wert).
import { json } from './_shared.js';

export function GET(): Response {
  const names = Object.keys(process.env).filter((n) => /anthropic/i.test(n));
  return json({
    claude: !!process.env.ANTHROPIC_API_KEY,
    variablesConAnthropic: names,
    entorno: process.env.VERCEL_ENV ?? 'local',
  });
}
