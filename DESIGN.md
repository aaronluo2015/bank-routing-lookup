# BankCode DESIGN.md — Stripe-inspired Fintech Design System

colors:
  primary: "#635bff"
  primaryHover: "#7b73ff"
  primaryDeep: "#4434d4"
  primarySoft: "#665efd"
  ink: "#0d253d"
  inkSecondary: "#273951"
  inkMute: "#64748d"
  canvas: "#ffffff"
  canvasSoft: "#f6f9fc"
  canvasCream: "#f5e9d4"
  hairline: "#e3e8ee"
  hairlineInput: "#a8c3de"
  onPrimary: "#ffffff"
  ruby: "#ea2261"
  magenta: "#f96bee"
  lemon: "#9b6829"
  shadow: "rgba(0,55,112,0.08)"

typography:
  display:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontWeight: 300
    letterSpacing: "-1.4px"
    lineHeight: 1.08
  heading:
    fontWeight: 400
    letterSpacing: "-0.02em"
  body:
    fontWeight: 400
    lineHeight: 1.6
    color: "{colors.inkMute}"

rounded:
  sm: 6px
  lg: 12px
  pill: 9999px

spacing:
  section: 96px
  card: 32px

components:
  button:
    background: "{colors.primary}"
    color: "{colors.onPrimary}"
    borderRadius: "{rounded.pill}"
    padding: 8px 16px
    fontWeight: 500
  buttonDark:
    background: "{colors.ink}"
    color: "{colors.onPrimary}"
    borderRadius: "{rounded.pill}"
    padding: 8px 16px
  card:
    background: "{colors.canvas}"
    border: "1px solid {colors.hairline}"
    borderRadius: "{rounded.lg} 12px"
    boxShadow: "0 1px 3px {colors.shadow}"
    padding: 32px
  input:
    border: "1px solid {colors.hairlineInput}"
    borderRadius: "{rounded.sm} 6px"
    padding: 8px 12px
  gradient:
    from-cream: "#f5e9d4"
    via-lavender: "#d4c5f9"
    to-indigo: "#635bff"
