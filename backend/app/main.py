from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import igraph
import io
import time
import os
from typing import Dict, List, Any
from dotenv import load_dotenv
from groq import Groq
from app.algorithms.graph_dsa import find_cycles_dfs, detect_shells
from app.algorithms.temporal_dsa import detect_smurfing

# Load environment variables
load_dotenv()

app = FastAPI(title="Money Mule Detection Engine")

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq Client
groq_client = None
api_key = os.getenv("GROQ_API_KEY")
if api_key and "gsk_" in api_key:
    try:
        groq_client = Groq(api_key=api_key)
        print("Groq Client Initialized Successfully")
    except Exception as e:
        print(f"Failed to initialize Groq client: {e}")
else:
    print("WARNING: GROQ_API_KEY not found or invalid in .env. AI features will be disabled or mocked.")

@app.post("/analyze")
async def analyze_transactions(file: UploadFile = File(...)):
    start_time = time.time()
    
    # 1. Parsing
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        required_cols = {'transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp'}
        if not required_cols.issubset(df.columns):
            raise HTTPException(status_code=400, detail=f"Missing columns. Required: {required_cols}")
        
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {str(e)}")

    # 1b. Pre-calculate Account Stats
    inflow = df.groupby('receiver_id')['amount'].sum().to_dict()
    outflow = df.groupby('sender_id')['amount'].sum().to_dict()

    # 2. Graph Construction
    edges = list(zip(df['sender_id'].astype(str), df['receiver_id'].astype(str), df['amount']))
    graph = igraph.Graph.TupleList(edges, directed=True, edge_attrs="amount")
    all_accounts = graph.vs["name"]
    
    # 3. Execution (Sequential)
    rings = []
    suspicious_accounts = {} 
    
    # Algorithms
    cycles = find_cycles_dfs(graph, min_len=3, max_len=5)
    rings.extend(cycles)
    
    smurfs = detect_smurfing(df, window_hours=72, count_threshold=10)
    rings.extend(smurfs)
    
    shells = detect_shells(graph, min_hops=3)
    rings.extend(shells)
    
    # 4. Scoring & Formatting
    WEIGHTS = {
        "Cycle": 40,
        "Smurfing (Fan-In)": 30,
        "Smurfing (Fan-Out)": 30,
        "Layered Shell": 20
    }
    
    formatted_rings = []
    seen_ring_ids = set()

    for ring in rings:
        rtype = ring["type"]
        weight = WEIGHTS.get(rtype, 10)
        
        # Improved Ring ID generation to reduce conflicts and collisions
        # Sort members to ensure deterministic ID regardless of order
        sorted_members = sorted([str(m) for m in ring['members']])
        members_str = ",".join(sorted_members)
        
        # Use a larger hash range
        ring_hash = abs(hash(members_str + rtype)) % 100000
        ring_id = f"RING-{ring_hash:05d}"
        
        # Deduplication: If this ring ID has been seen, skip it (or handle collision)
        # For this logic, we assume same ID = same ring pattern, so we skip duplicates
        if ring_id in seen_ring_ids:
            continue
        seen_ring_ids.add(ring_id)
        
        ring_risk_score = min(100, weight + (len(ring['members']) * 2))
        
        ring_members_set = set(sorted_members)
        ring_val = 0
        try:
            v_indices = [graph.vs.find(name=str(m)).index for m in ring_members_set if str(m) in all_accounts]
            if v_indices:
                subgraph_edges = graph.es.select(_source_in=v_indices, _target_in=v_indices)
                ring_val = sum(e["amount"] for e in subgraph_edges)
        except Exception:
            ring_val = 0 
            
        formatted_rings.append({
            "ring_id": ring_id,
            "member_accounts": sorted_members,
            "pattern_type": rtype,
            "risk_score": ring_risk_score,
            "total_value": round(ring_val, 2)
        })
        
        for member in sorted_members:
            if member not in suspicious_accounts:
                suspicious_accounts[member] = {
                    "account_id": member,
                    "score": 0,
                    "detected_patterns": set(),
                    "ring_ids": set()
                }
            
            suspicious_accounts[member]["score"] += weight
            suspicious_accounts[member]["detected_patterns"].add(rtype)
            suspicious_accounts[member]["ring_ids"].add(ring_id)

    # Finalize Accounts
    final_accounts = []
    for acc in suspicious_accounts.values():
        acc_id = acc["account_id"]
        acc["suspicion_score"] = min(100, acc["score"])
        acc["detected_patterns"] = list(acc["detected_patterns"])
        acc["ring_id"] = ",".join(list(acc["ring_ids"]))
        
        acc["total_inflow"] = round(inflow.get(acc_id, 0.0) if isinstance(acc_id, str) else inflow.get(int(acc_id), 0.0), 2)
        acc["total_outflow"] = round(outflow.get(acc_id, 0.0) if isinstance(acc_id, str) else outflow.get(int(acc_id), 0.0), 2)
        acc["net_balance"] = round(acc["total_inflow"] - acc["total_outflow"], 2)

        del acc["score"]
        del acc["ring_ids"]
        final_accounts.append(acc)
    
    final_accounts.sort(key=lambda x: x["suspicion_score"], reverse=True)
    
    # 5. Graph Data
    vis_nodes = []
    sus_map = {acc['account_id']: acc for acc in final_accounts}
    
    for v in graph.vs:
        name = v["name"]
        acc_data = sus_map.get(name)
        is_suspicious = acc_data is not None
        score = acc_data["suspicion_score"] if is_suspicious else 0
        
        color = "#cccccc"
        if score > 50: color = "#ef4444"
        elif score > 0: color = "#f97316"
            
        vis_nodes.append({
            "id": name,
            "val": 1 + (score / 20),
            "color": color,
            "suspicion_score": score,
            "patterns": acc_data["detected_patterns"] if is_suspicious else [],
            "ring": acc_data["ring_id"] if is_suspicious else "",
            "inflow": round(inflow.get(name, 0.0), 2),
            "outflow": round(outflow.get(name, 0.0), 2)
        })
        
    vis_edges = []
    for e in graph.es:
        src = graph.vs[e.source]["name"]
        tgt = graph.vs[e.target]["name"]
        vis_edges.append({
            "source": src,
            "target": tgt,
            "amount": e["amount"]
        })

    processing_time = time.time() - start_time
    
    return {
        "suspicious_accounts": final_accounts,
        "fraud_rings": formatted_rings,
        "summary": {
            "total_accounts_analyzed": len(all_accounts),
            "suspicious_accounts_flagged": len(final_accounts),
            "fraud_rings_detected": len(formatted_rings),
            "processing_time_seconds": round(processing_time, 2)
        },
        "graph_data": {
            "nodes": vis_nodes,
            "links": vis_edges 
        }
    }

