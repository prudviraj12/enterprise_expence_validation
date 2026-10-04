import { config } from "../config.js";

export type ReceiptAnalysis = {
  extracted: Record<string, unknown>;
  ocrConfidence: number;
  verificationConfidence: number;
  decision: string;
  reason: string;
  recommendation: string;
  imageHash: string;
  flags: Array<{ type: string; classification: string; score: number; details: Record<string, unknown> }>;
};

export async function analyzeReceipt(file: Buffer, mimeType: string): Promise<ReceiptAnalysis> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(file)], { type: mimeType }), "receipt");
  const response = await fetch(`${config.AI_SERVICE_URL}/analyze`, { method: "POST", body: form });
  if (!response.ok) throw new Error(`AI service returned ${response.status}.`);
  return response.json() as Promise<ReceiptAnalysis>;
}

export async function categorizeExpense(input: {
  title: string;
  description?: string;
  merchant?: string;
}): Promise<{ category: string; explanation: string }> {
  if (!config.OPENAI_API_KEY) return { category: "Other", explanation: "AI categorization is not configured." };
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Classify the expense into Travel, Meals, Lodging, Supplies, or Other. Return JSON with category and explanation." },
        { role: "user", content: JSON.stringify(input) }
      ]
    })
  });
  if (!response.ok) throw new Error(`OpenAI API returned ${response.status}.`);
  const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned no categorization.");
  return JSON.parse(content) as { category: string; explanation: string };
}
