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

## Additional languages: French (fr), Italian (it), Mandarin Chinese (zh, Simplified characters)
Register: French = "vous"; Italian = formal "Lei" in direct address where natural (website-neutral imperatives are fine, e.g. "Dona ora"); Chinese = Simplified Chinese (简体中文), clear standard Mandarin, polite neutral register, full-width Chinese punctuation (，。：；“”) except inside numbers, money, URLs and emails.
Keep-as-is rules above apply to all languages (organization name, partner names, SSI/CIM/SMIT, "Equity in Action", numbers, money, addresses, emails).
For the home-page headline "United We Stand, Health In Every Land" use the meaning "United for the health of the world" (es: "Unidos por la salud del mundo").

| English | fr | it | zh |
|---|---|---|---|
| Donate / Donate now | Faire un don / Faites un don | Dona / Dona ora | 捐赠 / 立即捐赠 |
| Member login | Espace membres | Area membri | 会员登录 |
| Member portal | Portail des membres | Portale membri | 会员门户 |
| Become a member / Membership | Devenir membre / Adhésion | Diventa socio / Iscrizione | 成为会员 / 会员资格 |
| Logistics Coalition | Coalition logistique | Coalizione logistica | 物流联盟 |
| Programs / Impact / Blog / About | Programmes / Impact / Blog / À propos | Programmi / Impatto / Blog / Chi siamo | 项目 / 影响 / 博客 / 关于我们 |
| Financial Transparency | Transparence financière | Trasparenza finanziaria | 财务透明 |
| Contact Us | Contactez-nous | Contattaci | 联系我们 |
| Volunteer | Bénévolat / Devenir bénévole | Volontariato / Diventa volontario | 志愿服务 / 成为志愿者 |
| fiscal sponsor(ship) | parrainage fiscal / parrain fiscal | sponsorizzazione fiscale / sponsor fiscale | 财务托管 / 财务托管方 |
| underserved communities | communautés mal desservies | comunità svantaggiate | 医疗资源匮乏的社区 |
| medical supplies | fournitures médicales | forniture mediche | 医疗物资 |
| tax-deductible | déductible des impôts (aux États-Unis) | deducibile dalle tasse (negli Stati Uniti) | 可抵税（美国） |
| clinician(s) | professionnel(s) de santé | professionisti sanitari | 临床医护人员 |
