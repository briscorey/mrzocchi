// Pages Function: /api/explain
// Bulletproof version: model fallback chain + retry + diagnostics
//
// WHY THIS EXISTS: Anthropic model strings change (e.g. dated strings expire,
// new versions release). A single hardcoded string will eventually break.
// This function tries multiple models in order, so if one stops working,
// the next picks up automatically — no code change needed.

// Model fallback chain — tried in order. When Anthropic releases new models,
// add the new string to the TOP of this list. Old strings that stop working
// simply get skipped. The function self-heals.
const MODEL_CHAIN = [
  "claude-haiku-4-5-20251001",   // current dated Haiku 4.5
  "claude-3-5-haiku-20241022",   // older Haiku 3.5
  "claude-sonnet-4-6",           // fallback to Sonnet if all Haiku fail
];

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function buildSystemPrompt(gradeNum, subjectName) {
  return `You are a warm, patient MYP ${subjectName} teacher at an international school in Nanjing, China. Your students are Grade ${gradeNum} (age ${gradeNum + 5}-${gradeNum + 6}). Many are EAL (English as Additional Language) learners from China, South Korea, and Germany.

YOUR RESPONSE FORMAT — follow this exactly:

1. Start with a one-line summary in simple English (1 sentence max)
2. Then give the Chinese translation of that summary line, prefixed with 🇨🇳
3. Then explain the concept in 3-5 short paragraphs using:
   - Simple vocabulary (avoid jargon unless you define it)
   - Short sentences (max 15 words each)
   - A real-world analogy the student can picture
   - Bold the key terms using **term**
4. End with "🔑 Key words" — list 3-5 important English terms with their Chinese translations

RULES:
- Never exceed 250 words total
- Use analogies from everyday life in Nanjing (cooking, sports, school, weather, metro)
- If the concept involves a formula, show it clearly and explain each part
- If the question is off-topic (not science or maths), politely redirect: "Great question! But I'm best at explaining science and maths. Try asking me about those!"
- Never mention you are an AI — you are "Mr Zocchi's study helper"
- Be encouraging: "Great question!" or "Lots of students find this tricky"`;
}

async function callClaude(apiKey, model, systemPrompt, userMessage) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { concept, grade, subject } = body;

    // Validation
    if (!concept || typeof concept !== "string" || concept.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please type what you'd like explained." }), {
        status: 400, headers: CORS,
      });
    }

    if (concept.trim().length > 300) {
      return new Response(JSON.stringify({ error: "Please keep your question under 300 characters." }), {
        status: 400, headers: CORS,
      });
    }

    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Explain service is not configured. Ask Mr Zocchi to check the API key." }), {
        status: 500, headers: CORS,
      });
    }

    // Build prompt
    const gradeNum = parseInt(grade) || 6;
    const subjectName = subject === "maths" ? "Mathematics" : "Science";
    const systemPrompt = buildSystemPrompt(gradeNum, subjectName);
    const userMessage = `Explain this to me: ${concept.trim()}`;

    // Try each model in the fallback chain
    let lastError = null;

    for (const model of MODEL_CHAIN) {
      try {
        const { ok, status, data } = await callClaude(apiKey, model, systemPrompt, userMessage);

        if (ok && data.content && data.content[0] && data.content[0].text) {
          // Success
          return new Response(JSON.stringify({
            explanation: data.content[0].text,
          }), { headers: CORS });
        }

        // Model not found or invalid — try next
        if (status === 404 || (status === 400 && data.error && data.error.message && data.error.message.includes("model")) || status === 529) {
          console.warn("Model " + model + " failed (" + status + "): " + (data.error ? data.error.message : "unknown") + ". Trying next.");
          lastError = data.error ? data.error.message : "HTTP " + status;
          continue;
        }

        // Auth error — key is bad, don't try more models
        if (status === 401 || status === 403) {
          console.error("API key error (" + status + "): " + (data.error ? data.error.message : ""));
          return new Response(JSON.stringify({ error: "Explain service has an authentication problem. Ask Mr Zocchi to check the API key." }), {
            status: 500, headers: CORS,
          });
        }

        // Rate limit
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Too many students asking at once! Wait 30 seconds and try again." }), {
            status: 429, headers: CORS,
          });
        }

        // Any other error — try next model
        console.warn("Model " + model + " returned " + status);
        lastError = data.error ? data.error.message : "HTTP " + status;

      } catch (fetchErr) {
        console.warn("Model " + model + " fetch failed: " + fetchErr.message);
        lastError = fetchErr.message;
      }
    }

    // All models failed
    console.error("All models exhausted. Last error: " + lastError);
    return new Response(JSON.stringify({
      error: "The explain service is temporarily unavailable. Please try again in a few minutes.",
    }), { status: 503, headers: CORS });

  } catch (err) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: CORS,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
