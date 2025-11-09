"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

type TaskStatus = "pending" | "active" | "done";

type Task = {
  id: string;
  title: string;
  details: string;
  marketplaceFocus?: string;
  status: TaskStatus;
  due?: string;
};

const taskSchema = z.object({
  title: z.string().min(3, "Give your task a short name."),
  details: z.string().min(5, "Describe the outcome you want."),
  marketplaceFocus: z.string().optional(),
  due: z.string().optional(),
});

const statusLabel: Record<TaskStatus, { label: string; accent: string }> = {
  pending: { label: "Backlog", accent: "bg-amber-500" },
  active: { label: "In Progress", accent: "bg-sky-500" },
  done: { label: "Completed", accent: "bg-emerald-500" },
};

const automationPlaybook = [
  { pattern: /catalog|listing/i, recommendation: "Extract missing attributes from supplier sheets." },
  { pattern: /pricing|price/i, recommendation: "Match price to competitor average before publishing." },
  { pattern: /image|photo/i, recommendation: "Check creative resolution is above 1500px for zoom." },
  { pattern: /keyword/i, recommendation: "Generate 5 long-tail keywords for search ranking." },
  { pattern: /prime day|sale/i, recommendation: "Schedule stock check and ad boosts 48h before sale." },
];

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draft, setDraft] = useState({
    title: "",
    details: "",
    marketplaceFocus: "",
    due: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const suggestions = useMemo(() => {
    if (tasks.length === 0) {
      return [
        "Sync today's top 3 catalog issues across Amazon, Flipkart, Meesho, and Myntra.",
        "Ask Jarvis to generate bullet copy variations for your hero SKU.",
        "Upload a fresh supplier feed in the Catalog Assistant to map attributes.",
      ];
    }

    const derived: string[] = [];
    tasks.forEach((task) => {
      automationPlaybook.forEach((play) => {
        if (play.pattern.test(task.title) || play.pattern.test(task.details)) {
          derived.push(`${task.title}: ${play.recommendation}`);
        }
      });
    });

    return derived.slice(0, 4);
  }, [tasks]);

  const addTask = () => {
    const result = taskSchema.safeParse(draft);
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string") {
          nextErrors[path] = issue.message;
        }
      });
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const id = crypto.randomUUID();
    const newTask: Task = {
      id,
      status: "pending",
      ...result.data,
    };

    setTasks((prev) => [newTask, ...prev]);
    setDraft({ title: "", details: "", marketplaceFocus: "", due: "" });
  };

  const updateStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task))
    );
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 text-white shadow-2xl">
      <header className="flex flex-col gap-2 pb-4">
        <h2 className="text-xl font-semibold">Mission Control</h2>
        <p className="text-sm text-zinc-300">
          Keep Jarvis aligned with your daily goals. Summon automation-ready tasks across
          marketplaces and track execution in one timeline.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
        <form
          className="flex flex-col gap-3 rounded-2xl bg-white/8 p-4 shadow-inner"
          onSubmit={(event) => {
            event.preventDefault();
            addTask();
          }}
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-zinc-400">
              Task Title
            </label>
            <input
              className="rounded-xl border border-white/20 bg-zinc-950/60 px-4 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
              placeholder="Example: Launch festive bundles on Amazon"
              value={draft.title}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, title: event.target.value }))
              }
            />
            {errors.title && <span className="text-xs text-rose-300">{errors.title}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-zinc-400">
              Outcome Details
            </label>
            <textarea
              rows={4}
              className="resize-y rounded-xl border border-white/20 bg-zinc-950/60 px-4 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
              placeholder="Include SKU references, campaign context, content gaps, etc."
              value={draft.details}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, details: event.target.value }))
              }
            />
            {errors.details && <span className="text-xs text-rose-300">{errors.details}</span>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-zinc-400">
                Marketplace Focus
              </label>
              <input
                className="rounded-xl border border-white/20 bg-zinc-950/60 px-4 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                placeholder="Amazon / Flipkart / Meesho / Myntra"
                value={draft.marketplaceFocus}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, marketplaceFocus: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs uppercase tracking-wide text-zinc-400">
                Target Date
              </label>
              <input
                type="date"
                className="rounded-xl border border-white/20 bg-zinc-950/60 px-4 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
                value={draft.due}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, due: event.target.value }))
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
          >
            Add to Jarvis Brief
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              Smart Automations
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-200">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
                No priorities yet. Feed Jarvis your first mission for today.
              </div>
            ) : (
              tasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/30"
                >
                  <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{task.title}</h3>
                      <p className="text-xs uppercase tracking-wide text-zinc-400">
                        {task.marketplaceFocus || "Multi-Channel"}{" "}
                        {task.due ? `· Due ${new Date(task.due).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white ${statusLabel[task.status].accent}`}
                    >
                      {statusLabel[task.status].label}
                    </span>
                  </header>

                  <p className="mt-3 text-sm text-zinc-200">{task.details}</p>

                  <footer className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-200">
                    {(["pending", "active", "done"] as TaskStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatus(task.id, status)}
                        className={`rounded-full border px-3 py-1 transition ${
                          task.status === status
                            ? "border-emerald-300 bg-emerald-500/20 text-emerald-100"
                            : "border-white/10 bg-white/5 hover:border-emerald-300/60 hover:text-emerald-100"
                        }`}
                      >
                        {statusLabel[status].label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="ml-auto rounded-full border border-rose-400/70 bg-rose-500/20 px-3 py-1 text-rose-100 transition hover:bg-rose-500/40"
                    >
                      Remove
                    </button>
                  </footer>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

