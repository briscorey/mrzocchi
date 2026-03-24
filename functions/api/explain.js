// Pages Function: /api/explain
// Visual AI tutor — returns explanation + interactive visualization
// Uses ===DELIMITER=== format for reliable parsing with Haiku

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
  return "You are a world-class MYP " + subjectName + " tutor at an international school in Nanjing, China. Students are Grade " + gradeNum + " (age " + (gradeNum+5) + "-" + (gradeNum+6) + "). Many are EAL learners from China, South Korea, and Germany.\n\nYOU MUST RESPOND IN THIS EXACT FORMAT:\n\n===EXPLANATION===\nYour markdown explanation here.\n\nRules:\n- One-line summary then Chinese translation prefixed with the CN flag emoji\n- 3-5 short paragraphs, simple vocabulary, max 15 words per sentence\n- Bold **key terms**\n- Real-world analogies from Nanjing, Korea, or Germany\n- End with key words section: 3-5 terms with Chinese translations\n- Max 250 words\n\n===VISUALIZATION===\nA complete self-contained HTML page (with DOCTYPE, html, head, body tags, inline CSS and JS) for an interactive visualization.\n\nVisualization rules:\n- Dark theme: background #0f172a, text #e2e8f0, accent #2dd4bf (teal)\n- MUST be interactive: sliders, buttons, click events, animations\n- Use Canvas or SVG for diagrams\n- Include labels in simple English\n- Title at the top of the page\n- For maths: number lines, fraction bars, coordinate planes, equation solvers, dice/spinners\n- For science: force arrows, particle animations, cell diagrams, food chains, orbital models, Sankey diagrams\n- If no visual fits, create an interactive concept map or comparison table\n- Min 300px height\n\nCRITICAL: Always include BOTH ===EXPLANATION=== and ===VISUALIZATION=== delimiters. The visualization MUST be a complete HTML page starting with <!DOCTYPE html>.";
}

async function callClaude(apiKey, model, systemPrompt, userMessage) {
  var res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  var data = await res.json();
  return { ok: res.ok, status: res.status, data: data };
}

export async function onRequestPost(context) {
  try {
    var body = await context.request.json();
    var concept = body.concept, grade = body.grade, subject = body.subject;

    if (!concept || typeof concept !== "string" || concept.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please type what you'd like explained." }), { status: 400, headers: CORS });
    }
    if (concept.trim().length > 300) {
      return new Response(JSON.stringify({ error: "Please keep your question under 300 characters." }), { status: 400, headers: CORS });
    }

    var apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Service not configured." }), { status: 500, headers: CORS });
    }

    var gradeNum = parseInt(grade) || 6;
    var subjectName = subject === "maths" ? "Mathematics" : "Science";
    var systemPrompt = buildSystemPrompt(gradeNum, subjectName);
    var userMessage = "Explain this concept and create an interactive visualization: " + concept.trim();

    var lastError = null;

    for (var m = 0; m < MODEL_CHAIN.length; m++) {
      var model = MODEL_CHAIN[m];
      try {
        var result = await callClaude(apiKey, model, systemPrompt, userMessage);

        if (result.ok && result.data.content && result.data.content[0] && result.data.content[0].text) {
          var rawText = result.data.content[0].text;

          var explanation = rawText;
          var visualization = null;

          // Parse ===DELIMITER=== format
          if (rawText.indexOf("===EXPLANATION===") !== -1) {
            var afterExp = rawText.split("===EXPLANATION===")[1] || "";
            if (afterExp.indexOf("===VISUALIZATION===") !== -1) {
              explanation = afterExp.split("===VISUALIZATION===")[0].trim();
              var vizRaw = afterExp.split("===VISUALIZATION===")[1].trim();
              // Strip markdown code fences
              vizRaw = vizRaw.replace(/^```(?:html)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
              if (vizRaw.length > 50) visualization = vizRaw;
            } else {
              explanation = afterExp.trim();
            }
          } else {
            // Fallback: try JSON
            try {
              var cleaned = rawText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
              var parsed = JSON.parse(cleaned);
              if (parsed.explanation) {
                explanation = parsed.explanation;
                visualization = parsed.visualization || null;
              }
            } catch(e) {}
          }

          return new Response(JSON.stringify({
            explanation: explanation,
            visualization: visualization,
          }), { headers: CORS });
        }

        if (result.status === 404 || result.status === 529 || (result.status === 400 && result.data.error && result.data.error.message && result.data.error.message.indexOf("model") !== -1)) {
          lastError = result.data.error ? result.data.error.message : "HTTP " + result.status;
          continue;
        }
        if (result.status === 401 || result.status === 403) {
          return new Response(JSON.stringify({ error: "Authentication error." }), { status: 500, headers: CORS });
        }
        if (result.status === 429) {
          return new Response(JSON.stringify({ error: "Too many requests. Wait 30 seconds." }), { status: 429, headers: CORS });
        }
        lastError = result.data.error ? result.data.error.message : "HTTP " + result.status;
      } catch (fetchErr) {
        lastError = fetchErr.message;
      }
    }

    return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), { status: 503, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Something went wrong." }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
