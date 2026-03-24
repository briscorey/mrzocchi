// Pages Function: /api/feedback
// Bulletproof version: model fallback chain so it never breaks from model string changes.

const MODEL_CHAIN = [
  "claude-sonnet-4-6",             // current Sonnet alias
  "claude-sonnet-4-20250514",      // dated Sonnet 4
  "claude-haiku-4-5-20251001",     // fallback to Haiku if Sonnet unavailable
];

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

async function callClaude(apiKey, model, prompt) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function() { controller.abort(); }, 30000);
  try {
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
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function onRequestPost(context) {
  try {
    const { worksheet, answers } = await context.request.json();

    if (!worksheet || !answers || !Array.isArray(answers) || answers.length === 0) {
      return new Response(JSON.stringify({ error: "No answers found in the uploaded PDF." }), {
        status: 400, headers: CORS,
      });
    }

    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Feedback service not configured. Ask Mr Zocchi to check the API key." }), {
        status: 500, headers: CORS,
      });
    }

    const answerList = answers
      .map(function(a) { return 'Field "' + a.question + '": "' + a.answer + '"'; })
      .join("\n");

    const prompt = 'You are a friendly MYP science and maths teacher marking a student\'s revision worksheet. The student is in middle school (Grade 6-8) and may be an EAL (English as Additional Language) learner.\n\nWORKSHEET: ' + worksheet + '\n\nSTUDENT ANSWERS:\n' + answerList + '\n\nMark each answer and respond ONLY with a JSON object in this exact format (no markdown, no backticks, no explanation outside the JSON):\n{\n  "overall_score": "X/Y",\n  "overall_comment": "One encouraging sentence about their work overall.",\n  "questions": [\n    {\n      "question": "1",\n      "status": "correct",\n      "score": "2/2",\n      "feedback": "Brief feedback. Max 2 sentences."\n    }\n  ]\n}\n\nRules:\n- status must be one of: "correct", "partial", "incorrect", "blank"\n- Be encouraging but honest. Start feedback with what the student got right.\n- For science: accept answers showing correct understanding even if wording is imperfect.\n- For maths: check working AND answer. Give partial credit for correct method with wrong answer.\n- For blank answers: say "You left this blank. Here\'s a hint: [brief hint]."\n- Keep feedback to 1-2 sentences per question. Use simple vocabulary.\n- Allocate 1-3 marks per question depending on complexity.\n- Number questions sequentially from 1 regardless of field names.';

    // Try each model in fallback chain
    let lastError = null;

    for (const model of MODEL_CHAIN) {
      try {
        const { ok, status, data } = await callClaude(apiKey, model, prompt);

        if (ok && data.content && data.content[0] && data.content[0].text) {
          const text = data.content[0].text;
          let feedback;
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse feedback." };
          } catch (parseErr) {
            feedback = { error: "Could not parse feedback. Please try again." };
          }
          return new Response(JSON.stringify(feedback), { headers: CORS });
        }

        if (status === 404 || (status === 400 && data.error && data.error.message && data.error.message.includes("model")) || status === 529) {
          console.warn("Model " + model + " failed (" + status + "). Trying next.");
          lastError = data.error ? data.error.message : "HTTP " + status;
          continue;
        }

        if (status === 401 || status === 403) {
          return new Response(JSON.stringify({ error: "Authentication error. Ask Mr Zocchi to check the API key." }), {
            status: 500, headers: CORS,
          });
        }

        if (status === 429) {
          return new Response(JSON.stringify({ error: "Too many requests. Wait 30 seconds and try again." }), {
            status: 429, headers: CORS,
          });
        }

        lastError = data.error ? data.error.message : "HTTP " + status;

      } catch (fetchErr) {
        if (fetchErr.name === "AbortError") {
          lastError = "Request timed out after 30 seconds";
        } else {
          console.warn("Model " + model + " fetch error: " + fetchErr.message);
          lastError = fetchErr.message;
        }
      }
    }

    console.error("All models exhausted. Last error: " + lastError);
    return new Response(JSON.stringify({ error: "Feedback service temporarily unavailable. Try again in a few minutes." }), {
      status: 503, headers: CORS,
    });

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

export async function onRequestGet() {
  return new Response(JSON.stringify({ error: "Use POST with worksheet data." }), { status: 405, headers: CORS });
}
