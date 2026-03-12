// Game/public/dune/js/campaign-stories.js — Campaign briefing stories, illustrations, and result text
// Keyed by faction: swiss, french, german

// ============================================================
// Helper: reusable SVG fragments
// ============================================================

const SKY = `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5599dd"/><stop offset="100%" stop-color="#aaddff"/></linearGradient></defs><rect width="440" height="260" fill="url(#sk)"/>`;
const DARK_BG = `<rect width="440" height="260" fill="#1a1a2e"/>`;
const CHAOS_BG = `<rect width="440" height="260" fill="#0d0d1a"/>`;
const EPIC_BG = `<defs><radialGradient id="gl" cx="50%" cy="40%" r="50%"><stop offset="0%" stop-color="#ffd700" stop-opacity="0.4"/><stop offset="100%" stop-color="#0d0d1a" stop-opacity="0"/></radialGradient><linearGradient id="ep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a0a2a"/><stop offset="100%" stop-color="#0d0d1a"/></linearGradient></defs><rect width="440" height="260" fill="url(#ep)"/><rect width="440" height="260" fill="url(#gl)"/>`;
const MOUNTAINS = `<polygon points="0,260 120,70 240,260" fill="#5a8a5a"/><polygon points="180,260 310,50 440,260" fill="#4a7a4a"/><polygon points="60,260 220,90 380,260" fill="#6a9a6a"/><polygon points="185,75 220,90 255,75 220,62" fill="#fff"/><polygon points="280,38 310,50 340,38 310,28" fill="#fff"/>`;
const GROUND = `<rect x="0" y="225" width="440" height="35" fill="#4a8a4a"/>`;
const DARK_GROUND = `<rect x="0" y="200" width="440" height="60" fill="#2a2a3a"/>`;
const FLAG_CH = (x, y) => `<rect x="${x}" y="${y}" width="18" height="13" fill="#cc0000" rx="1"/><rect x="${x+7}" y="${y+2}" width="4" height="9" fill="#fff"/><rect x="${x+3}" y="${y+5}" width="12" height="3" fill="#fff"/>`;
const FLAG_FR = (x, y) => `<rect x="${x}" y="${y}" width="8" height="18" fill="#0055a4"/><rect x="${x+8}" y="${y}" width="8" height="18" fill="#fff"/><rect x="${x+16}" y="${y}" width="8" height="18" fill="#ee1111"/>`;
const FLAG_DE = (x, y) => `<rect x="${x}" y="${y}" width="16" height="6" fill="#000"/><rect x="${x}" y="${y+6}" width="16" height="6" fill="#dd0000"/><rect x="${x}" y="${y+12}" width="16" height="6" fill="#ffcc00"/>`;
const BERET_SPY = (cx, cy) => `<ellipse cx="${cx}" cy="${cy-12}" rx="20" ry="6" fill="#1a1a6a"/><ellipse cx="${cx}" cy="${cy-14}" rx="14" ry="3" fill="#22228a"/><circle cx="${cx}" cy="${cy-18}" r="3" fill="#1a1a6a"/><circle cx="${cx-6}" cy="${cy-5}" r="4" fill="white" stroke="#333" stroke-width="0.8"/><circle cx="${cx+6}" cy="${cy-5}" r="4" fill="white" stroke="#333" stroke-width="0.8"/><circle cx="${cx-5}" cy="${cy-5}" r="2" fill="#333"/><circle cx="${cx+7}" cy="${cy-5}" r="2" fill="#333"/><path d="M${cx-4},${cy} Q${cx},${cy+4} ${cx+4},${cy}" fill="none" stroke="#333" stroke-width="1.5"/>`;
const LEDERHOSEN_SPY = (cx, cy) => `<rect x="${cx-14}" y="${cy-16}" width="28" height="10" fill="#5a3a1a"/><rect x="${cx-18}" y="${cy-10}" width="36" height="4" fill="#5a3a1a"/><circle cx="${cx-6}" cy="${cy-4}" r="4" fill="white" stroke="#333" stroke-width="0.8"/><circle cx="${cx+6}" cy="${cy-4}" r="4" fill="white" stroke="#333" stroke-width="0.8"/><circle cx="${cx-5}" cy="${cy-4}" r="2" fill="#333"/><circle cx="${cx+7}" cy="${cy-4}" r="2" fill="#333"/><path d="M${cx-5},${cy+3} L${cx+5},${cy+3}" stroke="#333" stroke-width="2"/>`;
const CHEESE_WHEEL = (cx, cy, r) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r*0.65}" fill="#ffd700" stroke="#daa520" stroke-width="2"/><circle cx="${cx-r*0.25}" cy="${cy-r*0.2}" r="${r*0.15}" fill="#daa520"/><circle cx="${cx+r*0.3}" cy="${cy+r*0.2}" r="${r*0.12}" fill="#daa520"/>`;

const svgOpen = `<svg viewBox="0 0 440 260" xmlns="http://www.w3.org/2000/svg">`;
const svgClose = `</svg>`;

// ============================================================
//  SWISS CAMPAIGN
// ============================================================

