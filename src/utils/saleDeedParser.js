/**
 * Sale Deed Parser
 * Extracts structured data from OCR text of Indian sale deeds
 */

/**
 * Parse OCR text and extract sale deed information
 */
export function parseSaleDeed(text) {
  if (!text) return null;

  const result = {
    seller: extractSeller(text),
    buyer: extractBuyer(text),
    property: extractProperty(text),
    saleAmount: extractSaleAmount(text),
    stampDuty: extractStampDuty(text),
    registrationFee: extractRegistrationFee(text),
    payments: extractPayments(text),
    registration: extractRegistration(text),
    witnesses: extractWitnesses(text),
    date: extractDate(text),
    encumbrance: extractEncumbrance(text),
    rawText: text,
  };

  // Calculate confidence score
  const fields = [result.seller, result.buyer, result.property, result.saleAmount, result.registration];
  const filledFields = fields.filter(f => f && Object.values(f).some(v => v));
  result.confidence = Math.round((filledFields.length / fields.length) * 100);

  return result;
}

function extractSeller(text) {
  const patterns = [
    /SELLER[:\s]*(?:Shri|Smt\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Za-z\s.]+?)(?:,|\n|S\/o|W\/o|D\/o|residing)/i,
    /VENDOR[:\s]*(?:Shri|Smt\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Za-z\s.]+?)(?:,|\n|S\/o|W\/o|D\/o|residing)/i,
    /(?:first party|party of the first part)[:\s]*(?:Shri|Smt\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Za-z\s.]+?)(?:,|\n|S\/o|W\/o|D\/o|residing)/i,
  ];

  const name = matchFirst(text, patterns);

  // Extract father/spouse
  const relationMatch = text.match(/SELLER.*?(S\/o|W\/o|D\/o)\s+(?:Late\s+)?(?:Shri|Smt\.?)?\s*([A-Za-z\s.]+?)(?:,|\n|residing)/is);

  // Extract address
  const addressMatch = text.match(/SELLER.*?residing\s+at\s+(.+?)(?:\n.*?)?(?:\(hereinafter|\n\n)/is);

  return {
    name: name ? name.trim() : null,
    relation: relationMatch ? `${relationMatch[1]} ${relationMatch[2].trim()}` : null,
    address: addressMatch ? addressMatch[1].trim().replace(/\n/g, ', ') : null,
  };
}

function extractBuyer(text) {
  const patterns = [
    /BUYER[:\s]*(?:Shri|Smt\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Za-z\s.]+?)(?:,|\n|S\/o|W\/o|D\/o|residing)/i,
    /PURCHASER[:\s]*(?:Shri|Smt\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Za-z\s.]+?)(?:,|\n|S\/o|W\/o|D\/o|residing)/i,
    /(?:second party|party of the second part)[:\s]*(?:Shri|Smt\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Za-z\s.]+?)(?:,|\n|S\/o|W\/o|D\/o|residing)/i,
  ];

  const name = matchFirst(text, patterns);

  const relationMatch = text.match(/(?:BUYER|PURCHASER).*?(S\/o|W\/o|D\/o)\s+(?:Late\s+)?(?:Shri|Smt\.?)?\s*([A-Za-z\s.]+?)(?:,|\n|residing)/is);
  const addressMatch = text.match(/(?:BUYER|PURCHASER).*?residing\s+at\s+(.+?)(?:\n.*?)?(?:\(hereinafter|\n\n)/is);

  return {
    name: name ? name.trim() : null,
    relation: relationMatch ? `${relationMatch[1]} ${relationMatch[2].trim()}` : null,
    address: addressMatch ? addressMatch[1].trim().replace(/\n/g, ', ') : null,
  };
}

function extractProperty(text) {
  // Flat/Plot/House number
  const flatMatch = text.match(/(?:Flat|Unit|House|Shop)\s*(?:No\.?)\s*([A-Za-z0-9\-\/]+)/i);
  const plotMatch = text.match(/Plot\s*(?:No\.?)\s*([A-Za-z0-9\-\/]+)/i);
  const surveyMatch = text.match(/Survey\s*(?:No\.?)\s*([A-Za-z0-9\-\/]+)/i);

  // Area
  const builtUpMatch = text.match(/Built[\s-]*up\s*Area[:\s]*([0-9,]+(?:\.[0-9]+)?)\s*(?:sq\.?\s*(?:ft|feet|meters?|mtr))/i);
  const carpetMatch = text.match(/Carpet\s*Area[:\s]*([0-9,]+(?:\.[0-9]+)?)\s*(?:sq\.?\s*(?:ft|feet|meters?|mtr))/i);
  const areaMatch = text.match(/(?:Area|Measuring)[:\s]*([0-9,]+(?:\.[0-9]+)?)\s*(?:sq\.?\s*(?:ft|feet|meters?|mtr|yards?))/i);

  // Location details
  const floorMatch = text.match(/(\d+(?:st|nd|rd|th)?\s*Floor)/i);
  const wingMatch = text.match(/(Wing[\s-]*[A-Z])/i);
  const societyMatch = text.match(/(?:Society|Apartments?|Heights?|Towers?|Complex|Residency)[:\s]*([A-Za-z\s]+?)(?:,|\n|Plot)/i);

  // Village/Taluka/District
  const villageMatch = text.match(/Village\s+([A-Za-z\s]+?)(?:,|\n|Taluka)/i);
  const talukaMatch = text.match(/Taluka\s+([A-Za-z\s]+?)(?:,|\n|District)/i);
  const districtMatch = text.match(/District\s+([A-Za-z\s]+?)(?:,|\n|Mumbai|-|\d)/i);

  // Full address from property details section
  const locationMatch = text.match(/(?:PROPERTY\s*DETAILS|property\s*described)[:\s]*\n?([\s\S]*?)(?:\n\n|Built|Carpet|Area|SALE\s*CONSIDERATION)/i);

  return {
    flatNo: flatMatch ? flatMatch[1].trim() : null,
    plotNo: plotMatch ? plotMatch[1].trim() : null,
    surveyNo: surveyMatch ? surveyMatch[1].trim() : null,
    floor: floorMatch ? floorMatch[1].trim() : null,
    wing: wingMatch ? wingMatch[1].trim() : null,
    society: societyMatch ? societyMatch[1].trim() : null,
    builtUpArea: builtUpMatch ? builtUpMatch[1].trim() + ' sq. ft.' : null,
    carpetArea: carpetMatch ? carpetMatch[1].trim() + ' sq. ft.' : null,
    area: areaMatch ? areaMatch[1].trim() : null,
    village: villageMatch ? villageMatch[1].trim() : null,
    taluka: talukaMatch ? talukaMatch[1].trim() : null,
    district: districtMatch ? districtMatch[1].trim() : null,
    fullAddress: locationMatch ? locationMatch[1].trim().replace(/\n/g, ', ') : null,
  };
}

