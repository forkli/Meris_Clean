import next from "eslint-config-next";

const config = [
  { ignores: ["legacy/**", ".next/**", "node_modules/**", "next-env.d.ts"] },
  ...next,
];

export default config;
