import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ExtractedItem {
  itemName: string;
  packing?: string;
  company?: string;
  purchaseRate: number;
  mrp: number;
  qty: number;
  batchNo?: string;
  expiryDate?: string;
}

const SYSTEM_EXTRACTION_PROMPT = `
Role: You are an automated invoice/bill data extraction tool. Your task is to scan the uploaded document (Image or PDF) and accurately extract all invoice line items and products into a structured JSON array for database import.

Extraction Fields for each item:
- "itemName": (String - Product name or description)
- "packing": (String - e.g. 5 kg, 1 kg, 500 ml, 10x10, Box of 10. If missing, use "")
- "company": (String - Manufacturer or brand e.g. ITC, Cipla, Tata. If missing, use "")
- "purchaseRate": (Numeric - Wholesale/purchase price/rate per unit. Remove currency symbols & commas. If missing, use 0)
- "mrp": (Numeric - Maximum Retail Price. Remove currency symbols & commas. If missing, use 0)
- "qty": (Numeric - Quantity purchased or billed. If missing, use 1)
- "batchNo": (String - Batch number if present, else "")
- "expiryDate": (String - Expiry date if present e.g. YYYY-MM, else "")

Instructions:
1. Locate the product table or list in the document.
2. Extract all rows accurately. Cleanse numeric values by removing symbols (₹, $, commas).
3. If a field is missing, supply "" or 0 without shifting columns.
4. Output strictly a JSON array of objects without conversational markdown or commentary.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileBase64, mimeType, apiKey: clientApiKey } = body;

    if (!fileBase64 || !mimeType) {
      return NextResponse.json(
        { error: "File data (base64) and mimeType are required." },
        { status: 400 },
      );
    }

    const apiKey =
      clientApiKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEY",
          message:
            "A Google Gemini API key is required to scan images and PDFs. Please provide your free Gemini API key or upload an Excel/CSV file instead.",
        },
        { status: 400 },
      );
    }

    // Attempt generation with available Gemini models
    const models = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

    let lastError: any = null;
    let responseText = "";

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: fileBase64,
                  },
                },
                {
                  text: SYSTEM_EXTRACTION_PROMPT,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          lastError = new Error(
            `Model ${model} returned ${res.status}: ${errText}`,
          );
          continue; // Try next model fallback
        }

        const data = await res.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          responseText = candidate;
          break; // Successfully got response
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!responseText) {
      return NextResponse.json(
        {
          error: "EXTRACTION_FAILED",
          message:
            lastError?.message ||
            "Unable to extract items from this document. Please verify the API key or try an Excel/CSV file.",
        },
        { status: 500 },
      );
    }

    // Clean JSON response (strip markdown fences if present)
    let cleaned = responseText.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to find JSON array inside text
      const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Invalid JSON structure returned by model.");
      }
    }

    const itemsRaw = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.items)
        ? parsed.items
        : Array.isArray(parsed.products)
          ? parsed.products
          : [];

    const normalizedItems: ExtractedItem[] = itemsRaw.map((it: any) => {
      const name =
        it.itemName ||
        it["Item Name"] ||
        it.name ||
        it.product ||
        it.description ||
        "Unnamed Item";

      const packing = it.packing || it.Packing || it.pack || it.unit || "";

      const company =
        it.company ||
        it["Company / Mfr"] ||
        it["Company/Mfr"] ||
        it.mfr ||
        it.manufacturer ||
        it.brand ||
        "";

      const purchaseRate =
        parseFloat(
          String(
            it.purchaseRate ??
              it["Purchase Rate (₹)"] ??
              it["Purchase Rate"] ??
              it.rate ??
              it.price ??
              0,
          ).replace(/[^0-9.]/g, ""),
        ) || 0;

      const mrp =
        parseFloat(
          String(
            it.mrp ??
              it["MRP (₹)"] ??
              it.MRP ??
              (purchaseRate > 0 ? purchaseRate * 1.25 : 0),
          ).replace(/[^0-9.]/g, ""),
        ) || 0;

      const qty =
        parseInt(
          String(it.qty ?? it.QTY ?? it.quantity ?? 1).replace(/[^0-9]/g, ""),
          10,
        ) || 1;

      const batchNo = String(
        it.batchNo ?? it["Batch No"] ?? it.batch ?? "",
      ).trim();

      const expiryDate = String(
        it.expiryDate ?? it["Expiry Date"] ?? it.expiry ?? "",
      ).trim();

      return {
        itemName: String(name).trim(),
        packing: String(packing).trim(),
        company: String(company).trim(),
        purchaseRate,
        mrp: mrp > 0 ? mrp : Math.round(purchaseRate * 1.25 * 100) / 100,
        qty: qty > 0 ? qty : 1,
        batchNo: batchNo || `BCH-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: expiryDate ? expiryDate.slice(0, 7) : "2028-12",
      };
    });

    return NextResponse.json({
      success: true,
      count: normalizedItems.length,
      items: normalizedItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "SERVER_ERROR",
        message: error?.message || "Internal server error",
      },
      { status: 500 },
    );
  }
}
