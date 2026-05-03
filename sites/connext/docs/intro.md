---
sidebar_position: 1
---

# Welkom bij ConNext

Dit is de docs-sectie van **connext.conduction.nl**. Hier komt straks de inhoud die nu op de losse [identity](https://connext.conduction.nl/identity/) en [diagrams](https://connext.conduction.nl/diagrams/) pagina's van het brand book staat.

Voor de eerste cyclus is dit een placeholder. De content volgt zodra het OpenCatalogi-content-plugin live staat en we Nederlandse en Engelse pagina's vanuit de Nextcloud-CMS kunnen renderen.

## Wat staat hier

- **Platform overview** — wat is ConNext, hoe past het op Nextcloud
- **Apps** — per-app docs (apex domains: `opencatalogi.conduction.nl`, etc.)
- **Solutions** — outcome-gedreven: WOO, procurement, public catalogi
- **Integrations** — connectoren, OAuth, SAML, IDP-koppeling

## Hoe het werkt

Deze site draait op [Docusaurus 3](https://docusaurus.io) met `@conduction/docusaurus-preset` voor de brand-defaults. Vier talen (nl / en / de / fr) komen uit de preset; NL is canoniek en woont op `/`.

Voor lokale ontwikkeling, draai een lokale Nextcloud + Conduction-omgeving en start de site met:

```bash
npm --workspace sites/connext run start
```

Zie de [preset README](https://github.com/ConductionNL/design-system/tree/main/docusaurus-preset) voor de volledige setup-flow.
