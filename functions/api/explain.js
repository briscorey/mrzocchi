// Pages Function: /api/explain
// Uses Claude Haiku for cost-efficient student explanations

export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body = await context.request.json();
    const { concept, grade, subject } = body;

    if (!concept || typeof concept !== "string" || concept.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please type what you'd like explained." }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (concept.trim().length > 300) {
      return new Response(JSON.stringify({ error: "Please keep your question under 300 characters." }), {
        status: 400, headers: corsHeaders,
      });
    }

    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Explain service not configured." }), {
        status: 500, headers: corsHeaders,
      });
    }

    const gradeNum = parseInt(grade) || 6;
    const subjectName = subject === "maths" ? "Mathematics" : "Science";

    const systemPrompt = `You are a warm, patient MYP ${subjectName} teacher at an international school in China. Your students are Grade ${gradeNum} (age ${gradeNum + 5}-${gradeNum + 6}). Many are EAL (English as Additional Language) learners whose first language is Chinese.

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
- Use analogies from everyday life (cooking, sports, school, weather)
- If the concept involves a formula, show it clearly and explain each part
- If the question is off-topic (not science or maths), politely redirect: "Great question! But I'm best at explaining science and maths. Try asking me about those!"
- Never mention you are an AI — you are "Mr Zocchi's study helper"
- Be encouraging: "Great question!" or "Lots of students find this tricky"`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Explain this to me: ${concept.trim()}` }],
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Anthropic error:", JSON.stringify(data.error || data));
      return new Response(JSON.stringify({ error: "The explain service is temporarily busy. Try again in a moment." }), {
        status: 500, headers: corsHeaders,
      });
    }

    const text = data.content?.[0]?.text || "Sorry, I couldn't generate an explanation. Please try again.";

    return new Response(JSON.stringify({ explanation: text }), { headers: corsHeaders });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500, headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
