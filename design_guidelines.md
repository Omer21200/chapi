# Design Guidelines: ChatBot Chapi - Asistente Virtual de Tránsito

## Design Approach

**Selected Approach**: Design System - Material Design
**Justification**: As a government civic service tool focused on delivering legal information about traffic regulations, Chapi requires a proven, accessible design system that prioritizes clarity, readability, and trust. Material Design's structured approach to information hierarchy and interactive feedback patterns perfectly suits this utility-focused application.

**Key Design Principles**:
- Clarity First: Every element serves the purpose of clear communication
- Trust & Authority: Professional aesthetic reflecting official government service
- Approachable Professionalism: Warm but formal to match Chapi's personality
- Accessibility: High readability for all users across devices

---

## Typography

**Primary Font**: Roboto (Google Fonts)
**Secondary Font**: Roboto Mono (for legal references, article numbers)

**Hierarchy**:
- Page Title/Header: 2xl (24px), font-bold - "ChatBot Chapi"
- Bot Name/Greeting: xl (20px), font-semibold - Initial greeting messages
- User Messages: base (16px), font-medium
- Bot Response Body: base (16px), font-normal - Main conversational text
- Legal References: sm (14px), font-mono - COIP/LOTTTSV article citations
- Fine Print/Metadata: xs (12px), font-normal - Timestamps, status indicators
- CTA Buttons: sm (14px), font-semibold, uppercase tracking

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Micro spacing (gaps, padding): 2 units (0.5rem)
- Component internal padding: 4 units (1rem)
- Section spacing: 6 units (1.5rem)
- Major layout gaps: 8 units (2rem)

**Grid Structure**:
- Chat Container: max-w-4xl centered with px-4 responsive padding
- Message Bubbles: max-w-2xl to maintain optimal reading line length
- Action Buttons: Full width on mobile, auto-width on desktop with gap-4

**Responsive Breakpoints**:
- Mobile-first approach
- Desktop enhancements at md: (768px) and lg: (1024px)

---

## Component Library

### Chat Interface Components

**Header Bar**:
- Fixed top position with subtle elevation shadow
- Contains: Chapi logo/icon (left), "ChatBot Chapi - Asistente de Tránsito" title (center), info icon (right)
- Height: h-16
- Padding: px-4 py-3
- Includes subtle bottom border for definition

**Chat Container**:
- Central scrollable area occupying viewport between header and input
- Padding: p-4 on mobile, p-6 on desktop
- Messages flow from top to bottom with space-y-4

**Message Bubbles**:

*User Messages*:
- Aligned right with ml-auto
- Max width: max-w-md
- Padding: px-4 py-3
- Rounded corners: rounded-2xl with rounded-br-sm for chat tail effect
- Shadow: subtle shadow-md

*Bot Messages (Chapi)*:
- Aligned left with mr-auto
- Max width: max-w-lg (slightly wider to accommodate detailed legal responses)
- Padding: px-4 py-3
- Rounded corners: rounded-2xl with rounded-bl-sm for chat tail effect
- Includes small avatar/icon (w-8 h-8) positioned top-left

**Legal Information Cards** (within bot messages):
- Nested component for displaying fines/penalties
- Border-l-4 accent border
- Padding: p-4
- Margin: mt-3
- Contains: Infraction type (font-semibold), penalty details (grid-cols-2 on desktop showing "Multa" and "Puntos")
- Background: subtle tinted background

**Input Area**:
- Fixed bottom position
- Contains: Text input field + Send button in flex layout
- Padding: p-4
- Shadow: shadow-lg for elevation
- Input: rounded-full with pl-6 pr-24 for send button overlap
- Send button: Positioned absolute right within input, circular icon button

**Quick Action Chips** (conversation starters):
- Displayed on initial load before first user message
- Grid layout: grid-cols-1 md:grid-cols-2 gap-3
- Each chip: Rounded border button with icon + text
- Padding: px-4 py-3
- Examples: "Consultar infracciones", "Límites de velocidad", "Puntos de licencia"

### Feedback Components

**Verification Prompt**:
- Appears after bot response
- Inline buttons: "Sí, está claro" | "Necesito más detalles"
- Layout: flex gap-3 mt-4
- Small, subtle styling to not overwhelm main message

