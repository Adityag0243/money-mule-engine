from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import igraph
import io
import time
from typing import Dict, List, Any
from app.algorithms.graph_dsa import find_cycles_dfs, detect_shells
from app.algorithms.temporal_dsa import detect_smurfing

app = FastAPI(title="Money Mule Detection Engine")

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

    # 2. Graph Construction
    edges = list(zip(df['sender_id'].astype(str), df['receiver_id'].astype(str)))
    graph = igraph.Graph.TupleList(edges, directed=True)
    all_accounts = graph.vs["name"]
    
    # 3. Execution (Sequential)
    rings = []
    suspicious_accounts = {} # map id -> dict
    
    # Algorithm 1: Cycles
    cycles = find_cycles_dfs(graph, min_len=3, max_len=5)
    rings.extend(cycles)
    
    # Algorithm 2: Smurfing
    smurfs = detect_smurfing(df, window_hours=72, count_threshold=10)
    rings.extend(smurfs)
    
    # Algorithm 3: Shells
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

    for ring in rings:
        rtype = ring["type"]
        weight = WEIGHTS.get(rtype, 10)
        
        # Ring ID
        ring_id = f"RING-{abs(hash(str(ring['members']) + rtype)) % 10000:04d}"
        
        # Calculate Ring Risk Score (Max of implied weight or specific logic)
        # For simple logic, we assign the base weight + bonus for size
        ring_risk_score = min(100, weight + (len(ring['members']) * 2))
        
        formatted_rings.append({
            "ring_id": ring_id,
            "member_accounts": [str(m) for m in ring["members"]],
            "pattern_type": rtype,
            "risk_score": ring_risk_score
        })
        
        for member in ring["members"]:
            member = str(member)
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

    # Finalize Suspicious Accounts
    final_accounts = []
    for acc in suspicious_accounts.values():
        acc["suspicion_score"] = min(100, acc["score"])
        acc["detected_patterns"] = list(acc["detected_patterns"])
        # Join multiple rings with comma if any
        acc["ring_id"] = ",".join(list(acc["ring_ids"]))
        
        # Remove internal keys
        del acc["score"]
        del acc["ring_ids"]
        
        final_accounts.append(acc)
    
    # Sort accounts by score desc
    final_accounts.sort(key=lambda x: x["suspicion_score"], reverse=True)
    
    # 5. Graph Data Visualization
    vis_nodes = []
    sus_map = {acc['account_id']: acc for acc in final_accounts}
    
    for v in graph.vs:
        name = v["name"]
        acc_data = sus_map.get(name)
        
        is_suspicious = acc_data is not None
        score = acc_data["suspicion_score"] if is_suspicious else 0
        
        # Node Color: Red > 50, Orange > 0, Grey otherwise
        color = "#cccccc"
        if score > 50:
            color = "#ef4444" # red-500
        elif score > 0:
            color = "#f97316" # orange-500
            
        vis_nodes.append({
            "id": name,
            "val": 1 + (score / 20), # size
            "color": color,
            "suspicion_score": score,
            # Add details for hover
            "patterns": acc_data["detected_patterns"] if is_suspicious else [],
            "ring": acc_data["ring_id"] if is_suspicious else ""
        })
        
    vis_edges = []
    for e in graph.es:
        src = graph.vs[e.source]["name"]
        tgt = graph.vs[e.target]["name"]
        vis_edges.append({
            "source": src,
            "target": tgt
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
