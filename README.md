# PRD Drift Detector

Real-time tracking of PRD-to-delivery alignment using GitHub Issues and Claude AI.

## Overview

PRD Drift Detector automatically analyzes the gap between your Product Requirements Document (PRD) and actual engineering delivery by:

- Parsing requirements from your PRD (stored in GitHub)
- Fetching delivery status from GitHub Issues
- Using Claude AI to detect semantic drift between planned features and delivered functionality
- Visualizing completion, risk scores, and specific drift points

## Why This Tool?

Product teams often struggle with:
- **PRD-delivery misalignment**: 68% of PMs report significant drift between planned scope and actual delivery
- **Manual status compilation**: PMs spend 6-8 hours/week manually tracking status across tools
- **Late risk discovery**: 54% of delays stem from risks/dependencies identified mid-sprint vs. during planning

This tool provides **automated, real-time visibility** into drift so product teams can stay ahead of scope creep, timeline slips, and dependencies.

## Features

- ✅ **GitHub Integration**: Connects directly to your GitHub repos (read-only)
- 🤖 **AI-Powered Drift Detection**: Uses Claude to semantically match PRD requirements to delivered Issues
- 📊 **Visual Dashboard**: Shows completion %, risk score, and timeline drift at a glance
- 🎯 **Requirement-Level Analysis**: Identifies which specific requirements are delivered, partial, missing, or in progress
- 🔗 **Issue Linking**: Maps PRD requirements to specific GitHub Issues

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **APIs**: GitHub REST API (Octokit), Anthropic Claude API
- **Deployment**: Vercel-ready (or any Node.js host)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

4. Enter your:
   - GitHub repository (e.g., `owner/repo`)
   - GitHub Personal Access Token
   - Anthropic API Key
   - PRD file path (e.g., `docs/prd.md`)

## Setup Requirements

- **GitHub Personal Access Token**: https://github.com/settings/tokens (needs `repo` read access)
- **Anthropic API Key**: https://console.anthropic.com/
- **Node.js 18+**

## How It Works

1. **Parses PRD** from GitHub markdown file
2. **Fetches Issues** via GitHub API
3. **Analyzes drift** using Claude AI semantic matching
4. **Visualizes results** with completion %, risk scores, and requirement-level details

## Demo LinkedIn Post Angle

"Built a POC in 3 days using Claude Code to solve a real PM pain point: tracking PRD-to-delivery drift.

Why GitHub Issues? Fastest path to demo. Clean API, no OAuth complexity, self-contained.

The real value isn't the integration—it's the LLM-powered semantic matching. Claude detects when 'CSV export' in the PRD became 'PDF export' in delivery.

This is portfolio work to showcase PM + technical thinking. Next: validate with 10+ teams, then consider Jira/Linear expansion."

## Built With

Next.js, React, Tailwind CSS, GitHub API (Octokit), Claude API

## Author

Kevin Dunne - Product Manager (9+ years in regulated industries)
Targeting roles in Australian utilities, mining tech, healthcare, fintech
