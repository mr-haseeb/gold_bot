# Gold Trading Bot

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![License](https://img.shields.io/github/license/mr-haseeb/gold_bot?style=flat)

An automated trading bot for gold (XAU/USD) built with TypeScript. Monitors market data, applies trading strategies, and executes buy/sell signals automatically.

---

## Features

- Real-time gold price monitoring (XAU/USD)
- Configurable trading strategies with entry/exit rules
- Automated order execution
- Risk management — stop-loss and take-profit controls
- Trade logging and performance tracking
- TypeScript for full type safety

---

## Getting Started

```bash
git clone https://github.com/mr-haseeb/gold_bot.git
cd gold_bot
npm install
```

Configure your API credentials:

```bash
cp .env.example .env
# Edit .env with your broker/exchange API keys
```

Run the bot:

```bash
npm run dev     # development mode with hot reload
npm run build   # compile TypeScript
npm start       # run compiled build
```

---

## Configuration

Edit `.env` to set:

```
API_KEY=your_api_key
API_SECRET=your_api_secret
SYMBOL=XAUUSD
LOT_SIZE=0.01
STOP_LOSS_PIPS=50
TAKE_PROFIT_PIPS=100
```

---

## Stack

- **TypeScript** — type-safe business logic
- **Node.js** — runtime
- **WebSocket** — real-time price feeds

---

## Disclaimer

This bot is for educational purposes. Trading financial instruments involves risk. Use in live markets at your own discretion.

---

## Author

**Haseeb Shinwari** — [LinkedIn](https://www.linkedin.com/in/mr-haseeb/) · [GitHub](https://github.com/mr-haseeb) · [Stack Overflow](https://stackoverflow.com/users/10900548/haseeb)

MS Computer Science @ San Francisco Bay University
