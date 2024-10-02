import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration for building a React component as a library
export default defineConfig({
  plugins: [react()], // React plugin for Vite
  build: {
    lib: {
      entry: "./src/index.ts", // Entry point for your library
      name: "SecureLogContainer", // Name of the library
      fileName: (format) => `secure-log-container.${format}.js`, // Output file name
      formats: ["es", "umd"], // Output formats (ES module and UMD)
    },
    rollupOptions: {
      // External dependencies to avoid bundling React and React JSX runtime
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  worker: {
    format: "es", // Specify the format for the web worker
  },
});
