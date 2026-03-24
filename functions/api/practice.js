// Pages Function: /api/practice
// Antifragile personalised practice — 3-model fallback, robust JSON parsing, question validation

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

async function callClaude(apiKey, model, system, user, timeoutMs) {
  var controller = new AbortController();
  var tid = setTimeout(function(){ controller.abort(); }, timeoutMs || 40000);
  try {
    var res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": API_VERSION },
      body: JSON.stringify({ model: model, max_tokens: 4000, system: system, messages: [{ role: "user", content: user }] }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    var data = await res.json();
    return { ok: res.ok, status: res.status, data: data };
  } catch(err) { clearTimeout(tid); throw err; }
}

function normalizeQuestions(parsed) {
  if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) return null;

  // Filter out questions that are clearly broken
  parsed.questions = parsed.questions.filter(function(q) {
    return q && typeof q.question === "string" && q.question.trim().length > 5;
  });

  if (parsed.questions.length === 0) return null;

  parsed.questions = parsed.questions.map(function(q, i) {
    q.num = q.num || (i + 1);
    q.type = (q.type || "short").toLowerCase().trim();
    // Normalise type aliases
    if (q.type === "multiple_choice" || q.type === "multiple choice" || q.type === "mc") q.type = "mcq";
    if (q.type === "calc" || q.type === "numerical") q.type = "calculation";
    if (q.type === "open" || q.type === "free" || q.type === "written") q.type = "short";
    if (q.type === "extended_response" || q.type === "long") q.type = "extended";

    // Ensure answer is always a string
    if (q.answer === undefined || q.answer === null) q.answer = "";
    q.answer = String(q.answer);

    // Ensure explanation is a string
    if (q.explanation === undefined || q.explanation === null) q.explanation = "";
    q.explanation = String(q.explanation);

    // MCQ: ensure options is a valid array and answer matches an option
    if (q.type === "mcq") {
      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        // Convert to short answer if MCQ has broken options
        q.type = "short";
        delete q.options;
        return q;
      }
      // Clean options: remove letter prefixes
      q.options = q.options.map(function(o) {
        return String(o).replace(/^[A-Da-d][.):\s]+/, "").trim();
      });

      var ans = q.answer.trim();
      // Check exact match
      var exactMatch = q.options.find(function(o) { return o === ans; });
      if (!exactMatch) {
        // Strip letter prefix from answer too
        var cleanAns = ans.replace(/^[A-Da-d][.):\s]+/, "").trim();
        exactMatch = q.options.find(function(o) { return o === cleanAns; });
        if (exactMatch) { q.answer = exactMatch; }
        else {
          // Try letter index
          var letter = ans.replace(/[^A-Da-d]/g, "").toUpperCase();
          var letterIndex = "ABCD".indexOf(letter);
          if (letterIndex >= 0 && letterIndex < q.options.length) {
            q.answer = q.options[letterIndex];
          } else {
            // Try substring match
            var subMatch = q.options.find(function(o) {
              return o.toLowerCase().indexOf(cleanAns.toLowerCase()) !== -1 ||
                     cleanAns.toLowerCase().indexOf(o.toLowerCase()) !== -1;
            });
            if (subMatch) q.answer = subMatch;
            else q.answer = q.options[0]; // Absolute last resort: first option
          }
        }
      }
    }
    return q;
  });

  // Ensure title
  if (!parsed.title || typeof parsed.title !== "string") {
    parsed.title = "Practice Quiz";
  }

  return parsed;
}

function tryParseJSON(raw) {
  // Strip markdown code fences
  raw = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  // Try direct parse first
  try { return JSON.parse(raw); } catch(e) {}

  // Try extracting JSON object
  var match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch(e) {}

    // Try fixing common JSON issues: trailing commas
    var fixed = match[0].replace(/,\s*([\]}])/g, "$1");
    try { return JSON.parse(fixed); } catch(e) {}
  }

  return null;
}

function isRetryable(status, data) {
  if (status === 404 || status === 529 || status === 502 || status === 503 || status === 500) return true;
  if (status === 400 && data && data.error && data.error.message && data.error.message.indexOf("model") !== -1) return true;
  return false;
}