function extractSaleAmount(text) {
  const patterns = [
    /(?:sale\s*consideration|total\s*(?:sale\s*)?(?:consideration|amount|price))[:\s]*(?:is\s+)?(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\/-)?)/i,
    /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\/-)?)\s*\(Rupees?\s+(.+?)(?:Only|only)\)/i,
  ];

  let amount = null;
  let amountInWords = null;

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      amount = match[1].replace(/\/-$/, '').trim();
      if (match[2]) amountInWords = match[2].trim();
      break;
    }
  }

  // Try to get amount in words separately
  if (!amountInWords) {
    const wordsMatch = text.match(/\(Rupees?\s+(.+?)(?:Only|only)\)/i);
    if (wordsMatch) amountInWords = wordsMatch[1].trim();
  }

  return {
    amount: amount ? `₹${amount}` : null,
    amountInWords: amountInWords || null,
    rawAmount: amount ? parseInt(amount.replace(/,/g, '')) : null,
  };
}

function extractStampDuty(text) {
  const match = text.match(/STAMP\s*DUTY[:\s]*(?:Rs\.?|INR|₹)\s*([0-9,]+)/i);
  return match ? `₹${match[1]}` : null;
}

function extractRegistrationFee(text) {
  const match = text.match(/REGISTRATION\s*FEE[:\s]*(?:Rs\.?|INR|₹)\s*([0-9,]+)/i);
  return match ? `₹${match[1]}` : null;
}

function extractPayments(text) {
  const payments = [];
  const paymentRegex = /(\d+)\.\s*(.+?)[:\s]+(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\/-)?)\s*(?:paid\s+on\s+)?([0-9A-Za-z\s-]*?)(?:\s+via\s+(.+?))?(?:\n|$)/gi;

  let match;
  while ((match = paymentRegex.exec(text)) !== null) {
    payments.push({
      no: parseInt(match[1]),
      description: match[2].trim(),
      amount: `₹${match[3].replace(/\/-$/, '').trim()}`,
      date: match[4] ? match[4].trim() : null,
      mode: match[5] ? match[5].trim() : null,
    });
  }

  return payments;
}

function extractRegistration(text) {
  const regNoMatch = text.match(/Registration\s*No[.:\s]*([A-Za-z0-9\/\-]+)/i);
  const subRegMatch = text.match(/Sub[\s-]*Registrar[:\s]*([A-Za-z\s,]+?)(?:\n|$)/i);
  const regDateMatch = text.match(/Date\s*of\s*Registration[:\s]*([A-Za-z0-9\s,]+?)(?:\n|$)/i);

  return {
    registrationNo: regNoMatch ? regNoMatch[1].trim() : null,
    subRegistrar: subRegMatch ? subRegMatch[1].trim() : null,
    registrationDate: regDateMatch ? regDateMatch[1].trim() : null,
  };
}

function extractWitnesses(text) {
  const witnesses = [];
  const witnessSection = text.match(/WITNESS(?:ES)?[:\s]*\n?([\s\S]*?)(?:\n\n|Registration|$)/i);

  if (witnessSection) {
    const lines = witnessSection[1].split('\n');
    for (const line of lines) {
      const wMatch = line.match(/\d+\.\s*(?:Shri|Smt\.?|Mr\.?|Mrs\.?|Ms\.?)?\s*([A-Za-z\s.]+?)(?:,\s*(.+))?$/);
      if (wMatch) {
        witnesses.push({
          name: wMatch[1].trim(),
          designation: wMatch[2] ? wMatch[2].trim() : null,
        });
      }
    }
  }

  return witnesses;
}

function extractDate(text) {
  const patterns = [
    /executed\s+on\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})/i,
    /dated?\s*[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /dated?\s*[:\s]+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})/i,
  ];

  return matchFirst(text, patterns);
}

function extractEncumbrance(text) {
  const match = text.match(/ENCUMBRANCE[:\s]*(.+?)(?:\n\n|\n[A-Z]|$)/is);
  return match ? match[1].trim() : null;
}

function matchFirst(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

/**
 * Format currency in Indian numbering system
 */
export function formatINR(amount) {
  if (!amount) return '—';
  const num = typeof amount === 'string' ? parseInt(amount.replace(/[₹,]/g, '')) : amount;
  if (isNaN(num)) return amount;

  return '₹' + num.toLocaleString('en-IN');
}
