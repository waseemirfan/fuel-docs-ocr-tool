import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { getSites, updateSites, checkHealth, getConfig, updateConfig } from "../api/client";

const PROVIDER_INFO = {
  gemini: {
    label: "Google Gemini (Recommended)",
    description: "Free tier — ~1,500 requests/day, no local install needed",
    keyLabel: "GEMINI_API_KEY",
    keyLink: "https://aistudio.google.com/apikey",
    keyHint: "Get a free key from Google AI Studio",
    model: "gemini-2.5-flash",
    free: true,
  },
  openrouter: {
    label: "OpenRouter",
    description: "Gateway to 300+ models. Free credits on signup, then pay-as-you-go",
    keyLabel: "OPENROUTER_API_KEY",
    keyLink: "https://openrouter.ai/keys",
    keyHint: "Get a key from OpenRouter.ai",
    model: "google/gemini-2.5-flash",
    free: false,
  },
  ollama: {
    label: "Ollama (Local, offline)",
    description: "Runs fully offline on your Mac. Requires 16–32 GB RAM.",
    keyLabel: null,
    keyLink: "https://ollama.com/download",
    keyHint: "No API key needed",
    model: "qwen2.5vl:7b",
    free: true,
  },
};

type Provider = keyof typeof PROVIDER_INFO;

function ApiKeyInput({ label, configKey, link, hint }: { label: string; configKey: string; link: string; hint: string }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const mut = useMutation({
    mutationFn: () => updateConfig(configKey, value),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); },
  });

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={hint}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          onClick={() => mut.mutate()}
          disabled={!value || mut.isPending}
          className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Save size={14} /> {mut.isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {saved && (
        <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
          <CheckCircle size={13} /> Saved
        </p>
      )}
      <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 inline-block">
        {link}
      </a>
    </div>
  );
}

export default function Settings() {
  const [sitesText, setSitesText] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>("gemini");

  const { data: sites = [] } = useQuery<string[]>({
    queryKey: ["sites"],
    queryFn: getSites,
  });

  useEffect(() => {
    if (sitesText === null && sites.length > 0) {
      setSitesText(sites.join("\n"));
    }
  }, [sites]);

  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: checkHealth,
    refetchInterval: 15000,
  });

  useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
    onSuccess: (d: Record<string, string>) => {
      if (d.LLM_PROVIDER && d.LLM_PROVIDER in PROVIDER_INFO) {
        setProvider(d.LLM_PROVIDER as Provider);
      }
    },
  } as any);

  const providerMut = useMutation({
    mutationFn: (p: Provider) => updateConfig("LLM_PROVIDER", p),
    onSuccess: () => refetchHealth(),
  });

  const saveSitesMut = useMutation({
    mutationFn: (list: string[]) => updateSites(list),
  });

  const handleSaveProvider = (p: Provider) => {
    setProvider(p);
    providerMut.mutate(p);
  };

  const handleSaveSites = () => {
    const list = (sitesText ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
    saveSitesMut.mutate(list);
  };

  const info = PROVIDER_INFO[provider];
  const llm = health?.llm;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {/* System status */}
      <section className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-3">System Status</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${health?.api === "ok" ? "bg-green-500" : "bg-gray-300"}`} />
            <span className="text-gray-600">API Backend</span>
            <span className="font-medium text-green-700">{health?.api ?? "Checking…"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${llm?.status === "ok" ? "bg-green-500" : llm?.status === "missing_api_key" ? "bg-yellow-400" : "bg-red-400"}`} />
            <span className="text-gray-600">LLM ({llm?.provider ?? "…"})</span>
            <span className={`font-medium ${llm?.status === "ok" ? "text-green-700" : "text-yellow-700"}`}>
              {llm?.status ?? "Checking…"}
            </span>
            {llm?.model && <span className="text-xs text-gray-400">· {llm.model}</span>}
          </div>
        </div>
      </section>

      {/* Provider selection */}
      <section className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-1">LLM Provider</h2>
        <p className="text-xs text-gray-400 mb-4">Choose the AI model provider. Changes take effect immediately.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {(Object.keys(PROVIDER_INFO) as Provider[]).map((p) => {
            const pi = PROVIDER_INFO[p];
            return (
              <button
                key={p}
                onClick={() => handleSaveProvider(p)}
                className={`text-left rounded-xl border-2 p-3 transition-colors ${
                  provider === p ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-800">{pi.label}</span>
                  {pi.free && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Free</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{pi.description}</p>
              </button>
            );
          })}
        </div>

        {info.keyLabel ? (
          <ApiKeyInput
            label={info.keyLabel}
            configKey={info.keyLabel}
            link={info.keyLink}
            hint={info.keyHint}
          />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <strong>Ollama setup:</strong> Install Ollama from{" "}
            <a href={info.keyLink} target="_blank" rel="noopener noreferrer" className="underline">
              {info.keyLink}
            </a>{" "}
            and run <code className="bg-amber-100 px-1 rounded">ollama pull qwen2.5vl:7b</code> (32 GB) or{" "}
            <code className="bg-amber-100 px-1 rounded">qwen2.5vl:3b</code> (16 GB).
          </div>
        )}
      </section>

      {/* Delivery sites */}
      <section className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-1">Delivery Sites</h2>
        <p className="text-xs text-gray-400 mb-3">
          One site name per line. Used to suggest matches during review — no auto-corrections applied.
        </p>
        <textarea
          rows={12}
          value={sitesText !== null ? sitesText : sites.join("\n")}
          onChange={(e) => setSitesText(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder={"Site A\nSite B\nDistribution Center 1"}
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleSaveSites}
            disabled={saveSitesMut.isPending}
            className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            <Save size={15} />
            {saveSitesMut.isPending ? "Saving…" : "Save Sites"}
          </button>
          {saveSitesMut.isSuccess && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle size={15} /> Saved
            </span>
          )}
          {saveSitesMut.isError && (
            <span className="flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle size={15} /> Failed to save
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
