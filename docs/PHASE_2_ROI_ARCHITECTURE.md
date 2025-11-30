# Phase 2: ROI Timeline & Scope Creep Tracking

## Overview

Phase 1 (IMPLEMENTED) provides snapshot ROI metrics:
- Alignment Score (% of high-value features on track)
- Cost of Delay identification (high-value missing/partial requirements)
- Value Stream Risk Heatmap (value vs execution status)

Phase 2 will add **temporal ROI tracking** to show how investment efficiency changes over time.

## Architecture Requirements

### 1. Database Layer
**Need:** Persistent storage for historical analysis results

**Options:**
- **Vercel Postgres** (recommended for Vercel deployment)
  - Built-in integration with Vercel projects
  - PostgreSQL-compatible
  - Auto-scaling
  - Cost: ~$20/month for hobby tier

- **Supabase** (alternative)
  - Open-source PostgreSQL
  - Real-time subscriptions
  - Built-in auth if needed later
  - Generous free tier

- **PlanetScale** (alternative)
  - MySQL-compatible
  - Serverless with auto-scaling
  - Good free tier

**Schema Design:**
```sql
CREATE TABLE analysis_history (
  id SERIAL PRIMARY KEY,
  repository VARCHAR(255) NOT NULL,
  prd_path VARCHAR(255) NOT NULL,
  analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Metrics
  completion_percentage INTEGER,
  risk_score INTEGER,
  alignment_score INTEGER,
  weeks_behind INTEGER,
  features_blocked INTEGER,

  -- Scope tracking
  total_requirements INTEGER,
  delivered_count INTEGER,
  in_progress_count INTEGER,
  partial_count INTEGER,
  missing_count INTEGER,
  out_of_scope_count INTEGER,

  -- Value breakdown
  high_value_delivered INTEGER,
  high_value_in_progress INTEGER,
  high_value_missing INTEGER,
  medium_value_delivered INTEGER,
  medium_value_in_progress INTEGER,
  medium_value_missing INTEGER,
  low_value_delivered INTEGER,
  low_value_in_progress INTEGER,
  low_value_missing INTEGER,

  -- Full analysis JSON (for detailed drill-down)
  analysis_data JSONB,

  CONSTRAINT unique_analysis UNIQUE (repository, prd_path, analyzed_at)
);

CREATE INDEX idx_repo_time ON analysis_history(repository, analyzed_at DESC);
CREATE INDEX idx_prd_time ON analysis_history(prd_path, analyzed_at DESC);

-- For detecting unplanned issues
CREATE TABLE github_issues_snapshot (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER REFERENCES analysis_history(id),
  issue_number INTEGER NOT NULL,
  issue_title TEXT,
  mapped_to_requirement BOOLEAN,
  requirement_id VARCHAR(100),
  created_at TIMESTAMP,
  closed_at TIMESTAMP
);
```

### 2. API Endpoints

**New endpoints needed:**

```typescript
// Store analysis result
POST /api/analysis/save
{
  repository: string;
  prdPath: string;
  analysis: OverallAnalysis;
  issues: GitHubIssue[];
}

// Get historical data for a repository
GET /api/analysis/history?repository={owner/repo}&prdPath={path}&days={30}
Returns: Array<HistoricalAnalysis>

// Get scope creep metrics
GET /api/analysis/scope-creep?repository={owner/repo}&days={30}
Returns: {
  plannedWorkPercentage: number[];
  unplannedWorkPercentage: number[];
  dates: string[];
}
```

### 3. Unplanned Issue Detection

**Logic needed:**
```typescript
interface UnplannedIssueDetection {
  // Issues that don't map to any PRD requirement
  detectUnplannedIssues(
    issues: GitHubIssue[],
    requirements: PRDRequirement[],
    analysis: DriftAnalysis[]
  ): {
    plannedIssues: GitHubIssue[];
    unplannedIssues: GitHubIssue[];
  }

  // Calculate time spent on unplanned work
  calculateScopeCreepRate(
    allIssues: GitHubIssue[],
    plannedIssues: GitHubIssue[]
  ): {
    plannedTimePercentage: number;
    unplannedTimePercentage: number;
  }
}
```

**Heuristics for detection:**
- Issue has no matched requirement in analysis
- Issue labels don't align with PRD sections
- Issue created after PRD was finalized (needs PRD timestamp tracking)

