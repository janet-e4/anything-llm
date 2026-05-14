import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, TextT, PaintBrush, Code } from "@phosphor-icons/react";
import useLoginMode from "@/hooks/useLoginMode";
import useDisplaySettings, { GOOGLE_FONTS } from "@/hooks/useDisplaySettings";
import { isMobile } from "react-device-detect";

const TEXT_SIZES = [
  { key: "small", label: "Small", textClass: "text-xs" },
  { key: "normal", label: "Normal", textClass: "text-sm" },
  { key: "large", label: "Large", textClass: "text-base" },
  { key: "xl", label: "Extra Large", textClass: "text-lg" },
];

const TABS = [
  { id: "text", icon: TextT, label: "Text" },
  { id: "font", icon: PaintBrush, label: "Font" },
  { id: "rendering", icon: Code, label: "Rendering" },
];

export default function TextSizeMenu() {
  const mode = useLoginMode();
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const { settings, update } = useDisplaySettings();

  const hasUserIcon = mode !== null;

  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Keep legacy textSizeChange event for backward compat with useTextSize hook
  function handleTextSizeChange(size) {
    update("textSize", size);
    window.localStorage.setItem("anythingllm_text_size", size);
    window.dispatchEvent(new CustomEvent("textSizeChange", { detail: size }));
  }

  if (isMobile) return null;

  return (
    <div
      className={`absolute top-3 md:top-5 z-30 ${hasUserIcon ? "right-[55px] md:right-[67px]" : "right-4 md:right-6"}`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className={`group border-none cursor-pointer flex items-center justify-center w-[35px] h-[35px] rounded-full transition-all ${
          showMenu
            ? "bg-zinc-700 light:bg-slate-200"
            : "hover:bg-zinc-700 light:hover:bg-slate-200"
        }`}
      >
        <SlidersHorizontal
          size={18}
          className={
            showMenu
              ? "text-white light:text-slate-800"
              : "text-zinc-300 light:text-slate-600 group-hover:text-white light:group-hover:text-slate-800"
          }
        />
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-0 top-[42px] bg-zinc-800 light:bg-white border border-zinc-700 light:border-slate-300 rounded-lg shadow-lg w-[260px] overflow-hidden"
        >
          {/* Tab bar */}
          <div className="flex border-b border-zinc-700 light:border-slate-200">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  activeTab === id
                    ? "text-white light:text-slate-900 border-b-2 border-blue-400"
                    : "text-zinc-400 light:text-slate-500 hover:text-zinc-200 light:hover:text-slate-700"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-3">
            {/* Text Size tab */}
            {activeTab === "text" && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-medium text-zinc-400 light:text-slate-500 px-1 mb-1">
                  Text Size
                </p>
                {TEXT_SIZES.map(({ key, label, textClass }) => (
                  <div
                    key={key}
                    onClick={() => handleTextSizeChange(key)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                      settings.textSize === key
                        ? "bg-zinc-700 light:bg-slate-200"
                        : "hover:bg-zinc-700/50 light:hover:bg-slate-100"
                    }`}
                  >
                    <span className={`${textClass} text-white light:text-slate-900`}>
                      {label}
                    </span>
                    {settings.textSize === key && (
                      <span className="text-blue-400 text-[10px]">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Font Family tab */}
            {activeTab === "font" && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-medium text-zinc-400 light:text-slate-500 px-1 mb-1">
                  Font Family
                </p>
                <div className="max-h-[220px] overflow-y-auto no-scroll flex flex-col gap-1">
                  {GOOGLE_FONTS.map((font) => (
                    <div
                      key={font.id}
                      onClick={() => update("fontFamily", font.id)}
                      className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                        settings.fontFamily === font.id
                          ? "bg-zinc-700 light:bg-slate-200"
                          : "hover:bg-zinc-700/50 light:hover:bg-slate-100"
                      }`}
                    >
                      <span
                        className="text-sm text-white light:text-slate-900"
                        style={{ fontFamily: font.stack }}
                      >
                        {font.name}
                      </span>
                      {settings.fontFamily === font.id && (
                        <span className="text-blue-400 text-[10px]">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rendering tab */}
            {activeTab === "rendering" && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-medium text-zinc-400 light:text-slate-500 px-1 mb-1">
                  Message Rendering
                </p>
                <Toggle
                  label="Markdown"
                  description="Render bold, italic, headers, lists"
                  value={settings.markdownEnabled}
                  onChange={(v) => update("markdownEnabled", v)}
                />
                <Toggle
                  label="HTML"
                  description="Render HTML tags in responses"
                  value={settings.htmlEnabled}
                  onChange={(v) => update("htmlEnabled", v)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-zinc-700/30 light:hover:bg-slate-50">
      <div className="flex flex-col">
        <span className="text-sm text-white light:text-slate-900">{label}</span>
        <span className="text-[10px] text-zinc-400 light:text-slate-500">{description}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
          value ? "bg-blue-500" : "bg-zinc-600 light:bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
