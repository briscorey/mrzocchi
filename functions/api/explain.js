// Pages Function: /api/explain
// Antifragile visual AI tutor — SVG diagrams, language support, 3-model fallback

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

function buildSystemPrompt(gradeNum, subjectName, lang) {
  var langInstr = "";
  if (lang === "zh") {
    langInstr = "\n\nIMPORTANT: Write the ENTIRE explanation in Simplified Chinese (中文). Use simple Chinese suitable for a middle school student. Keep all technical terms in both Chinese and English in brackets like: 光合作用 (photosynthesis). The visualization labels should also be in Chinese.";
  } else if (lang === "ko") {
    langInstr = "\n\nIMPORTANT: Write the ENTIRE explanation in Korean (한국어). Use simple Korean suitable for a middle school student. Keep all technical terms in both Korean and English in brackets like: 광합성 (photosynthesis). The visualization labels should also be in Korean.";
  }

  return "You are an MYP " + subjectName + " tutor at an international school in Nanjing, China. Students are Grade " + gradeNum + " (age " + (gradeNum+5) + "-" + (gradeNum+6) + "). Many are EAL learners." + langInstr + "\n\nYou MUST respond using these exact delimiters:\n\n===EXPLANATION===\nYour explanation in markdown.\n\nRules for the explanation:\n" + (lang === "zh" ? "- Write entirely in Simplified Chinese\n- Include English terms in brackets after Chinese terms\n" : lang === "ko" ? "- Write entirely in Korean\n- Include English terms in brackets after Korean terms\n" : "- Start with a one-line summary, then add the Chinese translation on the next line prefixed with 🇨🇳\n") + "- 3-5 short paragraphs, simple vocabulary\n- Bold **key terms** on first use\n- Use a real-world analogy students can relate to\n- End with a 'Key Words' section: 3-5 terms" + (lang ? "" : " with Chinese translations") + "\n- Max 250 words\n\n===VISUALIZATION===\nA SINGLE self-contained SVG element. NOT an HTML page — just the raw <svg> tag.\n\nSVG Rules:\n- Start with <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 600 400\">\n- Dark background: fill the first rect with #0f172a\n- Use these colours: teal #2dd4bf, gold #e9c46a, coral #f97316, white #e2e8f0, muted #94a3b8\n- Include a title at the top in white, font-size 18\n- Use clear labels, arrows, and simple shapes to illustrate the concept\n- For maths: number lines, fraction bars, shape diagrams, coordinate grids, pie charts\n- For science: labelled diagrams, process flows with arrows, comparison charts, particle arrangements, force diagrams, food chain flows\n- Use <text> elements with fill colour and readable font-size (12-16px)\n- Use <line>, <rect>, <circle>, <polygon>, <path> for shapes\n- Use <marker> for arrowheads if needed\n- NO <script> tags. NO JavaScript. NO <foreignObject>. NO HTML inside the SVG. Pure SVG only.\n- Keep it simple, clear, and correct. A clean labelled diagram is better than a complex broken one.\n\nCRITICAL: The visualization MUST be a raw <svg> tag — NOT wrapped in HTML, NOT wrapped in ```code blocks. Just the SVG element itself.";
}

