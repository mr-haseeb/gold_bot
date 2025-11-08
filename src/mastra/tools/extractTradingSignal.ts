import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Tool to extract trading signals from Telegram messages using Gemini AI
 * 
 * This tool parses forex trading signals in various formats and extracts:
 * - Trading symbol (e.g., XAUUSD, EURUSD)
 * - Action (BUY or SELL)
 * - Entry price or range
 * - Stop Loss (SL)
 * - Take Profit levels (TP1, TP2, TP3, etc.)
 */
export const extractTradingSignal = createTool({
  id: "extract-trading-signal",
  
  description:
    "Extracts structured forex trading signal data from unstructured Telegram messages using Gemini AI. Identifies symbol, buy/sell action, entry price, stop loss, and take profit levels.",
  
  inputSchema: z.object({
    message: z.string().describe("Raw Telegram message containing trading signal"),
  }),
  
  outputSchema: z.object({
    symbol: z.string().describe("Trading symbol (e.g., XAUUSD, EURUSD)"),
    action: z.enum(["BUY", "SELL"]).describe("Trading action"),
    entryPrice: z.string().describe("Entry price or price range"),
    stopLoss: z.string().describe("Stop loss price"),
    takeProfitLevels: z.array(z.string()).describe("Array of take profit levels"),
    rawExtraction: z.string().describe("Full extraction details from Gemini"),
  }),
  
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [extractTradingSignal] Starting extraction", { 
      messageLength: context.message.length 
    });

    if (!process.env.GEMINI_API_KEY) {
      logger?.error("❌ [extractTradingSignal] GEMINI_API_KEY not found");
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      logger?.info("📝 [extractTradingSignal] Calling Gemini API...");

      // Craft a precise prompt for signal extraction
      const prompt = `You are a forex trading signal parser. Extract the trading information from the following message and return it in JSON format.

Message:
${context.message}

Extract the following information:
1. symbol: The trading pair (e.g., XAUUSD, EURUSD, Gold). Convert common names like "Gold" to "XAUUSD".
2. action: Either "BUY" or "SELL"
3. entryPrice: The entry price or price range (if range like "4021-4014", keep as is)
4. stopLoss: The stop loss (SL) price
5. takeProfitLevels: Array of take profit (TP) levels as strings

Return ONLY valid JSON in this exact format:
{
  "symbol": "XAUUSD",
  "action": "BUY",
  "entryPrice": "4021",
  "stopLoss": "4013",
  "takeProfitLevels": ["4024", "4027"]
}`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      logger?.info("✅ [extractTradingSignal] Gemini response received", { 
        responseLength: text.length 
      });

      // Parse the JSON response
      // Remove markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "");
      }
      
      const parsed = JSON.parse(jsonText.trim());
      
      logger?.info("✅ [extractTradingSignal] Successfully extracted signal", {
        symbol: parsed.symbol,
        action: parsed.action,
      });

      return {
        symbol: parsed.symbol,
        action: parsed.action,
        entryPrice: parsed.entryPrice,
        stopLoss: parsed.stopLoss,
        takeProfitLevels: parsed.takeProfitLevels,
        rawExtraction: text,
      };
    } catch (error) {
      logger?.error("❌ [extractTradingSignal] Extraction failed", { error });
      throw new Error(`Failed to extract trading signal: ${error}`);
    }
  },
});
