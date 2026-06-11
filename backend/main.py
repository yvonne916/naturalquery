from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import sqlite3
import io
import os
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "NaturalQuery API is running"}

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    table_name = file.filename.replace(".csv", "").replace(" ", "_").lower()
    
    conn = sqlite3.connect("data.db")
    df.to_sql(table_name, conn, if_exists="replace", index=False)
    conn.close()
    
    return {
        "table_name": table_name,
        "columns": list(df.columns),
        "row_count": len(df),
        "preview": df.head(3).to_dict(orient="records")
    }

@app.post("/query")
async def query_data(request: dict):
    question = request.get("question")
    table_name = request.get("table_name")
    columns = request.get("columns")
    history = request.get("history", [])

    prompt = f"""You are a SQL expert helping analyze data. You have access to conversation history.

Table info:
- Table name: {table_name}
- Columns: {columns}

Use the conversation history to understand context like "they", "those", "it" etc.

Convert this question to a SQLite SQL query: "{question}"

Reply with ONLY the SQL query, nothing else."""

    messages = history + [{"role": "user", "content": prompt}]

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=500,
        messages=messages
    )

    sql = message.content[0].text.strip()
    sql = sql.replace("```sql", "").replace("```", "").strip()

    conn = sqlite3.connect("data.db")
    cursor = conn.cursor()
    cursor.execute(sql)
    rows = cursor.fetchall()
    col_names = [description[0] for description in cursor.description]
    conn.close()

    return {
        "sql": sql,
        "columns": col_names,
        "rows": rows
    }