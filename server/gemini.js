import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

// ─────────────────────────────────────────────────────────────────────────────
// Client — initialised once at module load
// GEMINI_API_KEY must be set in server/.env
// ─────────────────────────────────────────────────────────────────────────────
const MODEL = 'gemini-3.6-flash';

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// ─────────────────────────────────────────────────────────────────────────────
// PASS 1 PROMPT — THE SORTER
//
// Ultra-minimal. Only job: identify distinct properties and extract the
// verbatim deed text that belongs to each one.
//
// The model MUST NOT produce any summaries, timelines, or analysis.
// This prompt is intentionally short so it's harder for the model to drift.
// ─────────────────────────────────────────────────────────────────────────────
const SORTER_PROMPT = `You are a real-estate legal text extractor specialising in Indian property deeds.

The text below is raw OCR output from one or more legal deeds (sale deeds, gift deeds, etc.).

YOUR ONLY JOB:
1. Identify every DISTINCT physical property in the text.
   A property is distinct when it has a different Survey Number, Gat Number, Khasra Number, Khata Number, or Plot Number.
   Do NOT treat deeds as the same property just because their dates are sequential or their parties overlap.
2. For each distinct property, copy VERBATIM all portions of the text that describe or relate to that property into the "extractedTextForThisProperty" field.

RULES:
- Two deeds belong to the SAME property ONLY if they share the exact same Survey/Gat/Plot number AND the same village/locality.
- If all deeds belong to one property, return exactly one array element.
- If deeds belong to N distinct properties, return exactly N array elements.
- The "propertyIdentifier" field must be the most specific identifier found (e.g. "Survey No. 2090/2, Hadapsar" or "Plot No. 627, Whitefield").
- Do NOT summarise, analyse, or paraphrase. Copy text verbatim into extractedTextForThisProperty.

Return ONLY a JSON array matching this exact schema — no other text:
[
  {
    "propertyId": "1",
    "propertyIdentifier": "<Survey/Plot/Gat number + village>",
    "extractedTextForThisProperty": "<full verbatim OCR text for this property only>"
  }
]

OCR TEXT:
===
{OCR_TEXT}
===`;

// ─────────────────────────────────────────────────────────────────────────────
// PASS 2 PROMPT — THE SYNTHESIZER
//
// Receives ONLY the isolated text for one property.
// Cross-property hallucination is architecturally impossible — the model
// cannot reference text it was never given.
// ─────────────────────────────────────────────────────────────────────────────
const SYNTHESIZER_PROMPT = `You are an expert Indian legal document analyst.

The text below contains one or more deeds that ALL belong to the SAME physical property.
They may form a title chain — a chronological sequence of ownership transfers.

Extract ALL of the following and return as a single JSON object. 
You MUST thoroughly scan the text for any mention of financial liabilities, banks, mortgages, hypothecations, or outstanding debts tied to the property or the transaction parties.

1. "document_type" — "Sale Deed" for a single deed, "Unified Title Chain" for multiple deeds.
2. "summary" — A concise 3-4 sentence narrative tracing ownership from the earliest seller to the final buyer.
3. "seller" — { "name": string, "address": string } — the EARLIEST seller in the chain.
4. "buyer"  — { "name": string, "address": string } — the FINAL buyer in the chain.
5. "property" — { "location": string, "surveyNo": string, "area": string, "boundaries": string }.
6. "registration" — { "regNo": string, "office": string, "date": string, "year": string } — LATEST deed's registration.
7. "saleAmount" — string — consideration amount of the LATEST deed.
8. "timeline" — array of { "date": string, "event": string } covering ALL transactions in chronological order.
9. "deeds" — array in chronological order, each: {
     "date": string,
     "seller": { "name": string, "address": string },
     "buyer":  { "name": string, "address": string },
     "saleAmount": string,
     "registration": { "regNo": string, "office": string, "date": string, "year": string }
   }.
10. "relationships" — array of { "source": string, "target": string, "label": string }.
    Use lowercase IDs: "seller", "property", "buyer", "registration".
11. "anomalies" — array of financial anomalies, encumbrances, or debts. Each object must be:
    {
      "type": "Loan" | "Mortgage" | "Tax Lien" | "Other Debt",
      "details": "string (detailed description of the liability)",
      "status": "Active" | "Discharged" | "Unclear",
      "mentionedInDeed": "string (name or date of the document where this was found)"
    }
    If no anomalies are found, return an empty array [].

Return ONLY the raw JSON object. No markdown, no explanation, no extra keys.

DEED TEXT (single property only):
===
{OCR_TEXT}
===`;

// ─────────────────────────────────────────────────────────────────────────────
// Utility: robustly clean common LLM JSON output issues
// ─────────────────────────────────────────────────────────────────────────────
function cleanJSON(str) {
  if (!str) return '';
  let s = str.trim();
  // Strip markdown fences if present despite responseMimeType
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  // Remove trailing commas
  s = s.replace(/,(\s*[}\]])/g, '$1');
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility: single Gemini call with JSON output mode
// ─────────────────────────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,   // deterministic extraction
    },
  });
  const raw = response.text ?? '';
  return JSON.parse(cleanJSON(raw));
}