const SWISS_STORIES = [
  {
    title: 'THE CHEESE DISCOVERY',
    subtitle: 'Mission 1 \u2014 First Steps',
    text: `<p>Life is good in the Swiss Alps. The cows are happy, the cheese wheels are plentiful, and the yodeling echoes through the valleys every morning at precisely 7:00 AM. Swiss punctuality, of course.</p>
<p>But today, something terrible has happened. <span class="intel">Jacques Fromageaux</span>, France's top cheese intelligence agent, has been spotted on the border with military-grade binoculars and a suspicious amount of crackers.</p>
<p>His report to Paris was just three words: <span class="intel">"THEY HAVE EMMENTAL."</span> The baguette hotline is ringing. This can only mean trouble. Prepare your base, commander. A single enemy approaches.</p>`,
    svg: `${svgOpen}${SKY}${MOUNTAINS}
  ${FLAG_CH(215, 50)}${GROUND}
  <ellipse cx="160" cy="200" rx="28" ry="16" fill="white" stroke="#333" stroke-width="1.5"/>
  <ellipse cx="152" cy="196" rx="7" ry="4" fill="#333"/><ellipse cx="170" cy="204" rx="5" ry="3" fill="#333"/>
  <circle cx="133" cy="190" r="11" fill="white" stroke="#333" stroke-width="1.5"/>
  <circle cx="130" cy="188" r="2.5" fill="#333"/><circle cx="137" cy="188" r="2.5" fill="#333"/>
  <path d="M128,194 Q133,198 138,194" fill="none" stroke="#333" stroke-width="1.2"/>
  <line x1="128" y1="181" x2="124" y2="173" stroke="#daa520" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="139" y1="181" x2="143" y2="173" stroke="#daa520" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="155" y="213" width="3" height="14" fill="#333"/><rect x="163" y="213" width="3" height="14" fill="#333"/>
  <rect x="172" y="213" width="3" height="14" fill="#333"/><rect x="180" y="213" width="3" height="14" fill="#333"/>
  <rect x="157" y="211" width="9" height="11" fill="#daa520" rx="2"/>
  ${CHEESE_WHEEL(85, 218, 20)}${CHEESE_WHEEL(240, 222, 15)}
  <ellipse cx="360" cy="214" rx="30" ry="20" fill="#2d6b2d"/>
  <ellipse cx="348" cy="206" rx="18" ry="14" fill="#3a8a3a"/><ellipse cx="372" cy="208" rx="14" ry="11" fill="#3a8a3a"/>
  ${BERET_SPY(360, 208)}
  <rect x="380" y="198" width="28" height="5" fill="#d2a679" rx="2" transform="rotate(-15 380 198)"/>
  <rect x="380" y="205" width="28" height="5" fill="#d2a679" rx="2" transform="rotate(5 380 205)"/>
${svgClose}`
  },
  {
    title: 'THE CHEESE ULTIMATUM',
    subtitle: 'Mission 2 \u2014 Border Skirmish',
    text: `<p>France has sent a formal diplomatic note \u2014 written on a cr\u00eape \u2014 demanding <span class="intel">"cheese reparations for centuries of Alpine hoarding."</span> They claim Gruy\u00e8re was invented in Grenoble. This is, of course, absurd.</p>
<p>Meanwhile, Germany has shown up uninvited, claiming the cheese rightfully belongs to them because <span class="intel">"it has holes, like our pretzels."</span> They arrived in a convoy of Volkswagens blasting Rammstein at full volume.</p>
<p>The Swiss ambassador tried to remain neutral. But when the French delegation called Swiss chocolate <span class="intel">"adequate"</span>, all diplomacy collapsed. Two enemy fronts are now active.</p>`,
    svg: `${svgOpen}${DARK_BG}${DARK_GROUND}
  <ellipse cx="220" cy="200" rx="200" ry="30" fill="rgba(255,255,200,0.05)"/>
  <circle cx="90" cy="110" r="18" fill="#ffe0c0"/>
  <ellipse cx="90" cy="96" rx="22" ry="7" fill="#1a1a6a"/><ellipse cx="90" cy="94" rx="15" ry="4" fill="#22228a"/><circle cx="90" cy="88" r="4" fill="#1a1a6a"/>
  <circle cx="84" cy="108" r="3" fill="#333"/><circle cx="96" cy="108" r="3" fill="#333"/>
  <path d="M82,116 Q78,112 74,114" fill="none" stroke="#333" stroke-width="2"/>
  <path d="M98,116 Q102,112 106,114" fill="none" stroke="#333" stroke-width="2"/>
  <rect x="84" y="128" width="12" height="55" fill="#2222aa" rx="2"/>
  <rect x="78" y="183" width="6" height="20" fill="#333"/><rect x="96" y="183" width="6" height="20" fill="#333"/>
  <rect x="105" y="100" width="60" height="8" fill="#d2a679" rx="3" transform="rotate(-30 105 100)"/>
  <text x="60" y="240" font-family="monospace" font-size="11" fill="#4444aa" text-anchor="middle">"EN GARDE!"</text>
  <circle cx="350" cy="110" r="18" fill="#ffe0c0"/>
  <rect x="336" y="94" width="28" height="10" fill="#5a3a1a"/><rect x="332" y="100" width="36" height="4" fill="#5a3a1a"/>
  <circle cx="344" cy="108" r="3" fill="#333"/><circle cx="356" cy="108" r="3" fill="#333"/>
  <path d="M342,120 L358,120" stroke="#333" stroke-width="2"/>
  <rect x="344" y="128" width="12" height="30" fill="#8B7355" rx="1"/>
  <rect x="340" y="158" width="20" height="12" fill="#5a3a1a"/>
  <rect x="340" y="170" width="8" height="20" fill="#5a3a1a"/><rect x="352" y="170" width="8" height="20" fill="#5a3a1a"/>
  <rect x="340" y="190" width="8" height="14" fill="#333"/><rect x="352" y="190" width="8" height="14" fill="#333"/>
  <ellipse cx="320" cy="150" rx="25" ry="28" fill="none" stroke="#c8a050" stroke-width="8"/>
  <text x="380" y="240" font-family="monospace" font-size="11" fill="#aa8844" text-anchor="middle">"JAWOHL!"</text>
  <circle cx="220" cy="115" r="16" fill="#ffe0c0"/>
  <circle cx="214" cy="113" r="2.5" fill="#333"/><circle cx="226" cy="113" r="2.5" fill="#333"/>
  <path d="M214,122 Q220,126 226,122" fill="none" stroke="#333" stroke-width="1.2"/>
  <rect x="212" y="131" width="16" height="45" fill="#cc0000" rx="2"/>
  <rect x="218" y="136" width="4" height="12" fill="#fff"/><rect x="214" y="140" width="12" height="4" fill="#fff"/>
  <rect x="212" y="176" width="7" height="18" fill="#333"/><rect x="221" y="176" width="7" height="18" fill="#333"/>
  ${CHEESE_WHEEL(220, 180, 35)}
  <text x="220" y="248" font-family="monospace" font-size="11" fill="#cc4444" text-anchor="middle">"THIS CHEESE IS NEUTRAL!"</text>
  <text x="155" y="155" font-family="monospace" font-size="20" fill="#ff4444" font-weight="bold">VS</text>
  <text x="275" y="155" font-family="monospace" font-size="20" fill="#ff4444" font-weight="bold">VS</text>
${svgClose}`
  },
  {
    title: 'THE FONDUE FRONT',
    subtitle: 'Mission 3 \u2014 Alpine Assault',
    text: `<p>The situation has escalated dramatically. France has constructed <span class="intel">"Le Maginot Line du Fromage"</span> \u2014 a 300-meter defensive wall made entirely of day-old baguettes. It is surprisingly effective.</p>
<p>Germany has responded by deploying the <span class="intel">Wurst-Werfer 9000</span>, a fearsome bratwurst catapult with a range of 500 meters and a devastating mustard payload.</p>
<p>The Swiss High Command has authorized the use of fondue pots as defensive installations. The army knife divisions are sharpening all 47 blades. Someone has started stress-yodeling. Two aggressive foes approach.</p>`,
    svg: `${svgOpen}<defs><linearGradient id="fi" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#ff4400"/><stop offset="50%" stop-color="#ffaa00"/><stop offset="100%" stop-color="#ffee88"/></linearGradient></defs>
  <rect width="440" height="260" fill="#2a1a0a"/><rect x="0" y="200" width="440" height="60" fill="#3a2a1a"/>
  <rect x="20" y="120" width="80" height="12" fill="#d2a679" rx="4"/><rect x="15" y="134" width="85" height="12" fill="#c89a69" rx="4"/>
  <rect x="20" y="148" width="80" height="12" fill="#d2a679" rx="4"/><rect x="15" y="162" width="85" height="12" fill="#c89a69" rx="4"/>
  <rect x="20" y="176" width="80" height="12" fill="#d2a679" rx="4"/><rect x="15" y="190" width="85" height="12" fill="#c89a69" rx="4"/>
  <line x1="60" y1="120" x2="60" y2="90" stroke="#666" stroke-width="2"/>${FLAG_FR(60, 90)}
  <text x="55" y="218" font-family="monospace" font-size="8" fill="#c89a69">MAGINOT LINE DU FROMAGE</text>
  <ellipse cx="220" cy="185" rx="50" ry="15" fill="#888"/>
  <rect x="172" y="155" width="96" height="32" fill="#777" rx="4"/>
  <ellipse cx="220" cy="155" rx="48" ry="14" fill="#ffd700"/>
  <circle cx="205" cy="150" r="5" fill="#ffaa00" opacity="0.7"/><circle cx="230" cy="145" r="7" fill="#ffcc00" opacity="0.6"/>
  <ellipse cx="220" cy="100" rx="40" ry="25" fill="#ffd700" opacity="0.4"/>
  <ellipse cx="220" cy="85" rx="30" ry="20" fill="#ffcc00" opacity="0.3"/>
  <rect x="210" y="100" width="20" height="50" fill="#ffd700" opacity="0.3"/>
  <line x1="220" y1="155" x2="220" y2="50" stroke="#888" stroke-width="1.5"/>${FLAG_CH(220, 50)}
  <ellipse cx="210" cy="198" rx="8" ry="12" fill="url(#fi)"/><ellipse cx="225" cy="196" rx="6" ry="14" fill="url(#fi)"/><ellipse cx="238" cy="198" rx="7" ry="11" fill="url(#fi)"/>
  <rect x="340" y="160" width="12" height="45" fill="#5a3a1a"/><rect x="330" y="158" width="30" height="6" fill="#5a3a1a" rx="1"/>
  <line x1="355" y1="160" x2="395" y2="110" stroke="#5a3a1a" stroke-width="4" stroke-linecap="round"/>
  <rect x="385" y="100" width="25" height="15" fill="#5a3a1a" rx="2"/>
  <rect x="388" y="96" width="20" height="5" fill="#b35a28" rx="2"/><rect x="390" y="90" width="18" height="5" fill="#c06830" rx="2"/>
  <line x1="380" y1="160" x2="380" y2="130" stroke="#666" stroke-width="2"/>${FLAG_DE(380, 130)}
  <text x="370" y="218" font-family="monospace" font-size="8" fill="#aa7744">WURST-WERFER 9000</text>
  <rect x="290" y="80" width="24" height="7" fill="#b35a28" rx="3" transform="rotate(-25 290 80)"/>
  <text x="280" y="72" font-family="monospace" font-size="9" fill="#ff8844">WHOOSH!</text>
${svgClose}`
  },
  {
    title: 'THE GREAT CHEESE WAR',
    subtitle: 'Mission 4 \u2014 Three-Front War',
    text: `<p>It is now total war. The French have weaponized their escargot reserves \u2014 thousands of snails are being launched across enemy lines. They move slowly, but the <span class="intel">psychological damage is immense.</span></p>
<p>Germany has activated <span class="intel">"Operation Sauerkraut Storm"</span> \u2014 aerial bombardment of fermented cabbage that leaves entire valleys smelling like a Bavarian beer tent on a hot Sunday.</p>
<p>In desperation, the Swiss have unveiled their ultimate secret weapon: the <span class="intel">Cuckoo Clock of Doom</span>. Every hour, on the hour, it launches a devastating cheese fondue strike with Swiss watch precision. Three fronts. Survive and conquer.</p>`,
    svg: `${svgOpen}${CHAOS_BG}
  <circle cx="80" cy="180" r="30" fill="#ff4400" opacity="0.15"/>
  <circle cx="370" cy="160" r="35" fill="#ff4400" opacity="0.12"/>
  <rect x="175" y="40" width="90" height="130" fill="#5a3a1a" rx="3"/>
  <rect x="180" y="45" width="80" height="55" fill="#3a2a1a" rx="2"/>
  <circle cx="220" cy="72" r="22" fill="#ffe8c0" stroke="#8a6a3a" stroke-width="2"/>
  <circle cx="220" cy="72" r="2" fill="#333"/>
  <line x1="220" y1="72" x2="220" y2="56" stroke="#333" stroke-width="2"/>
  <line x1="220" y1="72" x2="232" y2="72" stroke="#333" stroke-width="1.5"/>
  <polygon points="170,40 220,15 270,40" fill="#5a3a1a"/>
  <rect x="216" y="105" width="8" height="20" fill="#cc0000"/><rect x="210" y="111" width="20" height="8" fill="#cc0000"/>
  <rect x="210" y="130" width="20" height="15" fill="#2a1a0a"/>
  <ellipse cx="240" cy="136" rx="10" ry="6" fill="#daa520"/>
  <polygon points="250,134 258,136 250,138" fill="#ff8800"/><circle cx="247" cy="134" r="1.5" fill="#333"/>
  <circle cx="280" cy="130" r="8" fill="#ffd700" stroke="#daa520" stroke-width="1.5"/>
  <text x="290" y="128" font-family="monospace" font-size="8" fill="#ffcc00">FONDUE STRIKE!</text>
  <line x1="220" y1="170" x2="205" y2="210" stroke="#daa520" stroke-width="2"/><circle cx="205" cy="215" r="8" fill="#daa520"/>
  <g transform="translate(40,60)"><ellipse cx="0" cy="0" rx="12" ry="8" fill="#8a7a5a"/><ellipse cx="0" cy="5" rx="14" ry="5" fill="#b0a080"/>
    <line x1="-8" y1="-4" x2="-12" y2="-10" stroke="#8a7a5a" stroke-width="1.5"/><line x1="-5" y1="-4" x2="-7" y2="-12" stroke="#8a7a5a" stroke-width="1.5"/>
    <circle cx="-12" cy="-11" r="1.5" fill="#333"/><circle cx="-7" cy="-13" r="1.5" fill="#333"/>
  </g>
  <g transform="translate(75,90) scale(0.8)"><ellipse cx="0" cy="0" rx="12" ry="8" fill="#8a7a5a"/><ellipse cx="0" cy="5" rx="14" ry="5" fill="#b0a080"/>
    <line x1="-8" y1="-4" x2="-12" y2="-10" stroke="#8a7a5a" stroke-width="1.5"/><line x1="-5" y1="-4" x2="-7" y2="-12" stroke="#8a7a5a" stroke-width="1.5"/>
  </g>
  <ellipse cx="38" cy="53" rx="6" ry="2" fill="#1a1a6a"/>
  <text x="20" y="180" font-family="monospace" font-size="9" fill="#4444aa">ESCARGOT DIVISION</text>
  <ellipse cx="380" cy="60" rx="30" ry="20" fill="#8aaa3a" opacity="0.5"/>
  <rect x="350" y="100" width="3" height="12" fill="#8aaa3a" opacity="0.6" rx="1"/>
  <rect x="365" y="110" width="3" height="10" fill="#7a9a2a" opacity="0.5" rx="1"/>
  <rect x="380" y="95" width="3" height="14" fill="#8aaa3a" opacity="0.6" rx="1"/>
  <rect x="395" y="105" width="3" height="11" fill="#7a9a2a" opacity="0.5" rx="1"/>
  <text x="358" y="185" font-family="monospace" font-size="9" fill="#8aaa3a">OP. SAUERKRAUT</text>
  <rect x="370" y="200" width="40" height="50" fill="#daa520" rx="3"/>
  <ellipse cx="390" cy="200" rx="22" ry="5" fill="#fff" opacity="0.4"/>
  <text x="120" y="120" font-family="monospace" font-size="16" fill="#ff4444" font-weight="bold">BOOM</text>
  <rect x="0" y="245" width="440" height="15" fill="#2a2a1a"/>
${svgClose}`
  },
  {
    title: 'THE FINAL FONDUE',
    subtitle: 'Mission 5 \u2014 The Grand Melee',
    text: `<p>This is it. The war to end all cheese wars. Every last wheel of Emmental, every final slice of Gruy\u00e8re, every crumb of Comt\u00e9 is at stake.</p>
<p>France has deployed its elite <span class="intel">Moustache Regiment</span> \u2014 soldiers so French they surrender ironically. Germany has sent the <span class="intel">Lederhosen Brigade</span>, warriors who fight in shorts regardless of weather.</p>
<p>The Swiss have activated <span class="intel">Protocol Toblerone</span>: complete mobilization of all chocolate and cheese reserves. One nation will rule the Alps forever. The losers will eat processed cheese slices for eternity.</p>`,
    svg: `${svgOpen}${EPIC_BG}
  <polygon points="0,260 60,160 120,260" fill="#1a1a2a"/><polygon points="100,260 180,130 260,260" fill="#1a1a2a"/>
  <polygon points="200,260 300,140 400,260" fill="#1a1a2a"/><polygon points="320,260 400,170 440,260" fill="#1a1a2a"/>
  <circle cx="220" cy="70" r="55" fill="#ffd700" opacity="0.15"/>
  <circle cx="220" cy="70" r="42" fill="#ffd700" stroke="#daa520" stroke-width="3"/>
  <circle cx="205" cy="60" r="6" fill="#daa520"/><circle cx="230" cy="75" r="5" fill="#daa520"/>
  <circle cx="215" cy="85" r="4" fill="#daa520"/><circle cx="238" cy="58" r="3.5" fill="#daa520"/>
  <line x1="220" y1="15" x2="220" y2="0" stroke="#ffd700" stroke-width="2" opacity="0.3"/>
  <line x1="260" y1="30" x2="280" y2="10" stroke="#ffd700" stroke-width="2" opacity="0.3"/>
  <line x1="180" y1="30" x2="160" y2="10" stroke="#ffd700" stroke-width="2" opacity="0.3"/>
  <line x1="50" y1="200" x2="50" y2="155" stroke="#666" stroke-width="2"/>${FLAG_FR(50, 145)}
  <circle cx="40" cy="210" r="5" fill="#2a2a4a"/><rect x="37" y="215" width="6" height="15" fill="#2a2a4a"/>
  <circle cx="55" cy="208" r="5" fill="#2a2a4a"/><rect x="52" y="213" width="6" height="17" fill="#2a2a4a"/>
  <circle cx="70" cy="212" r="5" fill="#2a2a4a"/><rect x="67" y="217" width="6" height="13" fill="#2a2a4a"/>
  <ellipse cx="40" cy="206" rx="6" ry="2" fill="#1a1a6a"/><ellipse cx="55" cy="204" rx="6" ry="2" fill="#1a1a6a"/>
  <line x1="45" y1="210" x2="55" y2="195" stroke="#d2a679" stroke-width="3" stroke-linecap="round"/>
  <line x1="370" y1="200" x2="370" y2="155" stroke="#666" stroke-width="2"/>${FLAG_DE(370, 145)}
  <circle cx="355" cy="210" r="5" fill="#2a2a3a"/><rect x="352" y="215" width="6" height="15" fill="#2a2a3a"/>
  <circle cx="385" cy="208" r="5" fill="#2a2a3a"/><rect x="382" y="213" width="6" height="17" fill="#2a2a3a"/>
  <circle cx="360" cy="200" r="8" fill="none" stroke="#c8a050" stroke-width="3"/>
  <line x1="220" y1="195" x2="220" y2="145" stroke="#888" stroke-width="2"/>${FLAG_CH(214, 130)}
  <circle cx="200" cy="215" r="5" fill="#4a2a2a"/><rect x="197" y="220" width="6" height="14" fill="#4a2a2a"/>
  <circle cx="230" cy="213" r="5" fill="#4a2a2a"/><rect x="227" y="218" width="6" height="15" fill="#4a2a2a"/>
  <line x1="205" y1="215" x2="210" y2="198" stroke="#cc0000" stroke-width="3" stroke-linecap="round"/>
  <text x="220" y="250" font-family="monospace" font-size="14" fill="#ffd700" text-anchor="middle" font-weight="bold">ONE CHEESE TO RULE THEM ALL</text>
  <line x1="0" y1="235" x2="440" y2="235" stroke="#ffd700" stroke-width="0.5" opacity="0.3"/>
${svgClose}`
  }
];

