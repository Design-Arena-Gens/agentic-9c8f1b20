"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

type AssistantResponse = {
  reply: string;
  summary?: string;
  followUps?: string[];
};

type RecognitionEventResult = {
  isFinal: boolean;
  0?: { transcript?: string };
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionEventResult>;
};

type RecognitionErrorEvent = {
  error: string;
};

interface RecognitionController {
  start: () => void;
  stop: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  addEventListener(type: "start" | "end", listener: () => void): void;
  addEventListener(type: "result", listener: (event: RecognitionEvent) => void): void;
  addEventListener(type: "error", listener: (event: RecognitionErrorEvent) => void): void;
  removeEventListener(type: "start" | "end", listener: () => void): void;
  removeEventListener(type: "result", listener: (event: RecognitionEvent) => void): void;
  removeEventListener(type: "error", listener: (event: RecognitionErrorEvent) => void): void;
}

const recognitionSingleton = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const SpeechRecognitionCtor =
    (window as typeof window & { SpeechRecognition?: new () => RecognitionController }).SpeechRecognition ??
    (window as typeof window & { webkitSpeechRecognition?: new () => RecognitionController })
      .webkitSpeechRecognition;

  if (!SpeechRecognitionCtor) {
    return null;
  }

  const recognition = new SpeechRecognitionCtor();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-IN";
  recognition.maxAlternatives = 1;

  return recognition;
};

const synth = () => (typeof window === "undefined" ? null : window.speechSynthesis);

export function VoiceAgent() {
  const recognitionRef = useRef<RecognitionController | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recognitionRef.current) {
      return;
    }

    recognitionRef.current = recognitionSingleton();
  }, []);

  const speak = useCallback((text: string) => {
    const speech = synth();
    if (!speech) {
      return;
    }
    speech.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice =
      speech
        .getVoices()
        .find((voice) => /english/i.test(voice.lang) && /india/i.test(voice.name)) ??
      speech.getVoices().find((voice) => /english/i.test(voice.lang)) ??
      null;

    speech.speak(utterance);
  }, []);

  const submitMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }

      const pendingMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, pendingMessage]);
      setInput("");
      setInterimTranscript("");
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history: messages.slice(-6) }),
        });

        if (!response.ok) {
          throw new Error(`Assistant offline (${response.status})`);
        }

        const data = (await response.json()) as AssistantResponse;
        const reply = data.reply ?? "I am ready for your next task.";

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          createdAt: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (autoSpeak) {
          speak(reply);
        }
      } catch (err) {
        const fallbackMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            err instanceof Error
              ? `I ran into an issue: ${err.message}. Please try again.`
              : "I ran into an issue. Please try again.",
          createdAt: Date.now(),
        };

        setMessages((prev) => [...prev, fallbackMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [autoSpeak, isLoading, messages, speak]
  );

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    const handleStart = () => {
      setError(null);
      setInterimTranscript("");
      setListening(true);
    };

    const handleResult = (event: RecognitionEvent) => {
      let interim = "";
      let finalTranscript = "";

      const results = Array.from(event.results);

      for (let i = event.resultIndex; i < results.length; i += 1) {
        const result = results[i];
        const transcript = result?.[0]?.transcript ?? "";

        if (result?.isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (finalTranscript.trim()) {
        submitMessage(finalTranscript.trim());
      }
    };

    const handleEnd = () => {
      setListening(false);
    };

    const handleError = (event: RecognitionErrorEvent) => {
      const message =
        event.error === "no-speech"
          ? "I could not hear you."
          : event.error || "Voice input failed.";
      setError(message);
      setListening(false);
    };

    recognition.addEventListener("start", handleStart);
    recognition.addEventListener("result", handleResult);
    recognition.addEventListener("end", handleEnd);
    recognition.addEventListener("error", handleError);

    return () => {
      recognition.removeEventListener("start", handleStart);
      recognition.removeEventListener("result", handleResult);
      recognition.removeEventListener("end", handleEnd);
      recognition.removeEventListener("error", handleError);
    };
  }, [submitMessage]);

  const toggleListening = useCallback(() => {
    const controller = recognitionRef.current;
    if (!controller) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }

    if (listening) {
      controller.stop();
      setListening(false);
      return;
    }

    controller.start();
  }, [listening]);

  const formattedMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        time: new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      })),
    [messages]
  );

  return (
    <section className="rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/70">
      <header className="flex items-center justify-between gap-4 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Voice Control Center
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              listening
                ? "bg-rose-500 text-white shadow-inner"
                : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            }`}
          >
            {listening ? "Listening…" : "Start Jarvis"}
          </button>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(event) => setAutoSpeak(event.target.checked)}
              className="accent-emerald-500"
            />
            Auto speak
          </label>
        </div>
      </header>

      <div className="mb-4 min-h-[240px] space-y-3 overflow-y-auto rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
        {formattedMessages.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            Say something like “Plan my Amazon Prime Day listings” or “What are my critical tasks
            today?”
          </p>
        ) : (
          formattedMessages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col gap-1 ${
                message.role === "assistant" ? "items-start text-left" : "items-end text-right"
              }`}
            >
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-wide ${
                  message.role === "assistant"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200"
                }`}
              >
                {message.role === "assistant" ? "Jarvis" : "You"} · {message.time}
              </span>
              <p className="max-w-prose rounded-2xl bg-white/70 p-3 leading-relaxed text-zinc-800 shadow-sm dark:bg-zinc-900/70 dark:text-zinc-100">
                {message.content}
              </p>
            </div>
          ))
        )}

        {interimTranscript && (
          <p className="animate-pulse text-xs text-zinc-500 dark:text-zinc-400">
            {interimTranscript}
          </p>
        )}
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(input);
        }}
      >
        <input
          className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 shadow-inner outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-emerald-400"
          placeholder="Type instead of speaking…"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Thinking…" : "Send"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-xs font-medium text-rose-500">
          {error} Try using the text input if speech is unavailable.
        </p>
      )}
    </section>
  );
}
