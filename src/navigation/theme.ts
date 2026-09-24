/**
 * Small shared color palette so screens don't each invent their own shade of
 * color. Not a full design system -- just enough consistency for a
 * hackathon build to stop looking like disconnected wireframes.
 *
 * Brand colors (brand/brandDark/accent) are Jahnel Group's, pulled from the
 * live site's CSS custom properties (jahnelgroup.com --jg-primary/
 * --jg-secondary/--jg-orange-rgb): primary cyan #00BDFF, secondary dark
 * teal #0C4B5F, accent orange #FC9D03. The bright cyan fails WCAG contrast
 * for white text/icons on top of it (~2.2:1, needs 4.5:1) so it's used as a
 * small accent/highlight color rather than a large surface fill; the dark
 * teal (which passes easily) carries the header/button/selected-state
 * surfaces instead. Safety-status colors (safe/unsafe/noData) stay their
 * own semantic green/orange/gray, independent of brand -- that signal
 * matters more than brand consistency for those specific badges.
 */
export const colors = {
  brand: '#0C4B5F',
  brandDark: '#082f3b',
  accent: '#00BDFF',
  background: '#f4f6f7',
  card: '#ffffff',
  border: '#e3e8ea',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  safe: '#2f6f4f',
  unsafe: '#b5651d',
  noData: '#8a8a8a',
  danger: '#b00020',
  rating: '#FC9D03',
};
