// Pages Function: /api/feedback
// The ANTHROPIC_API_KEY is set as an environment variable in Cloudflare Pages settings

export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const { worksheet, answers } = await context.request.json();

    if (!worksheet || !answers || !Array.isArray(answers) || answers.length === 0) {
      return new Response(JSON.stringify({ error: "No answers found in the uploaded PDF." }), {
        status: 400, headers: corsHeaders,
      });
    }

    const apiKey = context.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Feedback service not configured." }), {
        status: 500, headers: corsHeaders,
      });
    }

    // Build the marking prompt
    const answerList = answers
      .map((a) => `Field "${a.question}": "${a.answer}"`)
      .join("\n");

    const prompt = `You are a friendly MYP science and maths teacher marking a student's revision worksheet. The student is in middle school (Grade 6-8) and may be an EAL (English as Additional Language) learner.

WORKSHEET: ${worksheet}

STUDENT ANSWERS:
${answerList}

Mark each answer and respond ONLY with a JSON object in this exact format (no markdown, no backticks, no explanation outside the JSON):
{
  "overall_score": "X/Y",
  "overall_comment": "One encouraging sentence about their work overall.",
  "questions": [
    {
      "question": "1",
      "status": "correct",
      "score": "2/2",
      "feedback": "Brief feedback. Max 2 sentences."
    }
  ]
}

Rules:
- status must be one of: "correct", "partial", "incorrect", "blank"
- Be encouraging but honest. Start feedback with what the student got right.
- For science: accept answers showing correct understanding even if wording is imperfect.
- For maths: check working AND answer. Give partial credit for correct method with wrong answer.
- For blank answers: say "You left this blank. Here's a hint: [brief hint]."
- Keep feedback to 1-2 sentences per question. Use simple vocabulary.
- Allocate 1-3 marks per question depending on complexity.
- Number questions sequentially from 1 regardless of field names.`;

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Anthropic error:", data.error);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
        status: 500, headers: corsHeaders,
      });
    }

    const text = data.content?.[0]?.text || "";

    // Parse JSON from response
    let feedback;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Could not parse feedback." };
    } catch {
      feedback = { error: "Could not parse feedback. Please try again." };
    }

    return new Response(JSON.stringify(feedback), { headers: corsHeaders });

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
