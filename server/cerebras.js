import Cerebras from "@cerebras/cerebras_cloud_sdk";

// Initialize the Cerebras client
// Note: It will automatically look for process.env.CEREBRAS_API_KEY
const client = new Cerebras();

const PROMPT_TEMPLATE = `You are an expert legal document analyst. 
Extract structured information from the following Indian legal document OCR text.

You MUST extract:
1. document_type (e.g. "Sale Deed", "Gift Deed", etc.)
2. summary (a concise 2-3 sentence AI summary of what the document is doing)
3. seller (object with "name" and optional "address")
4. buyer (object with "name" and optional "address")
5. property (object with location details, area, survey numbers)
6. registration (object with details if available)
7. saleAmount (string or number representing the consideration amount)
8. timeline (array of objects with "date" and "event" description)
9. relationships (array of objects with "source", "target", and "label" describing how entities relate. Use lowercase IDs for source/target, e.g. "seller", "property", "buyer").

IMPORTANT: Return ONLY valid JSON matching this structure. Do not wrap in markdown code blocks. Do not add any conversational text. If a field is missing, use null or an empty array.

DOCUMENT TEXT:
===
{OCR_TEXT}
===
`;

export async function analyzeLegalDocument(ocrText) {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is not configured in the environment.");
  }

  const prompt = PROMPT_TEMPLATE.replace("{OCR_TEXT}", ocrText.substring(0, 30000)); // safeguard length

  try {
    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-oss-120b",
      temperature: 0.1, // low temp for deterministic JSON extraction
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    
    // Attempt to parse the JSON
    const parsedJSON = JSON.parse(content);
    return parsedJSON;
  } catch (error) {
    console.error("[CEREBRAS ERROR] Failed to analyze document:", error);
    throw error;
  }
}
