// Rijkshuisstijl example theme for Cunningham, the La Suite token system.
// Values are the Rijkshuisstijl community tokens 18.0.1 (theme lintblauw) converted from oklch to sRGB;
// steps the package does not publish are interpolated between its neighbours. README.md lists the anchors.
// Colours, type and spacing only: no logo, no wordmark, no RijksoverheidSans (all reserved for the central government).
//
// Use: merge it into your cunningham.ts and set the theme on <CunninghamProvider theme="rijkshuisstijl">.
//   import { rijkshuisstijl } from "./rijkshuisstijl";
//   export default deepmerge(cunninghamConfig, { themes: { rijkshuisstijl } });

export const rijkshuisstijl = {
  "globals": {
    "colors": {
      "logo-1-light": "#154273",
      "logo-2-light": "#154273",
      "logo-1-dark": "#B8C6D5",
      "logo-2-dark": "#B8C6D5",
      "brand-050": "#DCE3EA",
      "brand-100": "#B8C6D5",
      "brand-150": "#A6B8CA",
      "brand-200": "#95A9C0",
      "brand-250": "#849CB6",
      "brand-300": "#738EAB",
      "brand-350": "#6180A0",
      "brand-400": "#4F7196",
      "brand-450": "#3C618A",
      "brand-500": "#28527F",
      "brand-550": "#154273",
      "brand-600": "#162F50",
      "brand-650": "#162C4A",
      "brand-700": "#162945",
      "brand-750": "#14253E",
      "brand-800": "#122138",
      "brand-850": "#0F1D31",
      "brand-900": "#0D192B",
      "brand-950": "#0B1524",
      "gray-000": "#FFFFFF",
      "gray-050": "#F8FAFC",
      "gray-100": "#F1F5F9",
      "gray-150": "#EAEEF4",
      "gray-200": "#E2E8F0",
      "gray-250": "#D6DEE8",
      "gray-300": "#CBD5E1",
      "gray-350": "#B0BCCC",
      "gray-400": "#94A3B8",
      "gray-450": "#7C8CA2",
      "gray-500": "#64748B",
      "gray-550": "#56647A",
      "gray-600": "#475569",
      "gray-650": "#3D4B5F",
      "gray-700": "#334155",
      "gray-750": "#283548",
      "gray-800": "#1E293B",
      "gray-850": "#162032",
      "gray-900": "#0F172A",
      "gray-950": "#0A0F1C",
      "success-050": "#E1EDDB",
      "success-100": "#C4DBB6",
      "success-150": "#B4D2A4",
      "success-200": "#A5C991",
      "success-250": "#96C07F",
      "success-300": "#88B76D",
      "success-350": "#79AE5B",
      "success-400": "#6AA549",
      "success-450": "#5A9B35",
      "success-500": "#499120",
      "success-550": "#39870C",
      "success-600": "#2C5D12",
      "success-650": "#2A5612",
      "success-700": "#275012",
      "success-750": "#234810",
      "success-800": "#1F400E",
      "success-850": "#1B380D",
      "success-900": "#17300B",
      "success-950": "#132809",
      "info-050": "#D9E8F0",
      "info-100": "#B3D2E1",
      "info-150": "#A0C6DA",
      "info-200": "#8CBBD2",
      "info-250": "#79B0CA",
      "info-300": "#66A4C3",
      "info-350": "#5399BC",
      "info-400": "#408EB4",
      "info-450": "#2B81AC",
      "info-500": "#1675A3",
      "info-550": "#01689B",
      "info-600": "#01496C",
      "info-650": "#0C4464",
      "info-700": "#163F5B",
      "info-750": "#143952",
      "info-800": "#123349",
      "info-850": "#0F2C40",
      "info-900": "#0D2637",
      "info-950": "#0B202E",
      "danger-050": "#F9DFDD",
      "danger-100": "#F2BFBC",
      "danger-150": "#EFAFAA",
      "danger-200": "#EC9F99",
      "danger-250": "#E98F88",
      "danger-300": "#E67F78",
      "danger-350": "#E27067",
      "danger-400": "#DF6056",
      "danger-450": "#DC4E43",
      "danger-500": "#D83D31",
      "danger-550": "#D52B1E",
      "danger-600": "#9E1B16",
      "danger-650": "#881713",
      "danger-700": "#731310",
      "danger-750": "#68110E",
      "danger-800": "#5C0F0D",
      "danger-850": "#510E0B",
      "danger-900": "#450C0A",
      "danger-950": "#3A0A08"
    },
    "font": {
      "families": {
        "base": "'Fira Sans', Arial, Verdana, sans-serif",
        "accent": "'Fira Sans', Arial, Verdana, sans-serif"
      },
      "sizes": {
        "sm": "0.875rem",
        "md": "1rem"
      }
    }
  },
  "components": {
    "button": {
      "border-radius": "2px",
      "border-radius--active": "2px",
      "border-radius--focus": "2px",
      "medium-height": "48px",
      "medium-text-height": "48px",
      "small-height": "40px",
      "font-weight": "700"
    },
    "forms-input": {
      "border-radius": "2px",
      "border-radius--hover": "2px",
      "border-radius--focus": "2px"
    },
    "forms-select": {
      "border-radius": "2px",
      "border-radius--hover": "2px",
      "border-radius--focus": "2px"
    },
    "forms-textarea": {
      "border-radius": "2px",
      "border-radius--hover": "2px",
      "border-radius--focus": "2px"
    },
    "forms-checkbox": {
      "border-radius": "0px"
    },
    "alert": {
      "border-radius": "4px"
    },
    "modal": {
      "border-radius": "4px"
    }
  }
} as const;

// Roles the La Suite apps read. The Rijkshuisstijl keeps lintblauw for the header and every button,
// donkerblauw for links and hemelblauw (info) for the one accent.
export const rijkshuisstijlRoles = {
  "header": "brand-550",
  "link": "info-550",
  "selected": "brand-550",
  "primaryAction": "brand-550",
  "primaryActionHover": "brand-600",
  "accent": "info-550",
  "text": "gray-900",
  "textMuted": "gray-600",
  "border": "gray-500",
  "rowLine": "gray-200",
  "surfaceMuted": "gray-050"
} as const;
