import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { sharedPostgresStorage } from "../storage";
import { extractTradingSignal } from "../tools/extractTradingSignal";
import { executeMT5Trade } from "../tools/executeMT5Trade";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Forex Trading Agent
 * 
 * This agent processes Telegram messages containing forex trading signals,
 * extracts the trading parameters using Gemini AI, and executes trades on MetaTrader 5.
 * 
 * CAPABILITIES:
 * - Extracts structured trading data from unstructured Telegram messages
 * - Identifies symbol, action (BUY/SELL), entry price, stop loss, and take profit levels
 * - Executes trades on MetaTrader 5 platform via Python script
 * - Maintains conversation history for context
 */

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "⚠️  GEMINI_API_KEY not found. Please add it to your environment variables."
  );
}

// Configure Gemini AI
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const forexTradingAgent = new Agent({
  name: "Forex Trading Agent",
  
  instructions: `
You are a professional forex trading assistant that processes trading signals from Telegram messages.

Your responsibilities:
1. Receive trading signal messages from Telegram channels
2. Extract the trading parameters using the extractTradingSignal tool:
   - Trading symbol (e.g., XAUUSD, EURUSD, Gold)
   - Action (BUY or SELL)
   - Entry price or price range
   - Stop loss (SL)
   - Take profit levels (TP1, TP2, TP3, etc.)

3. Execute the trade on MetaTrader 5 using the executeMT5Trade tool

4. Provide clear confirmation of the extracted signal and execution status

IMPORTANT GUIDELINES:
- Always use the extractTradingSignal tool first to parse the message
- Then use the executeMT5Trade tool to execute the trade
- Handle various message formats (see examples below)
- Be precise with numerical values
- Confirm all extracted parameters before execution

EXAMPLE MESSAGE FORMATS YOU'LL HANDLE:

Format 1:
"Buy Gold @4021-4014
Sl :4013
Tp1 :4024
Tp2 :4027"

Format 2:
"XAUUSD BUY
ENTRY 4021-4014
SL 4013
TP 4024
TP 4027"

Format 3:
"XAUUSD BUY NOW 3979
SI : 3965
Tp : 3990
Tp : 4016
Tp : 4040"

Format 4:
"XAUUSD BUY ENTRY 4024.7-4018.7 SL 4016.7 TP 4026.7 TP 4028.9 TP 4031.7"

Your response should be clear and confirm what action you're taking.
`,

  // Use Gemini 1.5 Flash for fast and accurate signal extraction (compatible with generateLegacy)
  model: google("gemini-1.5-flash"),
  
  // Provide both trading tools to the agent
  tools: {
    extractTradingSignal,
    executeMT5Trade,
  },
  
  // Add memory to track trading signals and maintain context
  memory: new Memory({
    options: {
      threads: {
        generateTitle: true,
      },
      lastMessages: 20, // Keep last 20 messages for context
    },
    storage: sharedPostgresStorage,
  }),
});