### 4. Time-Series Visualizations

**Components to build:**

```typescript
// ROI Timeline Chart
interface ROIScopeCreepChart {
  data: {
    dates: string[];
    plannedWork: number[]; // Percentage
    unplannedWork: number[]; // Percentage
  };
  renderStackedAreaChart(): JSX.Element;
}

// Alignment Score Trend
interface AlignmentTrendChart {
  data: {
    dates: string[];
    alignmentScore: number[]; // 0-100
    completionPercentage: number[]; // 0-100
  };
  renderLineChart(): JSX.Element;
}

// Value Stream Evolution Heatmap
interface ValueStreamEvolution {
  data: {
    snapshots: Array<{
      date: string;
      highValue: { delivered: number; inProgress: number; missing: number };
      mediumValue: { delivered: number; inProgress: number; missing: number };
      lowValue: { delivered: number; inProgress: number; missing: number };
    }>;
  };
  renderEvolutionHeatmap(): JSX.Element;
}
```

## Implementation Roadmap

### Step 1: Database Setup (1-2 hours)
1. Add Vercel Postgres to project
2. Create schema with migrations
3. Set up environment variables

### Step 2: Data Persistence (2-3 hours)
1. Create `/api/analysis/save` endpoint
2. Modify existing `/api/analyze` to save results after analysis
3. Add historical data retrieval endpoint

### Step 3: Unplanned Issue Detection (3-4 hours)
1. Build logic to detect issues not mapped to requirements
2. Create `/api/analysis/scope-creep` endpoint
3. Calculate time-based metrics (requires issue timestamps)

### Step 4: UI Components (4-6 hours)
1. ROI Timeline chart (stacked area)
2. Alignment Score trend chart (line chart)
3. Add date range selector to dashboard
4. Create "Historical View" toggle or separate page

### Step 5: Charting Library Integration (1-2 hours)
**Recommended:** Recharts (React-based, responsive, TypeScript support)
```bash
npm install recharts
```

Alternative: Chart.js with react-chartjs-2

## Phase 1 → Phase 2 Migration Path

**What Phase 1 provides (CURRENT):**
- Single-point-in-time analysis
- Alignment Score calculation
- Cost of Delay identification
- Value Stream Risk snapshot

**What Phase 2 adds:**
- Historical trend tracking
- Scope creep visualization over time
- Comparison of planned vs unplanned work
- Month-over-month ROI metric changes

**User Flow:**
1. User runs analysis (Phase 1 works as-is)
2. Results are saved to database (Phase 2 addition)
3. User can toggle "Show Trends" to see historical data (Phase 2 UI)
4. Charts show how alignment score, scope creep, and value delivery evolved

## Data Retention Strategy

**Considerations:**
- How long to keep historical data? (Recommend: 12 months for free tier, unlimited for paid)
- Should we aggregate older data? (e.g., daily → weekly → monthly)
- Privacy: Analysis data contains no PII, safe to store

**Cost estimates:**
- 1 analysis = ~50KB JSON + metadata
- 100 repositories × 4 analyses/month × 12 months = 4,800 records
- Storage: ~240MB/year
- Vercel Postgres hobby tier: sufficient for 100+ repositories

## Key Metrics to Track Over Time

1. **Alignment Score Trend**
   - Shows if team is staying focused on high-value work
   - Declining trend = drift toward lower-value features

2. **Scope Creep Rate**
   - % of engineering time on unplanned issues
   - Rising trend = reactive mode, poor planning

3. **Cost of Delay Evolution**
   - How many high-value features remain neglected month-over-month
   - Persistent items = serious ROI risk

4. **Value Realization Velocity**
   - How quickly high-value features move from "missing" to "delivered"
   - Low velocity = slow ROI realization

## Future Enhancements (Phase 3+)

- **Forecasting:** Predict when high-value features will be delivered based on historical velocity
- **Team Performance:** Compare alignment scores across different teams/projects
- **Budget Tracking:** If cost data available, show actual spend vs planned ROI
- **Alerts:** Notify when alignment score drops below threshold or scope creep exceeds limit
- **Integrations:** Jira, Azure DevOps, Linear for broader issue tracking

## References

- John Cutler's work on ROI misreporting: https://cutlefish.substack.com/
- "Cost of Delay" concept: Donald Reinertsen, "The Principles of Product Development Flow"
- Value Stream Mapping: Lean software development practices
