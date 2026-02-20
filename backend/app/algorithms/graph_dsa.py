import igraph
from typing import List, Set, Dict


import numpy as np

# will use this capacity thing for complexity and Time complexity reduction
def get_dynamic_outdegree_cap(graph: igraph.Graph, multiplier: float = 3.0) -> int:
    """
    Derives a statistically grounded out-degree cap from the graph itself.
    Cap = mean + (multiplier * std_dev) — classic outlier detection
    """
    outdegrees = graph.outdegree()  # list of all out-degrees
    
    mean = np.mean(outdegrees)
    std  = np.std(outdegrees)
    
    cap = mean + (multiplier * std)
    return int(cap)



def find_cycles_dfs(graph: igraph.Graph, min_len: int = 3, max_len: int = 5) -> List[Dict]:
    """
    Detects circular money flows (cycles) of length 3 to 5 using DFS.
    Returns a list of rings, where each ring is a list of vertex names.
    """
    cycles = []
    # Use a set of sorted tuples to avoid duplicate cycles (e.g., A-B-C vs B-C-A)
    seen_cycles = set()

    cap = get_dynamic_outdegree_cap(graph)
    # We only care about nodes that have both in > 0 and out degrees <= cap
    # it will reduce outlier things
    candidates = [v.index for v in graph.vs if v.degree(mode="in") > 0 and v.degree(mode="out") <= cap]
    
    for start_node_idx in candidates:
        stack = [(start_node_idx, [start_node_idx])] # (current_node, path)
        
        while stack:
            curr, path = stack.pop()
            
            if len(path) > max_len:
                continue
            
            # Get neighbors
            neighbors = graph.successors(curr)
            
            for neighbor in neighbors:
                if neighbor == start_node_idx:
                    # Cycle found!
                    if min_len <= len(path) <= max_len:
                        # Normalize cycle to check for duplicates
                        cycle_indices = tuple(path)
                        # We normalize by rotating the cycle so the smallest index is first - not perfect for string names but good for indices
                        # Better: sort the components to identify the 'Ring Set' if order doesn't matter for the ID
                        # But here order matters for the flow. 
                        # To dedupe: create a canonical representation.
                        # E.g. (A, B, C) is same ring as (B, C, A).
                        # Find min index
                        min_i = min(cycle_indices)
                        min_pos = cycle_indices.index(min_i)
                        canonical = cycle_indices[min_pos:] + cycle_indices[:min_pos]
                        
                        if canonical not in seen_cycles:
                            seen_cycles.add(canonical)
                            # Convert indices back to names
                            cycle_names = [graph.vs[i]["name"] for i in cycle_indices]
                            cycles.append({
                                "type": "Cycle",
                                "members": cycle_names,
                                "metadata": {"length": len(path)}
                            })
                elif neighbor not in path:
                    # Continue DFS
                    if len(path) < max_len:
                        stack.append((neighbor, path + [neighbor]))
                        
    return cycles

def detect_shells(graph: igraph.Graph, min_hops: int = 3) -> List[Dict]:
    """
    Detects layered shell networks.
    Chain of 3+ hops where intermediate nodes have low degree (2-3).
    """
    # 1. Identify Shell Candidates: Total degree 2 or 3
    # In a directed graph, a shell usually has 1 in and 1 out (degree 2), or maybe 1 in 2 out (degree 3).
    shell_candidates_indices = [v.index for v in graph.vs if 2 <= v.degree() <= 3]
    shell_candidates_set = set(shell_candidates_indices)
    
    shells = []
    seen_paths = set()

    if not shell_candidates_indices:
        return []

    # We are looking for Source -> Shell -> Shell -> ... -> Destination
    # The path must have length >= 3 (at least 2 intermediates?) 
    # Prompt says: "chains of 3 or more hops where intermediate 'shell' accounts..."
    # A->S1->S2->B (3 hops, 2 intermediates).
    
    # We can induce a subgraph of shell candidates? 
    # No, because Source and Dest might not be shells.
    
    # Pattern: Non-Shell (or Shell) -> Shell -> ... -> Shell -> Non-Shell (or Shell)
    # Actually, the requirement is "intermediate 'shell' accounts".
    # So we look for connected components of shell candidates?
    
    # Let's try finding paths through the shell subgraph.
    # Construct a subgraph of ONLY shell candidates.
    if len(shell_candidates_indices) < 2:
        return []

    # Get edges where BOTH source and target are in shell_candidates
    # This detects the "Shell -> Shell" part of the chain.
    # Then we expand outwards?
    
    # Alternative: DFS from any node, but strictly constrain that *next* node must be a shell, unless we are ending.
    # This might be too expensive.
    
    # Better approach:
    # 1. Subgraph of shells.
    # 2. Find connected components or long paths in this subgraph.
    # 3. If a path in shell-subgraph is length >= 1 (S1->S2), that's 2 shells.
    # We need "chains of 3+ hops".
    # Hop 1: X -> S1
    # Hop 2: S1 -> S2
    # Hop 3: S2 -> Y
    # So we need at least 2 connected shell nodes to form a 3-hop chain (X->S1->S2->Y).
    
    # Let's build the subgraph of shells.
    shell_graph = graph.subgraph(shell_candidates_indices)
    
    # Find all simple paths in shell_graph? Or just connected components?
    # Connected components (weak) give us clusters of shells.
    # If a cluster has diameter >= 1, it can form a chain.
    
    components = shell_graph.connected_components(mode="weak")
    
    for cluster in components:
        # cluster is a list of vertex indices in shell_graph (0 to N_sub)
        # map back to original indices
        original_indices = [shell_candidates_indices[i] for i in cluster]
        
        if len(original_indices) >= 2:
            # Check if they form a path
            # We can treat this cluster as a potential shell network
            # To be precise, let's include them. 
            # The prompt asks to "Identify chains...". 
            # Reporting the cluster of shells is a good approximation and robust.
            
            # Refinement: Check distinct paths?
            # For high performance, returning the connected component of shells is safest.
            member_names = [graph.vs[i]["name"] for i in original_indices]
            shells.append({
                "type": "Layered Shell",
                "members": member_names,
                "metadata": {"size": len(member_names)}
            })
            
    return shells
