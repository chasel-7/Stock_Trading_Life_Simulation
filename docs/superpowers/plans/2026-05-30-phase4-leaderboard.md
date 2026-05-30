# Phase 4: 全能排行榜 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "All-Rounder" leaderboard (🏅 全能榜) that ranks players by weighted sum of their 4-axis radar scores.

**Architecture:** Backend adds a new `GET /leaderboard` endpoint that queries `game_records`, parses the `score_metrics` JSON column, computes the weighted overall score, and returns top N. Frontend adds a tab in the lobby to switch between "Total Return" and "All-Rounder" views.

**Tech Stack:** Python/FastAPI, SQLModel, React

**Depends on:** None (independent feature, can be built in parallel with Phase 2/3)

---

### Task 1: Create Leaderboard API Endpoint

**Files:**
- Create: `backend/app/api/endpoints/leaderboard.py`

- [ ] **Step 1: Create the leaderboard endpoint**

Create `backend/app/api/endpoints/leaderboard.py`:

```python
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session
from app.database.db import get_db
from app.models.game_record import GameRecord
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    score: float
    detail: Optional[dict] = None


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(
    type: str = Query("profit", description="'profit' for total return, 'overall' for all-rounder"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Get leaderboard rankings.
    - type=profit: ranked by profit_rate (existing behavior)
    - type=overall: ranked by weighted 4-axis score
    """
    # Only include verified, non-practice records
    records = (
        db.query(GameRecord)
        .filter(GameRecord.is_verified == True, GameRecord.is_practice == False)
        .all()
    )

    # Group by user, take their best record
    best_per_user = {}

    for record in records:
        user = db.query(User).filter(User.id == record.user_id).first()
        username = user.username if user else record.user_id[:8]

        if type == "profit":
            score = record.profit_rate
        elif type == "overall":
            # Parse score_metrics JSON
            try:
                metrics = json.loads(record.score_metrics) if isinstance(record.score_metrics, str) else record.score_metrics
            except (json.JSONDecodeError, TypeError):
                metrics = {}

            # Weighted sum: 投资智慧×0.3 + 心态稳定×0.25 + 社交回报×0.25 + 生活平衡×0.2
            wisdom = metrics.get("投资智慧", 50)
            mindset = metrics.get("心态稳定", 50)
            social = metrics.get("社交回报", 50)
            balance = metrics.get("生活平衡", 50)
            score = wisdom * 0.3 + mindset * 0.25 + social * 0.25 + balance * 0.2
        else:
            score = record.profit_rate

        # Keep best score per user
        if record.user_id not in best_per_user or score > best_per_user[record.user_id]["score"]:
            detail = None
            if type == "overall":
                try:
                    metrics = json.loads(record.score_metrics) if isinstance(record.score_metrics, str) else record.score_metrics
                except (json.JSONDecodeError, TypeError):
                    metrics = {}
                detail = metrics

            best_per_user[record.user_id] = {
                "user_id": record.user_id,
                "username": username,
                "score": round(score, 1),
                "detail": detail,
            }

    # Sort and rank
    sorted_entries = sorted(best_per_user.values(), key=lambda x: x["score"], reverse=True)
    result = []
    for i, entry in enumerate(sorted_entries[:limit]):
        result.append(LeaderboardEntry(
            rank=i + 1,
            user_id=entry["user_id"],
            username=entry["username"],
            score=entry["score"],
            detail=entry["detail"],
        ))

    return result
```

- [ ] **Step 2: Register the router**

In `backend/app/main.py` (or wherever routers are included), add:

```python
from app.api.endpoints.leaderboard import router as leaderboard_router
app.include_router(leaderboard_router, prefix="/api", tags=["leaderboard"])
```

Find the existing router registration section and add the import and include_router call.

- [ ] **Step 3: Verify backend starts**

