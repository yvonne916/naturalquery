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
async def upload_csv(files: List[UploadFile] = File(...)):
    print(f"Received {len(files)} files")
    tables = {}
    
    for file in files:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        table_name = file.filename.replace(".csv", "").replace(" ", "_").lower()
        tables[table_name] = df
    
    if len(tables) == 1:
        table_name = list(tables.keys())[0]
        df = tables[table_name]
        conn = sqlite3.connect("data.db")
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        conn.close()
        
        return {
            "tables": [table_name],
            "all_columns": list(df.columns),
            "selected_columns": list(df.columns),
            "row_count": len(df),
            "preview": df.head(3).to_dict(orient="records")
        }
    
    joined_df = list(tables.values())[0]
    table_names = list(tables.keys())
    
    for i in range(1, len(tables)):
        other_df = list(tables.values())[i]

        join_key = None
        for key in ["id", "user_id", "customer_id", "product_id"]:
            if key in joined_df.columns and key in other_df.columns:
                join_key = key
                break
        
        if join_key:
            joined_df = joined_df.merge(other_df, on=join_key, how="inner")
    
    final_table_name = "_".join(table_names)
    conn = sqlite3.connect("data.db")
    joined_df.to_sql(final_table_name, conn, if_exists="replace", index=False)
    conn.close()
    
    # 获取column来源信息 - 精确追踪
    column_sources = {}

# 先记录每个原始表的columns
    table_columns = {}
    for table_name, df in tables.items():
        table_columns[table_name] = set(df.columns)

# 然后对joined_df的每个column，检查它来自哪个table
    for col in joined_df.columns:
        sources = []
        for table_name in table_names:
            if col in table_columns.get(table_name, set()):
                sources.append(table_name)
            column_sources[col] = sources if sources else table_names  # 如果找不到，默认来自所有

    return {
        "tables": table_names,
        "all_columns": list(joined_df.columns),
        "column_sources": column_sources,
        "selected_columns": list(joined_df.columns),
        "row_count": len(joined_df),
        "preview": joined_df.head(3).to_dict(orient="records")
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