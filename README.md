# Lookai (LooKai)

AI-powered calorie and nutrition tracking — scan meals, log macros, and get personalized insights.

**Repository:** [github.com/AshaLathaKoneru/Lookai](https://github.com/AshaLathaKoneru/Lookai)  
**Maintainer:** [AshaLathaKoneru](https://github.com/AshaLathaKoneru)

## Getting started

Requirements: [Node.js](https://nodejs.org/) (LTS recommended) and npm.

```sh
git clone https://github.com/AshaLathaKoneru/Lookai.git
cd Lookai
npm install
cp .env.example .env   # add your Supabase keys
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests                |
| `npm run lint` | Lint the codebase        |

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, edge functions)

## License

Private project — all rights reserved by AshaLathaKoneru unless stated otherwise.