// ─────────────────────────────────────────────────────────────────────────────
// PASS 1 — THE SORTER  (AI Call #1)
//
// Returns: Array<{ propertyId, propertyIdentifier, extractedTextForThisProperty }>
//
// If the model fails or returns a malformed response, falls back to a single
// group containing the full OCR text so the pipeline never hard-crashes.
// ─────────────────────────────────────────────────────────────────────────────
async function runSorter(ocrText) {
  const text = ocrText.substring(0, 40000); // Gemini Flash has large context — use it
  console.log(`\n[PASS 1 — SORTER] Sending ${text.length} chars to ${MODEL}...`);

  const prompt = SORTER_PROMPT.replace('{OCR_TEXT}', text);

  let groups;
  try {
    const result = await callGemini(prompt);

    // The model should return a JSON array directly
    if (Array.isArray(result)) {
      groups = result;
    } else if (result.properties && Array.isArray(result.properties)) {
      // Gracefully handle if model wraps in an object
      groups = result.properties;
    } else {
      throw new Error('Sorter response is not a JSON array');
    }

    if (groups.length === 0) throw new Error('Sorter returned an empty array');

    console.log(`[PASS 1 — SORTER] ✅ Identified ${groups.length} distinct property group(s):`);
    groups.forEach(g =>
      console.log(`  → propertyId=${g.propertyId} | identifier="${g.propertyIdentifier}" | text length=${(g.extractedTextForThisProperty || '').length}`)
    );

    return groups;

  } catch (err) {
    console.error(`[PASS 1 — SORTER] ❌ Failed: ${err.message} — falling back to single-group mode`);
    return [{
      propertyId: '1',
      propertyIdentifier: 'Property (auto-detected)',
      extractedTextForThisProperty: ocrText,
    }];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASS 2 — THE SYNTHESIZER  (AI Call per property)
//
// Receives ONE group from Pass 1. The model only ever sees the text for that
// specific property — cross-contamination is architecturally impossible.
//
// Returns the assembled property result object.
// ─────────────────────────────────────────────────────────────────────────────
async function runSynthesizerForGroup(group, idx) {
  const { propertyId, propertyIdentifier, extractedTextForThisProperty } = group;

  const text = (extractedTextForThisProperty || '').substring(0, 30000);
  console.log(`[PASS 2 — SYNTHESIZER] Analyzing group ${propertyId} ("${propertyIdentifier}") | ${text.length} chars...`);

  const prompt = SYNTHESIZER_PROMPT.replace('{OCR_TEXT}', text);
  const analysis = await callGemini(prompt);

  return {
    propertyId: `prop-${propertyId}`,
    propertyName: propertyIdentifier || `Property ${idx + 1}`,
    propertyIdentifiers: {
      surveyNo: analysis.property?.surveyNo || '',
      plotNo: '',
      khasraNo: '',
      village: analysis.property?.location || '',
      district: '',
    },
    rawOcrText: extractedTextForThisProperty || '',  // kept for Raw OCR tab passthrough
    ...analysis,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — Two-Pass Pipeline
//
// Returns: { properties: [ { propertyId, propertyName, summary, ... }, ... ] }
//
// Flow:
//   1. Pass 1 (Sorter): one Gemini call → array of isolated text groups
//   2. Pass 2 (Synthesizer): one Gemini call PER group, run concurrently
//      via Promise.all for minimum latency
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeLegalDocument(ocrText) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
  }

  // ── PASS 1: Sorter ──────────────────────────────────────────────────────────
  const groups = await runSorter(ocrText);

  // ── PASS 2: Synthesizer — parallel calls, one per property ──────────────────
  console.log(`\n[PASS 2 — SYNTHESIZER] Starting ${groups.length} parallel synthesis call(s)...`);

  const settledResults = await Promise.allSettled(
    groups.map((group, idx) => runSynthesizerForGroup(group, idx))
  );

  const properties = settledResults.map((result, idx) => {
    if (result.status === 'fulfilled') {
      console.log(`[PASS 2 — SYNTHESIZER] ✅ Group ${groups[idx].propertyId} complete.`);
      return result.value;
    } else {
      console.error(`[PASS 2 — SYNTHESIZER] ❌ Group ${groups[idx].propertyId} failed: ${result.reason?.message}`);
      const g = groups[idx];
      return {
        propertyId: `prop-${g.propertyId}`,
        propertyName: g.propertyIdentifier || `Property ${idx + 1}`,
        propertyIdentifiers: { surveyNo: '', plotNo: '', khasraNo: '', village: '', district: '' },
        rawOcrText: g.extractedTextForThisProperty || '',
        document_type: 'Analysis Failed',
        summary: `Analysis failed: ${result.reason?.message || 'Unknown error'}`,
        seller: {}, buyer: {}, property: {}, registration: {},
        saleAmount: null, timeline: [], deeds: [], relationships: [], anomalies: [],
      };
    }
  });

  console.log(`\n[PIPELINE] ✅ Complete — ${properties.length} property group(s) returned.\n`);
  return { properties };
}
