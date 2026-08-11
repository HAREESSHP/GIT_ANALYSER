# GitHub Insight - Production-Ready GitHub Analytics Dashboard

checkout: https://git-analyser-kappa.vercel.app/


A professional full-stack SaaS application for analyzing GitHub profiles. Search any GitHub user, get deep insights into their repositories, statistics, activity, and more—all displayed in a beautiful dashboard.

**Perfect for:** Portfolio projects, internship applications, and production deployments.

## 🌟 Features

- 🔍 **Profile Search** - Search by GitHub username or profile URL
- 📊 **Analytics Dashboard** - View detailed statistics and metrics
- 📈 **Repository Analysis** - Top repositories with stars, forks, language
- 👤 **Profile Information** - Name, bio, location, company, followers, etc.
- 💾 **Data Storage** - Profiles stored in MySQL with instant retrieval
- 📱 **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- ⚡ **Professional Design** - Modern SaaS aesthetic with pure CSS
- 🚀 **Production Ready** - Deploy to Vercel and Render
- 🤖 **AI Assistant (RAG)** - Ask natural-language questions about any profile, answered with grounded data (free, local)

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool (fast bundling)
- **Axios** - HTTP client
- **Pure CSS** - Styling (no frameworks)

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **GitHub API** - Data source

### Deployment
- **Frontend:** Vercel
- **Backend:** Render (or Vercel API)
- **Database:** MySQL (Railway, PlanetScale, or managed service)

### RAG (Optional, Free)
- **Cloud mode (default)** - Google Gemini API (free tier, no downloads, no credit card)
- **Local mode** - Ollama + ChromaDB (fully offline)
- See [RAG_SETUP.md](RAG_SETUP.md) for full setup instructions

## 📁 Project Structure

```
github-insight/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx & Navbar.css
│   │   │   ├── Hero.jsx & Hero.css
│   │   │   ├── Dashboard.jsx & Dashboard.css
│   │   │   └── Footer.jsx & Footer.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx & App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── github.js
│   ├── package.json
│   ├── schema.sql
│   ├── .env.example
│   └── README.md
│
└── README.md (this file)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- GitHub Personal Access Token

### 1. Clone & Setup

```bash
cd github-insight

# Backend setup
cd backend
npm install
cp .env.example .env
# Update .env with your credentials

# Create database
mysql -u root -p < schema.sql

# Start backend
npm start  # or npm run dev for development
```

Backend runs on `http://localhost:5000`

```bash
# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
# Update .env if needed (default: http://localhost:5000)

# Start frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### 2. Get GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Create a new token with `public_repo` scope
3. Add to backend `.env` as `GITHUB_API_TOKEN`

### 3. MySQL Setup

If you don't have MySQL running:

**Windows:**
```bash
# Using XAMPP or similar, or:
mysql --version  # Check if installed
mysql -u root -p < backend/schema.sql
```

**macOS:**
```bash
brew install mysql
brew services start mysql
mysql -u root < backend/schema.sql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo mysql < backend/schema.sql
```

### 4. Test the Application

1. Open `http://localhost:5173` in your browser
2. Try analyzing: `torvalds` or `https://github.com/torvalds`
3. View analytics dashboard

## 📋 API Endpoints

### POST /api/ask
Ask a natural-language question about a GitHub profile (RAG).

**Request:**
```json
{ "question": "What is this developer strongest at?", "username": "torvalds" }
```

**Response:**
```json
{
  "success": true,
  "answer": "Based on the repositories, this developer is strongest at...",
  "sources": [ { "repo": "linux", "text": "..." } ]
}
```

### GET /api/rag/status
Check if RAG services (Ollama + ChromaDB) are available.

### POST /api/analyze
Analyze a GitHub profile.

**Request:**
```json
{ "username": "torvalds" }
```
or
```json
{ "url": "https://github.com/torvalds" }
```

**Response:**
```json
{
  "success": true,
  "profile": { ... },
  "analytics": { ... },
  "topRepositories": [ ... ]
}
```

### GET /api/profile/:username
Get stored profile data.

### GET /api/profiles
List all analyzed profiles with pagination and search.

