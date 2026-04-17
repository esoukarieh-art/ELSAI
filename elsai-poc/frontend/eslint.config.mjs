import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "public/sw.js"],
  },
  ...nextCoreWebVitals,
  prettier,
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;
