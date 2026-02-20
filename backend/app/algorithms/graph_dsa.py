import igraph
import numpy as np
from typing import List, Dict


def get_dynamic_outdegree_cap(graph: igraph.Graph, multiplier: float = 2.0) -> int:
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
    return int(mean + (multiplier * std))


def find_cycles_dfs(graph: igraph.Graph, min_len: int = 3, max_len: int = 5) -> List[Dict]:
    """
    Detects circular money flows (cycles) of length 3 to 5 using iterative DFS.
    Returns a list of rings, where each ring is a dict with type, members, and metadata.

    Approach:
      - Iterative DFS with explicit stack — eliminates Python function call overhead
        that recursive DFS accumulates (millions of stack frames at scale)
      - Each stack frame stores (node, iterator over neighbors) so we resume
        exactly where we left off after exploring a subtree, enabling true backtracking
        without recursion
      - Single shared path list + path_set mutated in place — zero list copying
      - Dynamic out-degree cap (mean + 2*std) excludes statistical outlier nodes
      - O(1) cycle membership check via path_set
      - Deduplicates cycles via canonical rotation (smallest index first)
    """
    cycles      = []
    seen_cycles = set()

    cap = get_dynamic_outdegree_cap(graph)

    # Pre-build adjacency dict once — avoids repeated igraph API calls in hot loop
    adj = {}
    for v in graph.vs:
        idx = v.index
        adj[idx] = graph.successors(idx) if graph.outdegree(idx) <= cap else []

    candidates = [
        v.index for v in graph.vs
        if v.degree(mode="in") > 0 and 0 < v.degree(mode="out") <= cap
    ]

    path     = []   # current DFS path, mutated in place
    path_set = set()

    for start in candidates:
        if not adj[start]:
            continue

        # Each frame: (node, iterator_over_its_neighbors)
        # Using iterator means we resume from where we left off — true backtracking
        path.append(start)
        path_set.add(start)
        stack = [(start, iter(adj[start]))]

        while stack:
            node, neighbors_iter = stack[-1]

            try:
                neighbor = next(neighbors_iter)

                if neighbor == start:
                    # --- Cycle found ---
                    if min_len <= len(path) <= max_len:
                        cycle_indices = tuple(path)
                        min_pos   = cycle_indices.index(min(cycle_indices))
                        canonical = cycle_indices[min_pos:] + cycle_indices[:min_pos]

                        if canonical not in seen_cycles:
                            seen_cycles.add(canonical)
                            cycles.append({
                                "type"    : "Cycle",
                                "members" : [graph.vs[i]["name"] for i in cycle_indices],
                                "metadata": {"length": len(path)}
                            })

                elif neighbor not in path_set and len(path) < max_len:
                    # Go deeper
                    path.append(neighbor)
                    path_set.add(neighbor)
                    stack.append((neighbor, iter(adj[neighbor])))

            except StopIteration:
                # All neighbors of current node exhausted — backtrack
                stack.pop()
                path.pop()
                path_set.discard(node)

        # Clean up for next start node
        path.clear()
        path_set.clear()

    return cycles


def detect_shells(graph: igraph.Graph, min_hops: int = 3) -> List[Dict]:
    """
    Detects layered shell networks.
    Identifies chains of 3+ hops where intermediate nodes have low total degree (2-3),
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
