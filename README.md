# 🏰 Knight of Sufferlandria Planner

> **Assault on the Castle** - Plan your quest to achieve the highest honour in Sufferlandria

[![Live Demo](https://img.shields.io/badge/🚀-Live%20Demo-brightgreen)](https://againstdemons84.github.io/knighthood-quests/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4.1-purple)](https://vitejs.dev/)

## 🎯 What is This?

The **Knight of Sufferlandria Planner** is a comprehensive training planning application for cyclists pursuing the ultimate endurance challenge: completing 10 consecutive Sufferfest/SYSTM workouts to earn knighthood in the realm of Sufferlandria.

This React-based web application helps athletes:
- 🗡️ **Plan their assault** by selecting 10 grueling workouts from the official knighthood list
- 📊 **Analyze training load** with real-time TSS, IF, and power calculations
- 🎯 **Optimize their power profile** using Four Dimensional Power (4DP) data
- 📋 **Generate quest schedules** with printable workout plans and timing
- 🔄 **Compare scenarios** to find the perfect recipe for suffering

## ⚔️ The Knight of Sufferlandria Challenge

The Knight of Sufferlandria is an legendary endurance challenge where participants must complete **10 consecutive workout sessions** from a curated list of the most brutal training videos ever created. This application helps you:

1. **Select Your Weapons**: Choose from 30+ official knighthood workouts
2. **Calculate Your Suffering**: See real-time training stress and intensity metrics
3. **Schedule Your Siege**: Plan timing, breaks, and execution strategy
4. **Share Your Madness**: Export and share your quest plans with fellow sufferers

## 🚀 Features

### 🎲 Quest Planning
- **Smart Selection**: Choose from 30+ official knighthood workouts
- **Quick Paths**: Pre-built routes (Merciful, Brutal, Epic Endurance, Trial by Chaos)
- **Dynamic Metrics**: Real-time calculation of TSS, IF, NP, and duration
- **Workout Analysis**: Detailed power zone breakdowns and intensity profiles

### 📊 Training Analytics
- **Power Profile Integration**: Full Four Dimensional Power (4DP) support
- **Target Intensity Scaling**: Adjust workouts to your fitness level (30-200% FTP)
- **Comprehensive Metrics**: TSS, Intensity Factor, Normalized Power calculations
- **Visual Charts**: Interactive power curve and workout intensity visualization

### 🗂️ Scenario Management
- **Save Multiple Plans**: Create and manage different quest combinations
- **Compare Scenarios**: Side-by-side analysis of different approaches
- **Share Plans**: Generate shareable links for your quest combinations
- **Export Options**: Print-friendly workout schedules with timing

### 📱 Cross-Platform Design
- **Responsive Interface**: Optimized for desktop, tablet, and mobile
- **Progressive Enhancement**: Works offline once loaded
- **Touch-Friendly**: Intuitive mobile interaction patterns
- **Modern UI**: Dark theme with Sufferlandrian aesthetics

## 🛠️ Technology Stack

### Frontend Framework
- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.x** - Full type safety and enhanced developer experience
- **Vite 6.4.1** - Lightning-fast build tool and development server

### Data Visualization
- **Chart.js 4.5.1** - Interactive charts and graphs
- **React Router 6.30.2** - Client-side routing and navigation
- **Custom SVG Components** - Workout intensity visualizations

### Testing & Quality
- **Vitest 3.2.4** - Modern testing framework (123 tests)
- **Playwright** - End-to-end testing across devices
- **TypeScript ESLint** - Code quality and consistency

### Deployment
- **GitHub Actions** - Automated CI/CD pipeline
- **GitHub Pages** - Static site hosting
- **Vite Build Optimization** - Production-ready bundles

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── IntroPage.tsx    # Landing page and onboarding
│   ├── WorkoutSelector.tsx  # Main workout selection interface
│   ├── ScenarioManager.tsx  # Quest management and comparison
│   ├── ScenarioDetailsView.tsx  # Individual scenario analysis
│   ├── UserProfileManager.tsx   # 4DP power profile configuration
│   ├── PrintQuestModal.tsx     # Printable quest schedules
│   └── WorkoutChart.tsx # Power curve visualization
├── data/                # Static data and workout information
│   ├── knighthood-workouts.json  # Official knighthood workout list
│   ├── workouts.json    # Complete SYSTM workout database
│   └── workout-data/    # Individual workout power files
├── types/               # TypeScript type definitions
│   ├── scenario.ts      # Quest and workout selection types
│   ├── workout.ts       # Workout data and metrics types
│   └── userProfile.ts   # User power profile types
├── utils/               # Business logic and calculations
│   ├── scenarioHelpers.ts     # Quest planning utilities
│   ├── trainingMetrics.ts     # TSS/IF/NP calculations
│   ├── targetIntensityUtils.ts # Power scaling utilities
│   └── svgGenerator.ts  # Chart generation utilities
├── hooks/               # Custom React hooks
├── routes/             # Route components and navigation
└── services/           # External API integrations
```

## 🚦 Getting Started

### Prerequisites
- **Node.js 18+** - JavaScript runtime
- **npm 8+** - Package manager
- **Modern Browser** - Chrome, Firefox, Safari, or Edge

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/againstdemons84/knighthood-quests.git
   cd knighthood-quests
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   
   The app will open at `http://localhost:3000`

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build production bundle
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run deploy` - Deploy to GitHub Pages

## 📋 Usage Guide

### 1. Set Up Your Power Profile
- Enter your Four Dimensional Power values (NM, AC, MAP, FTP)
- Set your target training intensity (30-100%+ FTP)
- Configure lactate threshold heart rate for accurate metrics

### 2. Plan Your Quest
- Navigate to the "Plan Quest" tab
- Select individual workouts or choose a pre-built path:
  - **🛡️ Merciful Path**: Lowest total TSS (easiest route to knighthood)
  - **⚔️ Brutal Path**: Highest intensity (maximum suffering per hour)
  - **⏰ Epic Endurance**: Longest duration (test your mental fortitude)
  - **🎲 Trial by Chaos**: Random selection (let fate decide your suffering)

### 3. Analyze Your Plan
- View real-time metrics as you build your selection
- See detailed breakdowns of TSS, Intensity Factor, and duration
- Compare different scenarios side-by-side
- Visualize power requirements and workout intensity

### 4. Execute Your Quest
- Generate printable schedules with timing and rest breaks
- Share your plan with fellow Sufferlandrians
- Track your progress through the 10-workout gauntlet

## 🧪 Testing

The application includes comprehensive testing coverage:

- **Unit Tests**: 123 tests covering core business logic
- **End-to-End Tests**: Cross-device journey testing with Playwright
- **Integration Tests**: Component interaction and data flow validation

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm test

# Run E2E tests with UI
npm run test:e2e:ui
```

## 🚀 Deployment

The application is automatically deployed to GitHub Pages via GitHub Actions:

1. **Automated Deployment**: Every push to `main` triggers a build and deploy
2. **Pre-deployment Testing**: All tests must pass before deployment
3. **Production Optimization**: Code splitting, minification, and caching

Manual deployment:
```bash
npm run deploy
```

## 🔧 Configuration

### Environment Variables
- `VITE_BASE_URL` - Base URL for routing (defaults to `/knighthood-quests/`)
- `VITE_API_ENDPOINT` - SYSTM API endpoint for workout data fetching

### Build Configuration
- **Vite Config**: Modern build optimizations and dev server settings
- **TypeScript Config**: Strict type checking and modern ES features
- **Playwright Config**: Cross-browser and cross-device testing setup

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm run test:all`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode requirements
- Maintain test coverage for new features
- Use semantic commit messages
- Ensure mobile responsiveness
- Follow established component patterns

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: <2MB initial load
- **First Paint**: <1.5s on 3G networks
- **Interactive**: <3s on mobile devices

## 🐛 Known Issues

- Workout data fetching requires CORS proxy for SYSTM API calls
- Large workout datasets may cause initial loading delays
- Print layouts optimized for standard paper sizes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Sufferfest/SYSTM** for creating the workout content and knighthood challenge
- **The Wahoo Fitness Community** for inspiration and feedback
- **Four Dimensional Power** methodology for training metrics

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/againstdemons84/knighthood-quests/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/againstdemons84/knighthood-quests/discussions)
- 📧 **Contact**: Available through GitHub profile

---

**⚔️ Embrace the Suffering. Earn Your Knighthood. ⚔️**

> *"The Ministry of Madness demands only the strongest survive the quest for knighthood. Plan wisely, suffer greatly, and claim your place among the legends of Sufferlandria."*