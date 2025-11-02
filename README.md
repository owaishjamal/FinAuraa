# FinAura - Emotion-Aware Financial Wellness Platform

**Win Hackathons with AI-Ready Math & Real-Time Analytics**

FinAura is a cutting-edge financial wellness platform that combines financial metrics with emotional intelligence to provide holistic NeuroFinance Index (NFI) scoring. Built with React, Tailwind CSS, Supabase, and mathematical models ready for AI enhancement.

## 🚀 Features

### Core Functionality
- **NeuroFinance Index (NFI)** - Combines financial health with emotional wellness
- **Real-time Analytics** - Track your financial wellness over time
- **Smart Nudges** - AI-ready personalized recommendations (currently using advanced math)
- **CSV Insights** - Import transactions and get category breakdowns
- **Goal Planning** - Simulate different scenarios and plan improvements
- **Journal Tracking** - Maintain streaks for emotional wellness

### Backend & Data Persistence
- **Supabase Integration** - Full backend with authentication
- **User Profiles** - Persistent user preferences and financial state
- **NFI History** - Track all computations over time
- **Transaction Storage** - Save and analyze transaction history
- **Achievements System** - Unlockable badges for milestones
- **Analytics Dashboard** - Pre-computed summaries for performance

### User Experience
- **Authentication** - Secure sign up/sign in
- **Dark Mode** - Beautiful dark/light themes
- **Multiple Themes** - Indigo, Emerald, Amber color palettes
- **Responsive Design** - Works on all devices
- **Offline Support** - Works locally without backend

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account (free tier works)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Get your Supabase URL and Anon Key from Project Settings > API

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Alternatively, you can set these in your HTML:

```html
<meta name="supabase-url" content="your_supabase_url" />
<meta name="supabase-anon-key" content="your_supabase_anon_key" />
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
FinAura/
├── src/
│   ├── components/          # React components
│   │   ├── auth/            # Authentication components
│   │   ├── tabs/             # Tab components (Dashboard, Planner, etc.)
│   │   └── ui/               # Shadcn UI components
│   ├── lib/                  # Library configurations (Supabase, Auth)
│   ├── services/             # Business logic services
│   ├── utils/                # Utility functions (API, NFI, CSV, etc.)
│   ├── constants/           # Constants (palettes, tests)
│   └── App.jsx              # Main app component
├── supabase/
│   └── migrations/           # Database migrations
├── package.json
└── README.md
```

## 🎯 Hackathon Highlights

### What Makes This Hackathon-Worthy?

1. **AI-Ready Architecture**
   - Mathematical models designed for AI enhancement
   - Clean separation between computation and AI integration points
   - Easy to add AI/ML models later

2. **Production-Ready Backend**
   - Full Supabase integration with RLS (Row Level Security)
   - Scalable database schema
   - Real-time capabilities ready

3. **Advanced Mathematical Models**
   - NFI calculation with weighted factors
   - Trend analysis using statistical methods
   - Sentiment analysis algorithm
   - Volatility calculations

4. **Excellent UX/UI**
   - Smooth animations with Framer Motion
   - Beautiful gradients and themes
   - Responsive design
   - Accessibility considerations

5. **Data-Driven Insights**
   - Historical trend analysis
   - Category spending breakdowns
   - Personalized recommendations
   - Achievement system

## 🧮 Mathematical Models

### NFI Calculation
The NeuroFinance Index combines:
- **Finance Subscore (65%)**: Savings rate, debt health, volatility, adherence
- **Emotion Subscore (35%)**: Mood, stress level, sleep quality

### Sentiment Analysis
Uses word frequency analysis on positive/negative word lists to derive sentiment scores.

### Volatility Calculation
Standard deviation of expenses normalized by mean, clamped between 0-1.

### Trend Analysis
Statistical analysis of historical data to predict patterns and generate recommendations.

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- User data isolated by user_id
- Secure authentication with Supabase Auth
- No sensitive data in client-side code

## 🚧 Future AI Enhancements

The codebase is structured to easily add:
- ML-based sentiment analysis
- Predictive financial modeling
- Personalized nudge optimization
- Fraud detection on transactions
- Pattern recognition in spending

## 📝 License

MIT License - Feel free to use for hackathons!

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

## 🏆 Hackathon Tips

1. **Demo Flow**: Start with sign-up → Input financial data → See NFI → View insights → Show CSV import
2. **Highlight Features**: Emphasize the combination of finance + emotion, Supabase backend, AI-ready architecture
3. **Live Demo**: Show real-time data persistence, theme switching, responsive design
4. **Explain Tech Stack**: React + Supabase + Mathematical Models ready for AI

---

**Built with ❤️ for Hackathons**

