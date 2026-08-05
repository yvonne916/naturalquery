from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
from anthropic import Anthropic
import os
from dotenv import load_dotenv
import io
from pymongo import MongoClient
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Anthropic()
api_key = os.getenv("ANTHROPIC_API_KEY")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
mongo_client = MongoClient(MONGODB_URI)
db = mongo_client["naturalquery"]
tables_collection = db["tables"]
data_collection = db["data"]

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
        
        df_dict = df.to_dict(orient='records')
        data_collection.delete_many({"table": table_name})
        if df_dict:
            data_collection.insert_many([{**row, "table": table_name} for row in df_dict])
        
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

    all_tables = data_collection.distinct("table")
    
    schema_info = {}
    for table_name in all_tables:
        sample_doc = data_collection.find_one({"table": table_name})
        if sample_doc:
            cols = [k for k in sample_doc.keys() if k != "table" and k != "_id"]
            schema_info[table_name] = cols

    schema_description = "Available tables:\n"
    for table_name, cols in schema_info.items():
        schema_description += f"- {table_name}: {', '.join(cols)}\n"

    prompt = f"""You are a SQL expert. Generate a SQLite query to answer this question.

{schema_description}

You can use JOIN if needed to combine data from multiple tables.

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

    try:
        rows = execute_sql_on_mongodb(sql, table)
        col_names = list(rows[0].keys()) if rows else []
    except Exception as e:
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
        
        rows = execute_sql_on_mongodb(fixed_sql, table)
        col_names = list(rows[0].keys()) if rows else []
        sql = fixed_sql

    return {
        "sql": sql,
        "columns": col_names,
        "rows": [[row.get(col) for col in col_names] for row in rows]
    }

def execute_sql_on_mongodb(sql: str, table: str):
    import sqlite3
    
    conn = sqlite3.connect(":memory:")
    
    all_tables = data_collection.distinct("table")
    for t in all_tables:
        docs = list(data_collection.find({"table": t}, {"_id": 0, "table": 0}))
        if docs:
            df = pd.DataFrame(docs)
            df.to_sql(t, conn, if_exists="replace", index=False)
    
    cursor = conn.cursor()
    cursor.execute(sql)
    rows = cursor.fetchall()
    
    if rows:
        col_names = [description[0] for description in cursor.description]
        return [dict(zip(col_names, row)) for row in rows]
    
    conn.close()
    return []