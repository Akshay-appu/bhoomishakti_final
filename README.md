# BhoomiShakti — Smart Agriculture Innovation Ecosystem (static website)

**One Ecosystem. Multiple Innovations. Stronger Rural Communities.**

A static, multi-page website for the seven BhoomiShakti projects. It uses only
**HTML5, CSS3 and vanilla JavaScript**: no frameworks, no build tools, no Node/npm
and no backend. Open `index.html` in a browser, or publish the folder on GitHub Pages.

## Pages

| File | Content |
|---|---|
| `index.html` | Home: hero, About (7 layers), interactive ecosystem, filterable project showcase, Impact, Future Scope, CTA |
| `projects.html` | All projects: filter + comparison table with honest status labels |
| `ai.html` | BhoomiShakti AI: modules, Demand → Response → Procurement timeline, architecture, security, current implementation |
| `agri-digital.html` | Agri Digital: farmer journey, ecosystem ring, modules, two-sided business workflow |
| `seva.html` | Seva: services, interactive booking demonstration (illustrative example), modules, phases |
| `x1.html` | X1: animated machine energy-flow diagram, architecture, **Rent BhoomiShakti X1** enquiry form |
| `s4.html` | S4: scroll-driven seed-flow story with seed particles, "Designed Around the Farmer", enquiry form |
| `jeevadhara.html` | JeevaDhara: composition donut (50/25/15/10 + urine 1:8), preparation, nitrogen mechanism, X1 soil mixing, soil cross-section, observations, limitations |
| `jeevadhan.html` | JeevaDhan: circular cycle, energy + digestate pathways, digital platform, phases, JeevaDhan + JeevaDhara loop |
| `farmer-tools.html` | Farmer Tools: weather & spray advisor (Open-Meteo), land unit converter, farm profit planner (printable), official government schemes & helplines |
| `team.html` | Team: founder spotlight (orbiting projects, journey), six member cards with profile pop-ups, expertise filter, people ↔ projects map |
| `contact.html` | Contact: topic-aware form sent by **EmailJS**, growing-plant progress, live preview, voice typing, offline outbox |

## Folder structure

```
/
├── index.html, projects.html, ai.html, agri-digital.html, seva.html,
│   x1.html, s4.html, jeevadhara.html, jeevadhan.html
├── css/style.css          one shared stylesheet (tokens at the top)
├── js/script.js           one shared script (each module checks for its elements)
├── js/contact.js          contact page only: EmailJS settings + form logic
├── js/farmer-tools.js     farmer tools page only
├── js/quick-contact.js    sidebar on every page (+ css/quick-contact.css)
├── js/team.js             team page only: reads everything from team.html
├── assets/
│   ├── images/            all photos (replace these; see below)
│   ├── icons/favicon.png
│   ├── illustrations/     (empty; for your own diagrams or renders)
│   └── fonts/             self-hosted Fraunces + Manrope (no external requests)
└── .nojekyll              tells GitHub Pages to serve files as-is
```

## Deploy to GitHub Pages

1. Create a repository and upload **the contents of this folder** (so `index.html` is at the root).
2. Go to **Settings → Pages**, then set **Source: Deploy from a branch**, **Branch: `main` / root**.
3. The site is published at `https://<username>.github.io/<repository>/`.

No build step is required.

## Contact form (EmailJS)

