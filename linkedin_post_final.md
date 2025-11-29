# LinkedIn Post - Final Version

---

**Built a PRD drift detector using GitHub Issues + Claude. Here's why I avoided Jira integrations.**

**The problem:** The gap between what you spec and what ships is where products fail. Requirements get "mostly done," features ship incomplete, timelines slip quietly. By launch, you've delivered something fundamentally different from your PRD.

**The decision:** Most drift tools require Jira integrations, databases, SSO, and weeks of setup. I wanted to test if AI could meaningfully analyse delivery drift without the heavy tooling.

**The approach:**
- Parse your PRD markdown
- Fetch GitHub Issues via API
- Let Claude 3.5 Sonnet analyse the drift

No database. No integrations. Your repo is the source of truth.

**Why this works:**

Claude doesn't sugarcoat. It surfaces patterns you'd miss manually—requirements marked "delivered" that only partially match the spec, missing acceptance criteria, scope creep hiding in partial implementations. 19 high-risk items? You see 19 high-risk items.

**The learning:**

This was built to learn, not to sell. It proves AI can provide honest product delivery insights without enterprise tooling. The analysis is surprisingly good—better than manual PRD reviews I've done with teams.

**Try it:** https://prd-drift-detector-nhr149coq-kevin-dunnes-projects.vercel.app

Point it at your GitHub repo, specify your PRD path, see where you drifted. 5 free analyses per day. No signup, no tracking.

Built with Next.js 15, React 19, Claude 3.5 Sonnet. Open to feedback.

---

**Character count: ~1,240 (LinkedIn allows 3,000)**

**Tone: Professional but conversational, emphasizes learning over selling, shows clear decision-making rationale**
