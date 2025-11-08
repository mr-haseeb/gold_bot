# Replit Mastra Agent Stack

## Overview

This is a Mastra-based agentic automation system designed for Replit's infrastructure. It enables users to build AI-powered workflows and agents using TypeScript, with durable execution via Inngest and support for various triggers including time-based and webhook-based events.

The application serves as a framework for creating autonomous agents and structured workflows that can handle complex, multi-step processes with features like memory persistence, human-in-the-loop interactions, and real-time streaming responses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Framework
- **Mastra Framework**: The primary orchestration layer providing agents, workflows, tools, and memory management
- **TypeScript/ES2022**: Modern TypeScript with ESM modules for type-safe development
- **Node.js >=20.9.0**: Runtime environment requirement

### Agent Architecture
- **Agent System**: Built on `@mastra/core` Agent class supporting both V1 (legacy) and V2 model APIs
- **Model Router**: Unified interface supporting 800+ models across 47+ providers (OpenAI, Anthropic, Google, xAI, etc.)
- **Memory System**: Three-tier memory architecture:
  - Conversation history (recent messages)
  - Semantic recall (RAG-based vector search)
  - Working memory (persistent user preferences/state)
- **Guardrails**: Input/output processors for content moderation and security
- **Agent Networks**: Multi-agent coordination via routing agents for complex task delegation

### Workflow Engine
- **Graph-Based Execution**: Workflows composed of steps with explicit control flow
- **Suspend/Resume**: Human-in-the-loop support with state persistence as snapshots
- **Error Handling**: Built-in retry mechanisms at workflow and step levels
- **Branching/Merging**: Support for parallel execution, conditional logic, and dynamic routing
- **Streaming**: Real-time incremental responses from both agents and workflows

### Durability Layer (Inngest Integration)
- **Inngest**: Provides durable execution, step memoization, and retry logic
- **Event-Driven Architecture**: Pub/sub system for workflow orchestration
- **State Persistence**: Automatic snapshot creation for workflow suspension points
- **Development Middleware**: Real-time monitoring via `@inngest/realtime`
- **Custom Integration**: Located in `src/mastra/inngest/` for Replit-specific adaptations

### Trigger System
- **Time-Based Triggers**: Scheduled workflow execution
- **Webhook Triggers**: HTTP endpoints for external service integrations
  - Pattern: `/webhooks/{connector}/action` endpoints
  - Examples: Telegram (`telegramTriggers.ts`), Slack (`slackTriggers.ts`)
  - Registration via `registerApiRoute` helper function
- **Trigger Architecture**: Each trigger passes full payloads to handlers for flexible consumption

### Memory & Storage
- **Storage Providers**: Pluggable storage backends via adapters
  - LibSQL (`@mastra/libsql`) - file-based or remote
  - PostgreSQL (`@mastra/pg`) - with pgvector extension for embeddings
  - Upstash (`@mastra/upstash`) - Redis + Vector services
- **Vector Database**: Semantic recall using embeddings (OpenAI by default)
- **Thread/Resource Scoping**: Two-level memory isolation (per-conversation or per-user)
- **Shared Storage**: Single storage instance shared across all agents via main Mastra instance

### Tool System
- **Tool Creation**: Zod-based schema validation for inputs/outputs
- **Execution Context**: Access to Mastra instance, abort signals, and runtime context
- **Tool Integration**: Tools callable from agents, workflows, and other tools
- **MCP Support**: Integration with Model Context Protocol via `@mastra/mcp`

### Logging & Observability
- **Custom Logger**: Production-ready Pino logger (`ProductionPinoLogger`) with structured JSON output
- **Log Levels**: DEBUG, INFO, WARN, ERROR support
- **Mastra Loggers**: `@mastra/loggers` package for framework-level logging

### Runtime Context
- **Request-Scoped Configuration**: Pass dynamic values (user tier, feature flags, etc.) per request
- **Type-Safe Context**: Generic typing for context values via `RuntimeContext<T>`
- **Propagation**: Context flows through agents, tools, and workflows automatically

### Replit-Specific Features
- **Playground UI**: Custom UI at `.mastra/output/playground/` for workflow visualization
  - User-only interface (agent cannot interact)
  - Workflow graph visualization with plain English node descriptions
  - Requires `.generateLegacy()` for backwards compatibility
- **Module Resolution**: Build-time resolution map at `.mastra/.build/module-resolve-map.json`
- **Auto-Refresh**: SSE-based hot reload for development

### API/Integration Layer
- **Hono Framework**: HTTP server using Hono for API routes
- **Streaming Support**: SSE (Server-Sent Events) for real-time updates
- **AI SDK Compatibility**: Optional v4 compatibility layer for Vercel AI SDK integration
- **API Route Registration**: Helper functions in `src/mastra/inngest` for webhook setup

### Development Workflow
- **Build System**: Mastra CLI (`mastra build`, `mastra dev`)
- **Type Checking**: Separate TypeScript validation (`tsc --noEmit`)
- **Code Formatting**: Prettier for consistent code style
- **Development Mode**: Live reload with `tsx` execution

## External Dependencies

### AI/ML Services
- **OpenAI**: Primary LLM provider (GPT-4o, GPT-4o-mini, etc.) via `@ai-sdk/openai`
- **Google Generative AI**: Gemini models via `@google/generative-ai` and `@ai-sdk/google`
- **OpenRouter**: Multi-provider gateway via `@openrouter/ai-sdk-provider`
- **Exa**: Search API integration via `exa-js`

### Communication Platforms
- **Slack**: Webhook integration via `@slack/web-api`
- **Telegram**: Bot API for messaging triggers
- **WhatsApp**: Business API for chat bot functionality

### Infrastructure Services
- **Inngest**: Workflow orchestration and durable execution
  - Cloud service or self-hosted
  - Dashboard for monitoring and debugging
- **Upstash**: Optional Redis and Vector database services

### Database/Storage
- **PostgreSQL**: Optional relational database with pgvector extension
- **LibSQL**: Embedded or remote SQLite-compatible database
- **Vector Databases**: For semantic search and embeddings storage

### Development Tools
- **Vercel AI SDK**: Core streaming and AI utilities (`ai` package)
- **Mastra CLI**: `mastra` package for scaffolding and development
- **Inngest CLI**: `inngest-cli` for local Inngest development server

### Monitoring & Telemetry
- **OpenTelemetry**: Auto-instrumentation for observability
  - OTLP exporters (gRPC and HTTP)
  - Node.js auto-instrumentation
  - Custom instrumentation hooks

### Runtime Environment
- **Environment Variables**: Managed via `dotenv`
- **Configuration**: Provider API keys, database URLs, webhook tokens
- **Execution**: Node.js with ESM support and TypeScript compilation