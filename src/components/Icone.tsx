// Ícones de traço fino da identidade do Prumo (mesmos de assets/mockups/src/icones.js).
const ICONES = {
  hoje: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  registrar: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  historico: '<path d="M4 4v16h16"/><path d="m8 15 3-4 3 2 4-6"/>',
  coach: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  sono: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  atividade: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  agua: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  alimentacao: '<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="m5 19 7-7"/>',
  humor:
    '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 9.5h.01M15 9.5h.01"/>',
  tela: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  sino: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  enviar: '<path d="m4 12 16-8-6 16-2-7z"/>',
  ia: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  voltar: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  sair: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  lixeira: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  olho: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'olho-fechado':
    '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  escudo: '<path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
} as const;

export type NomeIcone = keyof typeof ICONES;

export function Icone({ nome, className = '' }: { nome: NomeIcone; className?: string }) {
  return (
    <svg
      className={`icone ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONES[nome] }}
    />
  );
}