### PUT /api/profile/:username
Refresh profile data from GitHub.

### DELETE /api/profile/:username
Delete a profile from database.

## 🌐 Deployment

### Frontend on Vercel

#### ⚡ Method 1: Direct Vercel CLI Deployment (Instant)
Deploy your latest local code directly to Vercel production using the Vercel CLI:

```bash
# Run from repository root or frontend folder
npx vercel --prod
```
*Live Production URL: [https://git-analyser-kappa.vercel.app/](https://git-analyser-kappa.vercel.app/)*

#### 🔄 Method 2: Automatic GitHub Push Deployment
Commit and push code directly to the `main` branch. GitHub and Vercel are connected to automatically trigger production builds:

```bash
git add .
git commit -m "feat: update feature"
git push origin main
```
*Vercel automatically detects the GitHub push, builds the `frontend`, and updates production.*

### Backend on Render

1. Create account on [Render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repository
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables
7. Deploy

### Database on Railway or PlanetScale

1. Set up MySQL database on Railway or PlanetScale
2. Update backend `.env` with new DB_HOST and credentials
3. Run `schema.sql` on cloud database

## 📊 What Gets Analyzed

- **Profile Stats**: Followers, following, repositories, gists
- **Repository Metrics**: Stars, forks, languages, descriptions
- **Analytics**: Total stars, total forks, average stars, top language
- **Most Starred Repository**: Best performing project

## 🎨 Design Features

- Professional SaaS aesthetic
- Clean, minimal color palette
- Soft shadows and rounded corners
- Smooth hover animations
- Fully responsive flexbox/grid layout
- No CSS frameworks (pure CSS)
- Mobile-first approach

## 🔒 Security

- MySQL parameterized queries (SQL injection prevention)
- CORS configuration
- Environment variables for secrets
- GitHub API token usage
- Error handling and validation

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
GITHUB_API_TOKEN=your_token
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=github_insight
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## 🤝 Common Issues & Solutions

### "User not found"
- GitHub username doesn't exist
- Try: `torvalds`, `gvanrossum`, `octocat`

### "GitHub API rate limit exceeded"
- Too many requests in short time
- Add GitHub Personal Access Token for higher limits
- Wait 1 hour for rate limit reset

### "Database connection refused"
- MySQL not running
- Check credentials in .env
- Verify database exists

### CORS errors
- Update `CORS_ORIGIN` in backend .env
- Frontend and backend running on different ports?

## 📚 Technologies Explained

- **React** - Component-based UI
- **Vite** - Extremely fast build tool
- **Express.js** - Minimal web framework
- **MySQL** - Reliable relational database
- **GitHub API** - Real GitHub data

## 💡 Customization Ideas

- Add user authentication
- Save favorites
- Compare multiple profiles
- Export analytics as PDF
- Dark mode toggle
- Advanced filtering
- GitHub activity timeline

## 📈 Performance

- Vite builds in milliseconds
- React optimizations
- Database indexes for fast queries
- Responsive images
- Efficient CSS

## 🎓 Learning Outcomes

Perfect for learning:
- Full-stack development
- REST API design
- React hooks
- Database design
- Responsive CSS
- API integration
- Deployment workflows

## 📄 License

MIT License

## 🙋 Support

- Check individual README files in frontend/ and backend/
- Review GitHub API documentation
- Test with sample usernames

## 🎯 Deployment Checklist

- [ ] Frontend build passes (`npm run build`)
- [ ] Backend tests connection
- [ ] Database is set up and migrated
- [ ] Environment variables are correct
- [ ] GitHub token is valid
- [ ] CORS is configured properly
- [ ] Frontend and backend can communicate
- [ ] All API endpoints work
- [ ] Responsive design tested on mobile
- [ ] Ready for production

## 🚀 Ready to Deploy!

This is a production-ready application. All files are included:

✅ Complete backend with Express.js  
✅ Complete frontend with React  
✅ Database schema with optimizations  
✅ Environment configuration  
✅ Professional CSS styling  
✅ Error handling  
✅ Responsive design  
✅ Deployment documentation  

Just run `npm install`, set up your environment variables, and deploy!

---

Built with ❤️ for your portfolio and career growth.
