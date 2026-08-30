import { GoogleGenAI } from "@google/genai";
import { jsonrepair } from "jsonrepair";

// Lazily initialize the Gemini client on first use, rather than at import
// time — same reasoning as cerebras.js: constructing it eagerly throws
// whenever GEMINI_API_KEY isn't set, which would crash the whole server
// before it could even start listening.
let client = null;
function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

// Same prompt/schema contract as cerebras.js's analyzeLegalDocument — the
// frontend (AISummary, OwnershipGraph, TimelineView, EntitiesView) parses
// whatever this returns assuming this exact shape, so it has to match
// regardless of which LLM provider is actually answering it.
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
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }

  // Previously truncated to the first 30,000 characters as a length
  // safeguard — that silently dropped the tail of longer title-chain
  // documents. Flash's context window (1M+ tokens) has plenty of room, so
  // the full OCR text now goes through untruncated.
  const prompt = PROMPT_TEMPLATE.replace("{OCR_TEXT}", ocrText);

  const response = await getClient().models.generateContent({
    model: "gemini-flash-latest", // alias for the current recommended Flash model — avoids pinning to a version that gets deprecated
    contents: prompt,
    config: {
      temperature: 0.1, // low temp for deterministic JSON extraction
      // Multi-deed "title chain" documents can need a large timeline/deeds
      // array — 4096 was inherited from the old Cerebras config without
      // reconsidering it, and a response cut off mid-object by hitting
      // this ceiling looks identical to a JSON syntax error at parse time.
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
    },
  });

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason === 'MAX_TOKENS') {
    console.error(`[GEMINI ERROR] Response truncated at the token limit before completing the JSON object.`);
    throw new Error('Gemini response was cut off before completing (document may be too long for a single analysis pass).');
  }

  // Actual token counts for this run, straight from the API rather than an
  // estimate — logged here and folded into the returned data so the
  // frontend can surface it instead of it being a black box.
  const usage = response.usageMetadata || {};
  const tokenUsage = {
    promptTokens: usage.promptTokenCount ?? null,
    outputTokens: usage.candidatesTokenCount ?? null,
    totalTokens: usage.totalTokenCount ?? null,
  };
  console.log(`[GEMINI] Token usage — prompt: ${tokenUsage.promptTokens}, output: ${tokenUsage.outputTokens}, total: ${tokenUsage.totalTokens}`);

  const content = response.text;
  const cleanedContent = cleanJSONString(content);

  try {
    return { ...JSON.parse(cleanedContent), tokenUsage };
  } catch (parseError) {
    // Log enough of the actual bad output to diagnose next time, rather
    // than just the generic "position N" message — that alone never says
    // *what* was at position N.
    console.error(`[GEMINI ERROR] JSON.parse failed: ${parseError.message}`);
    console.error(`[GEMINI ERROR] Raw content (first 1000 chars): ${cleanedContent.slice(0, 1000)}`);

    // Common real cause: the model left an internal quote unescaped inside
    // a string value (property descriptions, aliases in parentheses, etc.
    // are common in Indian legal documents and easy for an LLM to slip up
    // on despite the prompt's explicit escaping instructions). jsonrepair
    // handles this and several other common malformed-JSON shapes before
    // giving up for real.
    try {
      const repaired = jsonrepair(cleanedContent);
      const parsedJSON = JSON.parse(repaired);
      console.warn('[GEMINI WARN] JSON required repair to parse — output may have minor inaccuracies near the fix point.');
      return { ...parsedJSON, tokenUsage };
    } catch (repairError) {
      console.error(`[GEMINI ERROR] jsonrepair also failed: ${repairError.message}`);
      throw parseError; // surface the original, more specific parse error
    }
  }
}
