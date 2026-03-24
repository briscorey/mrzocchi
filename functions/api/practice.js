// Pages Function: /api/practice
// Generates personalised practice worksheets based on student interests and heritage

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

async function callClaude(apiKey, model, system, user) {
  var controller = new AbortController();
  var tid = setTimeout(function(){ controller.abort(); }, 30000);
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

    if (!topic || topic.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please select a topic." }), { status: 400, headers: CORS });
    }

    var apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Service not configured." }), { status: 500, headers: CORS });
    }

    var gradeNum = parseInt(grade) || 6;
    if (gradeNum < 1 || gradeNum > 12) gradeNum = 6;
    var subjectName = subject === "maths" ? "Mathematics" : "Science";

    var personalization = "";
    if (interests.trim()) personalization += "\nStudent interests/hobbies: " + interests.trim();
    if (heritage.trim()) personalization += "\nStudent heritage/culture: " + heritage.trim();

    var system = "You are an expert MYP " + subjectName + " teacher creating a personalised practice worksheet for a Grade " + gradeNum + " student at an international school in Nanjing, China." + personalization + "\n\nGenerate a practice worksheet as a JSON object with this EXACT structure. Output ONLY valid JSON, no markdown fences, no preamble:\n\n{\n  \"title\": \"Worksheet title incorporating the student's interests\",\n  \"intro\": \"A short personalised intro (1-2 sentences) connecting the topic to the student's world\",\n  \"questions\": [\n    {\n      \"num\": 1,\n      \"type\": \"mcq\",\n      \"question\": \"Question text themed around student interests\",\n      \"options\": [\"A\", \"B\", \"C\", \"D\"],\n      \"answer\": \"B\",\n      \"explanation\": \"Brief explanation of correct answer\"\n    },\n    {\n      \"num\": 2,\n      \"type\": \"short\",\n      \"question\": \"Short answer question themed around student interests\",\n      \"answer\": \"Model answer\",\n      \"explanation\": \"Explanation\"\n    },\n    {\n      \"num\": 3,\n      \"type\": \"calculation\",\n      \"question\": \"Calculation using real-world numbers from student's culture\",\n      \"answer\": \"42\",\n      \"unit\": \"km\",\n      \"working\": \"Step-by-step working\"\n    }\n  ]\n}\n\nRULES:\n- Generate exactly 8 questions\n- Mix types: 3 MCQ, 3 short answer, 2 calculation (for maths) or 3 MCQ, 4 short, 1 extended (for science)\n- EVERY question must connect to the student's interests, heritage, or hobbies\n- If the student likes basketball, use basketball distances/scores/physics\n- If they are Korean, use Korean contexts (Seoul, won currency, kimchi chemistry)\n- If they like gaming, use game scenarios for maths problems\n- Difficulty: " + difficulty + " (easy=recall, medium=application, hard=analysis)\n- Use simple EAL-friendly English\n- Include Chinese translation of key terms in parentheses where helpful\n- Each question should genuinely teach the topic, not just mention the interest superficially";

    var userMsg = "Create a personalised " + subjectName + " practice worksheet on: " + topic.trim();

    var lastError = null;
    for (var m = 0; m < MODEL_CHAIN.length; m++) {
      try {
        var result = await callClaude(apiKey, MODEL_CHAIN[m], system, userMsg);
        if (result.ok && result.data.content && result.data.content[0] && result.data.content[0].text) {
          var raw = result.data.content[0].text;
          raw = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
          try {
            var match = raw.match(/\{[\s\S]*\}/);
            if (match) {
              var parsed = JSON.parse(match[0]);
              if (parsed.questions && parsed.questions.length > 0) {
                return new Response(JSON.stringify(parsed), { headers: CORS });
              }
            }
          } catch(pe) {}
          return new Response(JSON.stringify({ error: "Could not generate worksheet. Try again." }), { status: 500, headers: CORS });
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
      } catch(fe) {
        lastError = fe.name === "AbortError" ? "Timed out" : fe.message;
      }
    }
    return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), { status: 503, headers: CORS });
  } catch(err) {
    return new Response(JSON.stringify({ error: "Something went wrong." }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() { return new Response(null, { headers: CORS }); }
export async function onRequestGet() { return new Response(JSON.stringify({ error: "POST only." }), { status: 405, headers: CORS }); }
