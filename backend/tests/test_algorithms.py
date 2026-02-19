import unittest
import igraph
import pandas as pd
from datetime import datetime, timedelta
from app.algorithms.graph_dsa import find_cycles_dfs, detect_shells
from app.algorithms.temporal_dsa import detect_smurfing

class TestAlgorithms(unittest.TestCase):
    def test_cycle_detection(self):
        # Create A -> B -> C -> A
        g = igraph.Graph.TupleList([("A", "B"), ("B", "C"), ("C", "A")], directed=True)
        cycles = find_cycles_dfs(g, min_len=3, max_len=5)
        self.assertEqual(len(cycles), 1)
        self.assertEqual(set(cycles[0]["members"]), {"A", "B", "C"})
        
    def test_shell_detection(self):
        # Create Source -> S1 -> S2 -> Dest
        # Source (deg 1), S1 (deg 2), S2 (deg 2), Dest (deg 1)
        # Add some noise to Source/Dest to ensure they aren't shells
        # Source: Out=1, In=0 -> Total=1. Not shell.
        # S1: In=1, Out=1 -> Total=2. Shell.
        # S2: In=1, Out=1 -> Total=2. Shell.
        # Dest: In=1, Out=0 -> Total=1. Not shell.
        
        edges = [("Source", "S1"), ("S1", "S2"), ("S2", "Dest")]
        g = igraph.Graph.TupleList(edges, directed=True)
        shells = detect_shells(g, min_hops=3)
        self.assertEqual(len(shells), 1)
        self.assertTrue("S1" in shells[0]["members"])
        self.assertTrue("S2" in shells[0]["members"])

    def test_smurfing_fan_in(self):
        # Receiver R receives from S1..S10 in 2 hours
        data = []
        base_time = datetime(2023, 1, 1, 10, 0, 0)
        for i in range(10):
            data.append({
                "sender_id": f"S{i}",
                "receiver_id": "R",
                "amount": 100,
                "timestamp": base_time + timedelta(minutes=i*10)
            })
        df = pd.DataFrame(data)
        results = detect_smurfing(df, count_threshold=10)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["type"], "Smurfing (Fan-In)")
        self.assertEqual(results[0]["members"][0], "R")

if __name__ == '__main__':
    unittest.main()
