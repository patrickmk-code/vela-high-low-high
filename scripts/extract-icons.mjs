// Extrahiert die benötigten Solar-Icons (480 Design, CC BY 4.0) aus @iconify-json/solar
// in eine kleine TS-Datei, damit nicht das ganze Icon-Set im Bundle landet.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const set = JSON.parse(readFileSync(require.resolve('@iconify-json/solar/icons.json'), 'utf8'));

const NAMES = [
  'moon-stars-linear', 'moon-stars-bold-duotone',
  'calendar-mark-linear', 'calendar-mark-bold-duotone',
  'star-shine-linear', 'star-shine-bold-duotone',
  'microphone-3-linear', 'pen-linear', 'play-bold',
  'leaf-linear', 'battery-low-linear', 'lightbulb-minimalistic-linear',
  'fire-linear', 'notebook-linear', 'music-notes-linear', 'moon-sleep-linear',
  'alt-arrow-left-linear', 'alt-arrow-right-linear', 'alt-arrow-down-linear',
  'tuning-2-linear', 'restart-linear', 'star-linear', 'star-bold', 'hamburger-menu-linear',
  'pause-bold', 'close-circle-linear', 'download-minimalistic-linear', 'calendar-add-linear',
  'trash-bin-minimalistic-linear', 'smartphone-linear', 'refresh-linear', 'add-circle-linear',
  'target-linear', 'target-bold-duotone', 'calendar-linear', 'calendar-bold-duotone', 'heart-linear', 'soundwave-linear',
  'settings-linear', 'lock-keyhole-minimalistic-linear', 'check-circle-linear', 'chat-round-line-linear', 'cloud-linear',
  'users-group-rounded-linear', 'chart-2-linear', 'stars-linear', 'document-text-linear',
];

const out = {};
for (const n of NAMES) {
  const icon = set.icons[n];
  if (!icon) throw new Error('Icon fehlt: ' + n);
  out[n] = icon.body;
}
const src = `// Automatisch erzeugt von scripts/extract-icons.mjs – nicht von Hand bearbeiten.
// Solar Icon Set von 480 Design, Lizenz CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
export const ICONS = ${JSON.stringify(out, null, 2)} as const;
export type IconName = keyof typeof ICONS;
`;
writeFileSync(new URL('../src/icons.generated.ts', import.meta.url), src);
console.log('Icons geschrieben:', NAMES.length);