export async function onRequestPost(context) {
  try {
    var body;
    try { body = await context.request.json(); } catch(e) {
      return new Response(JSON.stringify({ error: "Invalid request." }), { status: 400, headers: CORS });
    }

    var grade = body.grade, subject = body.subject, topic = body.topic;
    var rawInterests = body.interests || "";
    var interests = Array.isArray(rawInterests) ? rawInterests.join(", ") : String(rawInterests);
    var heritage = String(body.heritage || ""), difficulty = body.difficulty || "medium";

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please select a topic." }), { status: 400, headers: CORS });
    }

    var apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Service not configured. Ask Mr Zocchi to check the API key." }), { status: 500, headers: CORS });
    }

    var gradeNum = parseInt(grade) || 6;
    if (gradeNum < 1 || gradeNum > 12) gradeNum = 6;
    var subjectName = subject === "maths" ? "Mathematics" : "Science";

    var personalization = "";
    if (interests.trim()) personalization += "\nStudent interests/hobbies: " + interests.trim();
    if (heritage.trim()) personalization += "\nStudent heritage/culture: " + heritage.trim();

    var system = "You are an expert MYP " + subjectName + " teacher creating a personalised practice worksheet for a Grade " + gradeNum + " student at an international school in Nanjing, China." + personalization + "\n\nGenerate a practice worksheet as a JSON object. Output ONLY valid JSON, no markdown fences, no preamble, no commentary.\n\nStructure:\n{\n  \"title\": \"Fun title connecting topic to student interests\",\n  \"intro\": \"1-2 sentence personalised intro\",\n  \"questions\": [\n    {\n      \"num\": 1,\n      \"type\": \"mcq\",\n      \"question\": \"Question text\",\n      \"options\": [\"Option A text\", \"Option B text\", \"Option C text\", \"Option D text\"],\n      \"answer\": \"Option B text\",\n      \"explanation\": \"Why this is correct\"\n    },\n    {\n      \"num\": 2,\n      \"type\": \"short\",\n      \"question\": \"Question requiring a written answer\",\n      \"answer\": \"Model answer\",\n      \"explanation\": \"Explanation\"\n    },\n    {\n      \"num\": 3,\n      \"type\": \"calculation\",\n      \"question\": \"Calculation using real-world numbers\",\n      \"answer\": \"42\",\n      \"unit\": \"km\",\n      \"working\": \"Step 1: ... Step 2: ...\"\n    }\n  ]\n}\n\nCRITICAL RULES:\n- Generate exactly 8 questions\n- Mix: 3 MCQ, 3 short answer, 2 calculation (maths) or 3 MCQ, 4 short, 1 extended (science)\n- For MCQ: the \"answer\" field MUST be the EXACT full text of the correct option, NOT just a letter\n- For MCQ: do NOT prefix options with A. B. C. D. — just write the option text directly\n- EVERY question connects to student interests/heritage/hobbies\n- Difficulty: " + difficulty + " (easy=recall, medium=application, hard=analysis)\n- Simple EAL-friendly English\n- Include Chinese terms in parentheses for key vocabulary\n- Questions must genuinely teach the topic, not just mention interests superficially\n- Output ONLY valid JSON. No text before or after.";

    var userMsg = "Create a personalised " + subjectName + " practice worksheet on: " + topic.trim();

    var lastError = null;
    for (var m = 0; m < MODEL_CHAIN.length; m++) {
      try {
        var result = await callClaude(apiKey, MODEL_CHAIN[m], system, userMsg, 35000);
        if (result.ok && result.data && result.data.content && result.data.content[0] && result.data.content[0].text) {
          var raw = result.data.content[0].text;
          var parsed = tryParseJSON(raw);
          if (parsed) {
            var normalized = normalizeQuestions(parsed);
            if (normalized && normalized.questions && normalized.questions.length >= 3) {
              return new Response(JSON.stringify(normalized), { headers: CORS });
            }
          }
          lastError = "Could not parse valid questions from response";
          continue;
        }

        if (isRetryable(result.status, result.data)) {
          lastError = result.data && result.data.error ? result.data.error.message : "HTTP " + result.status;
          continue;
        }
        if (result.status === 401 || result.status === 403) {
          return new Response(JSON.stringify({ error: "Authentication error. Ask Mr Zocchi to check the API key." }), { status: 500, headers: CORS });
        }
        if (result.status === 429) {
          return new Response(JSON.stringify({ error: "Too many requests. Wait a moment and try again." }), { status: 429, headers: CORS });
        }
        lastError = result.data && result.data.error ? result.data.error.message : "HTTP " + result.status;
      } catch(fe) {
        lastError = fe.name === "AbortError" ? "Request timed out" : fe.message;
      }
    }
    return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again in a moment." }), { status: 503, headers: CORS });
  } catch(err) {
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() { return new Response(null, { headers: CORS }); }
export async function onRequestGet() { return new Response(JSON.stringify({ error: "Use POST with worksheet data." }), { status: 405, headers: CORS }); }
