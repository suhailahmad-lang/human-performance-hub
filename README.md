# Human Performance Hub

Build a polished, production-minded MVP web application called "Human Performance AI" — an AI-powered human performance and training platform. This is the user's primary long-term product project. Build the actual working application, not a landing-page-only mockup.

PRODUCT VISION
The platform helps a person assess their current activity level and goals, receive a structured training plan, complete daily sessions, log training, and review progress. Core loop: Measure → Plan → Train → Track → Analyze → Adapt.

TARGET EXPERIENCE
A premium, modern, trustworthy fitness-tech SaaS experience. Responsive desktop and mobile layouts. Use a dark charcoal/navy foundation with restrained electric-lime or teal accents, crisp typography, clear cards, useful charts, accessible contrast, and polished empty/loading/error states. Avoid clutter and generic template appearance. The app should feel like a serious human-performance product.

CORE TRAINING DOMAINS
Create a training-domain catalogue and dashboard sections for:
1. Strength Training
2. Calisthenics
3. Sprint Training
4. Endurance Training
5. Martial Arts / Combat Fitness (fitness and skill conditioning only; no instructions for harming people)
6. Mobility Training
7. Plyometrics
8. Cardio
9. Yoga & Pranayama
10. Meditation / Recovery

MVP USER JOURNEY
1. Welcome / sign up / sign in.
2. First-run onboarding assessment: display name, age range/date of birth, optional height and weight, optional gender, experience level, primary goal, secondary goals, available training days, session duration, available equipment, training location, preferred domains, current activity level, and relevant limitations or movements to avoid. Make optional fields clearly optional. Do not request unnecessary sensitive data.
3. Build a profile and a baseline assessment summary.
4. Create a personalized weekly plan from a deterministic rules-based planner first. Show a clear explanation of why the plan was generated. Do not pretend an AI model is connected when it is not.
5. Daily workout view: warm-up, exercises, sets/reps/time/distance, rest, coaching cues, cooldown, completion controls.
6. Workout logging: record completed sets/reps/load/time/distance/RPE and notes. Allow users to skip or modify a session.
7. Dashboard: today's session, weekly schedule, consistency, completed sessions, training volume / duration, domain distribution, recent activity, and next recommended action.
8. Exercise library with search and filters by domain, difficulty, equipment, and movement pattern.
9. Basic progress and analytics page with meaningful charts and date filters.
10. A clearly labelled AI Coach interface as a staged feature: provide a useful demo experience using safe predefined guidance and transparent status; do not fabricate live AI integration or ask for API keys in chat. Keep the architecture ready for a future AI API connection.

NAVIGATION / PAGES
- Public welcome / product overview
- Authentication
- Onboarding assessment
- Main dashboard
- My Plan / weekly calendar
- Today's Workout / workout session
- Exercise Library / exercise detail
- Progress & Analytics
- AI Coach
- Profile & Settings

DATA / BACKEND
Use Lovable's supported full-stack TypeScript stack and its integrated backend/database capabilities. Set up persistent database-backed user profiles, goals, training preferences, exercise catalogue, training plans, planned workouts, workout sessions, set logs, and progress records. Use authenticated, user-scoped data access and row-level security wherever supported. Never expose one user's private records to another. Add sensible schema constraints, timestamps, and ownership relationships. If the cloud database/auth provisioning requires a user approval, pause and clearly explain the approval needed.

IMPLEMENTATION GUIDANCE
- First implement the complete responsive UI and functional core flows with realistic seed exercise data.
- Add authentication and persistent storage using the platform-supported integration when available.
- Implement deterministic plan generation with explicit safety and scheduling rules; avoid unsupported medical claims.
- Provide sensible sample/demo data only when clearly labelled as demo.
- Include validation, loading states, empty states, error handling, and accessible controls.
- Use reusable components, TypeScript types, and a clean maintainable project structure.
- Do not add payments, social feeds, public leaderboards, or unnecessary features to the MVP.
- Do not use body-image scoring, appearance ratings, or body-comparison features. Keep progress centered on training consistency, capability, performance, and wellbeing.
- For minors, use conservative age-appropriate defaults and avoid high-intensity prescriptions without suitable supervision; include a clear note that the platform is not medical care and users should seek qualified guidance for health concerns.
- Do not claim to diagnose, treat, or prevent medical conditions.

BUILD ORDER
Start by creating the product shell, navigation, onboarding, dashboard, plan/calendar, workout experience, exercise library, progress page, and profile/settings with a coherent visual system. Then wire the supported backend/auth and persist the core data. Finish by checking the main user journey and fixing obvious errors.

Important: make concrete implementation progress now. Do not respond with only a plan or a list of suggestions.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c2c8f989-c301-4f75-9013-273effd9c758).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