The contact page sends messages by email through [EmailJS](https://www.emailjs.com), so no server is needed.

1. Create a free EmailJS account.
2. **Email Services → Add New Service** (Gmail, Outlook…). Copy the **Service ID**.
3. **Email Templates → Create New Template**. Set:
   - **To Email:** your team address
   - **Reply To:** `{{reply_to}}`
   - **Subject:** `[{{reference_id}}] {{subject}} — {{from_name}}`
   - **Content:**
     ```
     New message from the BhoomiShakti website

     Reference:        {{reference_id}}
     Topic:            {{topic}}
     Name:             {{from_name}} ({{role}})
     Mobile:           {{mobile}}
     Email:            {{from_email}}
     Location:         {{location}}
     Preferred reply:  {{preferred_contact}}
     Extra details:    {{extra_details}}

     Message:
     {{message}}

     Sent {{submitted_at}} from {{page_url}}
     ```
   Copy the **Template ID**.
4. **Account → General**: copy your **Public Key**.
5. Open `js/contact.js` and replace `YOUR_PUBLIC_KEY`, `YOUR_SERVICE_ID` and `YOUR_TEMPLATE_ID`.
6. Recommended: in **Account → Security**, add your GitHub Pages domain (for example `username.github.io`) to the allowed origins.

Optional:
- **Confirmation email to the sender:** create a second template with **To Email** `{{from_email}}`, and put its ID in `autoReplyTemplateId`. It is sent only when the person gives an email.
- **Direct contact details:** fill in `CONTACT_INFO` (email, phone, WhatsApp, address) in `js/contact.js`. Empty values stay hidden.
- Other variables you can use in templates: `rental_duration`, `preferred_date`, `crop`, `land_size`, `service_needed`.

Until the keys are added, the form checks every field but shows "Email sending is not set up yet" and sends nothing. It never pretends a message was sent.

Contact page features:
- **Topic chips:** these recolour the page to that project's colour, show extra fields (X1: duration and date; S4/JeevaDhara: crop and land size; Seva: service), fill in the subject, and suggest message starters.
- **Growing plant:** a plant grows from a seed as the five required parts are completed. On phones it becomes a sticky progress bar.
- **Live letter preview:** shows the message as it will be sent.
- **Voice typing:** English, हिन्दी and ಕನ್ನಡ, where the browser supports it.
- **Draft autosave:** the draft is kept on the visitor's own device.
- **Offline outbox:** a message sent while offline is sent automatically when the connection returns, as long as the page stays open.
- **Reference ID:** each message gets one (for example `BS-260930-K7QX`), included in the email.
- **Spam protection:** a hidden honeypot field, a 30-second resend pause, and EmailJS rate limiting.
- **Direct links:** `contact.html?topic=x1` opens the form with a topic already chosen (`ai`, `agri-digital`, `seva`, `x1`, `s4`, `jeevadhara`, `jeevadhan`, `collab`, `general`).

## Farmer Tools (farmer-tools.html)

All four tools run in the browser. Nothing a farmer types is stored or sent anywhere, except the place name or location sent to get the forecast.

**Weather & spray advisor**
- Uses [Open-Meteo](https://open-meteo.com/) for the forecast and for finding villages. It needs no API key and allows calls from any website, so it works on GitHub Pages without a server.
- It is free for **non-commercial** use (10,000 calls per day) under the CC BY 4.0 licence. The "Weather data by Open-Meteo.com" credit on the page is required, so keep it.
- If BhoomiShakti becomes a commercial service, take an Open-Meteo paid plan. A paid plan uses an API key, which must stay on a server, not in this static site.
- The advice uses published thresholds, set at the top of `js/farmer-tools.js` and explained on the page:

| Advice | Rule | Source |
|---|---|---|
| Rain expected | 2.5 mm or more in the day | IMD rainfall categories ("light rain") |
| High heat | Maximum of 40 °C or more | IMD heat-wave threshold for plains |
| Possible spray hours | 6 AM–6 PM, no rain that hour, wind 5–13 km/h | Pesticide-stewardship guidance (3–8 mph) |

**Land unit converter**
- Uses exact relationships: 1 acre = 40 guntas = 100 cents = 43,560 sq ft, and 1 hectare = 10,000 m².

**Farm profit planner**
- Uses only the farmer's own values and shows each formula with the numbers filled in.
- "Print / Save as PDF" prints only the result.

**Government schemes & helplines** (verified October 2026 from official sources)
- **PM-KISAN:** pmkisan.gov.in, helpline 155261 (source: PIB).
- **PMFBY:** pmfby.gov.in, Krishi Rakshak Portal & Helpline 14447 (source: PIB).
- **Soil Health Card:** soilhealth.dac.gov.in. No helpline is shown, because none was confirmed.
- **eNAM:** enam.gov.in, toll-free 1800 270 0224.
- **Kisan Call Centre:** 1800-180-1551, 6 AM–10 PM every day (source: mkisan.gov.in).

Recheck these links and numbers from time to time. Do not add amounts, eligibility rules or deadlines unless they come from an official source.

## Quick-contact sidebar (every page)

`js/quick-contact.js` and `css/quick-contact.css` add a floating WhatsApp / Call / Email / Google reviews bar to every page. Each page loads it with one line before `</body>`:
`<script src="js/quick-contact.js" defer></script>`

Fill in your details at the top of `js/quick-contact.js`:

| Setting | Example |
|---|---|
| `whatsapp` | `'919876543210'` (country code + number, digits only) |
| `phone` | `'+91 98765 43210'` |
| `email` | `'team@bhoomishakti.in'` |
| `googleReviews` | Your Google Business Profile "Ask for reviews" link |
| `hours` | Days and hours for the "Available now / Away" status (IST) |

Until a value is filled in, that button opens the contact form (preview mode). Set `showWhenEmpty: false` to hide unfilled buttons instead.

How the sidebar behaves:
- **Desktop:** a dock on the right edge. Hovering shows a label; the arrow at the bottom tucks the dock away, and the choice is remembered.
- **Phone:** a round button at the bottom-left opens the four options.
- **WhatsApp:** a chat card with quick topics (X1 rental, S4, Seva, soil health). The message includes the page the visitor came from.
- **Call:** "Call now" plus a copy button, since desktops can't call.
- **Email:** a mail app or Gmail opens with the subject and a template already filled in.
- **Google reviews:** opens your review link in a new tab.

## Team page (team.html)

Everything is edited in `team.html`. `js/team.js` reads it automatically. Search for `EDIT:` to find each block.

**Founder** (block starting `FOUNDER — EDIT`):
- Replace `[Founder Name]`, the title line, the quote, the Story / Vision / Expertise tabs and the five journey milestones (`[Year]` and the text inside each `<template>`).
- Photo: replace `assets/images/team/founder.jpg` (portrait, about 900×1100 px; it is shown in a circle).
- Links: set the LinkedIn and Email buttons, for example `href="https://www.linkedin.com/in/..."` and `href="mailto:name@example.com"`. Links left as `#` are hidden automatically.

**Members 1–6** (blocks starting `MEMBER n — EDIT`):
- Replace the name, role and one-line summary. Write the full bio, responsibilities and skills inside `<template class="m-bio">`; these appear in the profile pop-up.
- `data-domain` is the filter group. Use one of `engineering`, `software`, `agri`, `design`, and update the small label in `<span class="m-domain">` to match.
- `data-projects` lists the projects the person works on, separated by spaces: `ai agri-digital seva x1 s4 jeevadhara jeevadhan`. Also update the project chips in that card (copy a chip from another card if needed). The "Who builds what" map is drawn from `data-projects`.
- Photos: replace `assets/images/team/member-1.jpg` … `member-6.jpg` (portrait, about 600×750 px).
- Links: set the LinkedIn, GitHub and email `href` values. Any left as `#` stay hidden.

The project assignments in `data-projects` are placeholders. Change them to the real ones before publishing.

If the founder is one of the six members, delete one member block. The page adapts automatically.

## Replacing images

Every `<img>` has an HTML comment immediately before it that starts with
`<!-- IMAGE:`. The comment says where the image is used, what to show, and why.
Search the HTML for `IMAGE:` to find them all.

The simplest way to swap an image is to keep the file name and replace the file in
`assets/images/`:

| File | Used for |
|---|---|
| `home-hero-field.jpg` | Home hero (farming landscape) |
| `home-about.jpg` | Home About section |
| `home-cta.jpg` | Home closing banner |
| `ai-hero.jpg`, `ai-cta.jpg` | BhoomiShakti AI |
| `agri-digital-hero.jpg`, `agri-digital-cta.jpg` | Agri Digital |
| `seva-hero.jpg`, `seva-cta.jpg` | Seva |
| `x1-hero.jpg`, `x1-cta.jpg` | X1 (also shown on JeevaDhara for X1 integration) |
| `s4-hero.jpg`, `s4-cta.jpg` | S4 |
| `jeevadhara-hero.jpg`, `jeevadhara-soil-health.jpg`, `jeevadhara-cta.jpg` | JeevaDhara |
| `jeevadhan-hero.jpg`, `jeevadhan-cta.jpg` | JeevaDhan |
| `bhoomishakti-logo.png` | Logo in navigation, footer and ecosystem centre |
| `team/founder.jpg`, `team/member-1.jpg` … `team/member-6.jpg` | Team page portraits (placeholder silhouettes) |

The current images are placeholder artwork (generated crop fields, foliage and a
soil cross-section), not real photos of the machines. Replace them with real photos
or renders of X1, S4 and the other projects.

Recommended size: JPG, 1400–1800 px wide, under about 300 KB.

## Content rules followed

- No invented users, revenue, prices, availability, ratings, partnerships, certifications or deployments.
- Status labels are honest: **Working platform / Mobile-first web app** (AI, Agri Digital), **Prototype** (X1, S4), **Project observations** (JeevaDhara), **Proposed** (Seva, JeevaDhan).
- Future items are labelled **Future Scope**. JeevaDhara results are labelled **Project observation**. The 60–70% time saving is marked as a project-reported figure.
- Seva's provider example (Mahindra 47 HP, 4.8 rating, 4.2 km) is marked **Illustrative example**.
- The X1 rental form and S4 enquiry form check that fields are filled in correctly, then say plainly that nothing was sent. Connect them to a form service or backend later if needed.

## Motion and accessibility

- Leaf motion uses CSS transforms only. There are three leaf tones (green / earth / gold) and two modes (falling, drifting), with fewer leaves on phones.
- Scroll reveals use IntersectionObserver. Workflows auto-advance only while visible and can be clicked or operated by keyboard.
- `prefers-reduced-motion` turns animation off and shows all content statically.
- The markup is semantic with a skip link, visible focus rings, ARIA on tabs, accordions, menus and forms, and alt text on images.
