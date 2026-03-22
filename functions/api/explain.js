// Pages Function: /api/explain
// Uses Claude Haiku for cost-efficient student explanations
// Rate-limited: 5 requests per student per day via CF KV (or in-memory fallback)

export async function onRequest(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: corsHeaders,
    });
  }

  try {
    const { concept, grade, subject } = await context.request.json();

    if (!concept || concept.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please type what you'd like explained." }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (concept.trim().length > 200) {
      return new Response(JSON.stringify({ error: "Keep your question under 200 characters." }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Rate limiting via client IP
    const clientIP = context.request.headers.get("CF-Connecting-IP") || "unknown";
    const today = new Date().toISOString().split("T")[0];
    const rateKey = `explain:${clientIP}:${today}`;

    // Try KV rate limiting if available, otherwise skip
    let requestCount = 0;
    const DAILY_LIMIT = 8;

    if (context.env.RATE_LIMIT) {
      const stored = await context.env.RATE_LIMIT.get(rateKey);
      requestCount = stored ? parseInt(stored, 10) : 0;

      if (requestCount >= DAILY_LIMIT) {
        return new Response(JSON.stringify({
          error: "You've used all your explanations for today. Come back tomorrow, or check the glossary and quiz tabs for help now.",
          remaining: 0,
        }), { status: 429, headers: corsHeaders });
      }
    }

    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Service not configured." }), {
        status: 500, headers: corsHeaders,
      });
    }

    const gradeNum = grade || "6";
    const subjectName = subject || "science";

    const systemPrompt = `You are Mr Zocchi's teaching assistant on a school website for Nanjing International School (NIS). You help MYP Grade ${gradeNum} ${subjectName} students understand concepts they're stuck on.

RULES:
- Explain at a Grade ${gradeNum} level (age 11-14). Use simple English — many students speak Chinese or Korean at home.
- Start with a one-sentence answer, then explain WHY with an analogy or example.
- If the concept involves a formula or key term, show it clearly.
- Always end with a Chinese translation section: "🇨🇳 中文解释：" followed by a clear Chinese explanation (2-3 sentences, simplified Chinese).
- Keep the total response under 250 words.
- If the question is not about ${subjectName} or mathematics/science in general, politely redirect: "That's a great question, but I can only help with maths and science topics. Try asking about something from your current unit!"
- Do NOT do homework for students. If they paste a specific question, explain the METHOD, not the answer.
- Use analogies students in Nanjing would understand (e.g. the Yangtze River, Nanjing Metro, local food).`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: systemPrompt,
        messages: [
          { role: "user", content: concept.trim() },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Sorry, the explanation service is temporarily unavailable." }), {
        status: 502, headers: corsHeaders,
      });
    }

    const data = await response.json();
    const explanation = data.content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    // Increment rate limit
    const newCount = requestCount + 1;
    if (context.env.RATE_LIMIT) {
      await context.env.RATE_LIMIT.put(rateKey, String(newCount), { expirationTtl: 86400 });
    }

    return new Response(JSON.stringify({
      explanation,
      remaining: DAILY_LIMIT - newCount,
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("Explain function error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Try again." }), {
      status: 500, headers: corsHeaders,
    });
  }
}
