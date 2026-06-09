# ☕ ShopReach — AI-Native Mini CRM for BrewCraft

> Built for the Xeno Engineering Internship Assignment 2026

ShopReach is an AI-native Mini CRM that helps BrewCraft (a fictional premium coffee chain) intelligently reach its shoppers through personalised campaigns.

## 🎯 What It Does

1. **Ingests Customer & Order Data** — 200 customers with 800+ coffee orders (seeded)
2. **Smart Segmentation** — Rule-based AND AI-powered audience segmentation
3. **Campaign Management** — Create & send personalised messages via WhatsApp, SMS, Email
4. **Delivery Tracking** — Real-time stats via a callback-driven channel service
5. **AI Copilot** — Natural language interface for all CRM operations

## 🏗️ Architecture

```
Frontend (React + Vite)  →  CRM Backend (Express + MongoDB)  →  Channel Service (Express)
      Vercel                        Render                           Render
```

**Two-Service Callback Loop:**
- CRM sends messages to Channel Service
- Channel Service simulates delivery and calls back CRM with status updates
- Frontend polls for real-time stat updates

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier) — [Create here](https://cloud.mongodb.com)
- Gemini API key (free) — [Get here](https://aistudio.google.com)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd Xeno

# Install all dependencies
cd server && npm install
cd ../channel-service && npm install
cd ../client && npm install
cd ..
```

### 2. Configure Environment
```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and Gemini API key

# Channel Service
cp channel-service/.env.example channel-service/.env
```

### 3. Seed Data
```bash
cd server && npm run seed
```

### 4. Start All Services
Open three terminal windows:

```bash
# Terminal 1: CRM Backend (port 5000)
cd server && npm run dev

# Terminal 2: Channel Service (port 3001)
cd channel-service && npm run dev

# Terminal 3: React Frontend (port 5173)
cd client && npm run dev
```

Visit: http://localhost:5173

## 🧠 Tech Stack & Rationale

| Layer | Tech | Why |
|---|---|---|
| Frontend | React + Vite | Fast dev, component-based UI |
| Styling | Vanilla CSS | Full design control, premium dark theme |
| Backend | Express + Node.js | Familiar, clean REST API |
| Database | MongoDB Atlas | Schema-flexible for customer data |
| AI | Google Gemini | Free tier, great for text generation |
| Deployment | Vercel + Render | Free hosting |

## 📊 Scale Assumptions & Tradeoffs

This system is designed for a **single brand with ~10K customers**. Here's what we'd change at scale:

| Current | At Scale |
|---|---|
| Direct HTTP to channel service | Message queue (RabbitMQ) |
| MongoDB for everything | Redis for real-time counters |
| Polling for campaign stats | WebSockets / SSE |
| Sync segment evaluation | Pre-computed with change streams |

## 📁 Project Structure

```
├── client/          # React frontend
├── server/          # CRM backend (Express + MongoDB)
└── channel-service/ # Stubbed channel delivery service
```