@app.post("/generate-sar")
async def generate_sar(ring: Dict[str, Any] = Body(...)):
    """
    Generates a Suspicious Activity Report (SAR) using Groq based on ring data.
    """
    if not groq_client:
        # Mock Response if no API key
        time.sleep(2)
        return {
            "executive_summary": "Simulated AI Response: Groq API Key is missing. This is a placeholder summary indicating that a suspicious ring was detected with circular flow characteristics.",
            "mule_herder": ring['member_accounts'][0] if ring.get('member_accounts') else "Unknown"
        }

    # Construct Prompt
    prompt = f"""
    You are an expert Financial Forensics Analyst for FinCEN.
    Analyze the following Fraud Ring data and generate a professional Suspicious Activity Report (SAR) snippet.
    
    Ring ID: {ring.get('ring_id')}
    Pattern Type: {ring.get('pattern_type')}
    Risk Score: {ring.get('risk_score')}/100
    Total Volume: ${ring.get('total_value', 0)}
    Member Accounts: {', '.join(ring.get('member_accounts', []))}
    
    Output strictly in JSON format with two keys:
    1. "executive_summary": A professional, 3-sentence summary of the suspicious activity, mentioning the typology (e.g. smurfing, cycle) and financial impact. Use "We have detected..." style.
    2. "mule_herder": Identify the likely central actor (account ID) and briefly explain why (e.g. "Account X initiated the flow"). If unsure, pick the first account.
    """

    try:
        completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a specialized financial crime detection AI. Output strictly valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        response_content = completion.choices[0].message.content
        import json
        return json.loads(response_content)

    except Exception as e:
        print(f"Groq API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
