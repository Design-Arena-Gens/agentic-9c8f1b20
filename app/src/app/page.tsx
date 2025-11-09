import { CatalogAssistant } from "@/components/catalog-assistant";
import { TaskBoard } from "@/components/task-board";
import { VoiceAgent } from "@/components/voice-agent";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-12 lg:gap-16 lg:px-12">
        <header className="grid gap-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-lg lg:grid-cols-[3fr_2fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">
              Jarvis · Personal Commerce AI
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Resolve daily ops, craft listings, and brief campaigns with a voice-first agent.
            </h1>
            <p className="text-sm text-zinc-200 max-w-2xl leading-relaxed">
              Speak naturally or type. Jarvis orchestrates marketplace tasks, generates catalog-ready
              sheets, and keeps you on track across Amazon, Flipkart, Meesho, and Myntra. Upload your
              master catalog once and let the assistant do the tedious mapping.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              <span className="rounded-full border border-emerald-400/60 px-3 py-1">
                Voice + Text Control
              </span>
              <span className="rounded-full border border-emerald-400/60 px-3 py-1">
                Catalog Sheet Automation
              </span>
              <span className="rounded-full border border-emerald-400/60 px-3 py-1">
                Daily Mission Planner
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-6 text-sm shadow-inner">
            <p className="text-zinc-300">
              Try saying: <strong className="text-white">“Jarvis, prep Flipkart listings for our new kurta set.”</strong>{" "}
              The assistant pulls attributes from your catalog, enriches bullet copy, and exports formatted CSVs.
            </p>
            <div className="space-y-2 rounded-2xl bg-white/5 p-4 leading-relaxed text-zinc-200">
              <p className="text-xs uppercase tracking-wide text-emerald-300">Live summary</p>
              <p>
                Listening for voice requests · Auto speaking responses · Catalog workspace empty. Upload a sheet to
                enable marketplace exports.
              </p>
            </div>
          </div>
        </header>

        <VoiceAgent />
        <TaskBoard />
        <CatalogAssistant />
      </main>
    </div>
  );
}
