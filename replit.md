# ChatBot Chapi - Asistente Virtual de Tránsito

## Overview
ChatBot Chapi is a specialized virtual assistant for traffic and mobility inquiries in Ecuador. It provides information about traffic violations, fines, license points, and road regulations based on COIP (Código Orgánico Integral Penal) and LOTTTSV (Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial).

## Current State
- **Design Phase**: Complete - Professional chat interface with Material Design principles
- **Backend**: Implemented with OpenAI GPT-4 integration
- **Frontend**: React SPA with real-time chat functionality
- **AI System**: Comprehensive prompt system with Ecuador traffic law knowledge base

## Recent Changes (October 29, 2025)
- Created complete frontend design with Chapi mascot avatar and welcome screen
- Implemented backend API routes for chat processing (`/api/chat`, `/api/chat/history`)
- Built AI prompt system with detailed COIP/LOTTTSV knowledge
- Connected frontend to backend with real-time OpenAI-powered responses
- Added conversation history tracking for contextual responses
- Implemented theme toggle (light/dark mode)

## Project Architecture

### Frontend (`client/`)
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS + Shadcn UI components
- **State Management**: React hooks with local state
- **Key Components**:
  - `ChatHeader`: Top bar with Chapi branding
  - `ChatMessage`: Message bubbles for user/bot
  - `ChatInput`: Text input with send functionality
  - `WelcomeScreen`: Initial greeting with quick action chips
  - `TypingIndicator`: Animated dots during bot processing
  - `VerificationPrompt`: Clarification buttons
  - `ThemeToggle`: Light/dark mode switcher

### Backend (`server/`)
- **Framework**: Express.js
- **AI Integration**: OpenAI GPT-4o-mini
- **Storage**: In-memory storage (MemStorage)
- **Key Files**:
  - `routes.ts`: API endpoints for chat
  - `lib/chapi-ai.ts`: OpenAI integration with traffic law prompt system
  - `storage.ts`: Message persistence interface

### Shared (`shared/`)
- **Schema**: Drizzle ORM schemas for User and ChatMessage types
- **Validation**: Zod schemas for API request/response validation

## Conversational Flow
1. **Welcome**: Chapi introduces itself on first interaction
2. **Query Processing**: User asks traffic-related questions
3. **AI Response**: OpenAI processes query with traffic law knowledge
4. **Verification**: Bot asks if response was clear
5. **Farewell**: Friendly goodbye with safety reminder

## Traffic Law Knowledge Base
- Speed limits (urban, school zones, highways)
- License points system (30 points starting, penalties by severity)
- Common fines (in % of SBU - Salario Básico Unificado)
- Traffic violations and penalties
- Parking regulations
- COIP and LOTTTSV article references

## API Endpoints
- `POST /api/chat` - Send message and get AI response
  - Request: `{ message: string, conversationHistory?: Array }`
  - Response: `{ response: string, success: boolean }`
- `GET /api/chat/history` - Retrieve conversation history

## Environment Variables
- `OPENAI_API_KEY` - Required for AI responses

## Design System
- **Colors**: Blue primary (#2B7DD6), professional card backgrounds
- **Typography**: Roboto (sans), Roboto Mono (code/legal refs)
- **Tone**: Friendly, educational, formal, safety-focused
- **Language**: Spanish (Ecuador)

## User Preferences
- Prefers Material Design for government civic services
- Emphasizes clarity, trust, and accessibility
- Amigable tone balanced with professional authority