**Loading Indicator**:
- Three animated dots (typing indicator)
- Appears in bot message position while processing
- Padding: p-4

**Error State**:
- Icon + message combination
- Centered layout with retry button below
- Used when out-of-scope question detected

### Navigation & System

**Welcome Screen** (first interaction):
- Centered layout with Chapi mascot/logo illustration
- Welcome message: "Hola, mi nombre es Chapi..."
- Subtext explaining capabilities
- Quick action chips below
- Friendly illustration/icon representing traffic assistance

**Empty State** (before conversation starts):
- Subtle placeholder text in chat area
- Visual cue (icon + text) encouraging user to ask first question

**Confirmation Modal** (if needed for complex actions):
- Centered overlay with backdrop
- Card: max-w-md, rounded-xl, p-6
- Title, description, action buttons (primary + secondary)

---

## Icons

**Icon Library**: Material Icons (Google Fonts CDN)
**Usage**:
- Chat/message icons: chat_bubble, send
- Traffic-related: traffic, speed, warning, local_police
- UI elements: info, help, close, check_circle
- Status: error, check_circle_outline
- All icons: Consistent size within context (w-5 h-5 for inline, w-6 h-6 for emphasis)

---

## Interactions & States

**Message Animations**:
- Fade-in with slight slide-up on message appear
- Smooth scroll-to-bottom on new message
- Duration: 200ms for snappy feel

**Button States**:
- Default: Solid fill
- Hover: Subtle scale (scale-105) + shadow increase
- Active: scale-95
- Disabled: Reduced opacity (opacity-50) + cursor-not-allowed

**Input Field States**:
- Focus: Ring-2 with offset
- Error (if validation needed): Red ring + error text below
- Typing: Show character count if limit exists

**Scroll Behavior**:
- Smooth auto-scroll to latest message
- "Scroll to bottom" floating button appears when user scrolls up (bottom-20 right-4)

---

## Images

**Header Logo/Icon**: 
- Small Chapi mascot icon (40x40px) - friendly traffic officer or robot character
- Positioned: Top-left of header bar

**Bot Avatar**:
- Circular avatar (32x32px) appearing with each bot message
- Same Chapi mascot in miniature
- Positioned: Left of each bot message bubble

**Welcome Illustration**:
- Hero illustration on initial screen before first message
- Size: max-w-sm centered
- Content: Friendly Chapi character with traffic-related visual elements (traffic light, road signs, car)
- Style: Modern, flat illustration with friendly aesthetic

**Empty State Graphic** (if no conversation):
- Subtle illustration/icon showing chat concept
- Grayscale or muted tones to indicate inactive state

---

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation: Tab through input, buttons, quick actions
- Focus indicators: Clear ring-2 on all focusable elements
- Color contrast: Ensure all text meets WCAG AA standards (4.5:1)
- Screen reader: Announce new messages, include alt text on illustrations
- Touch targets: Minimum 44x44px on mobile for all buttons
- High contrast mode support

---

## Layout Structure

**Desktop (lg: 1024px+)**:
- Chat container: max-w-4xl centered with generous side margins
- Three-column consideration for future dashboard: Sidebar (legal references) | Chat | Info panel
- Current focus: Single chat column with expansion potential

**Tablet (md: 768px)**:
- Chat container: Full width with px-6 padding
- Quick action chips: 2 columns
- Optimized for portrait and landscape

**Mobile (base)**:
- Chat container: Full viewport width with px-4 padding
- All elements stack vertically
- Input area: Fixed bottom with safe-area-inset for iOS
- Quick action chips: Single column, full width

---

## Conversation Flow Visual States

**State 1 - Welcome**:
- Centered welcome card with illustration
- Greeting text
- Quick action chips grid

**State 2 - Active Conversation**:
- Scrollable message history
- User and bot messages alternating
- Input always visible at bottom

**State 3 - Clarification Request**:
- Bot message with verification buttons inline
- Highlight verification prompt subtly

**State 4 - Farewell**:
- Bot message with emoji support: 😊 🚗💨
- Subtle animation or confetti effect on successful conversation end
- "Nueva consulta" button to restart

---

This design creates a professional, trustworthy, yet approachable chatbot interface that reflects Chapi's role as a helpful civic assistant while maintaining the authority expected from a government traffic information service.