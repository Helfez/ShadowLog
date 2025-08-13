# ShadowLog Backend API

A powerful Node.js backend for the ShadowLog diary application with AI integration.

## 🚀 Features

- **RESTful API**: Clean and intuitive API design
- **AI Integration**: OpenAI-powered sentiment analysis, tag generation, and writing assistance
- **Authentication**: JWT-based secure authentication
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for AI result caching
- **Rate Limiting**: Protect against abuse
- **Type Safety**: Full TypeScript support
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, and other security middleware

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **AI**: OpenAI API
- **Validation**: Zod
- **Authentication**: JWT

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-3.5-turbo` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🚀 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Diary Entries
- `GET /api/entries` - Get user's entries (with pagination)
- `GET /api/entries/:id` - Get specific entry
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

### AI Features
- `POST /api/ai/analyze` - Comprehensive AI analysis
- `POST /api/ai/sentiment` - Sentiment analysis only
- `POST /api/ai/tags` - Tag generation only
- `POST /api/ai/summary` - Summary generation only
- `POST /api/ai/writing-assist` - Writing assistance

### Search
- `POST /api/search` - Advanced search with filters
- `GET /api/search/quick` - Quick search for autocomplete

### System
- `GET /health` - Health check
- `GET /` - API information

## 🔒 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "error": "Error message (only when success is false)"
}
```

## 🤖 AI Features

### Sentiment Analysis
Analyzes the emotional tone of diary entries:
- Score: -1 (negative) to 1 (positive)
- Label: positive, negative, neutral, mixed
- Confidence: 0 to 1
- Emotions: Array of detected emotions

### Tag Generation
Automatically generates relevant tags for entries:
- 3-8 contextual tags per entry
- Supports multiple languages
- Optimized for search and categorization

### Writing Assistance
Provides intelligent writing suggestions:
- Content improvement suggestions
- Writing prompts and ideas
- Contextual recommendations

## 🚀 Deployment

### Zeabur Deployment

1. **Push to Git repository**
2. **Connect to Zeabur**
3. **Set environment variables**
4. **Deploy automatically**

The app is optimized for Zeabur deployment with:
- Automatic dependency detection
- Environment variable management
- PostgreSQL and Redis services
- Zero-config deployment

### Docker Deployment

```bash
# Build image
docker build -t shadowlog-backend .

# Run container
docker run -p 3001:3001 --env-file .env shadowlog-backend
```

## 📈 Performance

- **Caching**: AI results cached in Redis and PostgreSQL
- **Rate Limiting**: Protects against abuse
- **Compression**: Gzip compression enabled
- **Pagination**: Efficient data loading
- **Background Processing**: AI analysis runs asynchronously

## 🔧 Development

### Project Structure

```
src/
├── index.ts              # Main server file
├── types/                # TypeScript type definitions
│   ├── api.ts           # API request/response types
│   └── models.ts        # Database model types
├── utils/               # Utility functions
│   ├── helpers.ts       # General helpers
│   └── validation.ts    # Zod schemas
├── services/            # Business logic services
│   ├── database.ts      # Database service
│   └── ai.ts           # AI service
├── middleware/          # Express middleware
│   ├── auth.ts         # Authentication
│   ├── errorHandler.ts # Error handling
│   └── rateLimiter.ts  # Rate limiting
└── routes/             # API routes
    ├── auth.ts         # Authentication routes
    ├── entries.ts      # Diary entry routes
    ├── ai.ts          # AI feature routes
    └── search.ts      # Search routes
```

### Adding New Features

1. **Define types** in `src/types/`
2. **Add validation** in `src/utils/validation.ts`
3. **Create service logic** in `src/services/`
4. **Add routes** in `src/routes/`
5. **Update tests**

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL format
   - Ensure PostgreSQL is running
   - Run `npm run db:push`

2. **AI features not working**
   - Verify OPENAI_API_KEY is set
   - Check API quota and billing
   - Ensure Redis is running

3. **Authentication errors**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure user exists in database

## 📄 License

MIT License - see LICENSE file for details.
