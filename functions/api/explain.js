// Pages Function: /api/explain
// World-class visual AI tutor — returns text explanation + interactive visualization

const MODEL_CHAIN = [
  "claude-haiku-4-5-20251001",
  "claude-3-5-haiku-20241022",
  "claude-sonnet-4-6",
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
  return `You are a world-class MYP ${subjectName} tutor at an international school in Nanjing, China. Your students are Grade ${gradeNum} (age ${gradeNum + 5}-${gradeNum + 6}). Many are EAL learners from China, South Korea, and Germany.

You MUST respond with ONLY a valid JSON object (no markdown fences, no preamble). The JSON has exactly two keys:

{
  "explanation": "Your text explanation in markdown",
  "visualization": "A complete self-contained HTML page for an interactive visualization"
}

EXPLANATION RULES:
- Start with a one-line summary then its Chinese translation prefixed with 🇨🇳
- Explain in 3-5 short paragraphs, simple vocabulary, max 15 words per sentence
- Bold **key terms** using markdown
- Use real-world analogies from Nanjing, Korea, or Germany
- End with "🔑 Key words" — 3-5 terms with Chinese translations
- Max 250 words

VISUALIZATION RULES:
- Write a COMPLETE self-contained HTML page with inline CSS and JS
- The page must be visually striking with a dark theme (background #0f172a, text #e2e8f0)
- Use the accent color #2dd4bf (teal) for key elements
- Choose the RIGHT type of visualization for the concept:

  FOR MATHS:
  - Number concepts: interactive number line or place value chart
  - Fractions: visual fraction bars/pie charts with sliders
  - Algebra: step-by-step equation solver with balance scale animation
  - Geometry: interactive SVG with draggable points or angle measurement
  - Graphs: interactive coordinate plane with plotted functions
  - Statistics: bar charts or pie charts with the data
  - Probability: interactive dice/spinner simulator

  FOR SCIENCE:
  - Forces: force diagram with arrows showing magnitude
  - Energy: Sankey diagram or energy transfer chain
  - Particles: animated particles showing state of matter
  - Cells: labeled SVG diagram of the relevant cell/organelle
  - Chemistry: atom structure diagram or periodic table highlight
  - Ecology: food chain/web diagram with arrows
  - Space: orbital diagram or scale model
  - Earth Science: cross-section diagram with labeled layers

  GENERAL RULES FOR ALL VISUALIZATIONS:
  - Must be interactive where possible (sliders, buttons, click events)
  - Use Canvas or SVG for diagrams, not just text
  - Include labels and annotations in simple English
  - Size: width 100%, height auto, min-height 300px
  - Font: system-ui, sans-serif
  - Make it educational — the visualization should TEACH, not just illustrate
  - Include a title at the top of the visualization
  - If the concept doesn't suit a visual (e.g. pure vocabulary), create a visual comparison table or concept map

CRITICAL: Output ONLY valid JSON. No text before or after. No markdown fences.`;
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
      max_tokens: 4000,
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
      return new Response(JSON.stringify({ error: "Service not configured. Ask Mr Zocchi to check the API key." }), {
        status: 500, headers: CORS,
      });
    }

    const gradeNum = parseInt(grade) || 6;
    const subjectName = subject === "maths" ? "Mathematics" : "Science";
    const systemPrompt = buildSystemPrompt(gradeNum, subjectName);
    const userMessage = "Explain this concept and create an interactive visualization: " + concept.trim();

    let lastError = null;

    for (const model of MODEL_CHAIN) {
      try {
        const { ok, status, data } = await callClaude(apiKey, model, systemPrompt, userMessage);

        if (ok && data.content && data.content[0] && data.content[0].text) {
          const rawText = data.content[0].text;

          // Try to parse as JSON
          try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.explanation) {
                return new Response(JSON.stringify({
                  explanation: parsed.explanation,
                  visualization: parsed.visualization || null,
                }), { headers: CORS });
              }
            }
          } catch (parseErr) {
            // JSON parse failed — return as text-only explanation
          }

          // Fallback: return raw text as explanation without visualization
          return new Response(JSON.stringify({
            explanation: rawText,
            visualization: null,
          }), { headers: CORS });
        }

        if (status === 404 || (status === 400 && data.error && data.error.message && data.error.message.includes("model")) || status === 529) {
          lastError = data.error ? data.error.message : "HTTP " + status;
          continue;
        }
        if (status === 401 || status === 403) {
          return new Response(JSON.stringify({ error: "Authentication error. Ask Mr Zocchi to check the API key." }), {
            status: 500, headers: CORS,
          });
        }
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Too many requests! Wait 30 seconds and try again." }), {
            status: 429, headers: CORS,
          });
        }
        lastError = data.error ? data.error.message : "HTTP " + status;
      } catch (fetchErr) {
        lastError = fetchErr.message;
      }
    }

    return new Response(JSON.stringify({ error: "Service temporarily unavailable. Try again in a few minutes." }), {
      status: 503, headers: CORS,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: CORS,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
