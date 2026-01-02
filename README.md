# AlgoLoom 🧵

**Master Algorithms with AI-Powered Hints**

AlgoLoom is a modern LeetCode-style platform that combines competitive programming with gamification and AI-powered assistance. Solve algorithmic problems, get intelligent hints when stuck, earn XP, unlock achievements, and compete on the global leaderboard.

## ✨ Features

### 🧠 AI-Powered Hints

- Get progressive, non-spoiler hints from **Google Gemini AI**
- Three levels of hints to guide without giving away solutions
- Context-aware suggestions based on your code
- Daily limit to encourage problem-solving

### 🎮 Gamification System

- **XP & Leveling**: Earn XP for every problem solved
- **Achievements**: Unlock badges for milestones (first solve, streaks, etc.)
- **Streaks**: Maintain daily solving streaks for bonus XP
- **Daily Challenges**: A new challenge every day with bonus XP rewards
- **Leaderboard**: Compete globally with other developers
- **Difficulty Tiers**: Easy, Medium, Hard problems with varying rewards

### 💻 Code Editor

- **Monaco Editor** integration (VS Code experience)
- Support for **4 languages**: Python, C++, Java, JavaScript
- Syntax highlighting, IntelliSense, and code completion
- Auto-formatting

### 🔍 Problem Library

- **~30+ problems** curated for algorithmic practice
- **Public Viewing**: Browse problems and submissions without login
- **Protected Submissions**: Email verification required to submit solutions
- Filter by **difficulty**, **tags**, and **status**
- **URL State Persistence**: Pagination and filters synced with URL
- Real-time code execution with **Judge0 API**
- Detailed test case results and performance metrics

### 👤 User Profiles & Authentication

- **Email Verification**: Secure account verification via email (Resend API)
- **OAuth Support**: Sign in with Google or GitHub (auto-verified)
- **Username Auto-generation**: Automatic username creation from name
- Track your progress with comprehensive statistics
- Activity heatmap (GitHub-style contribution graph)
- Submission history and acceptance rate
- Social links (GitHub, LinkedIn, website)

### 👥 Social Features

- **Friend System**: Send, accept, and manage friend requests
- **Friend Activity Feed**: See when friends solve problems or unlock achievements
- **Profile Integration**: Add/unfriend directly from user profiles

### 💎 Premium Subscription

- **Stripe Integration**: Secure payment processing
- **Monthly/Yearly Plans**: Flexible subscription options ($9.99/mo or $79.99/yr)
- **Premium Problems**: Exclusive problems for Pro users
- **Billing Portal**: Manage subscription via Stripe Customer Portal
- **Webhook Handling**: Automatic status updates on payment events

### 🛡️ Admin Panel

- **Dashboard**: Overview stats (problems, users, submissions, test cases)
- **Problem Management**: Create, edit, and delete coding problems with test cases
- **User Management**: View user list with filters (search, role, sort)
- **Submissions**: View all submissions with filters and code preview
- **Daily Challenges**: Schedule challenges or let auto-generation handle it

## 🚀 Tech Stack

### Frontend

- **Next.js 15** (App Router, Server Components, React 19)
- **TypeScript** (strict mode)
- **Tailwind CSS** (utility-first styling)
- **shadcn/ui** (Radix UI + custom components)
- **Framer Motion** (animations)

### Backend

- **Next.js API Routes** (serverless functions)
- **NextAuth.js v5** (OAuth + credentials authentication)
- **Prisma ORM** (type-safe database queries)
- **PostgreSQL** (Neon.tech serverless DB)

### External Services

- **Judge0 API** (code execution via RapidAPI)
- **Google Gemini 3 Flash** (AI hints)
- **Upstash Redis** (distributed rate limiting - 10k requests/day free)
- **Resend** (email verification - 100 emails/day free)
- **Stripe** (subscription payments - test mode available)

## 📦 Installation

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (or use Neon.tech)
- API keys (see `.env.example`)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/algoloom.git
cd algoloom
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Fill in your `.env` file.

### 4. Setup Database

```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init

# Seed database with sample data
pnpm prisma db seed
```

### 5. Setup Email Verification (Optional for Development)

For development, you can skip email verification by:

- Using OAuth login (Google/GitHub) - auto-verified
- Or testing without actual emails (verification links logged to console)

For production with actual emails:

1. Sign up for [Resend](https://resend.com) (100 emails/day free)
2. Add your domain and verify DNS records
3. Get API key and add to `.env`:
   ```
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM=noreply@yourdomain.com
   ```

### 6. Run Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🔒 Security

- **Email Verification**: Required for code submissions (OAuth auto-verified)
- **Distributed Rate Limiting**: Upstash Redis-based (works across all edge instances)
  - Default: 100 requests/min per IP
  - Submissions: 1/min per user
  - Hints: 5/min per user
  - Problems: 1000/min per IP
  - Analytics enabled for monitoring
- **Authentication**: NextAuth.js v5 with JWT sessions (no polling)
- **Authorization**: Role-based access control (USER/ADMIN)
- **Public Viewing**: Problems and submissions viewable without auth
- **Protected Actions**: Submissions and hints require verified email
- **SQL Injection**: Protected by Prisma parameterized queries
- **XSS Protection**: React's built-in escaping + CSP headers
- **CSRF Protection**: NextAuth CSRF tokens

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy! 🎉

### Manual Deployment

```bash
# Build production
pnpm run build

# Start production server
pnpm start
```

## 📊 Database Schema

See `prisma/schema.prisma` for full schema. Key models:

### Core Models (Active)

- **User**: Authentication, gamification stats (xp, streak, level), emailVerified, profile info
- **Problem**: Title, description, test cases, difficulty, tags, constraints, hints
- **Submission**: User code submissions with verdict, runtime, memory metrics
- **TestCase**: Individual test cases for problems (visible and hidden)
- **TestResult**: Results for each test case in a submission
- **ProblemStat**: Tracks user progress per problem (attempts, solved status, hints used)
- **HintLog**: AI-generated hint history with XP costs and prompts
- **VerificationToken**: Email verification tokens (identifier + token composite key)

### Gamification Models (Active)

- **Leaderboard**: Event-driven ranking system - _Updates automatically on XP changes_
- **Achievement**: 20+ achievements (milestones, streaks, mastery, speed, etc.) - _Awards automatically on problem solve_
- **UserAchievement**: Tracks unlocked achievements per user with timestamps
- **DailyChallenge**: Daily problem challenges with XP bonuses - _Fully implemented with admin scheduling and auto-generation_
- **Friendship**: Friend system with requests, activity feed - _Fully implemented_
- **Subscription**: Stripe subscription tracking (plan, status, billing period) - _Fully implemented_

## 💡 Feature Ideas for Future

- [ ] Discussion forum per problem
- [ ] Video explanations
- [ ] Contest mode (timed challenges)
- [ ] Team competitions
- [ ] Problem difficulty voting
- [ ] Email notifications for streaks

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Judge0** for code execution API
- **Google Gemini** for AI-powered hints
- **Resend** for email delivery service
- **shadcn/ui** for beautiful component library
- **Vercel** for hosting platform
- **Neon** for serverless PostgreSQL

---

**Built with ❤️ for developers by developers**

⭐ Star this repo if you find it helpful!