// ============================================================
//  FRENCH CAMPAIGN
// ============================================================

const FRENCH_STORIES = [
  {
    title: 'LE VIN INCIDENT',
    subtitle: 'Mission 1 \u2014 First Steps',
    text: `<p>La belle France. The vineyards are lush, the baguettes are crispy, the moustaches are magnificent. The only sounds are accordion music and the gentle popping of champagne corks. Life is parfait.</p>
<p>But today, a Swiss spy \u2014 identified by his <span class="intel">seven wristwatches and suspiciously neutral demeanor</span> \u2014 was caught photographing the secret wine cellars of Bordeaux.</p>
<p>His notebook, written in four languages with obsessive precision, contained the words: <span class="intel">"THEIR WINE IS... ACCEPTABLE."</span> For a Swiss person, this is the highest possible praise. They want our wine. Prepare the defenses, commandant!</p>`,
    svg: `${svgOpen}${SKY}
  <rect x="0" y="180" width="440" height="80" fill="#5a7a3a"/>
  <rect x="0" y="220" width="440" height="40" fill="#4a6a2a"/>
  <line x1="50" y1="120" x2="50" y2="220" stroke="#5a3a1a" stroke-width="3"/>
  <line x1="100" y1="130" x2="100" y2="220" stroke="#5a3a1a" stroke-width="3"/>
  <line x1="150" y1="120" x2="150" y2="220" stroke="#5a3a1a" stroke-width="3"/>
  <line x1="50" y1="120" x2="100" y2="170" stroke="#4a8a2a" stroke-width="2"/>
  <line x1="100" y1="130" x2="150" y2="170" stroke="#4a8a2a" stroke-width="2"/>
  <line x1="100" y1="170" x2="50" y2="220" stroke="#4a8a2a" stroke-width="2"/>
  <line x1="150" y1="170" x2="100" y2="220" stroke="#4a8a2a" stroke-width="2"/>
  <circle cx="65" cy="140" r="6" fill="#6a2a6a"/><circle cx="80" cy="155" r="5" fill="#5a2a5a"/>
  <circle cx="115" cy="145" r="6" fill="#6a2a6a"/><circle cx="135" cy="150" r="5" fill="#5a2a5a"/>
  <line x1="230" y1="140" x2="230" y2="220" stroke="#666" stroke-width="2"/>
  ${FLAG_FR(230, 130)}
  <rect x="200" y="160" width="60" height="55" fill="#d2a679" rx="4"/>
  <rect x="205" y="155" width="50" height="10" fill="#c89a69" rx="3"/>
  <text x="213" y="195" font-family="monospace" font-size="9" fill="#5a3a1a">PAIN</text>
  <rect x="210" y="170" width="40" height="6" fill="#e8c088" rx="2"/>
  <rect x="210" y="178" width="40" height="6" fill="#e8c088" rx="2"/>
  <rect x="210" y="186" width="40" height="6" fill="#e8c088" rx="2"/>
  <rect x="285" y="145" width="12" height="70" fill="#4a6a2a" rx="3"/>
  <ellipse cx="308" cy="120" rx="25" ry="30" fill="#3a7a2a"/>
  <ellipse cx="290" cy="130" rx="18" ry="22" fill="#4a8a3a"/>
  <circle cx="308" cy="135" r="4" fill="white" stroke="#333" stroke-width="0.8"/>
  <circle cx="308" cy="135" r="2" fill="#333"/>
  <rect x="298" y="140" width="20" height="3" fill="#888"/>
  <rect x="295" y="142" width="4" height="8" fill="#daa520"/><rect x="302" y="142" width="4" height="8" fill="#daa520"/>
  <rect x="309" y="142" width="4" height="8" fill="#daa520"/><rect x="316" y="142" width="4" height="8" fill="#daa520"/>
  <text x="280" y="175" font-family="monospace" font-size="7" fill="#888">7 WATCHES</text>
  <rect x="370" y="155" width="8" height="60" fill="#8a2222" rx="2"/>
  <circle cx="374" cy="150" r="10" fill="#8a2222"/>
  <circle cx="374" cy="150" r="7" fill="#5a1111"/>
  <text x="374" y="240" font-family="monospace" font-size="9" fill="#888" text-anchor="middle">BORDEAUX</text>
${svgClose}`
  },
  {
    title: 'THE CROISSANT CRISIS',
    subtitle: 'Mission 2 \u2014 Border Skirmish',
    text: `<p>The Swiss have declared French cheese <span class="intel">"too smelly"</span> and imposed a Gruy\u00e8re embargo. Outrageous. Their cheese has holes in it. HOLES. That's not cheese, that's a structural failure.</p>
<p>But worse \u2014 far worse \u2014 at the International Food Summit, a German delegate was photographed <span class="intel">putting ketchup on a croissant.</span> The French ambassador fainted. The Acad\u00e9mie Fran\u00e7aise has declared this an act of war.</p>
<p>Two fronts have opened. The honor of French cuisine must be defended. Aux armes, commandant!</p>`,
    svg: `${svgOpen}${DARK_BG}${DARK_GROUND}
  <ellipse cx="220" cy="200" rx="200" ry="30" fill="rgba(255,255,200,0.05)"/>
  <circle cx="220" cy="100" r="18" fill="#ffe0c0"/>
  <ellipse cx="220" cy="86" rx="22" ry="7" fill="#1a1a6a"/><ellipse cx="220" cy="84" rx="15" ry="4" fill="#22228a"/><circle cx="220" cy="78" r="4" fill="#1a1a6a"/>
  <circle cx="214" cy="98" r="3" fill="#333"/><circle cx="226" cy="98" r="3" fill="#333"/>
  <path d="M212,106 Q208,102 204,104" fill="none" stroke="#333" stroke-width="2"/>
  <path d="M228,106 Q232,102 236,104" fill="none" stroke="#333" stroke-width="2"/>
  <rect x="214" y="118" width="12" height="50" fill="#2222aa" rx="2"/>
  <rect x="214" y="168" width="6" height="18" fill="#333"/><rect x="220" y="168" width="6" height="18" fill="#333"/>
  <ellipse cx="220" cy="195" rx="40" ry="18" fill="#e8c870" stroke="#c8a850" stroke-width="2"/>
  <path d="M185,190 Q220,175 255,190" fill="#d2a679" stroke="#b89060" stroke-width="1"/>
  <text x="220" y="248" font-family="monospace" font-size="11" fill="#ffcc00" text-anchor="middle">"VIVE LA FRANCE!"</text>
  <circle cx="80" cy="120" r="16" fill="#ffe0c0"/>
  <rect x="68" y="110" width="24" height="6" fill="#cc0000"/><rect x="76" y="112" width="8" height="2" fill="#fff"/>
  <circle cx="74" cy="118" r="2.5" fill="#333"/><circle cx="86" cy="118" r="2.5" fill="#333"/>
  <path d="M76,126 Q80,122 84,126" fill="none" stroke="#333" stroke-width="1"/>
  <rect x="74" y="136" width="12" height="40" fill="#cc0000" rx="2"/>
  <rect x="74" y="176" width="6" height="14" fill="#333"/><rect x="80" y="176" width="6" height="14" fill="#333"/>
  <circle cx="80" cy="120" r="3" fill="#ffe0c0"/>
  <text x="80" y="215" font-family="monospace" font-size="9" fill="#cc4444" text-anchor="middle">"SMELLY?!"</text>
  <circle cx="360" cy="120" r="16" fill="#ffe0c0"/>
  <rect x="348" y="106" width="24" height="8" fill="#5a3a1a"/><rect x="344" y="112" width="32" height="3" fill="#5a3a1a"/>
  <circle cx="354" cy="118" r="2.5" fill="#333"/><circle cx="366" cy="118" r="2.5" fill="#333"/>
  <rect x="354" y="136" width="12" height="40" fill="#5a3a1a" rx="2"/>
  <rect x="354" y="176" width="6" height="14" fill="#333"/><rect x="360" y="176" width="6" height="14" fill="#333"/>
  <rect x="375" y="110" width="30" height="20" fill="#e8c870" rx="4"/>
  <rect x="380" y="115" width="20" height="4" fill="#cc2222" rx="1"/>
  <text x="360" y="215" font-family="monospace" font-size="9" fill="#aa4444" text-anchor="middle">KETCHUP +</text>
  <text x="360" y="226" font-family="monospace" font-size="9" fill="#aa4444" text-anchor="middle">CROISSANT</text>
  <text x="150" y="160" font-family="monospace" font-size="18" fill="#ff4444" font-weight="bold">VS</text>
  <text x="280" y="160" font-family="monospace" font-size="18" fill="#ff4444" font-weight="bold">VS</text>
${svgClose}`
  },
  {
    title: 'LA R\u00c9SISTANCE DU FROMAGE',
    subtitle: 'Mission 3 \u2014 Alpine Assault',
    text: `<p>France deploys the <span class="intel">Baguette Ballistic System (BBS)</span> \u2014 stale baguettes hardened to near-diamond density, launched from wine-barrel cannons with devastating accuracy.</p>
<p>The Swiss counter with Toblerone spike strips across every mountain pass. The Germans bring precision-engineered bratwurst launchers running on a strict timetable.</p>
<p>The French wine reserves are being weaponized. A <span class="intel">Beaujolais Nouveau Bomb</span> is under development. Hold the line, commandant. Two aggressors close in on our beautiful countryside.</p>`,
    svg: `${svgOpen}<rect width="440" height="260" fill="#2a1a2a"/><rect x="0" y="200" width="440" height="60" fill="#3a2a3a"/>
  <rect x="40" y="100" width="80" height="60" fill="#5a2222" rx="4"/>
  <ellipse cx="80" cy="100" rx="40" ry="15" fill="#5a2222"/><ellipse cx="80" cy="100" rx="35" ry="10" fill="#4a1a1a"/>
  <rect x="55" y="160" width="8" height="40" fill="#8a6a3a"/><rect x="97" y="160" width="8" height="40" fill="#8a6a3a"/>
  <line x1="80" y1="100" x2="80" y2="60" stroke="#666" stroke-width="2"/>${FLAG_FR(80, 50)}
  <rect x="55" y="80" width="50" height="8" fill="#d2a679" rx="3" transform="rotate(-10 80 84)"/>
  <text x="80" y="215" font-family="monospace" font-size="8" fill="#cc8888" text-anchor="middle">BBS CANNON</text>
  <rect x="150" y="72" width="50" height="7" fill="#d2a679" rx="3" transform="rotate(-20 150 72)"/>
  <text x="185" y="65" font-family="monospace" font-size="9" fill="#ff8844">FIRE!</text>
  <polygon points="260,200 280,170 300,200 295,200 295,190 285,180 275,190 265,200" fill="#804020"/>
  <polygon points="310,200 330,175 350,200 345,200 345,192 335,183 325,192 315,200" fill="#804020"/>
  <polygon points="285,200 305,165 325,200 320,200 315,185 305,175 295,185 290,200" fill="#904830"/>
  <text x="305" y="218" font-family="monospace" font-size="7" fill="#aa8866" text-anchor="middle">TOBLERONE SPIKES</text>
  <rect x="375" y="120" width="40" height="25" fill="#5a3a1a" rx="2"/>
  <rect x="370" y="118" width="50" height="4" fill="#5a3a1a"/>
  <rect x="383" y="110" width="14" height="10" fill="#b35a28" rx="6"/>
  <rect x="378" y="145" width="8" height="55" fill="#5a3a1a"/><rect x="404" y="145" width="8" height="55" fill="#5a3a1a"/>
  <line x1="395" y1="120" x2="395" y2="90" stroke="#666" stroke-width="2"/>${FLAG_DE(395, 80)}
  <text x="395" y="218" font-family="monospace" font-size="7" fill="#aa8844" text-anchor="middle">WURST LAUNCHER</text>
${svgClose}`
  },
  {
    title: 'OP\u00c9RATION HAUTE CUISINE',
    subtitle: 'Mission 4 \u2014 Three-Front War',
    text: `<p>France activates <span class="intel">Plan Cuisine</span> \u2014 the nuclear option. Perfume gas creates a cloud of Chanel N\u00b05 across enemy lines. It is overwhelmingly pleasant but completely disorienting.</p>
<p>Wine bottle grenades rain upon Swiss positions. The pi\u00e8ce de r\u00e9sistance: a <span class="intel">Mobile Eiffel Tower</span> that fires baguettes with terrifying accuracy.</p>
<p>The Swiss have unleashed their cuckoo clocks. The Germans are throwing sauerkraut. Three fronts, total chaos. But French cuisine shall prevail. Vive la France!</p>`,
    svg: `${svgOpen}${CHAOS_BG}
  <circle cx="120" cy="170" r="25" fill="#ff4400" opacity="0.12"/>
  <circle cx="350" cy="150" r="30" fill="#ff4400" opacity="0.1"/>
  <polygon points="180,240 220,30 260,240" fill="#666" stroke="#888" stroke-width="1"/>
  <polygon points="195,200 220,60 245,200" fill="#555"/>
  <line x1="190" y1="120" x2="250" y2="120" stroke="#888" stroke-width="2"/>
  <line x1="195" y1="160" x2="245" y2="160" stroke="#888" stroke-width="2"/>
  ${FLAG_FR(210, 25)}
  <rect x="245" y="100" width="35" height="7" fill="#d2a679" rx="3" transform="rotate(-15 245 100)"/>
  <rect x="248" y="115" width="30" height="7" fill="#d2a679" rx="3" transform="rotate(-5 248 115)"/>
  <text x="295" y="100" font-family="monospace" font-size="8" fill="#ff8844">PEW PEW!</text>
  <text x="220" y="252" font-family="monospace" font-size="7" fill="#888" text-anchor="middle">MOBILE EIFFEL TOWER</text>
  <ellipse cx="70" cy="80" rx="45" ry="30" fill="#ecc0ee" opacity="0.3"/>
  <ellipse cx="60" cy="90" rx="30" ry="20" fill="#ddaadd" opacity="0.25"/>
  <text x="70" y="68" font-family="monospace" font-size="8" fill="#cc88cc">CHANEL N\u00b05</text>
  <text x="70" y="78" font-family="monospace" font-size="8" fill="#cc88cc">GAS CLOUD</text>
  <ellipse cx="50" cy="170" rx="8" ry="20" fill="#5a1111" rx="3"/>
  <rect x="47" y="150" width="6" height="4" fill="#666"/>
  <ellipse cx="90" cy="160" rx="8" ry="20" fill="#5a1111" rx="3"/>
  <rect x="87" y="140" width="6" height="4" fill="#666"/>
  <text x="70" y="210" font-family="monospace" font-size="8" fill="#aa4444" text-anchor="middle">WINE GRENADES</text>
  <rect x="340" y="80" width="60" height="80" fill="#5a3a1a" rx="3"/>
  <circle cx="370" cy="110" r="16" fill="#ffe8c0" stroke="#8a6a3a" stroke-width="2"/>
  <circle cx="370" cy="110" r="2" fill="#333"/>
  <line x1="370" y1="110" x2="370" y2="98" stroke="#333" stroke-width="2"/>
  <polygon points="335,80 370,60 405,80" fill="#5a3a1a"/>
  <text x="370" y="185" font-family="monospace" font-size="8" fill="#888" text-anchor="middle">SWISS CLOCK</text>
  <text x="140" y="130" font-family="monospace" font-size="14" fill="#ff4444" font-weight="bold">BOOM</text>
  <rect x="0" y="245" width="440" height="15" fill="#2a2a1a"/>
${svgClose}`
  },
  {
    title: 'LE GRAND BANQUET',
    subtitle: 'Mission 5 \u2014 The Grand Melee',
    text: `<p>The final battle for Alpine supremacy. France sends the <span class="intel">Cordon Bleu Elite</span> \u2014 chefs who fight as magnificently as they cook. Their battle cry echoes through the mountains: <span class="intel">"BON APP\u00c9TIT!"</span></p>
<p>The Swiss Fondue Division and German W\u00fcrstchen Brigade stand in the way. Between us and glory lies nothing but mountains, sauerkraut, and neutral cheese.</p>
<p>One nation will control the Alps forever. The others will eat instant noodles. C'est la guerre, commandant. Make France proud.</p>`,
    svg: `${svgOpen}${EPIC_BG}
  <polygon points="0,260 60,160 120,260" fill="#1a1a2a"/><polygon points="100,260 180,130 260,260" fill="#1a1a2a"/>
  <polygon points="200,260 300,140 400,260" fill="#1a1a2a"/><polygon points="320,260 400,170 440,260" fill="#1a1a2a"/>
  <circle cx="220" cy="70" r="55" fill="#d2a679" opacity="0.15"/>
  <circle cx="220" cy="70" r="42" fill="#d2a679" stroke="#c89a69" stroke-width="3"/>
  <rect x="200" y="55" width="40" height="6" fill="#c89a69" rx="2"/>
  <line x1="220" y1="15" x2="220" y2="0" stroke="#d2a679" stroke-width="2" opacity="0.3"/>
  <line x1="260" y1="30" x2="280" y2="10" stroke="#d2a679" stroke-width="2" opacity="0.3"/>
  <line x1="180" y1="30" x2="160" y2="10" stroke="#d2a679" stroke-width="2" opacity="0.3"/>
  <line x1="220" y1="195" x2="220" y2="145" stroke="#888" stroke-width="2"/>${FLAG_FR(210, 130)}
  <circle cx="200" cy="215" r="5" fill="#2a2a4a"/><rect x="197" y="220" width="6" height="14" fill="#2a2a4a"/>
  <circle cx="230" cy="213" r="5" fill="#2a2a4a"/><rect x="227" y="218" width="6" height="15" fill="#2a2a4a"/>
  <ellipse cx="200" cy="211" rx="6" ry="2" fill="#1a1a6a"/><ellipse cx="230" cy="209" rx="6" ry="2" fill="#1a1a6a"/>
  <line x1="205" y1="215" x2="212" y2="200" stroke="#d2a679" stroke-width="3" stroke-linecap="round"/>
  <line x1="50" y1="200" x2="50" y2="155" stroke="#666" stroke-width="2"/>${FLAG_CH(44, 140)}
  <circle cx="40" cy="210" r="5" fill="#4a2a2a"/><rect x="37" y="215" width="6" height="15" fill="#4a2a2a"/>
  <circle cx="60" cy="212" r="5" fill="#4a2a2a"/><rect x="57" y="217" width="6" height="13" fill="#4a2a2a"/>
  <line x1="370" y1="200" x2="370" y2="155" stroke="#666" stroke-width="2"/>${FLAG_DE(370, 145)}
  <circle cx="355" cy="210" r="5" fill="#2a2a3a"/><rect x="352" y="215" width="6" height="15" fill="#2a2a3a"/>
  <circle cx="385" cy="208" r="5" fill="#2a2a3a"/><rect x="382" y="213" width="6" height="17" fill="#2a2a3a"/>
  <text x="220" y="250" font-family="monospace" font-size="14" fill="#d2a679" text-anchor="middle" font-weight="bold">POUR LA GLOIRE!</text>
  <line x1="0" y1="235" x2="440" y2="235" stroke="#d2a679" stroke-width="0.5" opacity="0.3"/>
${svgClose}`
  }
];

