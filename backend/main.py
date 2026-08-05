from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import sqlite3
import io
import os
from anthropic import Anthropic
from dotenv import load_dotenv
from typing import List

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))



@app.get("/")
def read_root():
    return {"message": "NaturalQuery API is running"}

@app.post("/upload")
async def upload_csv(files: List[UploadFile] = File(...)):
    if not files:
        return {"error": "No files provided"}
    
    tables = {}
    table_infos = {}
    
    for file in files:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        table_name = file.filename.replace(".csv", "").replace(" ", "_").lower()
        tables[table_name] = df
        
        conn = sqlite3.connect("data.db")
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        conn.close()
        
        table_infos[table_name] = {
            "columns": list(df.columns),
            "row_count": len(df),
            "preview": df.head(10).to_dict(orient="records")
        }
    
    return {
        "tables": list(tables.keys()),
        "table_infos": table_infos
    }

@app.post("/query")
async def query_data(request: dict):
    question = request.get("question")
    table = request.get("table")
    history = request.get("history", [])

    # 获取所有表的schema
    conn = sqlite3.connect("data.db")
    cursor = conn.cursor()
    
    # 获取数据库里所有表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    all_tables = [row[0] for row in cursor.fetchall()]
    
    # 为每个表获取列信息
    schema_info = {}
    for table_name in all_tables:
        cursor.execute(f"PRAGMA table_info({table_name})")
        cols = [row[1] for row in cursor.fetchall()]
        schema_info[table_name] = cols
    
    conn.close()

    # 构建schema描述
    schema_description = "Available tables:\n"
    for table_name, cols in schema_info.items():
        schema_description += f"- {table_name}: {', '.join(cols)}\n"

    prompt = f"""You are a SQL expert. Generate a SQLite query to answer this question.

{schema_description}

You can use JOIN if needed to combine data from multiple tables. Look for common columns (like 'id', 'user_id', etc.) to join tables.

Question: "{question}"

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

    try:
        cursor.execute(sql)
        rows = cursor.fetchall()
        col_names = [description[0] for description in cursor.description]
    except sqlite3.OperationalError as e:
        error_message = str(e)
        fix_prompt = f"""The SQL query failed with error: {error_message}
    
Original SQL: {sql}

Please provide a corrected SQL query for the question: "{question}"

Reply with ONLY the corrected SQL query, nothing else."""
        
        fix_message = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=500,
            messages=[{"role": "user", "content": fix_prompt}]
        )
        
        fixed_sql = fix_message.content[0].text.strip()
        fixed_sql = fixed_sql.replace("```sql", "").replace("```", "").strip()
        
        cursor.execute(fixed_sql)
        rows = cursor.fetchall()
        col_names = [description[0] for description in cursor.description]
        sql = fixed_sql

    conn.close()

    return {
        "sql": sql,
        "columns": col_names,
        "rows": rows
    }