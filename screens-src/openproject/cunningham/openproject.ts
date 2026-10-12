// OpenProject example theme for Cunningham, the La Suite token system.
// Values are measured on community.openproject.org and openproject.org; steps between two
// measured values are interpolated. README.md lists the measured anchors.
//
// Use: merge it into your cunningham.ts and set the theme on <CunninghamProvider theme="openproject">.
//   import { openproject } from "./openproject";
//   export default deepmerge(cunninghamConfig, { themes: { openproject } });

export const openproject = {
  "globals": {
    "colors": {
      "logo-1-light": "#1A67A3",
      "logo-2-light": "#1A67A3",
      "logo-1-dark": "#A2BDD2",
      "logo-2-dark": "#A2BDD2",
      "brand-050": "#EBF3F7",
      "brand-100": "#D1DEE8",
      "brand-150": "#BACEDD",
      "brand-200": "#A2BDD2",
      "brand-250": "#8BACC6",
      "brand-300": "#749CBB",
      "brand-350": "#6291B6",
      "brand-400": "#5087B1",
      "brand-450": "#3E7CAD",
      "brand-500": "#2C72A8",
      "brand-550": "#1A67A3",
      "brand-600": "#175A8E",
      "brand-650": "#145180",
      "brand-700": "#124872",
      "brand-750": "#103F64",
      "brand-800": "#0E3655",
      "brand-850": "#0B314B",
      "brand-900": "#072C41",
      "brand-950": "#042737",
      "gray-000": "#FFFFFF",
      "gray-025": "#FAFBFC",
      "gray-050": "#F6F8FA",
      "gray-100": "#EFF2F5",
      "gray-150": "#EAEAEA",
      "gray-200": "#D1D9E0",
      "gray-250": "#C0C8D0",
      "gray-300": "#AEB7C0",
      "gray-350": "#9DA6AF",
      "gray-400": "#8C959F",
      "gray-450": "#7B848F",
      "gray-500": "#6A747E",
      "gray-550": "#59636E",
      "gray-600": "#4C535A",
      "gray-650": "#404347",
      "gray-700": "#333333",
      "gray-750": "#2C2E2F",
      "gray-800": "#26282C",
      "gray-850": "#1F2328",
      "gray-900": "#161A20",
      "gray-950": "#0D1117",
      "success-050": "#EAF6ED",
      "success-100": "#D2E7D8",
      "success-150": "#BCDBC4",
      "success-200": "#A5CFB1",
      "success-250": "#8FC49E",
      "success-300": "#79B88B",
      "success-350": "#67AE7B",
      "success-400": "#55A56C",
      "success-450": "#439B5C",
      "success-500": "#31924D",
      "success-550": "#1F883D",
      "success-600": "#197032",
      "success-650": "#16662E",
      "success-700": "#145D29",
      "success-750": "#125424",
      "success-800": "#0F4A20",
      "success-850": "#0C3E1A",
      "success-900": "#093215",
      "success-950": "#06260F",
      "green-050": "#EAF6ED",
      "green-100": "#D2E7D8",
      "green-150": "#BCDBC4",
      "green-200": "#A5CFB1",
      "green-250": "#8FC49E",
      "green-300": "#79B88B",
      "green-350": "#67AE7B",
      "green-400": "#55A56C",
      "green-450": "#439B5C",
      "green-500": "#31924D",
      "green-550": "#1F883D",
      "green-600": "#197032",
      "green-650": "#16662E",
      "green-700": "#145D29",
      "green-750": "#125424",
      "green-800": "#0F4A20",
      "green-850": "#0C3E1A",
      "green-900": "#093215",
      "green-950": "#06260F"
    },
    "font": {
      "families": {
        "base": "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
        "accent": "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif"
      },
      "sizes": {
        "sm": "0.75rem",
        "md": "0.875rem"
      }
    }
  },
  "components": {
    "button": {
      "border-radius": "2px",
      "border-radius--active": "2px",
      "border-radius--focus": "2px",
      "medium-height": "34px",
      "medium-text-height": "34px",
      "small-height": "28px",
      "font-weight": "400"
    },
    "forms-input": {
      "border-radius": "6px",
      "border-radius--hover": "6px",
      "border-radius--focus": "6px"
    },
    "forms-select": {
      "border-radius": "6px",
      "border-radius--hover": "6px",
      "border-radius--focus": "6px"
    },
    "forms-textarea": {
      "border-radius": "6px",
      "border-radius--hover": "6px",
      "border-radius--focus": "6px"
    },
    "forms-checkbox": {
      "border-radius": "2px"
    },
    "alert": {
      "border-radius": "3px"
    },
    "modal": {
      "border-radius": "6px"
    }
  }
} as const;

// Roles the La Suite apps read. OpenProject keeps blue for navigation and links
// and uses green for the one primary action on a page.
export const openprojectRoles = {
  "header": "brand-550",
  "link": "brand-600",
  "selected": "brand-600",
  "primaryAction": "success-550",
  "primaryActionHover": "success-600",
  "text": "gray-850",
  "textMuted": "gray-550",
  "border": "gray-200",
  "rowLine": "gray-150",
  "surfaceMuted": "gray-050"
} as const;
