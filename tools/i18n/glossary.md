# PAMA translation brief (Spanish = es, Brazilian Portuguese = pt)

Audience: clinicians, students, community partners and donors across Latin America. Tone: professional, warm,
coalition-first ("together with our partners"), capacity building, never charity/savior language. Clear, ~9th-grade reading level.

Register: Spanish (es) = neutral Latin American Spanish, formal "usted". Portuguese (pt) = Brazilian Portuguese, "você".

## Keep exactly as is (do not translate)
- Organization name: "Pan-American Medical Association", "The Pan-American Medical Association", "PAMA".
- Proper names of people, partner organizations, places, publications and sources (e.g. "Not Just Tourists", "Global Health Partners", "U.S. Hands Off Cuba Committee", "Philly for Cuba (P4C)", "Levántate por Cuba", "Aldea Pitzal", "PAHO/WHO", "UN IGME", "PayPal", "Venmo", "Candid", "GuideStar").
- Named PAMA tools/programs keep their English names and acronyms: "Solidarity Supply Index (SSI)", "Community Impact Measure (CIM)", "Solidarity Medical Impact Teams (SMIT)". You may add a short translation in parentheses the FIRST time only if it reads naturally; otherwise keep English.
- Numbers, money ($, Q), percentages, dates' digits, EIN, addresses, emails, phone numbers, URLs, social network names.
- "501(c)(3)".

## Preferred terms
| English | es | pt |
|---|---|---|
| Donate / Donate now | Donar / Done ahora | Doar / Doe agora |
| Member login | Acceso de miembros | Acesso de membros |
| Member portal | Portal de miembros | Portal de membros |
| Become a member / Membership | Hágase miembro / Membresía | Seja membro / Associação |
| Logistics Coalition | Coalición Logística | Coalizão Logística |
| Programs / Impact / Blog / About | Programas / Impacto / Blog / Nosotros | Programas / Impacto / Blog / Sobre nós |
| Financial Transparency | Transparencia financiera | Transparência financeira |
| Contact Us | Contáctenos | Fale conosco |
| Volunteer | Voluntariado / Sea voluntario | Voluntariado / Seja voluntário |
| fiscal sponsor(ship) | patrocinio fiscal / patrocinador fiscal | patrocínio fiscal / patrocinador fiscal |
| underserved communities | comunidades desatendidas | comunidades carentes de atendimento |
| medical supplies | insumos médicos | suprimentos médicos |
| tax-deductible | deducible de impuestos (en EE. UU.) | dedutível de impostos (nos EUA) |
| clinician(s) | profesional(es) clínico(s) / personal clínico | profissional(is) de saúde |

## Placeholder tokens — critical
Text contains tokens like <t1>…</t1>, <t2/>, <t3>…</t3>. They stand for HTML tags (links, bold, line breaks, inputs, images).
- Keep EVERY token, with the same numbers, the same count, and proper nesting. Never add, drop or renumber tokens.
- You may move a token pair to wrap the equivalent translated words when grammar requires.
- Self-closing tokens like <t2/> (line break, input, image) must stay; keep their relative position sensible (e.g. a checkbox token stays at the start of its label).
- Do not add any real HTML.

## Output
A JSON object mapping each id to its translation, same ids as the input, valid UTF-8 JSON, no comments. Translate every entry.
Very short UI strings (button labels, menu items) should stay short.
