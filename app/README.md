## Jarvis Commerce Agent

Voice-first AI operator for Indian e-commerce sellers. Jarvis helps you coordinate daily operations and generate marketplace-ready catalog sheets for Amazon, Flipkart, Meesho, and Myntra.

### Features

- Voice + text control center with live transcription and text-to-speech responses.
- Mission planner to log tasks, switch status, and get automation playbooks.
- Catalog Automation Lab to ingest your master sheet and export channel-ready CSVs.
- OpenAI-powered responses (with graceful offline heuristics when no key is provided).

### Local Development

```bash
cd app
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to interact with Jarvis.

### Environment Variables

Copy `.env.example` to `.env.local` and set your OpenAI API key:

```bash
cp .env.example .env.local
```

- `OPENAI_API_KEY` – optional. Enables LLM-quality answers. Without it, Jarvis falls back to rule-based guidance.
- `OPENAI_MODEL` – optional override (defaults to `gpt-4o-mini`).

### Production Build

```bash
npm run build
npm run start
```

### Testing Voice + Catalog Tools

1. Use Chrome for best Web Speech API support.
2. Upload a CSV with headers like `SKU`, `Title`, `MRP`, `Offer Price`, `Color`, `Fabric`, and `Image URL`.
3. Hit “Generate” next to your target marketplace to download a ready-to-upload sheet.

Jarvis is deploy-ready on Vercel using the included Next.js configuration.