Run: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
Then open: `http://localhost:8000/api/leaderboard?type=profit&limit=5`
Expected: Returns a JSON array (empty is OK if no records exist).

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/endpoints/leaderboard.py backend/app/main.py
git commit -m "feat: add /api/leaderboard endpoint with profit and overall ranking types"
```

---

### Task 2: Add Leaderboard Tab UI in Lobby

**Files:**
- Modify: `frontend/src/App.jsx` — lobby section

- [ ] **Step 1: Add leaderboard state and fetch**

Add state variables (with other state declarations):
```js
const [leaderboardType, setLeaderboardType] = useState('profit');
const [leaderboardData, setLeaderboardData] = useState([]);
```

Add a fetch function:
```js
const fetchLeaderboard = async (type) => {
    try {
        const resp = await fetch(`${API_BASE}/api/leaderboard?type=${type}&limit=10`);
        if (resp.ok) {
            const data = await resp.json();
            setLeaderboardData(data);
        }
    } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
    }
};
```

Add useEffect to fetch on type change (after login):
```js
useEffect(() => {
    if (store.user && !store.isPlaying) {
        fetchLeaderboard(leaderboardType);
    }
}, [store.user, store.isPlaying, leaderboardType]);
```

- [ ] **Step 2: Add leaderboard UI in lobby**

In the lobby section (after the history section, before the closing `</div>` of the lobby card), add:

```jsx
{/* 全服排行榜 */}
<div style={{ marginTop: '24px', borderTop: '2px dashed var(--border-card)', paddingTop: '16px' }}>
    <h5 className="section-title" style={{ fontSize: '14px', marginBottom: '10px' }}>🏆 全服排行榜</h5>
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
            className={leaderboardType === 'profit' ? 'btn-tab btn-tab--active' : 'btn-tab'}
            onClick={() => setLeaderboardType('profit')}
        >
            💰 总收益
        </button>
        <button
            className={leaderboardType === 'overall' ? 'btn-tab btn-tab--active' : 'btn-tab'}
            onClick={() => setLeaderboardType('overall')}
        >
            🏅 全能
        </button>
    </div>
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {leaderboardData.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '16px 0' }}>暂无排行数据</div>
        ) : (
            leaderboardData.map((entry) => (
                <div key={entry.user_id} className="leaderboard-entry">
                    <span className="leaderboard-rank">
                        {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                    <span className="leaderboard-name">{entry.username}</span>
                    <span className="leaderboard-score" style={{ color: leaderboardType === 'profit' ? (entry.score >= 0 ? 'var(--jade)' : 'var(--crimson)') : 'var(--amber)' }}>
                        {leaderboardType === 'profit'
                            ? `${entry.score >= 0 ? '+' : ''}${entry.score.toFixed(1)}%`
                            : `${entry.score.toFixed(0)}分`
                        }
                    </span>
                </div>
            ))
        )}
    </div>
</div>
```

- [ ] **Step 3: Add tab and leaderboard entry CSS**

In `frontend/src/index.css`, add:

```css
/* Leaderboard Tab Buttons */
.btn-tab {
    background: var(--bg-elevated);
    border: 1px solid var(--border-card);
    color: var(--text-secondary);
    padding: 5px 14px;
    border-radius: 16px;
    font-size: 12px;
    font-family: var(--font-data);
    cursor: pointer;
    transition: all 0.2s;
}
.btn-tab--active {
    background: rgba(240, 180, 41, 0.1);
    border-color: var(--amber);
    color: var(--amber);
}

/* Leaderboard Entries */
.leaderboard-entry {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 13px;
}
.leaderboard-entry:last-child { border-bottom: none; }
.leaderboard-rank {
    width: 30px;
    font-family: var(--font-data);
    color: var(--text-muted);
}
.leaderboard-name {
    flex: 1;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.leaderboard-score {
    font-family: var(--font-data);
    font-weight: 600;
    min-width: 60px;
    text-align: right;
}
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.jsx frontend/src/index.css
git commit -m "feat: add leaderboard tabs (profit + overall) in lobby UI"
```

---

### Task 3: End-to-End Verification

- [ ] **Step 1: Start backend and frontend**

```bash
cd backend && python -m uvicorn app.main:app --reload --port 8000 &
cd frontend && npm run dev
```

- [ ] **Step 2: Manual verification**

1. Login → Lobby should show "🏆 全服排行榜" section
2. Tab "💰 总收益" should be active by default
3. Click "🏅 全能" tab → Should switch to overall ranking
4. If no records exist, show "暂无排行数据"
5. Play a game, complete settlement → refresh lobby → should see your record in leaderboard

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete all-rounder leaderboard with backend API and frontend tabs"
```
