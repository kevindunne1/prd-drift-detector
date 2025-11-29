# LinkedIn Post Draft

---

**Built a PRD drift detector over the weekend. Here's why I chose GitHub Issues + Claude over Jira.**

Most drift detection tools require Jira integrations, SSO, database persistence, and weeks of setup. I took a different approach: parse your PRD, fetch GitHub Issues via API, let Claude 3.5 Sonnet analyse the drift. Done.

**Why this matters:**

The gap between what you spec and what ships is where products fail. Not from bad requirements—from invisible drift. A feature gets "mostly done." A requirement becomes "we'll circle back." Timeline slips 3 weeks but nobody updates the PRD.

By the time you notice, you're launching something fundamentally different from what you planned.

**Why GitHub + Claude:**

1. **Lightweight**: No database, no integrations, no DevOps setup. Your repo is the source of truth.
2. **Accessible**: Most teams already use GitHub Issues. Just point it at your PRD markdown file.
3. **Honest analysis**: Claude doesn't sugarcoat. 19 high-risk items? You see 19 high-risk items.

**The learning:**

This wasn't built to sell. It was built to test whether AI can meaningfully analyse product delivery without heavy tooling. Turns out it can. Claude surfaces drift patterns I'd have missed manually—requirements marked "delivered" that only partially match the spec, missing acceptance criteria, scope creep hiding in partial implementations.

**Technical approach:**

- Next.js 15, React 19, TypeScript
- GitHub REST API for issue/PR data
- Claude 3.5 Sonnet for drift analysis
- Rate-limited public demo (5 analyses/day per IP)
- No authentication, no database, no tracking

**Try it:** https://prd-drift-detector-nhr149coq-kevin-dunnes-projects.vercel.app

Point it at your GitHub repo, specify your PRD path, and see where your delivery diverged from your plan. Free to use, open to feedback.

---

**Alternative shorter version (if you want more concise):**

---

**I built a PRD drift detector using GitHub Issues + Claude. No Jira integration required.**

The insight: Most PM tools focus on what you're building. This shows the gap between what you planned and what you actually shipped.

Why it matters: Drift is silent. Requirements get "mostly done." Features ship incomplete. Timeline slips go undocumented. By launch, you've delivered something fundamentally different from your PRD.

Why GitHub + Claude over Jira:
- Lightweight: No integrations, no setup
- Accessible: Your repo is already the source of truth
- Honest: Claude surfaces drift patterns you'd miss manually

Built as a learning experiment, not a product. Wanted to test if AI can meaningfully analyse delivery without heavy tooling. It can.

Try it: https://prd-drift-detector-nhr149coq-kevin-dunnes-projects.vercel.app

5 free analyses per day. Point it at your repo's PRD and see where you drifted.

---

**Which version do you prefer? Or want me to adjust the tone/focus?**