// ============================================================
//  GERMAN CAMPAIGN
// ============================================================

const GERMAN_STORIES = [
  {
    title: 'DAS BIER PROBLEM',
    subtitle: 'Mission 1 \u2014 First Steps',
    text: `<p>Bavaria is paradise. The beer flows like rivers, the bratwursts sizzle on schedule, and the trains are running precisely on time. The Lederhosen are freshly pressed. Everything is in Ordnung.</p>
<p>But today, a French spy was caught attempting to <span class="intel">add champagne to the Oktoberfest beer supply.</span> This is a crime against civilization itself. He was wearing so much cologne that the Geiger counter went off.</p>
<p>Meanwhile, a Swiss banker was discovered trying to <span class="intel">patent German efficiency.</span> Patent. German. Efficiency. The audacity. One enemy approaches. Ordnung muss sein!</p>`,
    svg: `${svgOpen}${SKY}
  <rect x="0" y="180" width="440" height="80" fill="#5a7a3a"/>
  <rect x="0" y="220" width="440" height="40" fill="#4a6a2a"/>
  <rect x="50" y="110" width="120" height="110" fill="#c89a50" rx="4"/>
  <rect x="55" y="115" width="50" height="60" fill="#4a3a1a" rx="2"/>
  <rect x="115" y="115" width="50" height="60" fill="#4a3a1a" rx="2"/>
  <rect x="80" y="180" width="30" height="40" fill="#3a2a0a" rx="2"/>
  <text x="110" y="240" font-family="monospace" font-size="9" fill="#888" text-anchor="middle">BIERGARTEN</text>
  <line x1="110" y1="110" x2="110" y2="80" stroke="#666" stroke-width="2"/>${FLAG_DE(110, 65)}
  <rect x="200" y="140" width="60" height="40" fill="#8a5a2a" rx="3"/>
  <line x1="215" y1="140" x2="215" y2="120" stroke="#888" stroke-width="1.5"/>
  <line x1="230" y1="140" x2="230" y2="118" stroke="#888" stroke-width="1.5"/>
  <line x1="245" y1="140" x2="245" y2="122" stroke="#888" stroke-width="1.5"/>
  <rect x="210" y="135" width="40" height="6" fill="#b35a28" rx="2"/>
  <rect x="210" y="128" width="40" height="6" fill="#c06830" rx="2"/>
  <rect x="210" y="121" width="40" height="6" fill="#b35a28" rx="2"/>
  <rect x="195" y="180" width="8" height="40" fill="#5a3a1a"/><rect x="257" y="180" width="8" height="40" fill="#5a3a1a"/>
  <ellipse cx="230" cy="180" rx="30" ry="5" fill="#ff4400" opacity="0.3"/>
  <text x="230" y="240" font-family="monospace" font-size="9" fill="#888" text-anchor="middle">BRATWURST GRILL</text>
  <rect x="200" y="145" width="60" height="3" fill="#888"/>
  <ellipse cx="350" cy="186" rx="22" ry="16" fill="#3a8a3a"/>
  <ellipse cx="340" cy="178" rx="14" ry="10" fill="#4a9a4a"/>
  <ellipse cx="360" cy="180" rx="12" ry="9" fill="#4a9a4a"/>
  ${BERET_SPY(350, 180)}
  <rect x="370" y="172" width="30" height="5" fill="#d2a679" rx="2" transform="rotate(-10 370 172)"/>
  <ellipse cx="390" cy="155" rx="15" ry="15" fill="rgba(200,180,255,0.25)"/>
  <text x="390" y="148" font-family="monospace" font-size="6" fill="#aa88cc">COLOGNE</text>
  <text x="390" y="156" font-family="monospace" font-size="6" fill="#aa88cc">CLOUD</text>
${svgClose}`
  },
  {
    title: 'DER SENF-VORFALL',
    subtitle: 'Mission 2 \u2014 Border Skirmish',
    text: `<p>The French have publicly declared German sausage <span class="intel">"primitive."</span> The Swiss have suggested that German chocolate is <span class="intel">"too sweet and lacks precision."</span> The nerve. Swiss chocolate lacks FLAVOUR.</p>
<p>At an emergency NATO Food Summit, the German delegate presented a <span class="intel">47-page report</span> proving German cuisine is objectively superior. It included graphs, efficiency metrics, and a Gantt chart of optimal bratwurst grilling times.</p>
<p>The French walked out. The Swiss remained neutral for exactly 3.7 seconds. Two enemies now challenge our borders. Time to show them German engineering, Kommandant!</p>`,
    svg: `${svgOpen}${DARK_BG}${DARK_GROUND}
  <ellipse cx="220" cy="200" rx="200" ry="30" fill="rgba(255,255,200,0.05)"/>
  <circle cx="220" cy="105" r="18" fill="#ffe0c0"/>
  <rect x="206" y="90" width="28" height="10" fill="#5a3a1a"/><rect x="202" y="96" width="36" height="4" fill="#5a3a1a"/>
  <circle cx="214" cy="103" r="3" fill="#333"/><circle cx="226" cy="103" r="3" fill="#333"/>
  <path d="M212,113 L228,113" stroke="#333" stroke-width="2"/>
  <rect x="214" y="123" width="12" height="30" fill="#8B7355" rx="1"/>
  <rect x="210" y="153" width="20" height="12" fill="#5a3a1a"/>
  <rect x="210" y="165" width="8" height="20" fill="#5a3a1a"/><rect x="222" y="165" width="8" height="20" fill="#5a3a1a"/>
  <rect x="210" y="185" width="8" height="12" fill="#333"/><rect x="222" y="185" width="8" height="12" fill="#333"/>
  <rect x="240" y="95" width="45" height="60" fill="white" stroke="#333" stroke-width="1"/>
  <line x1="248" y1="105" x2="278" y2="105" stroke="#333" stroke-width="0.5"/>
  <line x1="248" y1="110" x2="278" y2="110" stroke="#333" stroke-width="0.5"/>
  <line x1="248" y1="115" x2="278" y2="115" stroke="#333" stroke-width="0.5"/>
  <line x1="248" y1="120" x2="270" y2="120" stroke="#333" stroke-width="0.5"/>
  <rect x="250" y="125" width="25" height="15" fill="none" stroke="#4444aa" stroke-width="0.5"/>
  <line x1="250" y1="138" x2="258" y2="130" stroke="#44aa44" stroke-width="1"/>
  <line x1="258" y1="130" x2="266" y2="134" stroke="#44aa44" stroke-width="1"/>
  <line x1="266" y1="134" x2="275" y2="126" stroke="#44aa44" stroke-width="1"/>
  <text x="262" y="150" font-family="monospace" font-size="5" fill="#333" text-anchor="middle">47 PAGES</text>
  <text x="220" y="248" font-family="monospace" font-size="11" fill="#ffcc00" text-anchor="middle">"OBJECTIVELY SUPERIOR"</text>
  <circle cx="80" cy="115" r="16" fill="#ffe0c0"/>
  <ellipse cx="80" cy="103" rx="18" ry="6" fill="#1a1a6a"/>
  <circle cx="74" cy="113" r="2.5" fill="#333"/><circle cx="86" cy="113" r="2.5" fill="#333"/>
  <path d="M74,120 Q70,117 66,119" fill="none" stroke="#333" stroke-width="1.5"/>
  <path d="M86,120 Q90,117 94,119" fill="none" stroke="#333" stroke-width="1.5"/>
  <rect x="74" y="131" width="12" height="40" fill="#2222aa" rx="2"/>
  <rect x="74" y="171" width="6" height="18" fill="#333"/><rect x="80" y="171" width="6" height="18" fill="#333"/>
  <path d="M75,140 Q80,180 85,140" fill="none" stroke="#fff" stroke-width="0.5"/>
  <text x="80" y="215" font-family="monospace" font-size="9" fill="#4444aa" text-anchor="middle">"PRIMITIVE?!"</text>
  <circle cx="360" cy="115" r="16" fill="#ffe0c0"/>
  <rect x="354" y="105" width="12" height="3" fill="#cc0000"/><rect x="358" y="103" width="4" height="7" fill="#fff"/>
  <circle cx="354" cy="113" r="2.5" fill="#333"/><circle cx="366" cy="113" r="2.5" fill="#333"/>
  <path d="M355,122 Q360,118 365,122" fill="none" stroke="#333" stroke-width="1"/>
  <rect x="354" y="131" width="12" height="40" fill="#cc0000" rx="2"/>
  <rect x="354" y="171" width="6" height="18" fill="#333"/><rect x="360" y="171" width="6" height="18" fill="#333"/>
  <text x="360" y="215" font-family="monospace" font-size="9" fill="#cc4444" text-anchor="middle">"3.7 SECONDS"</text>
  <text x="150" y="155" font-family="monospace" font-size="18" fill="#ff4444" font-weight="bold">VS</text>
  <text x="285" y="155" font-family="monospace" font-size="18" fill="#ff4444" font-weight="bold">VS</text>
${svgClose}`
  },
  {
    title: 'BLITZWURST',
    subtitle: 'Mission 3 \u2014 Alpine Assault',
    text: `<p>Germany deploys <span class="intel">Operation Blitzwurst</span> \u2014 a lightning-fast bratwurst offensive supported by precision-engineered pretzel fortifications. Everything runs on a strict timetable. The victory parade is already scheduled for next Tuesday at 14:00 sharp.</p>
<p>The French respond with baguette barriers. The Swiss have deployed their irritating cuckoo clock early warning system that goes off every 15 minutes.</p>
<p>The German High Command has distributed <span class="intel">efficiency reports to every soldier.</span> Morale is at maximum optimization. Two foes stand in our way, Kommandant.</p>`,
    svg: `${svgOpen}<rect width="440" height="260" fill="#2a2a1a"/><rect x="0" y="200" width="440" height="60" fill="#3a3a2a"/>
  <ellipse cx="110" cy="170" rx="50" ry="50" fill="none" stroke="#c8a050" stroke-width="12"/>
  <line x1="80" y1="140" x2="140" y2="140" stroke="#c8a050" stroke-width="8"/>
  <circle cx="95" cy="148" r="8" fill="#2a2a1a"/><circle cx="125" cy="148" r="8" fill="#2a2a1a"/>
  <ellipse cx="110" cy="130" rx="40" ry="10" fill="#c8a050"/>
  <line x1="110" y1="120" x2="110" y2="90" stroke="#666" stroke-width="2"/>${FLAG_DE(110, 75)}
  <text x="110" y="240" font-family="monospace" font-size="8" fill="#c8a050" text-anchor="middle">PRETZEL FORTRESS</text>
  <rect x="200" y="120" width="50" height="25" fill="#666" rx="2"/>
  <rect x="195" y="115" width="20" height="8" fill="#666" rx="1"/>
  <rect x="190" y="145" width="10" height="8" fill="#333" rx="2"/>
  <rect x="210" y="145" width="10" height="8" fill="#333" rx="2"/>
  <rect x="230" y="145" width="10" height="8" fill="#333" rx="2"/>
  <rect x="250" y="145" width="10" height="8" fill="#333" rx="2"/>
  <rect x="250" y="125" width="30" height="6" fill="#b35a28" rx="2"/>
  <text x="225" y="170" font-family="monospace" font-size="8" fill="#888" text-anchor="middle">WURST-PANZER</text>
  <rect x="205" y="100" width="40" height="16" fill="white" stroke="#333" stroke-width="0.5"/>
  <text x="210" y="108" font-family="monospace" font-size="5" fill="#333">14:00 VICTORY</text>
  <text x="210" y="113" font-family="monospace" font-size="5" fill="#333">14:15 PARADE</text>
  <rect x="320" y="140" width="70" height="10" fill="#d2a679" rx="4"/>
  <rect x="320" y="152" width="70" height="10" fill="#c89a69" rx="4"/>
  <rect x="320" y="164" width="70" height="10" fill="#d2a679" rx="4"/>
  <rect x="320" y="176" width="70" height="10" fill="#c89a69" rx="4"/>
  <rect x="320" y="188" width="70" height="10" fill="#d2a679" rx="4"/>
  <line x1="355" y1="140" x2="355" y2="110" stroke="#666" stroke-width="2"/>${FLAG_FR(355, 100)}
  <text x="355" y="218" font-family="monospace" font-size="7" fill="#c89a69" text-anchor="middle">BAGUETTE BARRIER</text>
  <rect x="290" y="100" width="24" height="7" fill="#b35a28" rx="3" transform="rotate(-20 290 100)"/>
  <text x="290" y="92" font-family="monospace" font-size="9" fill="#ffcc00">BLITZ!</text>
${svgClose}`
  },
  {
    title: 'OKTOBERFEST OFFENSIVE',
    subtitle: 'Mission 4 \u2014 Three-Front War',
    text: `<p>Germany activates <span class="intel">Contingency Plan Oktoberfest.</span> Beer-powered mechanized divisions roll out. The Lederhosen Special Forces are deployed. Accordion suppression systems jam all enemy communications.</p>
<p>The French are throwing snails again. The Swiss are hiding behind their chocolate. The <span class="intel">Bavarian Beer Blitz</span> is our answer: waves of soldiers fortified by Weissbier and armed with pretzel-shaped shields.</p>
<p>Three fronts. German engineering will prevail. Everything is proceeding according to the timetable, Kommandant.</p>`,
    svg: `${svgOpen}${CHAOS_BG}
  <circle cx="100" cy="170" r="30" fill="#daa520" opacity="0.1"/>
  <circle cx="350" cy="150" r="30" fill="#ff4400" opacity="0.1"/>
  <rect x="150" y="80" width="80" height="50" fill="#666" rx="4"/>
  <rect x="145" y="75" width="30" height="10" fill="#666" rx="2"/>
  <rect x="140" y="130" width="16" height="10" fill="#333" rx="3"/>
  <rect x="162" y="130" width="16" height="10" fill="#333" rx="3"/>
  <rect x="184" y="130" width="16" height="10" fill="#333" rx="3"/>
  <rect x="206" y="130" width="16" height="10" fill="#333" rx="3"/>
  <rect x="160" y="60" width="50" height="25" fill="#daa520" rx="4"/>
  <ellipse cx="185" cy="60" rx="28" ry="8" fill="#fff" opacity="0.4"/>
  <text x="185" y="73" font-family="monospace" font-size="7" fill="#5a3a1a" text-anchor="middle">BIER TANK</text>
  ${FLAG_DE(155, 45)}
  <text x="190" y="155" font-family="monospace" font-size="8" fill="#daa520" text-anchor="middle">BEER-POWERED</text>
  <circle cx="60" cy="110" r="5" fill="#2a2a4a"/><rect x="57" y="115" width="6" height="14" fill="#2a2a4a"/>
  <circle cx="75" cy="108" r="5" fill="#2a2a4a"/><rect x="72" y="113" width="6" height="16" fill="#2a2a4a"/>
  <circle cx="90" cy="112" r="5" fill="#2a2a4a"/><rect x="87" y="117" width="6" height="13" fill="#2a2a4a"/>
  <rect x="55" y="105" width="10" height="12" fill="#5a3a1a"/><rect x="73" y="103" width="10" height="12" fill="#5a3a1a"/>
  <rect x="88" y="107" width="10" height="12" fill="#5a3a1a"/>
  <circle cx="50" cy="100" r="8" fill="none" stroke="#c8a050" stroke-width="3"/>
  <circle cx="95" cy="100" r="7" fill="none" stroke="#c8a050" stroke-width="3"/>
  <text x="70" y="145" font-family="monospace" font-size="7" fill="#c8a050" text-anchor="middle">LEDERHOSEN BRIGADE</text>
  <rect x="300" y="80" width="60" height="40" fill="#8a6a3a" rx="4"/>
  <rect x="310" y="70" width="10" height="15" fill="#666"/>
  <rect x="340" y="68" width="10" height="17" fill="#666"/>
  <path d="M310,80 Q330,65 350,80" fill="none" stroke="#666" stroke-width="3"/>
  <ellipse cx="330" cy="85" rx="20" ry="8" fill="rgba(200,180,150,0.2)"/>
  <text x="330" y="135" font-family="monospace" font-size="7" fill="#888" text-anchor="middle">ACCORDION JAMMER</text>
  <text x="330" y="100" font-family="monospace" font-size="12" fill="#aa8844">OOMPA OOMPA</text>
  <text x="220" y="200" font-family="monospace" font-size="14" fill="#ff4444" font-weight="bold">PROST!</text>
  <rect x="0" y="245" width="440" height="15" fill="#2a2a1a"/>
${svgClose}`
  },
  {
    title: 'DER LETZTE BISS',
    subtitle: 'Mission 5 \u2014 The Grand Melee',
    text: `<p>The final battle. Germany sends its finest: the <span class="intel">Bayerische Bierbrigade.</span> The French Moustache Regiment and the Swiss Army Knife Corps stand between Germany and total Alpine domination.</p>
<p>The winner controls all beer, cheese, wine, and sausage production in the Alps. The losers drink <span class="intel">light beer</span> forever. There is no fate more terrible.</p>
<p>The timetable says victory is at 16:00. German engineering does not fail. Vorw\u00e4rts, Kommandant!</p>`,
    svg: `${svgOpen}${EPIC_BG}
  <polygon points="0,260 60,160 120,260" fill="#1a1a2a"/><polygon points="100,260 180,130 260,260" fill="#1a1a2a"/>
  <polygon points="200,260 300,140 400,260" fill="#1a1a2a"/><polygon points="320,260 400,170 440,260" fill="#1a1a2a"/>
  <circle cx="220" cy="70" r="55" fill="#daa520" opacity="0.15"/>
  <circle cx="220" cy="70" r="42" fill="#daa520" stroke="#c8a050" stroke-width="3"/>
  <ellipse cx="220" cy="70" rx="30" ry="30" fill="none" stroke="#c8a050" stroke-width="6"/>
  <line x1="200" y1="60" x2="240" y2="60" stroke="#c8a050" stroke-width="4"/>
  <circle cx="210" cy="65" r="5" fill="#1a0a2a"/><circle cx="230" cy="65" r="5" fill="#1a0a2a"/>
  <line x1="220" y1="15" x2="220" y2="0" stroke="#daa520" stroke-width="2" opacity="0.3"/>
  <line x1="260" y1="30" x2="280" y2="10" stroke="#daa520" stroke-width="2" opacity="0.3"/>
  <line x1="180" y1="30" x2="160" y2="10" stroke="#daa520" stroke-width="2" opacity="0.3"/>
  <line x1="220" y1="195" x2="220" y2="145" stroke="#888" stroke-width="2"/>${FLAG_DE(210, 130)}
  <circle cx="200" cy="215" r="5" fill="#2a2a3a"/><rect x="197" y="220" width="6" height="14" fill="#2a2a3a"/>
  <circle cx="230" cy="213" r="5" fill="#2a2a3a"/><rect x="227" y="218" width="6" height="15" fill="#2a2a3a"/>
  <rect x="197" y="210" width="10" height="12" fill="#5a3a1a"/><rect x="227" y="208" width="10" height="12" fill="#5a3a1a"/>
  <circle cx="200" cy="200" r="6" fill="none" stroke="#c8a050" stroke-width="2"/>
  <circle cx="235" cy="200" r="6" fill="none" stroke="#c8a050" stroke-width="2"/>
  <line x1="50" y1="200" x2="50" y2="155" stroke="#666" stroke-width="2"/>${FLAG_FR(50, 145)}
  <circle cx="40" cy="210" r="5" fill="#2a2a4a"/><rect x="37" y="215" width="6" height="15" fill="#2a2a4a"/>
  <circle cx="60" cy="212" r="5" fill="#2a2a4a"/><rect x="57" y="217" width="6" height="13" fill="#2a2a4a"/>
  <line x1="370" y1="200" x2="370" y2="155" stroke="#666" stroke-width="2"/>${FLAG_CH(364, 140)}
  <circle cx="355" cy="210" r="5" fill="#4a2a2a"/><rect x="352" y="215" width="6" height="15" fill="#4a2a2a"/>
  <circle cx="385" cy="208" r="5" fill="#4a2a2a"/><rect x="382" y="213" width="6" height="17" fill="#4a2a2a"/>
  <text x="220" y="250" font-family="monospace" font-size="14" fill="#daa520" text-anchor="middle" font-weight="bold">ORDNUNG MUSS SEIN!</text>
  <line x1="0" y1="235" x2="440" y2="235" stroke="#daa520" stroke-width="0.5" opacity="0.3"/>
${svgClose}`
  }
];

