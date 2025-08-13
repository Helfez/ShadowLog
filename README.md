# ShadowLog

A lightweight, AI-powered diary application with modern UI and cross-platform support.

## 🌟 Features

- **Modern UI**: Beautiful black and white (Zinc) theme using shadcn/ui
- **AI Integration**: Intelligent sentiment analysis, tag generation, and writing assistance
- **Cross-Platform**: Support for iOS and mobile web platforms
- **Secure Authentication**: JWT-based user authentication
- **Real-time Updates**: Hot module replacement for development
- **Separated Architecture**: Independent frontend and backend deployment

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** for build tooling
- **shadcn/ui** component library
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** with SQLite database
- **OpenAI API** for AI features
- **Redis** for caching (optional)
- **JWT** for authentication
- **Zod** for validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ShadowLog
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm run db:generate
   npm run db:push
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Prisma Studio: http://localhost:5555 (run `npx prisma studio` in backend folder)

## 📁 Project Structure

```
ShadowLog/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   ├── lib/            # Utilities and API client
│   │   ├── pages/          # Page components
│   │   └── ...
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Helper utilities
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── dev.db          # SQLite database (development)
│   ├── package.json
│   └── tsconfig.json
│
├── package.json              # Root workspace configuration
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

## 🤖 AI Features

- **Sentiment Analysis**: Automatically analyze the emotional tone of diary entries
- **Tag Generation**: Generate relevant tags for easy categorization
- **Summary Creation**: Create concise summaries of longer entries
- **Writing Assistance**: Get suggestions to improve your writing

## 📱 Mobile Support

The application is optimized for:
- iOS Safari
- Mobile web browsers
- Responsive design for all screen sizes
- Touch-friendly interface

## 🚀 Deployment

### Zeabur (Recommended)

1. **Frontend Deployment**:
   - Connect your Git repository to Zeabur
   - Select the `frontend` folder as the root
   - Zeabur will automatically detect Vite and deploy

2. **Backend Deployment**:
   - Create a new service for the `backend` folder
   - Add environment variables in Zeabur dashboard
   - Add PostgreSQL and Redis services if needed

### Manual Deployment

1. **Build frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Build backend**:
   ```bash
   cd backend
   npm run build
   ```

3. **Deploy built files to your hosting platform**

## 🧪 Development

### Available Scripts

**Root level**:
- `npm run dev:frontend` - Start frontend development server
- `npm run dev:backend` - Start backend development server
- `npm run build` - Build both frontend and backend

**Frontend**:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

**Backend**:
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database

### Database Management

View and manage your database with Prisma Studio:
```bash
cd backend
npx prisma studio
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation with Zod

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Prisma](https://prisma.io/) for the excellent database toolkit
- [OpenAI](https://openai.com/) for AI capabilities
- [Zeabur](https://zeabur.com/) for seamless deployment

---

Built with ❤️ using modern web technologies
