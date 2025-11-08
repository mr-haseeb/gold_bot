import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { forexTradingAgent } from "../agents/forexTradingAgent";

/**
 * Forex Trading Workflow
 * 
 * This workflow processes Telegram messages containing trading signals
 * and executes them on MetaTrader 5.
 * 
 * WORKFLOW STEPS:
 * 1. Process trading signal using the Forex Trading Agent
 * 2. Return the execution results
 */

/**
 * Step 1: Process Trading Signal with Agent
 * The agent will extract the signal and execute the trade
 */
const processTradingSignal = createStep({
  id: "process-trading-signal",
  description: "Processes Telegram trading signal and executes trade on MT5 using AI agent",
  
  inputSchema: z.object({
    threadId: z.string().describe("Unique thread ID for this conversation"),
    userName: z.string().describe("Telegram username who sent the message"),
    message: z.string().describe("Trading signal message from Telegram"),
  }),
  
  outputSchema: z.object({
    agentResponse: z.string().describe("Agent's response about signal processing"),
    userName: z.string().describe("Username who sent the signal"),
    success: z.boolean().describe("Whether processing was successful"),
  }),
  
  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [processTradingSignal] Starting signal processing", {
      userName: inputData.userName,
      messagePreview: inputData.message.substring(0, 100),
    });

    try {
      // Construct the prompt for the agent
      const prompt = `
Process this forex trading signal from Telegram user ${inputData.userName}:

${inputData.message}

Please:
1. Extract the trading parameters (symbol, action, entry, SL, TPs)
2. Execute the trade on MetaTrader 5
3. Confirm the details
`;

      logger?.info("📝 [processTradingSignal] Calling forex trading agent...");

      // Call the agent using generateLegacy for SDK v4 compatibility
      const response = await forexTradingAgent.generateLegacy(
        [{ role: "user", content: prompt }],
        {
          resourceId: "telegram-trading-bot",
          threadId: inputData.threadId,
          maxSteps: 5, // Allow the agent to use multiple tools
        }
      );

      logger?.info("✅ [processTradingSignal] Agent processing complete", {
        responseLength: response.text.length,
      });

      return {
        agentResponse: response.text,
        userName: inputData.userName,
        success: true,
      };
    } catch (error) {
      logger?.error("❌ [processTradingSignal] Processing failed", { error });
      
      return {
        agentResponse: `Failed to process trading signal: ${error}`,
        userName: inputData.userName,
        success: false,
      };
    }
  },
});

/**
 * Step 2: Format and Log Results
 */
const formatResults = createStep({
  id: "format-results",
  description: "Formats the trading signal processing results and logs them",
  
  inputSchema: z.object({
    agentResponse: z.string(),
    userName: z.string(),
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

🤖 Agent Response:
${inputData.agentResponse}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    logger?.info(formattedOutput);
    logger?.info("✅ [formatResults] Results formatted and logged");

    return {
      summary: `Processed trading signal from ${inputData.userName}: ${inputData.success ? "Success" : "Failed"}`,
      formattedOutput,
      success: inputData.success,
    };
  },
});

/**
 * Create the Forex Trading Workflow
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
  .then(processTradingSignal as any)
  .then(formatResults as any)
  .commit();
