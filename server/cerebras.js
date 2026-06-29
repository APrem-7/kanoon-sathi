import Cerebras from "@cerebras/cerebras_cloud_sdk";

// Initialize the Cerebras client
// Note: It will automatically look for process.env.CEREBRAS_API_KEY
const client = new Cerebras();

const PROMPT_TEMPLATE = `You are an expert legal document analyst. 
Extract structured information from the following Indian legal document OCR text.

Note: The OCR text may belong to a single legal document OR it may be a merged text of multiple chronological deeds representing a title chain of ownership transfers over time.

You MUST extract:
1. document_type (e.g. "Sale Deed", or "Unified Title Chain" if multiple chronological deeds are detected)
2. summary (a concise AI summary. If multiple deeds are present, write a unified 3-4 sentence summary tracing the complete chain of ownership transfers from the earliest historical seller to the final buyer.)
3. seller (object with "name" and optional "address". If multiple deeds, set as the earliest/initial seller in the entire chain.)
4. buyer (object with "name" and optional "address". If multiple deeds, set as the final/latest buyer in the entire chain.)
5. property (object with location details, area, survey numbers. If multiple deeds, compile a consolidated description of the asset.)
6. registration (object with details if available. If multiple deeds, set as the registration details of the LATEST deed in the chain.)
7. saleAmount (string or number representing the consideration amount. If multiple deeds, set as the consideration of the LATEST deed.)
8. timeline (array of objects with "date" and "event" description covering all transactions and events across all deeds in chronological order.)
9. deeds (array of objects representing each deed in the chain chronologically. If only a single deed, this array can have just one item. Each object must have "date", "seller" (object with "name" and optional "address"), "buyer" (object with "name" and optional "address"), "saleAmount" (string or number), and "registration" (object with "regNo", "office", "date", "year")).
10. relationships (array of objects with "source", "target", and "label" describing how entities relate. Use lowercase IDs for source/target, e.g. "seller", "property", "buyer").

CRITICAL FORMATTING REQUIREMENTS:
- Output MUST be valid, parseable RFC 8259 JSON.
- Every key and property name in the JSON MUST be enclosed in double quotes (e.g. "name", NOT 'name' or name).
- Every string value MUST be enclosed in double quotes.
- If a string value contains double quotes internally, you MUST escape them with a backslash (e.g., "Plot No. 12 (\\\"Private Property\\\")").
- Do NOT include any trailing commas after the last property in an object or the last element in an array.
- Do NOT wrap the JSON in markdown code blocks (e.g. \`\`\`json ... \`\`\`).
- Output ONLY the raw JSON object. Do not add any introduction, explanations, or backticks.

DOCUMENT TEXT:
===
{OCR_TEXT}
===`;

/**
 * Robustly pre-processes LLM response to clean common JSON syntax errors.
 */
function cleanJSONString(str) {
  if (!str) return '';
  
  let cleaned = str.trim();
  
  // Strip markdown code block markers
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  
  // Remove trailing commas inside arrays and objects
  cleaned = cleaned.replace(/,\s*\]/g, ']');
  cleaned = cleaned.replace(/,\s*\}/g, '}');
  
  return cleaned;
}

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
    const cleanedContent = cleanJSONString(content);
    
    // Attempt to parse the JSON
    const parsedJSON = JSON.parse(cleanedContent);
    return parsedJSON;
  } catch (error) {
    console.error("[CEREBRAS ERROR] Failed to analyze document:", error);
    throw error;
  }
}
