

---

# 💫 **FinAura Neurofin— Emotion-Aware Financial Wellness Platform**

### *“Where Finance Meets Feelings — Smarter Money Decisions, Calmer Minds.”*

---

## 🚀 **Overview**

**FinWiz** is a next-generation **emotion-aware financial wellness platform** that merges hard financial metrics with soft emotional signals.
It computes a **NeuroFinance Index (NFI)** — a single, explainable score combining **financial stability** and **emotional resilience** — and delivers **stress-aware nudges** to help users make smarter, calmer financial decisions.

Built with **React**, **Tailwind CSS**, and **Supabase**, FinWiz is designed to be **AI-ready**, **analytics-driven**, and **judge-grade demo-proof** for hackathons.

---

## 💡 **Why FinWiz?**

Modern finance apps track spending.
FinWiz goes further — it tracks **you**.

Your emotions, sleep, and stress directly influence financial behavior.
FinWiz bridges this gap with real-time analytics, emotional context, and actionable insights.

---

## ✨ **Key Features**

### 🧠 **Core Intelligence**

* **NeuroFinance Index (NFI)** — Combines finance & emotion into one holistic score
* **Smart Nudges** — Personalized, reinforcement-learning-ready suggestions
* **Explainability Dashboard** — Transparent contribution analysis for every factor
* **Goal Simulator** — Project how behavior changes affect your NFI
* **CSV Insights** — Paste your transactions and auto-analyze spending patterns

### 💾 **Backend & Data Persistence**

* **Supabase Integration** — Authentication, data storage, and analytics backend
* **User Profiles** — Persisted preferences and tracked trends
* **NFI History** — Time-series charting of user’s financial–emotional evolution
* **Transaction Store** — Historical spending data for insights and trend analysis

### 🎨 **User Experience**

* **Dark/Light Modes** — Beautiful responsive UI
* **Professional Themes** — Indigo, Emerald, and Amber color palettes
* **Micro-Journaling** — Emotional journaling streaks with gamified feedback
* **Offline Mode** — Works even without backend connectivity

---

## 🧮 **Mathematical & Behavioral Models**

### 🧭 **NFI Formula**

> **NFI = 0.65 × Financial Subscore + 0.35 × Emotional Subscore**

**Financial Subscore (65%)**

* Savings rate
* Debt ratio
* Spending volatility
* Budget adherence

**Emotional Subscore (35%)**

* Mood sentiment (text analysis)
* Stress level (0–10)
* Sleep quality (0–10)

### 📊 **Analytics Models**

* **Sentiment Analysis** — Word-based scoring on positive/negative lexicons
* **Volatility Measure** — Standard deviation of spend / mean spend (clamped 0–1)
* **Trend Forecasting** — Rolling analysis of NFI improvements over time

---

## ⚙️ **Tech Stack**

| Layer         | Tools & Frameworks                                          |
| :------------ | :---------------------------------------------------------- |
| Frontend      | React, Tailwind CSS, Shadcn/UI, Framer Motion               |
| Backend       | Supabase (PostgreSQL + Auth)                                |
| Data Science  | Python (Colab-ready simulation notebook)                    |
| Deployment    | Vercel / Netlify                                            |
| Visualization | Recharts + Framer Motion                                    |
| Security      | Row Level Security (Supabase RLS), local sentiment fallback |

---

## 🧰 **Setup Instructions**

### Prerequisites

* Node.js ≥ 18
* Supabase account (free tier works great)

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Setup Supabase

* Create a new project at [supabase.com](https://supabase.com)
* Run the migration file:

  ```bash
  supabase/migrations/001_initial_schema.sql
  ```
* Copy your API credentials:

  ```
  SUPABASE_URL = your_project_url
  SUPABASE_ANON_KEY = your_anon_key
  ```

### 3️⃣ Configure Environment

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4️⃣ Run Locally

```bash
npm run dev
```

Visit 👉 **[http://localhost:5173](http://localhost:5173)**

### 5️⃣ Build for Production

```bash
npm run build
```

---

## 🧩 **Project Structure**

```
FinWiz/
├── src/
│   ├── components/
│   │   ├── tabs/              # Dashboard, Planner, Insights
│   │   ├── ui/                # Shadcn UI components
│   │   └── auth/              # Authentication views
│   ├── lib/                   # Supabase configs & services
│   ├── utils/                 # NFI logic, CSV parser, helpers
│   └── App.jsx                # Main application entry
├── supabase/
│   └── migrations/            # Database schema
└── README.md
```

---

## 🧠 **Hackathon Highlights**

### 💥 **Innovation**

* Bridges **psychology + finance** with measurable NFI
* AI-ready design (sentiment → emotion → recommendation)
* Works **online + offline** with graceful fallbacks

### 🪶 **Tech Elegance**

* Supabase backend with RLS
* Clean modular React architecture
* Dynamic theme gradients and glassmorphism UI

### 📈 **Analytics Power**

* Realtime charting
* Explainable AI dashboard
* Spend volatility simulation

---

## 🤖 **Future Roadmap**

* Transformer-based emotion inference (BERT / DistilBERT fine-tuning)
* LSTM-based predictive financial forecasting
* Personalized nudge ranking via reinforcement learning
* Fraud detection and anomaly alerts

---

## 🔐 **Security**

* Row-Level Security (RLS) per user
* Authenticated Supabase API
* No sensitive keys in client code
* Local sentiment fallback for privacy

---

## 🧑‍💻 **Contributors**

**Lead Developer:** Owaish Jamal (IIIT Allahabad)
**Special Thanks:** Flipkart Grid Mentorship Community

---

## 🪄 **Demo Links**

* 🌐 **Live App:** [https://fin-auraa.vercel.app/](https://fin-auraa.vercel.app/)
* 💻 **GitHub Repo:** [https://github.com/owaishjamal/FinAuraa](https://github.com/owaishjamal/FinAuraa)
* 📹 **Demo Video:** [Drive Link](https://drive.google.com/file/d/1q0WZizqB74YSmBeOAMQSqiQA_3tIbszW/view?usp=sharing)


---

## 🏆 **Build With Love for FinWiz 1.0**



---

