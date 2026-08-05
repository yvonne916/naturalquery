# NaturalQuery

AI-powered conversational data analysis tool. Upload CSV files and ask questions in natural language to get instant SQL queries and visualizations.

## Features

- 🗂️ **Multi-file Upload** — Upload multiple CSV files independently
- 🤖 **Natural Language Queries** — Ask questions in plain English, AI generates SQL
- 🔗 **Intelligent Joins** — AI automatically determines when and how to join tables
- 📊 **Data Visualization** — Auto-generates charts for numeric results
- 💬 **Multi-turn Conversations** — Ask follow-up questions with context awareness
- 🛡️ **Error Recovery** — Automatic SQL error detection and correction
- ⚡ **Real-time Execution** — See results instantly as you type

## Tech Stack

**Frontend:**
- React 18 + Next.js 16.2
- TypeScript
- Tailwind CSS
- Recharts (data visualization)

**Backend:**
- FastAPI (Python)
- SQLite
- Claude API (Anthropic)
- Pandas (data processing)

**Deployment:**
- Railway (production)
- GitHub (version control)

## Project Structure

naturalquery/
├── frontend/
│ ├── app/
│ │ ├── components/
│ │ │ ├── Sidebar.tsx
│ │ │ ├── UploadArea.tsx
│ │ │ ├── DatasetSelector.tsx
│ │ │ ├── PreviewTable.tsx
│ │ │ ├── ChatMessage.tsx
│ │ │ └── QueryInput.tsx
│ │ └── page.tsx
│ └── package.json
│
├── backend/
│ ├── main.py
│ ├── requirements.txt
│ ├── .env
│ └── venv/
│
└── README.md


## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Anthropic API key

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
ANTHROPIC_API_KEY=your_api_key_here
```

5. Start backend server:
```bash
uvicorn main:app --reload
```

Backend runs on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Usage

1. **Upload Data** — Click the upload area to select CSV files
2. **Select Dataset** — Choose which dataset to preview
3. **Ask Questions** — Type natural language queries:
   - "Show me all users from USA"
   - "What's the average age?"
   - "Count orders by country"
   - "Show users with orders over $100"
4. **View Results** — See SQL queries, tables, and auto-generated charts
5. **Follow Up** — Ask related questions; context is maintained across conversation

## How It Works

### Data Flow

CSV Upload
↓
Parse & Store (SQLite)
↓
User Question
↓
Generate Prompt with Schema
↓
Claude API (SQL Generation)
↓
Execute Query (SQLite)
↓
Return Results + Visualization


### Key Technical Decisions

**No Auto-join on Upload:**
- Keeps data independent and clean
- AI decides join strategy based on user question
- More flexible for complex queries

**Single Dataset Preview:**
- Cleaner UX
- Users see what they're querying
- Easier to understand data structure

**Error Recovery:**
- AI automatically fixes SQL syntax errors
- Reduces user frustration
- Transparent process (shows original + fixed SQL)

**Component Architecture:**
- Modular, reusable components
- Easy to maintain and extend
- Clear separation of concerns

## Example Queries

Given a dataset with `users`, `orders`, and `reviews` tables:

Q: "Show me users with the most orders"
→ SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id
ORDER BY order_count DESC

Q: "Which products have the highest average rating?"
→ SELECT r.product, AVG(r.rating) as avg_rating
FROM reviews r
GROUP BY r.product
ORDER BY avg_rating DESC

Q: "Total spending by country"
→ SELECT u.country, SUM(o.amount) as total
FROM users u
JOIN orders o ON u.id = o.user_id
GROUP BY u.country


## Limitations & Future Work

### Current Limitations
- SQLite only (no complex databases)
- CSV files max ~10MB
- Limited to SQL queries (no complex analytics)
- No user authentication

### Future Improvements
- [ ] Support PostgreSQL, MySQL
- [ ] Query result caching
- [ ] Saved query history
- [ ] User authentication & sharing
- [ ] More visualization types (line, pie, scatter)
- [ ] Explain query results in natural language
- [ ] Export results (CSV, PDF)
- [ ] Batch query processing

## Performance

- Average query response: 2-3 seconds
- SQL generation: ~1 second
- Database operations: <100ms for typical datasets

## Architecture Decisions

### Why Claude API?
- Superior SQL generation understanding
- Multi-turn conversation support
- Built-in error recovery capability
- Cost-effective for small datasets

### Why SQLite?
- Zero setup, file-based
- Perfect for CSV analysis
- ACID compliance
- Sufficient for typical datasets

### Why React Components?
- Reusability
- Easier testing
- Clear component boundaries
- Scalability for future features

## Development

### Running Tests
```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
pytest
```

### Code Style
- Frontend: ESLint + Prettier
- Backend: Black + isort

### Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## Deployment

### Deploy on Railway

1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Set environment variables:
   - `ANTHROPIC_API_KEY`
4. Railway auto-deploys on push

Live demo: [Add your Railway URL here after deployment]

## API Reference

### POST `/upload`
Upload CSV files and create datasets.

**Request:**
```json
{
  "files": [File, File, ...]
}
```

**Response:**
```json
{
  "tables": ["users", "orders"],
  "table_infos": {
    "users": {
      "columns": ["id", "name", "age"],
      "row_count": 100,
      "preview": [...]
    }
  }
}
```

### POST `/query`
Execute natural language query against dataset.

**Request:**
```json
{
  "question": "Show me all users",
  "table": "users",
  "history": []
}
```

**Response:**
```json
{
  "sql": "SELECT * FROM users",
  "columns": ["id", "name", "age"],
  "rows": [[1, "Alice", 25], ...]
}
```

## Learnings & Insights

### Frontend
- Component decomposition improves maintainability
- TypeScript catches errors early
- Tailwind CSS speeds up development

### Backend
- CORS must be configured before routes
- Schema introspection enables flexible queries
- Error recovery improves UX significantly

### AI Integration
- Prompt engineering is critical for SQL generation
- Maintaining conversation history enables context-aware queries
- Error messages help AI self-correct

## License

MIT License - see LICENSE file for details

## Author

**Nuo Chen**
- GitHub: [@yvonne916](https://github.com/yvonne916)
- Email: nuoaqua888@gmail.com

## Acknowledgments

- Anthropic Claude API for SQL generation
- Recharts for beautiful data visualization
- FastAPI for rapid backend development
- Next.js for seamless frontend experience

---

**Last Updated:** August 2026
**Status:** Active Development
