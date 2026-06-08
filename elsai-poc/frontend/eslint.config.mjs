import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/sw.js"],
  },
  ...nextCoreWebVitals,
  prettier,
  {
    rules: {
      // eslint-config-next enregistre déjà le plugin jsx-a11y ; on ne le
      // redéclare pas (sinon "Cannot redefine plugin"), on applique seulement
      // les règles recommandées puis nos durcissements.
      ...jsxA11y.flatConfigs.recommended.rules,
      "react/no-unescaped-entities": "off",
      // Faux positif sur les effets de data-fetching idiomatiques
      // (fetch -> setState). Conservé en avertissement plutôt qu'erreur.
      "react-hooks/set-state-in-effect": "warn",
      // Durcissement RGAA : blocage build si régression a11y
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
    },
  },
];

export default config;
