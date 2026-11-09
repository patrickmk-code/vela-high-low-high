// Abend-Erinnerung als Kalendereintrag (.ics) – funktioniert auf iPhone und Android ohne Server.
import { keyOf } from './dates';

export function reminderIcs(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  if (start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
  const pad = (n: number) => (n < 10 ? '0' : '') + n;
  const local = (d: Date) => `${keyOf(d).replace(/-/g, '')}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 10 * 60000);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const url = window.location.origin + '/';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vela//High Low High//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:vela-recordatorio-${stamp}@vela`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Vela · El día se va apagando',
    `DESCRIPTION:¿Quieres cerrarlo con tres momentos? ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Vela · ¿Quieres cerrar el día con tres momentos?',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function downloadFile(name: string, content: string | Blob, type: string) {
  const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function addReminderToCalendar(time: string) {
  downloadFile('vela-recordatorio.ics', reminderIcs(time), 'text/calendar;charset=utf-8');
}
