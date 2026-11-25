const paths = {
  missions: 'M5 4h11l3 3v13H5z M8 9h6m-6 4h8m-8 4h5',
  check: 'M3 12l6 6L21 6',
  calendar: 'M4 6h16v14H4z M8 3v6m8-6v6M4 11h16m-12 4h3',
  chart: 'M3 3v17h18M7 16v-5m5 5V7m5 9v-7',
  timer: 'M9 2h6m-3 0v3m6 2 2-2M7 6h10l4 5v5l-4 5H7l-4-5v-5z M12 9v5h4',
  shield: 'M12 2l8 3v8l-3 5-5 4-5-4-3-5V5z M8 13l8-4',
  book: 'M5 3h14v18H5z M8 3v18m3-13h5m-5 4h5',
  alert: 'M10 4h4l8 15-2 2H4l-2-2z M12 8v5m0 3v1',
  clock: 'M7 3h10l4 4v10l-4 4H7l-4-4V7z M12 6v7l5 2',
  crest: 'M2 7l7 3 3 5 3-5 7-3-3 10-7 5-7-5z M8 3l4 5 4-5',
  edit: 'M4 16 16 4l4 4L8 20H4z M13 7l4 4',
  trash: 'M3 6h18M9 6V3h6v3M6 9l1 12h10l1-12M10 10v7m4-7v7',
  repeat: 'M3 10V7h15l-3-3m6 10v3H6l3 3',
  bolt: 'M13 2 4 14h7l-1 8 10-13h-8z',
  plus: 'M12 4v16M4 12h16',
  chip: 'M6 6h12v12H6z M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4',
  rank: 'M3 14l9-7 9 7M5 18l7-5 7 5',
  lock: 'M5 10h14v11H5z M8 10V6l2-3h4l2 3v4',
  exit: 'M10 3H4v18h6m-1-9h12l-5-5m5 5-5 5',
  play: 'M7 4l13 8-13 8z',
  stop: 'M5 5h14v14H5z',
  back: 'M16 4l-8 8 8 8',
  next: 'M8 4l8 8-8 8',
  pin: 'M7 3h10l3 5-8 13L4 8z M10 8h4',
} as const;

export default function HudIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg aria-hidden="true" focusable="false" width="1em" height="1em" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="miter"
      style={{ verticalAlign: '-0.13em', flexShrink: 0 }}>
      <path d={paths[name]} />
    </svg>
  );
}
