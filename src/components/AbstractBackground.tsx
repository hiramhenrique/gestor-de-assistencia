/**
 * Background abstrato temático: circuitos, gráficos de barras,
 * engrenagens e linhas de gestão — paleta GameBox (violet + cyan).
 */
export default function AbstractBackground() {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none select-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="bar-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0.07" />
        </linearGradient>
        <linearGradient id="cyan-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
          <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Fundo base suave ── */}
      <rect width="100%" height="100%" fill="url(#bg-grad)" />

      {/* ══════════════════════════════════════════
          GRÁFICO DE BARRAS — canto inferior esquerdo
      ══════════════════════════════════════════ */}
      <g opacity="0.7">
        <rect x="2%" y="72%" width="3%" height="18%" rx="4" fill="url(#bar-grad)" />
        <rect x="6.5%" y="64%" width="3%" height="26%" rx="4" fill="url(#bar-grad)" />
        <rect x="11%" y="58%" width="3%" height="32%" rx="4" fill="url(#bar-grad)" />
        <rect x="15.5%" y="67%" width="3%" height="23%" rx="4" fill="url(#bar-grad)" />
        <rect x="20%" y="53%" width="3%" height="37%" rx="4" fill="url(#bar-grad)" />
        <rect x="24.5%" y="61%" width="3%" height="29%" rx="4" fill="url(#bar-grad)" />
        <rect x="29%" y="48%" width="3%" height="42%" rx="4" fill="url(#bar-grad)" />
        {/* linha base */}
        <line x1="1%" y1="90%" x2="33%" y2="90%" stroke="#7C3AED" strokeWidth="1" strokeOpacity="0.15" />
      </g>

      {/* ══════════════════════════════════════════
          GRÁFICO DE BARRAS — canto inferior direito (ciano)
      ══════════════════════════════════════════ */}
      <g opacity="0.6">
        <rect x="68%" y="74%" width="3%" height="16%" rx="4" fill="url(#cyan-grad)" />
        <rect x="72.5%" y="66%" width="3%" height="24%" rx="4" fill="url(#cyan-grad)" />
        <rect x="77%" y="59%" width="3%" height="31%" rx="4" fill="url(#cyan-grad)" />
        <rect x="81.5%" y="70%" width="3%" height="20%" rx="4" fill="url(#cyan-grad)" />
        <rect x="86%" y="56%" width="3%" height="34%" rx="4" fill="url(#cyan-grad)" />
        <rect x="90.5%" y="63%" width="3%" height="27%" rx="4" fill="url(#cyan-grad)" />
        <rect x="95%" y="50%" width="3%" height="40%" rx="4" fill="url(#cyan-grad)" />
        <line x1="67%" y1="90%" x2="99%" y2="90%" stroke="#22D3EE" strokeWidth="1" strokeOpacity="0.15" />
      </g>

      {/* ══════════════════════════════════════════
          LINHA DE TENDÊNCIA — curva suave atravessando a tela
      ══════════════════════════════════════════ */}
      <path
        d="M -2% 68% C 10% 72%, 20% 55%, 35% 60% S 55% 40%, 70% 45% S 88% 35%, 102% 42%"
        stroke="url(#line-grad)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* pontos da linha */}
      {[
        [35, 60], [53, 44], [70, 45], [88, 37],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={`${cx}%`} cy={`${cy}%`} r="4" fill="#7C3AED" fillOpacity="0.12" />
          <circle cx={`${cx}%`} cy={`${cy}%`} r="2" fill="#7C3AED" fillOpacity="0.25" />
        </g>
      ))}

      {/* ══════════════════════════════════════════
          ENGRENAGEM — topo esquerdo
      ══════════════════════════════════════════ */}
      <g transform="translate(6%, 10%) scale(0.9)" opacity="0.1">
        <circle cx="40" cy="40" r="26" fill="none" stroke="#7C3AED" strokeWidth="6" />
        <circle cx="40" cy="40" r="12" fill="none" stroke="#7C3AED" strokeWidth="4" />
        {[0,45,90,135,180,225,270,315].map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const x1 = 40 + 26 * Math.cos(rad);
          const y1 = 40 + 26 * Math.sin(rad);
          const x2 = 40 + 36 * Math.cos(rad);
          const y2 = 40 + 36 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" />;
        })}
      </g>

      {/* ══════════════════════════════════════════
          ENGRENAGEM — canto inferior direito (menor, ciano)
      ══════════════════════════════════════════ */}
      <g transform="translate(88%, 78%) scale(0.6)" opacity="0.12">
        <circle cx="40" cy="40" r="26" fill="none" stroke="#22D3EE" strokeWidth="6" />
        <circle cx="40" cy="40" r="12" fill="none" stroke="#22D3EE" strokeWidth="4" />
        {[0,45,90,135,180,225,270,315].map((a, i) => {
          const rad = (a * Math.PI) / 180;
          const x1 = 40 + 26 * Math.cos(rad);
          const y1 = 40 + 26 * Math.sin(rad);
          const x2 = 40 + 36 * Math.cos(rad);
          const y2 = 40 + 36 * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#22D3EE" strokeWidth="5" strokeLinecap="round" />;
        })}
      </g>

      {/* ══════════════════════════════════════════
          CIRCUITO PCB — topo direito
      ══════════════════════════════════════════ */}
      <g opacity="0.1" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinecap="round">
        {/* trilhas horizontais */}
        <line x1="60%" y1="8%" x2="80%" y2="8%" />
        <line x1="72%" y1="8%" x2="72%" y2="18%" />
        <line x1="72%" y1="18%" x2="85%" y2="18%" />
        <line x1="85%" y1="18%" x2="85%" y2="12%" />
        <line x1="85%" y1="12%" x2="95%" y2="12%" />
        <line x1="60%" y1="8%" x2="60%" y2="22%" />
        <line x1="60%" y1="22%" x2="68%" y2="22%" />
        <line x1="68%" y1="22%" x2="68%" y2="28%" />
        <line x1="68%" y1="28%" x2="92%" y2="28%" />
        <line x1="80%" y1="8%" x2="80%" y2="14%" />
        <line x1="80%" y1="14%" x2="95%" y2="14%" />
        {/* vias (pads) */}
        {[
          [72, 8],[85, 12],[80, 8],[68, 22],[85, 18],[92, 28],[60, 22],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={`${cx}%`} cy={`${cy}%`} r="2.5" fill="#7C3AED" fillOpacity="0.3" />
        ))}
      </g>

      {/* ══════════════════════════════════════════
          CIRCUITO PCB — esquerda centro (ciano)
      ══════════════════════════════════════════ */}
      <g opacity="0.09" stroke="#22D3EE" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <line x1="2%" y1="42%" x2="14%" y2="42%" />
        <line x1="8%" y1="42%" x2="8%" y2="50%" />
        <line x1="8%" y1="50%" x2="16%" y2="50%" />
        <line x1="14%" y1="42%" x2="14%" y2="36%" />
        <line x1="14%" y1="36%" x2="22%" y2="36%" />
        <line x1="2%" y1="42%" x2="2%" y2="34%" />
        <line x1="2%" y1="34%" x2="10%" y2="34%" />
        {[
          [8, 42],[14, 36],[8, 50],[2, 34],[16, 50],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={`${cx}%`} cy={`${cy}%`} r="2.5" fill="#22D3EE" fillOpacity="0.3" />
        ))}
      </g>

      {/* ══════════════════════════════════════════
          ÍCONE $ — flutuante centro-esquerda
      ══════════════════════════════════════════ */}
      <text
        x="5%" y="30%"
        fontFamily="'Segoe UI', system-ui, sans-serif"
        fontSize="52"
        fill="#7C3AED"
        fillOpacity="0.05"
        fontWeight="800"
      >
        $
      </text>

      {/* ══════════════════════════════════════════
          ÍCONE ₿ — flutuante canto direito
      ══════════════════════════════════════════ */}
      <text
        x="88%" y="52%"
        fontFamily="'Segoe UI', system-ui, sans-serif"
        fontSize="44"
        fill="#22D3EE"
        fillOpacity="0.06"
        fontWeight="800"
      >
        ₿
      </text>

      {/* ══════════════════════════════════════════
          ÍCONE ⚙ — centro superior
      ══════════════════════════════════════════ */}
      <text
        x="46%" y="16%"
        fontFamily="'Segoe UI', system-ui, sans-serif"
        fontSize="60"
        fill="#7C3AED"
        fillOpacity="0.04"
        fontWeight="800"
      >
        ⚙
      </text>

      {/* ── Grade de pontos decorativa ── */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 14 }).map((_, col) => (
          <circle
            key={`${row}-${col}`}
            cx={`${4 + col * 7}%`}
            cy={`${8 + row * 12}%`}
            r="1.2"
            fill="#7C3AED"
            fillOpacity="0.04"
          />
        ))
      )}
    </svg>
  );
}
