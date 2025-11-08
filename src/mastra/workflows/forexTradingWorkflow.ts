import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { extractTradingSignal } from "../tools/extractTradingSignal";
import { executeMT5Trade } from "../tools/executeMT5Trade";

/**
 * Forex Trading Workflow
 * 
 * This workflow processes Telegram messages containing trading signals
 * and executes them on MetaTrader 5 using Gemini AI.
 * 
 * WORKFLOW STEPS:
 * 1. Extract trading signal from message using Gemini AI
 * 2. Execute the trade on MetaTrader 5
 * 3. Format and return results
 */

/**
 * Step 1: Extract Trading Signal
 * Uses Gemini AI to parse the trading signal from Telegram message
 */
const extractSignal = createStep({
  id: "extract-signal",
  description: "Extracts trading parameters from Telegram message using Gemini AI",
  
  inputSchema: z.object({
    threadId: z.string().describe("Unique thread ID for this conversation"),
    userName: z.string().describe("Telegram username who sent the message"),
    message: z.string().describe("Trading signal message from Telegram"),
  }),
  
  outputSchema: z.object({
    userName: z.string(),
    symbol: z.string(),
    action: z.enum(["BUY", "SELL"]),
    entryPrice: z.string(),
    stopLoss: z.string(),
    takeProfitLevels: z.array(z.string()),
    extractionSuccess: z.boolean(),
  }),
  
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [extractSignal] Starting signal extraction", {
      userName: inputData.userName,
      messagePreview: inputData.message.substring(0, 100),
    });

    try {
      // Call the extractTradingSignal tool directly
      const result = await extractTradingSignal.execute({
        context: { message: inputData.message },
        mastra,
        runtimeContext: {},
      });

      logger?.info("✅ [extractSignal] Signal extracted successfully", {
        symbol: result.symbol,
        action: result.action,
      });

      return {
        userName: inputData.userName,
        symbol: result.symbol,
        action: result.action,
        entryPrice: result.entryPrice,
        stopLoss: result.stopLoss,
        takeProfitLevels: result.takeProfitLevels,
        extractionSuccess: true,
      };
    } catch (error) {
      logger?.error("❌ [extractSignal] Extraction failed", { error });
      
      // Return default values on error
      return {
        userName: inputData.userName,
        symbol: "ERROR",
        action: "BUY" as const,
        entryPrice: "0",
        stopLoss: "0",
        takeProfitLevels: [],
        extractionSuccess: false,
      };
    }
  },
});

/**
 * Step 2: Execute Trade on MT5
 * Sends the extracted signal to MetaTrader 5
 */
const executeTradeOnMT5 = createStep({
  id: "execute-trade",
  description: "Executes the extracted trading signal on MetaTrader 5",
  
  inputSchema: z.object({
    userName: z.string(),
    symbol: z.string(),
    action: z.enum(["BUY", "SELL"]),
    entryPrice: z.string(),
    stopLoss: z.string(),
    takeProfitLevels: z.array(z.string()),
    extractionSuccess: z.boolean(),
  }),
  
  outputSchema: z.object({
    userName: z.string(),
    symbol: z.string(),
    action: z.string(),
    tradeDetails: z.string(),
    success: z.boolean(),
  }),
  
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    
    // Skip execution if extraction failed
    if (!inputData.extractionSuccess) {
      logger?.warn("⚠️ [executeTradeOnMT5] Skipping execution - extraction failed");
      return {
        userName: inputData.userName,
        symbol: inputData.symbol,
        action: inputData.action,
        tradeDetails: "Trade execution skipped due to signal extraction failure",
        success: false,
      };
    }

    logger?.info("🚀 [executeTradeOnMT5] Executing trade", {
      symbol: inputData.symbol,
      action: inputData.action,
    });

    try {
      // Call the executeMT5Trade tool directly
      const result = await executeMT5Trade.execute({
        context: {
          symbol: inputData.symbol,
          action: inputData.action,
          entryPrice: inputData.entryPrice,
          stopLoss: inputData.stopLoss,
          takeProfitLevels: inputData.takeProfitLevels,
          volume: 0.01, // Default lot size
        },
        mastra,
        runtimeContext: {},
      });

      logger?.info("✅ [executeTradeOnMT5] Trade executed successfully");

      return {
        userName: inputData.userName,
        symbol: inputData.symbol,
        action: inputData.action,
        tradeDetails: result.tradeDetails,
        success: result.success,
      };
    } catch (error) {
      logger?.error("❌ [executeTradeOnMT5] Trade execution failed", { error });
      
      return {
        userName: inputData.userName,
        symbol: inputData.symbol,
        action: inputData.action,
        tradeDetails: `Trade execution failed: ${error}`,
        success: false,
      };
    }
  },
});

/**
 * Step 3: Format and Log Results
 */
const formatResults = createStep({
  id: "format-results",
  description: "Formats the trading signal processing results and logs them",
  
  inputSchema: z.object({
    userName: z.string(),
    symbol: z.string(),
    action: z.string(),
    tradeDetails: z.string(),
    success: z.boolean(),
  }),
  
  outputSchema: z.object({
    summary: z.string(),
    formattedOutput: z.string(),
    success: z.boolean(),
  }),
  
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📤 [formatResults] Formatting results...");

    const formattedOutput = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 FOREX TRADING SIGNAL PROCESSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Telegram User: ${inputData.userName}
${inputData.success ? "✅" : "❌"} Status: ${inputData.success ? "Success" : "Failed"}
📈 Symbol: ${inputData.symbol}
🔄 Action: ${inputData.action}

📝 Trade Details:
${inputData.tradeDetails}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    logger?.info(formattedOutput);
    logger?.info("✅ [formatResults] Results formatted and logged");

    return {
      summary: `Processed ${inputData.action} signal for ${inputData.symbol} from ${inputData.userName}: ${inputData.success ? "Success" : "Failed"}`,
      formattedOutput,
      success: inputData.success,
    };
  },
});

/**
 * Create the Forex Trading Workflow
 * This workflow uses Gemini AI directly through tools (no OpenAI needed!)
 */
export const forexTradingWorkflow = createWorkflow({
  id: "forex-trading-workflow",
  
  inputSchema: z.object({
    threadId: z.string().describe("Unique thread ID for this conversation"),
    userName: z.string().describe("Telegram username who sent the message"),
    message: z.string().describe("Trading signal message from Telegram"),
  }) as any,
  
  outputSchema: z.object({
    summary: z.string(),
    formattedOutput: z.string(),
    success: z.boolean(),
  }),
})
  .then(extractSignal as any)
  .then(executeTradeOnMT5 as any)
  .then(formatResults as any)
  .commit();
