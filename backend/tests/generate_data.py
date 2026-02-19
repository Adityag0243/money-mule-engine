import pandas as pd
import numpy as np
import uuid
from datetime import datetime, timedelta
import random

# Constants
TOTAL_TRANSACTIONS = 10000
START_DATE = datetime(2026, 2, 1)

def random_date(start, end):
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def generate_synthetic_data():
    transactions = []
    
    # 1. Generate Baseline "Legitimate" Noise
    # Creates thousands of normal accounts trading back and forth
    print("Generating baseline transactions...")
    normal_accounts = [f"ACC_NORM_{i}" for i in range(2000)]
    for _ in range(TOTAL_TRANSACTIONS - 200): # Reserve 200 for fraud patterns
        t_time = random_date(START_DATE, START_DATE + timedelta(days=30))
        transactions.append({
            "transaction_id": f"TXN_{uuid.uuid4().hex[:8]}",
            "sender_id": random.choice(normal_accounts),
            "receiver_id": random.choice(normal_accounts),
            "amount": round(random.uniform(10.0, 5000.0), 2),
            "timestamp": t_time.strftime("%Y-%m-%d %H:%M:%S")
        })

    # 2. Inject Pattern 1: Circular Fund Routing (Cycles 3-5 hops)
    print("Injecting Cycle Patterns...")
    for cycle_id in range(5):
        length = random.randint(3, 5) # Detect cycles of length 3 to 5
        cycle_nodes = [f"ACC_CYC_{cycle_id}_{i}" for i in range(length)]
        base_amount = round(random.uniform(1000, 5000), 2)
        
        for i in range(length):
            sender = cycle_nodes[i]
            receiver = cycle_nodes[(i + 1) % length] # Loop back to start
            # Keep times sequential
            t_time = START_DATE + timedelta(days=cycle_id, hours=i)
            transactions.append({
                "transaction_id": f"TXN_{uuid.uuid4().hex[:8]}",
                "sender_id": sender,
                "receiver_id": receiver,
                "amount": base_amount - (i * 10), # Slight decay for realism
                "timestamp": t_time.strftime("%Y-%m-%d %H:%M:%S")
            })

    # 3. Inject Pattern 2: Smurfing (Fan-in and Fan-out within 72 hrs)
    print("Injecting Smurfing Patterns...")
    # Fan-in: Multiple accounts send to one aggregator (10+ senders -> 1 receiver)
    aggregator = "ACC_SMURF_AGGREGATOR"
    base_time_fan_in = START_DATE + timedelta(days=10)
    for i in range(15): # 15 senders to guarantee it hits the 10+ threshold
        sender = f"ACC_SMURF_IN_{i}"
        # Transactions within a 72-hour window are more suspicious
        t_time = base_time_fan_in + timedelta(hours=random.randint(1, 70)) 
        transactions.append({
            "transaction_id": f"TXN_{uuid.uuid4().hex[:8]}",
            "sender_id": sender,
            "receiver_id": aggregator,
            "amount": round(random.uniform(9000.0, 9900.0), 2), # Just under typical 10k reporting thresholds
            "timestamp": t_time.strftime("%Y-%m-%d %H:%M:%S")
        })

    # Fan-out: One account disperses to many receivers (1 sender -> 10+ receivers)
    disperser = "ACC_SMURF_DISPERSER"
    base_time_fan_out = START_DATE + timedelta(days=15)
    for i in range(12):
        receiver = f"ACC_SMURF_OUT_{i}"
        t_time = base_time_fan_out + timedelta(hours=random.randint(1, 70))
        transactions.append({
            "transaction_id": f"TXN_{uuid.uuid4().hex[:8]}",
            "sender_id": disperser,
            "receiver_id": receiver,
            "amount": round(random.uniform(500.0, 800.0), 2),
            "timestamp": t_time.strftime("%Y-%m-%d %H:%M:%S")
        })

    # 4. Inject Pattern 3: Layered Shell Networks
    # Chains of 3+ hops where intermediate accounts have only 2-3 total transactions
    print("Injecting Layered Shell Networks...")
    for shell_chain in range(3):
        src = f"ACC_SHELL_SRC_{shell_chain}"
        shell1 = f"ACC_SHELL_INT1_{shell_chain}"
        shell2 = f"ACC_SHELL_INT2_{shell_chain}"
        dst = f"ACC_SHELL_DST_{shell_chain}"
        
        chain_time = START_DATE + timedelta(days=20+shell_chain)
        
        # Hop 1: Src -> Shell1
        transactions.append({
            "transaction_id": f"TXN_{uuid.uuid4().hex[:8]}",
            "sender_id": src, "receiver_id": shell1,
            "amount": 5000.00, "timestamp": (chain_time).strftime("%Y-%m-%d %H:%M:%S")
        })
        # Hop 2: Shell1 -> Shell2 (Shell1 now has exactly 2 transactions: 1 in, 1 out)
        transactions.append({
            "transaction_id": f"TXN_{uuid.uuid4().hex[:8]}",
            "sender_id": shell1, "receiver_id": shell2,
            "amount": 4950.00, "timestamp": (chain_time + timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")
        })
        # Hop 3: Shell2 -> Dst (Shell2 now has exactly 2 transactions: 1 in, 1 out)
        transactions.append({
            "transaction_id": f"TXN_{uuid.uuid4().hex[:8]}",
            "sender_id": shell2, "receiver_id": dst,
            "amount": 4900.00, "timestamp": (chain_time + timedelta(hours=4)).strftime("%Y-%m-%d %H:%M:%S")
        })

    # Compile and shuffle so the fraud isn't clumped at the bottom of the CSV
    print("Compiling and shuffling dataset...")
    df = pd.DataFrame(transactions)
    
    # Sort by timestamp to simulate a real chronological database export
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df = df.sort_values(by='timestamp').reset_index(drop=True)
    
    # Export to CSV
    filename = "test_10k_transactions.csv"
    df.to_csv(filename, index=False)
    print(f"Dataset successfully generated: {filename} with {len(df)} rows.")

if __name__ == "__main__":
    generate_synthetic_data()