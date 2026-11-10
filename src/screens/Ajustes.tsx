import type { ReactNode } from 'react';
import { useApp } from '../ctx';
import { sx } from '../sx';
import { Icon } from '../Icon';
import { BACKLINK, CARD, GHOST, H1, TabPage } from '../ui';
import { SPOTIFY_URL } from '../data';
import { addReminderToCalendar } from '../lib/reminder';
import { sttSupported, voiceSupported } from '../lib/speech';
import { withSampleData } from '../lib/store';

const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const IS_STANDALONE = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export function Ajustes({ onExport, onDeleteAll }: { onExport: () => void; onDeleteAll: () => void }) {
  const { data, setData, ui, update, go, toast } = useApp();
  const s = data.settings;
  const set = (patch: Partial<typeof s>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const chip = (on: boolean) => `min-width: 64px; height: 40px; padding: 0 14px; border-radius: 20px; border: 1px solid ${on ? '#E6CDA3' : 'rgba(245,239,228,0.22)'}; background: ${on ? 'rgba(230,205,163,0.18)' : 'transparent'}; color: #F5EFE4; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit`;
  const row = (title: string, children: ReactNode, hint?: string) => (
    <div style={sx(CARD)}>
      <p style={sx('margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #CDBFAE')}>{title}</p>
      {children}
      {hint && <p style={sx('margin: 0; font-size: 13px; line-height: 1.5; color: #9C8F86')}>{hint}</p>}
    </div>
  );
  return (
    <TabPage>
      <button type="button" onClick={() => go('review')} style={sx(BACKLINK)}><Icon name="alt-arrow-left-linear" size={18} />Diario</button>
      <h1 style={sx(H1 + '; font-size: 30px; margin-top: -10px')}>Ajustes</h1>
      {row('Recordatorio', (
        <>
          <div style={sx('display: flex; gap: 8px; flex-wrap: wrap')}>
            {['21:00', '21:30', '22:00', '22:30'].map((tm) => <button key={tm} type="button" aria-pressed={s.remindTime === tm} onClick={() => set({ remindTime: tm })} style={sx(chip(s.remindTime === tm))}>{tm}</button>)}
          </div>
          <button type="button" onClick={() => { addReminderToCalendar(s.remindTime); set({ remindOn: true }); toast('Abre el archivo para añadir el recordatorio a tu calendario.'); }} style={sx(GHOST + '; display: flex; align-items: center; justify-content: center; gap: 8px')}><Icon name="calendar-add-linear" size={18} />Añadir a mi calendario</button>
        </>
      ), s.remindOn ? `Cada noche a las ${s.remindTime}, como evento con aviso en tu calendario. Si cambias la hora, vuelve a añadirlo.` : 'Vela te lo recuerda con un evento en tu calendario, una vez por la noche.')}
      {row('Cómo prefieres contarlo', (
        <>
          <div style={sx('display: flex; gap: 8px')}>
            <button type="button" aria-pressed={s.prefer === 'voz'} onClick={() => set({ prefer: 'voz' })} style={sx(chip(s.prefer === 'voz'))}>Hablar</button>
            <button type="button" aria-pressed={s.prefer === 'texto'} onClick={() => set({ prefer: 'texto' })} style={sx(chip(s.prefer === 'texto'))}>Escribir</button>
          </div>
          {!voiceSupported() && <p style={sx('margin: 0; font-size: 13px; color: #9C8F86')}>Este navegador no permite usar el micrófono.</p>}
          {voiceSupported() && !sttSupported() && <p style={sx('margin: 0; font-size: 13px; line-height: 1.5; color: #9C8F86')}>Este navegador guarda tu voz, pero no la transcribe. Para el texto automático, usa Chrome o Safari.</p>}
        </>
      ))}
      {row('Encender la vela', (
        <div style={sx('display: flex; gap: 8px')}>
          {[3, 5, 8].map((n) => <button key={n} type="button" aria-pressed={s.breathSeconds === n} onClick={() => set({ breathSeconds: n })} style={sx(chip(s.breathSeconds === n))}>{n} s</button>)}
        </div>
      ), 'Lo que dura un respiro con el dedo en la pantalla.')}
      {row('Música tranquila', (
        <a href={SPOTIFY_URL} target="_blank" rel="noopener noreferrer" style={sx(GHOST + '; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none')}><Icon name="music-notes-linear" size={18} />Abrir piano tranquilo en Spotify</a>
      ))}
      {!IS_STANDALONE && row('Vela en tu pantalla de inicio', (
        <p style={sx('margin: 0; font-size: 15px; line-height: 1.5; color: #E6DACB; display: flex; gap: 10px; align-items: center')}><Icon name="smartphone-linear" size={20} />Úsala como una app, a pantalla completa.</p>
      ), IS_IOS ? 'En Safari: toca Compartir y luego «Añadir a pantalla de inicio».' : 'En Chrome: menú ⋮ y luego «Instalar app» o «Añadir a pantalla de inicio».')}
      {row('Privacidad', (
        <>
          <button type="button" onClick={onExport} style={sx(GHOST + '; display: flex; align-items: center; justify-content: center; gap: 8px')}><Icon name="download-minimalistic-linear" size={18} />Exportar mis momentos</button>
          {!ui.confirmDelete ? (
            <button type="button" onClick={() => update({ confirmDelete: true })} style={sx(GHOST + '; display: flex; align-items: center; justify-content: center; gap: 8px; color: #CDBFAE')}><Icon name="trash-bin-minimalistic-linear" size={18} />Borrar todo</button>
          ) : (
            <div style={sx('display: flex; flex-direction: column; gap: 8px')}>
              <p style={sx('margin: 0; font-size: 14px; line-height: 1.5; color: #E6DACB')}>¿Seguro? Se borrarán todas tus noches, reflexiones y grabaciones de este dispositivo.</p>
              <div style={sx('display: flex; gap: 10px')}>
                <button type="button" onClick={onDeleteAll} style={sx(GHOST + '; border-color: #CDBFAE')}>Sí, borrar</button>
                <button type="button" onClick={() => update({ confirmDelete: false })} style={sx('height: 44px; padding: 0 14px; border: none; background: transparent; color: #CDBFAE; font-size: 14px; cursor: pointer; font-family: inherit')}>Cancelar</button>
              </div>
            </div>
          )}
        </>
      ), 'Tus momentos y tu voz se guardan solo en este dispositivo. Para el espejo, los patrones y las preguntas, el texto (nunca el audio) se envía a Claude, de Anthropic.')}
      {row('Probar Vela', (
        <button type="button" onClick={() => { setData((d) => withSampleData(d)); toast('Noches de ejemplo añadidas.'); }} style={sx(GHOST)}>Añadir noches de ejemplo</button>
      ), 'Añade catorce noches de ejemplo para ver el diario, los highs, los patrones y la introspección. Puedes borrarlas con «Borrar todo».')}
      <p style={sx('margin: 4px 0 0; font-size: 11px; color: #7F736C; text-align: center')}>
        Iconos: <a href="https://www.figma.com/community/file/1166831539721848736" target="_blank" rel="noopener noreferrer" style={sx('color: inherit')}>Solar</a> de 480 Design, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" style={sx('color: inherit')}>CC BY 4.0</a>
      </p>
    </TabPage>
  );
}
