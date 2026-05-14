import { useState, useEffect } from "react";

const STORAGE_KEY = "e4_display_settings";

export const DEFAULTS = {
  textSize: "normal",
  fontFamily: "system",
  markdownEnabled: true,
  htmlEnabled: true,
};

export const GOOGLE_FONTS = [
  {
    id: "system",
    name: "System Default",
    stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    googleFont: null,
    preview: "Aa",
  },
  {
    id: "inter",
    name: "Inter",
    stack: "'Inter', sans-serif",
    googleFont: "Inter:wght@400;500;600",
    preview: "Aa",
  },
  {
    id: "roboto",
    name: "Roboto",
    stack: "'Roboto', sans-serif",
    googleFont: "Roboto:wght@400;500;700",
    preview: "Aa",
  },
  {
    id: "open-sans",
    name: "Open Sans",
    stack: "'Open Sans', sans-serif",
    googleFont: "Open+Sans:wght@400;600",
    preview: "Aa",
  },
  {
    id: "lato",
    name: "Lato",
    stack: "'Lato', sans-serif",
    googleFont: "Lato:wght@400;700",
    preview: "Aa",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    stack: "'Montserrat', sans-serif",
    googleFont: "Montserrat:wght@400;500;600",
    preview: "Aa",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    stack: "'Playfair Display', serif",
    googleFont: "Playfair+Display:wght@400;700",
    preview: "Aa",
  },
  {
    id: "source-code",
    name: "Source Code Pro",
    stack: "'Source Code Pro', monospace",
    googleFont: "Source+Code+Pro:wght@400;500",
    preview: "Aa",
  },
];

function loadGoogleFont(font) {
  if (!font?.googleFont) return;
  const id = `gfont-${font.id}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${font.googleFont}&display=swap`;
  document.head.appendChild(link);
}

function applyFont(fontId) {
  const font = GOOGLE_FONTS.find((f) => f.id === fontId) ?? GOOGLE_FONTS[0];
  loadGoogleFont(font);
  document.documentElement.style.setProperty("--e4-chat-font", font.stack);
}

export function readDisplaySettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export default function useDisplaySettings() {
  const [settings, setSettings] = useState(readDisplaySettings);

  useEffect(() => {
    applyFont(settings.fontFamily);
  }, [settings.fontFamily]);

  useEffect(() => {
    function onExternalChange(e) {
      setSettings(e.detail);
    }
    window.addEventListener("e4DisplaySettingsChange", onExternalChange);
    return () => window.removeEventListener("e4DisplaySettingsChange", onExternalChange);
  }, []);

  function update(key, value) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("e4DisplaySettingsChange", { detail: next }));
      return next;
    });
  }

  return { settings, update };
}
