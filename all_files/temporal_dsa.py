import pandas as pd
from typing import List, Dict

def detect_smurfing(df: pd.DataFrame, window_hours: int = 72, count_threshold: int = 10) -> List[Dict]:
    """
    Detects Smurfing (Fan-in / Fan-out) using sliding temporal windows.
    Fan-in: Many senders -> 1 receiver.
    Fan-out: 1 sender -> Many receivers.
    """
    results = []
    
    # Ensure timestamp is datetime
    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
    df = df.sort_values('timestamp')
    
    # --- Fan-in Detection (Receiver focus) ---
    # We want to count unique senders per receiver within 72h.
    # set_index to timestamp for rolling
    
    # Iterate through each receiver (group by is safer than global rolling for logic)
    # Optimization: Filter receivers with total degree < threshold first?
    # Total distinct senders check might be a good pre-filter.
    receiver_counts = df.groupby('receiver_id')['sender_id'].nunique()
    sus_receivers = receiver_counts[receiver_counts >= count_threshold].index.tolist()
    
    for receiver in sus_receivers:
        receiver_df = df[df['receiver_id'] == receiver].sort_values('timestamp')
        
        # We need to find if there exists a 72h window with >= 10 unique senders
        # Sliding window over the events
        # We can just iterate or use a rolling approach on the time index
        
        # Helper to check window
        # For every transaction, check how many unique senders in [t, t + 72h]
        # This is O(N^2) worst case per group, but N is small per group usually.
        # Faster: Use a deque or two pointers.
        
        # Vectorized rolling is hard with "unique" count.
        # Fallback to simple sliding window since we filtered candidates.
        
        times = receiver_df['timestamp'].values
        senders = receiver_df['sender_id'].values
        n = len(times)
        
        start = 0
        window_senders = {} # Map sender -> count in window
        distinct_count = 0
        
        found = False
        window_td = pd.Timedelta(hours=window_hours)
        
        for end in range(n):
            # Add current
            s_end = senders[end]
            if s_end not in window_senders:
                window_senders[s_end] = 0
                distinct_count += 1
            window_senders[s_end] += 1
            
            # Remove expired from left
            while times[end] - times[start] > window_td:
                s_start = senders[start]
                window_senders[s_start] -= 1
                if window_senders[s_start] == 0:
                    del window_senders[s_start]
                    distinct_count -= 1
                start += 1
            
            if distinct_count >= count_threshold:
                # Found a window
                results.append({
                    "type": "Smurfing (Fan-In)",
                    "members": [receiver] + list(window_senders.keys()), # Central + leaves
                    "metadata": {"central_node": receiver, "unique_peers": distinct_count}
                })
                found = True
                break # Report once per node to avoid noise
                
    # --- Fan-out Detection (Sender focus) ---
    sender_counts = df.groupby('sender_id')['receiver_id'].nunique()
    sus_senders = sender_counts[sender_counts >= count_threshold].index.tolist()
    
    for sender in sus_senders:
        sender_df = df[df['sender_id'] == sender].sort_values('timestamp')
        
        times = sender_df['timestamp'].values
        receivers = sender_df['receiver_id'].values
        n = len(times)
        
        start = 0
        window_receivers = {}
        distinct_count = 0
        window_td = pd.Timedelta(hours=window_hours)
        
        for end in range(n):
            r_end = receivers[end]
            if r_end not in window_receivers:
                window_receivers[r_end] = 0
                distinct_count += 1
            window_receivers[r_end] += 1
            
            while times[end] - times[start] > window_td:
                r_start = receivers[start]
                window_receivers[r_start] -= 1
                if window_receivers[r_start] == 0:
                    del window_receivers[r_start]
                    distinct_count -= 1
                start += 1
            
            if distinct_count >= count_threshold:
                results.append({
                    "type": "Smurfing (Fan-Out)",
                    "members": [sender] + list(window_receivers.keys()),
                    "metadata": {"central_node": sender, "unique_peers": distinct_count}
                })
                break

    return results
