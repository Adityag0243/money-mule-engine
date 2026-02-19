# Money Mule Detection Engine - Walkthrough

## Overview
A web-based forensic tool to detect Circular Trading, Smurfing, and Shell Networks using deterministic graph algorithms.

## Prerequisite
- Python 3.8+
- Node.js 18+

## Setup

### 1. Backend Setup
1. Navigate to the project root.
2. Install Python dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
   Server will start at `http://localhost:8000`.

### 2. Frontend Setup
1. Navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   App will open at `http://localhost:3000`.

## Features
- **Cycles**: DFS-based search for 3-5 hop loops.
- **Smurfing**: 72-hour sliding window analysis for Fan-In/Fan-Out patterns.
- **Shells**: Structural analysis of low-degree node chains.
- **Visualization**: Interactive 2D force-directed graph (Canvas based).
