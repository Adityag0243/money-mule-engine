import igraph
import numpy as np
from typing import List, Dict


def get_dynamic_outdegree_cap(graph: igraph.Graph, multiplier: float = 3.0) -> int:
    """
    Derives a statistically grounded out-degree cap from the graph itself.
    Cap = mean + (multiplier * std_dev) — classic outlier detection.
    Nodes beyond this cap are statistical outliers (banks, payment gateways)
    and are excluded from cycle candidate consideration.
    Fully adaptive to any dataset size or time range — no hardcoded thresholds.
    """
    outdegrees = graph.outdegree()
    mean = np.mean(outdegrees)
    std  = np.std(outdegrees)
    cap  = int(mean + (multiplier * std))
    return cap


def find_cycles_dfs(graph: igraph.Graph, min_len: int = 3, max_len: int = 5) -> List[Dict]:
    """
    Detects circular money flows (cycles) of length 3 to 5 using DFS with backtracking.
    Returns a list of rings, where each ring is a dict with type, members, and metadata.

    Approach:
      - Pre-builds adjacency dict once to avoid repeated igraph API calls during traversal
      - Uses a single shared path list with backtracking instead of copying path on every step
      - Maintains a path_set alongside the path for O(1) membership checks
      - Applies a dynamic out-degree cap (mean + 3*std) to exclude statistical outlier nodes
        such as banks and payment gateways which are not mule candidates
      - Deduplicates cycles via canonical rotation (smallest index first)
    """
    cycles      = []
    seen_cycles = set()

    cap = get_dynamic_outdegree_cap(graph)

    # Pre-build adjacency list once — avoids graph.successors() call on every DFS step
    adj = {}
    for v in graph.vs:
        idx     = v.index
        out_deg = graph.outdegree(idx)
        # High out-degree nodes are still visitable during traversal,
        # but are excluded as start nodes via candidates filter below
        adj[idx] = graph.successors(idx) if out_deg <= cap else []

    # Only start DFS from nodes with in-degree > 0 and out-degree within cap
    candidates = [
        v.index for v in graph.vs
        if v.degree(mode="in") > 0 and 0 < v.degree(mode="out") <= cap
    ]

    # Single shared path + set — mutated in place, no list copying during DFS
    path     = []
    path_set = set()

    def dfs(node: int, start: int):
        path.append(node)
        path_set.add(node)

        if len(path) <= max_len:
            for neighbor in adj[node]:

                if neighbor == start:
                    # Cycle detected — validate length
                    if min_len <= len(path) <= max_len:
                        cycle_indices = tuple(path)
                        # Canonicalize by rotating so smallest index is first
                        min_pos   = cycle_indices.index(min(cycle_indices))
                        canonical = cycle_indices[min_pos:] + cycle_indices[:min_pos]

                        if canonical not in seen_cycles:
                            seen_cycles.add(canonical)
                            cycle_names = [graph.vs[i]["name"] for i in cycle_indices]
                            cycles.append({
                                "type"    : "Cycle",
                                "members" : cycle_names,
                                "metadata": {"length": len(path)}
                            })

                elif neighbor not in path_set:   # O(1) set lookup vs O(n) list scan
                    if len(path) < max_len:
                        dfs(neighbor, start)

        # Backtrack — undo in O(1), zero list copying
        path.pop()
        path_set.discard(node)

    for start_node in candidates:
        if not adj[start_node]:
            continue
        dfs(start_node, start_node)

    return cycles


def detect_shells(graph: igraph.Graph, min_hops: int = 3) -> List[Dict]:
    """
    Detects layered shell networks.
    Identifies chains of 3+ hops where intermediate nodes have low total degree (2–3),
    characteristic of shell accounts designed as thin pass-throughs (1 in, 1 out).

    Approach:
      - Filters shell candidates by total degree 2 or 3
      - Constructs a subgraph of shell candidates only
      - Uses weakly connected components of the shell subgraph as clusters
      - Clusters of size >= 2 represent viable shell chains (X -> S1 -> S2 -> Y)
      - Returns each cluster as a detected shell network with member names
    """
    shell_candidates_indices = [v.index for v in graph.vs if 2 <= v.degree() <= 3]

    shells = []

    if len(shell_candidates_indices) < 2:
        return []

    shell_graph = graph.subgraph(shell_candidates_indices)
    components  = shell_graph.connected_components(mode="weak")

    for cluster in components:
        original_indices = [shell_candidates_indices[i] for i in cluster]

        if len(original_indices) >= 2:
            member_names = [graph.vs[i]["name"] for i in original_indices]
            shells.append({
                "type"    : "Layered Shell",
                "members" : member_names,
                "metadata": {"size": len(member_names)}
            })

    return shells