async function callClaude(apiKey, model, systemPrompt, userMessage, timeoutMs) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, timeoutMs || 28000);

  try {
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
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    var data = await res.json();
    return { ok: res.ok, status: res.status, data: data };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

function parseResponse(rawText) {
  var explanation = rawText;
  var visualization = null;

  if (rawText.indexOf("===EXPLANATION===") !== -1) {
    var afterExp = rawText.split("===EXPLANATION===")[1] || "";
    if (afterExp.indexOf("===VISUALIZATION===") !== -1) {
      explanation = afterExp.split("===VISUALIZATION===")[0].trim();
      var vizRaw = afterExp.split("===VISUALIZATION===")[1].trim();
      vizRaw = vizRaw.replace(/^```(?:svg|xml|html)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      var svgMatch = vizRaw.match(/<svg[\s\S]*<\/svg>/i);
      if (svgMatch) vizRaw = svgMatch[0];
      if (vizRaw.length > 50 && vizRaw.indexOf("<svg") !== -1) visualization = vizRaw;
    } else {
      explanation = afterExp.trim();
    }
  } else {
    // Fallback: look for SVG anywhere in the response
    var svgFallback = rawText.match(/<svg[\s\S]*<\/svg>/i);
    if (svgFallback) {
      visualization = svgFallback[0];
      explanation = rawText.replace(visualization, "").trim();
    }
  }

  // Clean up explanation: remove stray delimiter text
  explanation = explanation.replace(/===\w+===/g, "").trim();

  return { explanation: explanation, visualization: visualization };
}

function isRetryable(status, data) {
  if (status === 404 || status === 529 || status === 502 || status === 503) return true;
  if (status === 400 && data && data.error && data.error.message && data.error.message.indexOf("model") !== -1) return true;
  return false;
}

export async function onRequestPost(context) {
  try {
    var body;
    try { body = await context.request.json(); }
    catch (parseErr) {
      return new Response(JSON.stringify({ error: "Invalid request. Send JSON with a 'concept' field." }), { status: 400, headers: CORS });
    }

    var concept = body.concept, grade = body.grade, subject = body.subject;
    var lang = body.lang || null;

    if (!concept || typeof concept !== "string" || concept.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please type what you'd like explained." }), { status: 400, headers: CORS });
    }
    if (concept.trim().length > 300) {
      return new Response(JSON.stringify({ error: "Please keep your question under 300 characters." }), { status: 400, headers: CORS });
    }

    var apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Service not configured. Ask Mr Zocchi to check the API key." }), { status: 500, headers: CORS });
    }

    var gradeNum = parseInt(grade) || 6;
    if (gradeNum < 1 || gradeNum > 12) gradeNum = 6;
    var subjectName = subject === "maths" ? "Mathematics" : "Science";
    var systemPrompt = buildSystemPrompt(gradeNum, subjectName, lang);
    var userMessage = "Explain this concept and create a clear SVG diagram: " + concept.trim();

    var lastError = null;

    for (var m = 0; m < MODEL_CHAIN.length; m++) {
      var model = MODEL_CHAIN[m];
      try {
        var result = await callClaude(apiKey, model, systemPrompt, userMessage, 28000);

        if (result.ok && result.data && result.data.content && result.data.content[0] && result.data.content[0].text) {
          var rawText = result.data.content[0].text;
          // Guard: if response is too short, retry with next model
          if (rawText.length < 50) {
            lastError = "Response too short (" + rawText.length + " chars)";
            continue;
          }
          var parsed = parseResponse(rawText);
          // Guard: ensure explanation is substantive
          if (!parsed.explanation || parsed.explanation.length < 30) {
            lastError = "Explanation too short";
            continue;
          }
          return new Response(JSON.stringify({
            explanation: parsed.explanation,
            visualization: parsed.visualization,
          }), { headers: CORS });
        }

        if (isRetryable(result.status, result.data)) {
          lastError = (result.data && result.data.error ? result.data.error.message : "HTTP " + result.status);
          continue;
        }

        if (result.status === 401 || result.status === 403) {
          return new Response(JSON.stringify({ error: "Authentication error. Ask Mr Zocchi to check the API key." }), { status: 500, headers: CORS });
        }

        if (result.status === 429) {
          return new Response(JSON.stringify({ error: "Too many students asking at once. Wait 30 seconds and try again." }), { status: 429, headers: CORS });
        }

        lastError = (result.data && result.data.error ? result.data.error.message : "HTTP " + result.status);
      } catch (fetchErr) {
        lastError = fetchErr.name === "AbortError" ? "Request timed out" : fetchErr.message;
      }
    }

    return new Response(JSON.stringify({ error: "The explain service is temporarily unavailable. Please try again in a moment." }), { status: 503, headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet() {
  return new Response(JSON.stringify({ error: "Use POST with a JSON body containing 'concept', 'grade', and 'subject'." }), { status: 405, headers: CORS });
}
