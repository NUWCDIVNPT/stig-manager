// Numeric mirror of the --text-* tokens in style.css, for code that needs the
// rem value rather than the CSS variable (density grid geometry derives row
// height from the cell font size). typographyConventions.test.js asserts the
// two stay equal.
export const TEXT_SCALE_REM = {
  'sm': 0.85,
  'md': 1,
  'lg': 1.1,
  'xl': 1.25,
  '2xl': 1.5,
}