// ============================================================
//  EXPORTS: faction-keyed story data
// ============================================================

export const MISSION_STORIES = {
  swiss: SWISS_STORIES,
  french: FRENCH_STORIES,
  german: GERMAN_STORIES,
};

export const VICTORY_STORIES = {
  swiss: [
    `The French spy Jacques Fromageaux has fled back across the border, his beret singed and his crackers crushed. Word of your victory spreads through the valleys. But the baguette hotline is still ringing, and now Berlin is picking up too...`,
    `Both invaders have been repelled! The French retreated carrying nothing but a single wheel of Camembert "for morale." The Germans left behind 47 empty beer steins and a strongly-worded note. The Swiss ambassador has cancelled all future cheese tastings with foreign diplomats.`,
    `Le Maginot Line du Fromage has crumbled. The Wurst-Werfer 9000 lies in pieces. Your fondue pots still bubble triumphantly. But intelligence reports are alarming: BOTH nations are mobilizing everything they have. The war is far from over.`,
    `Against all odds, you've held three fronts simultaneously with Swiss watch precision. The Cuckoo Clock of Doom has earned its place in military history. The enemy forces are shattered but not destroyed \u2014 they're consolidating for one final, desperate push.`,
    `IT IS OVER! The Alps are yours! The French Moustache Regiment has surrendered \u2014 ironically, as predicted. The Lederhosen Brigade ran out of both beer and courage. Every wheel of cheese from Geneva to Zurich is safe. Fondue shall flow freely for a thousand years. You are the Supreme Alpine Cheese Commander!`
  ],
  french: [
    `The Swiss spy has been sent home with his seven broken watches and a note reading "Do not return." Your vineyards are safe. But German radio is playing Rammstein louder than usual. Something is brewing across the Rhine...`,
    `Magnifique! The Swiss retreated to count their remaining cheese. The Germans left in their Volkswagens, sulking. But the croissant ketchup incident has not been forgotten. Both nations are regrouping. Keep the baguettes sharp, commandant.`,
    `The Baguette Ballistic System has proven devastatingly effective! Toblerone spikes and bratwurst launchers were no match for French engineering. But the enemy grows desperate. Intel suggests the Swiss and Germans may be forming an unholy alliance of bland food.`,
    `Three fronts held with French \u00e9lan! The Mobile Eiffel Tower is now a legend. The perfume gas cleared three valleys of enemy troops. But the final battle approaches \u2014 every baguette, every bottle of Bordeaux must be ready.`,
    `VICTOIRE! The Alps belong to France! The Swiss have surrendered their cheese recipes. The Germans have admitted French food is superior (it's in writing). Baguettes are now the official bread of the Alpine region. Champagne is flowing from every fountain. You are the Grand Commandant de la Cuisine Alpine!`
  ],
  german: [
    `The French spy has been deported, his cologne confiscated. The Swiss banker's patent application was shredded. Order is restored. But intelligence reports indicate BOTH neighbors are now discussing German beer at suspicious "diplomatic" meetings...`,
    `Efficient victory! The French delegation's 47-page rebuttal had typos on every page. The Swiss couldn't decide whether to be neutral or offended. Both have retreated to reconsider their life choices. But they'll be back \u2014 prepare the next timetable.`,
    `Operation Blitzwurst was completed ahead of schedule! The pretzel fortress held perfectly. The baguette barriers crumbled like... well, like stale bread. But both enemies are mobilizing everything for a massive counterattack. Adjust the timetable accordingly.`,
    `Three fronts managed with German precision! The beer-powered tanks exceeded fuel efficiency targets. The accordion jammer disrupted all enemy communications. But the final battle approaches. The victory parade has been rescheduled to accommodate the extra conquest.`,
    `SIEG! The Alps are German! The French surrendered their wine cellars. The Swiss handed over their watch factories. Beer gardens are being established on every mountain peak. Bratwurst is now the official Alpine sausage. Trains run on time from Z\u00fcrich to Lyon. You are the Oberkommandant der Alpenfestung!`
  ],
};

