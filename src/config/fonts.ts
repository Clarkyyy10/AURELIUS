import { Cormorant_Garamond, Inter } from "next/font/google";

// Provisional typefaces: DESIGN.md section 5, option A (decision D-38 is open).
// This is the only file that names a typeface. To swap fonts, change the two
// constructors below and keep the two CSS variable names. src/app/globals.css
// maps them to --font-sans, --font-heading and --font-display.
//
// The "latin-ext" subset is required: the peso sign (U+20B1) is not in the
// "latin" subset of either family. Both families contain the glyph in latin-ext
// (checked on the Google Fonts files, see docs/08-decisions.md D-54).
export const fontDisplay = Cormorant_Garamond({
  variable: "--font-face-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  display: "swap",
});

export const fontBody = Inter({
  variable: "--font-face-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const fontVariables = `${fontDisplay.variable} ${fontBody.variable}`;
