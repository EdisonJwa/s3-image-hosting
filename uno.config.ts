import { defineConfig, presetUno, presetWebFonts } from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      provider: "bunny",
      fonts: {
        sans: ["Noto Sans", "Noto Sans SC"],
        mono: "JetBrains Mono",
      },
    }),
  ],
});