export const DEFEAT_STORIES = {
  swiss: [
    `Your cheese reserves have been captured. Jacques Fromageaux is doing a victory dance on top of your Construction Yard, waving a baguette. The cows look disappointed. Regroup and try again, commander.`,
    `Overwhelmed on two fronts, your base crumbles. The French are already arguing with the Germans about how to divide the cheese. Don't worry \u2014 they'll be fighting each other soon enough. Rebuild and return!`,
    `The fondue pots have gone cold. The baguette wall held longer than your defenses. The Wurst-Werfer 9000 proved devastatingly accurate. Rally your forces!`,
    `Three fronts was too many. The snails got through. The sauerkraut storm was overwhelming. Even the Cuckoo Clock of Doom couldn't save you. But Switzerland has never truly been conquered \u2014 try again!`,
    `So close, yet so far. The final battle is lost. The Alps echo with German drinking songs and French accordion music. Processed cheese slices are being distributed. Try again, commander \u2014 the cheese demands it!`
  ],
  french: [
    `Your vineyard has been trampled. The Swiss spy is taking selfies with your wine barrels. The baguettes have gone stale from lack of morale. Regroup, commandant \u2014 France does not stay down for long!`,
    `Defeated on two fronts! The Germans are grilling bratwurst in your countryside. The Swiss are installing clocks everywhere. But French r\u00e9sistance is eternal. Rebuild, commandant!`,
    `The Baguette Ballistic System has been captured. The wine barrels are empty. The enemy is drinking your Beaujolais without even smelling it first. This humiliation cannot stand!`,
    `Three fronts overwhelmed even French \u00e9lan. The Mobile Eiffel Tower has been disassembled. Someone is putting ketchup on everything. Rally the troops, commandant \u2014 cuisine will have its revenge!`,
    `The final battle is lost. The Alps smell of sauerkraut and fondue instead of perfume and fresh bread. Instant coffee has replaced espresso. This is the darkest timeline. Try again \u2014 for France!`
  ],
  german: [
    `Your beer garden has been overrun. A French person is putting champagne in the taps. A Swiss banker is auditing the ruins. The trains are running two minutes late. This is unacceptable. Regroup, Kommandant!`,
    `Defeated on two fronts! The French are cooking snails in your kitchen. The Swiss are "optimizing" your efficiency reports with their own methodology. Rebuild with better engineering!`,
    `Operation Blitzwurst has failed. The pretzel fortress crumbled. The enemy is eating your bratwurst WITH KETCHUP. The timetable is in ruins. Revise the plan and try again!`,
    `Three fronts exceeded operational capacity. The beer-powered tanks ran dry. The accordion jammer was jammed. But German engineering learns from failure. Update the timetable, Kommandant!`,
    `The final battle is lost. The Alps ring with yodeling and accordion music. Light beer is being served everywhere. The trains are running on "approximate" schedules. Try again \u2014 Ordnung demands it!`
  ],
};
