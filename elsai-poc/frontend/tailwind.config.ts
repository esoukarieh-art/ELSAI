import type { Config } from "tailwindcss";

// Charte graphique ELSAI — modèle "Symbiose Organique"
// Vert Pin · Vieux Rose · Blanc Crème
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        elsai: {
          // Vert Pin — couleur primaire (confiance, stabilité, vivant)
          pin: {
            DEFAULT: "#5A7E6B",
            dark: "#425F51",
            light: "#7D9E8D",
            50: "#EEF3F0",
            100: "#D4E1D9",
            200: "#AEC5B7",
          },
          // Vieux Rose — couleur secondaire (chaleur, humanité, accueil)
          rose: {
            DEFAULT: "#9B7F7F",
            dark: "#7A6363",
            light: "#B89F9F",
            50: "#F4EEEE",
            100: "#E4D6D6",
          },
          // Blanc Crème — fond (douceur, organique)
          creme: {
            DEFAULT: "#F5F5ED",
            dark: "#E8E8DD",
            light: "#FBFBF5",
          },
          // Urgence — rouge conservé pour les CTA 119 (sécurité enfance)
          urgence: "#B54848",
          // Encre — texte principal
          ink: "#2C3B33",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      borderRadius: {
        organic: "1.75rem",
        leaf: "2.5rem 0.75rem 2.5rem 0.75rem",
      },
      boxShadow: {
        organic: "0 10px 40px -15px rgba(90, 126, 107, 0.25)",
        warm: "0 10px 40px -15px rgba(155, 127, 127, 0.25)",
      },
      backgroundImage: {
        "symbiose":
          "radial-gradient(ellipse at top left, rgba(125, 158, 141, 0.18), transparent 55%), radial-gradient(ellipse at bottom right, rgba(184, 159, 159, 0.22), transparent 55%)",
      },
    },
  },
  plugins: [],
};

export default config;
