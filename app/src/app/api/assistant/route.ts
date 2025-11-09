import { NextResponse } from "next/server";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

type AssistantPayload = {
  message: string;
  history?: ClientMessage[];
};

const SYSTEM_PROMPT = `
You are Jarvis, a proactive digital operations chief for Indian e-commerce founders.
Goals:
1. Resolve the user's daily tasks, create prioritised plans, and anticipate blockers.
2. Transform raw catalog data into marketplace-ready listings for Amazon, Flipkart, Meesho, and Myntra.
3. When asked to work with spreadsheets, outline missing attributes, data cleaning steps, and automation suggestions.

Rules:
- Respond in clear, structured English.
- Provide bullet plans, checklists, and channel-specific playbooks.
- If something is ambiguous, make a confident assumption and move forward—do not ask the user for clarification.
- End with 2-3 proactive follow-up suggestions where relevant.

Return your answer as JSON following the schema provided by the client.
`;

const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

type AssistantResponse = {
  reply: string;
  summary?: string;
  followUps?: string[];
};

const marketplaces = ["Amazon", "Flipkart", "Meesho", "Myntra"] as const;

function sentenceCase(text: string) {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildHeuristicResponse(input: string): AssistantResponse {
  const detectedMarketplaces = marketplaces.filter((name) =>
    new RegExp(name, "i").test(input)
  );

  const wantsCatalog =
    /catalog|listing|sheet|excel|sku|product/i.test(input) || detectedMarketplaces.length > 0;

  const wantsTasks = /task|plan|today|remind|schedule|priority|deadline/i.test(input);

  const responseSections: string[] = [];

  if (wantsTasks) {
    responseSections.push(
      "🗂️ Daily Ops Blueprint:",
      "- Prioritise based on impact → revenue, compliance, customer experience.",
      "- Break work into 90-minute focus blocks with clear Done Definitions.",
      "- Reserve the final block for QA checks and reporting back to leadership."
    );
  }

  if (wantsCatalog) {
    const channelPlan = detectedMarketplaces.length
      ? detectedMarketplaces.join(", ")
      : "Amazon, Flipkart, Meesho, and Myntra";

    responseSections.push(
      `🛒 ${channelPlan} Listing Automation:`,
      "- Clean your master sheet: ensure SKU, Title, MRP, Offer Price, Color, Size, Fabric, and Image URLs are present.",
      "- Use the Catalog Automation Lab panel → upload the latest supplier file, then generate marketplace CSVs.",
      "- Enrich copy automatically: include 3 USP bullet points, search keywords, and compliance notes for GST/Legal."
    );
  }

  if (!wantsCatalog && !wantsTasks) {
    responseSections.push(
      "🤖 Jarvis Ready:",
      "- Share a task, question, or catalog sheet—I will prep the steps, automations, and documents you need."
    );
  }

  const followUps: string[] = [];

  if (wantsTasks) {
    followUps.push(
      "Should I schedule reminders and sync them to your preferred calendar?",
      "Want me to draft stakeholder updates once each task is closed?"
    );
  }

  if (wantsCatalog) {
    followUps.push(
      "Would you like marketplace-compliant image naming rules generated?",
      "Need SEO keywords per SKU for sponsored ads?"
    );
  }

  if (!followUps.length) {
    followUps.push(
      "Upload the latest catalog so I can generate ready-to-use marketplace sheets.",
      "Tell me your top priority for today and I will create an execution timeline."
    );
  }

  return {
    reply: responseSections.map((line) => sentenceCase(line)).join("\n"),
    summary: wantsCatalog
      ? "Catalog automation plan prepared with channel-specific actions."
      : wantsTasks
        ? "Daily operations plan generated."
        : "Standing by for instructions.",
    followUps,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantPayload;
    const incomingMessage = (body.message ?? "").trim();

    if (!incomingMessage) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(buildHeuristicResponse(incomingMessage));
    }

    const history = (body.history ?? [])
      .filter((entry) => entry && entry.role && entry.content)
      .slice(-6);

    const payload = {
      model: OPENAI_MODEL,
      temperature: 0.6,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "assistant_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              reply: { type: "string" },
              summary: { type: "string" },
              followUps: { type: "array", items: { type: "string" } },
            },
            required: ["reply"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map(({ role, content }) => ({ role, content })),
        { role: "user", content: incomingMessage },
      ],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const result = await response.json();
    const messageContent = result?.choices?.[0]?.message?.content;

    if (!messageContent) {
      throw new Error("Assistant returned an empty response.");
    }

    const parsed = JSON.parse(messageContent);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Assistant error", error);
    return NextResponse.json(buildHeuristicResponse(""), { status: 200 });
  }
}

