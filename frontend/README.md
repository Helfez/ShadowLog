# ShadowLog Frontend

A modern React frontend for the ShadowLog diary application, built with TypeScript, Vite, and shadcn/ui.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** for beautiful, accessible UI components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/
│   └── ui/          # shadcn/ui components
├── lib/
│   └── utils.ts     # Utility functions
├── App.tsx          # Main application component
├── main.tsx         # Application entry point
└── index.css        # Global styles
```

## Features

- Responsive design for mobile and desktop
- Dark/light theme support
- Modern UI with shadcn/ui components
- TypeScript for type safety
- Fast development with Vite HMR

## Deployment

This frontend is designed to be deployed separately from the backend. It can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

The frontend communicates with the backend API through HTTP requests.
