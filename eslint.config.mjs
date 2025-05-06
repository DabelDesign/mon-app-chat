import js from "@eslint/js"; // ✅ Plugin ESLint pour JavaScript
import globals from "globals"; // ✅ Importation des variables globales reconnues
import { defineConfig } from "eslint/config"; // ✅ Définition propre de la config ESLint

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"], // 🔹 Appliquer ESLint sur tous les fichiers JavaScript
    plugins: { js }, // 🔹 Utilisation du plugin JavaScript recommandé
    extends: ["js/recommended"], // 🔹 Meilleures pratiques JavaScript recommandées
    languageOptions: {
      globals: {
        ...globals.browser, // ✅ Ajout des globales du navigateur
        amd: "readonly", // ✅ Correction de l'erreur
      },
    },
  },
  {
    files: ["**/*.js"], // 🔹 Spécifique aux fichiers `.js`
    languageOptions: {
      sourceType: "commonjs", // ✅ Définition de CommonJS pour les fichiers `.js`
    },
  },
]);
