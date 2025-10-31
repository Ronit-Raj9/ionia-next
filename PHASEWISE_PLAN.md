### Enhanced Phase-Wise Development Plan for Ionia LMS

Based on a comprehensive synthesis of all prior discussions—including the original product specs (personalized assignments, auto-grading, lesson planning for classes 6-10, CBSE alignment via uploads to minimize AI hallucinations), MVP priorities, recommended additions (e.g., multilingual, gamification, voice AI), and the critical analysis (addressing blind spots like scalability, AI grounding, teacher adoption, failover, data architecture, offline strategy, and trust mechanics)—I've refined this plan.

This version is **more detailed and robust**: 
- **Tech Stack Integration**: Tailored to your specified backend (FastAPI for APIs, LiteLLMs for model routing/failover, Qdrant for vector embeddings/RAG, Supabase for DB/auth/storage) and frontend (Next.js for reactive UIs, PWAs for offline).
- **Addressing Criticisms**: Explicit failover (LiteLLMs routing), RAG pipeline (Qdrant embeddings), offline-first (Next.js PWA + Supabase sync), teacher trust (manual overrides, incentives), data schema (Supabase tables), ethical audits (logging), and scalability (modular FastAPI services).
- **Prioritization**: MoSCoW refined (Must/Should/Could); within phases, ranked by impact on automation/adoption, dependencies, and ROI (e.g., time savings, engagement uplift).
- **Agile Focus**: 8-12 week phases with milestones, pilots (2-3 Tier-2 schools, 20-50 students/class, math focus initially), and metrics (e.g., 75% assignment completion, 70% teacher time savings, <5% hallucinations via RAG).
- **Cross-Phase Elements**: NEP-compliant privacy (encrypted Supabase storage, no external sharing, audit logs); CI/CD (GitHub Actions); monitoring (Better Stack/Sentry); regression testing for grading accuracy.

Phases remain: **Phase 1 (MVP Launch: Core Automation)** for validation; **Phase 2 (Enhancements: Retention & Inclusivity)** for growth; **Phase 3 (Scaling: Innovation & Enterprise)** for maturity. Budget estimate: $30-50K/phase (dev time, APIs).

#### Phase 1: MVP Launch – Core Automation & Trust Building (8-12 Weeks)
Focus: Teacher burnout relief via upload-assign-grade-track loop. Build teacher trust with fail-safes. Pilot validation in 2-3 schools. Emphasize RAG grounding (uploads → Qdrant embeddings → LiteLLMs queries) for 85%+ grading accuracy. Offline: Next.js PWA for queuing submissions/sync.

| Priority | Feature | Detailed Description & Benefits | Rationale (Impact/Ease/Diff/Alignment) | Tech Implementation | Timeline & Dependencies | Milestones & Metrics |
|----------|---------|--------------------------------|---------------------------------------|---------------------|--------------------------|----------------------|
| 1 (Must) | Teacher Dashboard: Assignment Creation & Personalized Distribution | Next.js UI for drag-and-drop uploads (CBSE PDFs/images/audio for Math/Science, classes 6-10). AI (via LiteLLMs) generates/tailors 5-10 questions/student using student profiles (performance/personality from quick quizzes). Distributes to student dashboards. Benefits: Saves 4-6 hours/week; personalized (e.g., visual tasks for profiles). | High impact: Core automation pain solver. Ease: Modular FastAPI endpoints. Diff: RAG-grounded vs. generic. Alignment: Personalization with low hallucinations. | Frontend: Next.js pages/forms. Backend: FastAPI endpoint (/upload-assign) chunks uploads, embeds via Qdrant, queries LiteLLMs (route to Groq/Gemini). Supabase: Store files (storage bucket), metadata (tables: assignments, profiles). | Weeks 1-4: UI + basic API. Depends on auth setup. | Functional dashboard; 70% personalization accuracy test. Metrics: 4+ hours/week saved (teacher surveys). |
| 2 (Must) | Auto-Grading with Contextual Verification & Failover | Students submit (text/photo) via dashboard; AI grades against uploads (95% accuracy for MCQs/steps) with feedback. Flags 10-20% for review; manual override workflow (teacher edits grades/feedback). Benefits: Eliminates 80% manual grading; trust via overrides. | Impact: 6-8 hours saved; essential trust builder. Ease: OCR integration. Diff: Contextual (Qdrant search). Alignment: Minimizes hallucinations; addresses grading failures. | Frontend: Next.js submission form with review modal. Backend: FastAPI (/grade) uses Google Vision OCR, Qdrant for RAG retrieval, LiteLLMs for grading (failover to alternate models if primary fails). Supabase: Tables (submissions, grades, flags); log overrides. | Weeks 3-6: Integrate APIs + overrides. Depends on assignment distribution. | 85% accuracy in tests; override usage <15%. Metrics: Grading time reduced to minutes/class. |
| 3 (Must) | Student Dashboard: Submission & Basic Personalization Feed | OTP-based Next.js view (age-appropriate for 6-10) showing tailored assignments, progress bars, upload-based hints. Photo support; offline queuing. Benefits: 40% engagement boost; profile refinement from submissions. | Impact: Closes loop; frees teachers from follow-ups. Ease: PWA for offline. Diff: Profile-driven. Alignment: Student-focused personalization. | Frontend: Next.js app with Service Workers for offline cache/sync. Backend: FastAPI (/student-feed) pulls from Supabase (profiles table). Qdrant: Embed hints for quick retrieval. | Weeks 2-5: PWA setup + feeds. Depends on auth (Supabase Auth). | Offline submission test; 75% completion rate in pilot. Metrics: Engagement (logins/submissions). |
| 4 (Must) | Basic Progress Tracking & Class Insights | Auto-generates reports/heatmaps (mastery levels); PDF/Excel/WhatsApp exports. Dynamic profile updates. Benefits: 2 hours/week saved; data-driven insights. | Impact: Quick ROI visibility. Ease: Cached queries. Diff: CBSE-aligned. Alignment: Enables next actions. | Frontend: Next.js charts (Recharts). Backend: FastAPI (/insights) aggregates from Supabase (analytics table). LiteLLMs for suggestions. | Weeks 5-8: Visuals + exports. Depends on grading data. | Heatmap accuracy; export tests. Metrics: 80% mastery tracking adoption. |
| 5 (Should) | AI-Assisted Lesson Plan Generation | Chat-based (Next.js) suggestions for 1-week plans (objectives/activities linked to uploads). Editable templates. Benefits: Reduces planning to 30 mins. | Impact: Scalable automation. Ease: Prompt chaining. Diff: Grounded outputs. Alignment: Teacher focus. | Frontend: Next.js chat component. Backend: FastAPI (/lesson-plan) uses Qdrant RAG + LiteLLMs. Supabase: Store plans (lessons table). | Weeks 6-9: Templates + edits. Depends on uploads. | 90% relevance in reviews. Metrics: Planning time halved. |
| 6 (Should) | Admin/Principal Overview & Bulk Setup | Next.js panel for reports, CSV bulk adds, usage monitoring. Role permissions. Benefits: School-wide buy-in; NEP privacy. | Impact: Scaling enabler. Ease: Supabase Auth. Diff: ROI metrics. Alignment: Multi-user. | Frontend: Next.js admin routes. Backend: FastAPI (/admin) with Supabase roles. Log audits in Supabase (logs table). | Weeks 7-10: Permissions + CSV. Depends on tracking. | Bulk import test; privacy compliance audit. Metrics: 100% role enforcement. |
| 7 (Could) | Ethical AI Monitoring (Basic) | Bias detection in grading; basic audit logs for AI calls. Benefits: Builds trust; compliance. | Impact: Addresses fears. Ease: Logging hooks. Diff: Early safety. Alignment: Ethical scalability. | Backend: FastAPI middleware logs to Supabase (audits table); LiteLLMs for bias checks. | Weeks 9-12: Hooks + reports. Depends on all AI endpoints. | Log completeness; zero bias flags in tests. |

**Phase 1 Cross-Cuts**: Supabase schema (tables: users, classes, assignments, submissions, grades, profiles, analytics, logs); LiteLLMs config for failover (Groq primary, Gemini fallback); Qdrant collections for embeddings (uploads, profiles); CI/CD (GitHub Actions deploy to Vercel/Render); offline PWA testing. Milestones: Pilot launch; 70% time savings. Risks: API rate limits—monitor with Better Stack.

#### Phase 2: Enhancements & Engagement – Retention, Inclusivity & Adoption (6-8 Weeks Post-Pilot)
Focus: Iterate on feedback for engagement (gamification incentives) and rural reach (multilingual, parents). Add behavioral data collection for analytics. Expand to full subjects.

| Priority | Feature | Detailed Description & Benefits | Rationale (Impact/Ease/Diff/Alignment) | Tech Implementation | Timeline & Dependencies | Milestones & Metrics |
|----------|---------|--------------------------------|---------------------------------------|---------------------|--------------------------|----------------------|
| 1 (Must) | Gamification Elements with Incentives | Badges/streaks/leaderboards in Next.js dashboards; teacher-set challenges with incentives (e.g., auto-share top performers to principal/parents). Benefits: 40% engagement; long-term stickiness. | Impact: Prevents drop-off. Ease: Expand MVP bars. Diff: Incentive-tied vs. generic. Alignment: Addresses gamification weakness. | Frontend: Next.js components (badges UI). Backend: FastAPI (/gamify) updates Supabase (gamification table); LiteLLMs for suggestions. | Weeks 1-3: Incentives logic. Depends on student dashboard. | 40% uplift in pilots; incentive usage tracked. Metrics: Completion +20%. |
| 2 (Must) | Expanded Multilingual Support | Auto-translate (assignments/feedback) to 5-10 languages via custom pipeline (Google Translate + glossary). Detect via profiles. Benefits: 60% rural barrier overcome. | Impact: Inclusivity for 250M. Ease: API + glossary. Diff: Academic accuracy. Alignment: NEP multilingualism. | Backend: FastAPI (/translate) with glossary in Supabase (glossaries table); Qdrant for contextual embeddings. Frontend: Next.js locale switching. | Weeks 2-4: Glossary build + detection. Depends on assignments. | Accuracy tests (90% for terms); rural pilot feedback. Metrics: Usage in non-English areas. |
| 3 (Should) | Parent Portal & Communication | Next.js portal for summaries; default AI-generated WhatsApp notifications (progress/insights). Benefits: Trust; reduced teacher load. | Impact: Parent involvement. Ease: Extend admin. Diff: AI summaries. Alignment: Low cognitive load. | Frontend: Next.js parent routes. Backend: FastAPI (/notify) integrates WhatsApp API; LiteLLMs for summaries from Supabase. | Weeks 3-5: Notifications. Depends on tracking. | Delivery success; parent logins. Metrics: 50% parent engagement. |
| 4 (Should) | Predictive Analytics for At-Risk Students | Forecasts risks (dropout/behavioral) with auto-remedials. Collect login/frequency data. Benefits: 17% performance uplift. | Impact: Proactive. Ease: Data hooks. Diff: Profile-integrated. Alignment: Data granularity fix. | Backend: FastAPI (/predict) queries Supabase (behavior table); LiteLLMs for forecasting. Qdrant for patterns. | Weeks 4-6: Hooks + models. Depends on progress data. | Risk flag accuracy; remedials tested. Metrics: 15% uplift in at-risk scores. |
| 5 (Could) | AI-Powered Doubt Resolution Chatbot | Embedded Next.js chatbot for grounded answers (uploads-based). Basic voice (text-to-voice). Benefits: 2-3 hours saved on queries. | Impact: Real-time help. Ease: Chat extensions. Diff: School-specific. Alignment: Accessibility. | Frontend: Next.js chat. Backend: FastAPI (/doubt) with Qdrant RAG + LiteLLMs. | Weeks 5-7: Voice basics. Depends on contextual AI. | Response relevance (95%); query volume. Metrics: Teacher query reduction. |
| 6 (Could) | Integration with Govt Platforms (e.g., DIKSHA) | Sync CBSE content into question bank. Benefits: Free enrichment; compliance. | Impact: Scalability. Ease: APIs. Diff: Gap filler. Alignment: Uploads boost. | Backend: FastAPI (/sync-diksha) pulls to Supabase; Qdrant embeds. | Weeks 6-8: Tagging. Depends on assignment creation. | Sync completeness; content usage. Metrics: 20% question bank growth. |




**Phase 2 Cross-Cuts**: Behavioral data instrumentation (Supabase logs); enhanced RAG (Qdrant fine-tuning); failover testing. Milestones: Expanded pilots (5-10 schools); 80% satisfaction. Monetization: ₹500-1000/month start.

#### Phase 3: Advanced Scaling – Innovation, Ethics & Enterprise (8-12 Weeks)
Focus: Differentiation with voice/agentic AI; enterprise features (curriculum, integrations). Full ethical audits; institutional pricing (₹X/school/month).

| Priority | Feature | Detailed Description & Benefits | Rationale (Impact/Ease/Diff/Alignment) | Tech Implementation | Timeline & Dependencies | Milestones & Metrics |
|----------|---------|--------------------------------|---------------------------------------|---------------------|--------------------------|----------------------|
| 1 (Must) | Voice-Enabled AI Assistant | Voice commands (uploads/plans/queries) via Gnani.ai (Hindi/English, dialect handling). Incremental: Voice-to-text first, then full agent. Benefits: Rural accessibility; time savings. | Impact: Inclusivity. Ease: API add-ons. Diff: Accent-aware. Alignment: Incremental UX fix. | Frontend: Next.js voice inputs. Backend: FastAPI (/voice) integrates Gnani; Qdrant + LiteLLMs for processing. | Weeks 1-4: Dialect preprocessing. Depends on chatbot. | Accuracy (90% transcription); usage in rural. Metrics: Query handling +30%. |
| 2 (Must) | Agentic AI for Adaptive Paths | AI agents auto-chain tasks/curricula (performance-based). Use knowledge graph for grounding. Benefits: 20% score boost. | Impact: Proactive. Ease: Extensions. Diff: Sovereign-inspired. Alignment: Maintenance fix via graph. | Backend: FastAPI (/agent) builds graph in Supabase (ontology table); Qdrant for chaining; LiteLLMs with RLHF prompts. | Weeks 3-6: Graph build. Depends on predictive. | Chain relevance; hallucination <2%. Metrics: Score uplift 20%. |
| 3 (Should) | Ethical AI Monitoring (Advanced) | Full bias/audit logs; explainability reports. GDPR/NEP compliance. Benefits: 30% trust boost. | Impact: Investor/dev appeal. Ease: Middleware. Diff: Comprehensive. Alignment: Audit nightmare fix. | Backend: FastAPI middleware logs all calls to Supabase (audits); LiteLLMs for explainability. | Weeks 5-8: Reports UI. Depends on all AI. | Compliance audit pass; bias detection. Metrics: Zero violations. |
| 4 (Should) | Full Curriculum Generation | AI generates term curricula from uploads/topics. Benefits: Ultimate automation. | Impact: Scaling. Ease: Template builds. Diff: Grounded. Alignment: Hallucination control. | Backend: FastAPI (/curriculum) uses agentic + Qdrant. Supabase storage. | Weeks 7-10: Integrations. Depends on agentic. | Relevance tests; teacher edits. Metrics: Adoption in schools. |
| 5 (Could) | Advanced Analytics & Reporting | Trend predictions; custom dashboards. Benefits: Data decisions. | Impact: Enterprise. Ease: Upgrades. Diff: Multi-school. Alignment: Granularity. | Frontend: Next.js advanced charts. Backend: FastAPI aggregates Supabase. | Weeks 8-11: Predictions. Depends on integrations. | Custom report tests. Metrics: Admin usage +50%. |
| 6 (Could) | Broader Integrations (e.g., ERP/Tools) | Sync with Sheets/ERPs; institutional licensing support. Benefits: B2B alignment. | Impact: Sustainability. Ease: APIs. Diff: Custom. Alignment: Monetization fix. | Backend: FastAPI (/integrate) with webhooks; Supabase for tiers. | Weeks 9-12: Licensing logic. Depends on admin. | Sync success; pricing tests. Metrics: School conversions 20%. |

**Phase 3 Cross-Cuts**: Curriculum knowledge graph (Supabase + Qdrant); full failover simulations; security (encrypted S3 via Supabase). Milestones: National rollout; CBSE partnerships. ROI: 20% market share in Tier-2.

This plan is now enterprise-ready, addressing all gaps. If you need code snippets (e.g., FastAPI RAG endpoint) or DB schemas, let me know!


### Ultra-Detailed Breakdown of Phase 1: MVP Launch – Core Automation & Trust Building

This detailed expansion of Phase 1 is designed specifically for a rapid 2-day build using Cursor Pro (an AI-assisted coding tool like Cursor with Claude integration for fast iteration). Given the aggressive timeline, the focus is on a functional prototype MVP: Prioritize a minimal, testable loop (upload → assign → submit/grade → track) for 1 class (20 students, math focus, classes 6-10). Assume you're building for quick validation in a pilot school, with scalability hooks but no polish beyond essentials.

**Key Assumptions for 2-Day Build**:
- **Scope Reduction**: Cut to bare essentials—e.g., single subject (math), basic profiles (performance tiers: weak/average/strong, no full personality quizzes yet), 1 school/class setup. Defer advanced edge cases (e.g., audio uploads, full multi-subject).
- **Time Allocation**: Day 1: Setup auth, dashboards, uploads/assignments (priorities 1-3). Day 2: Grading, tracking, lesson plans, admin (priorities 4-6), plus ethical basics (priority 7); testing/deployment.
- **Cursor Pro Workflow**: Use Cursor's composer mode for generating boilerplate (e.g., "Generate Next.js dashboard with drag-and-drop upload"). Iterate prompts like: "Add FastAPI endpoint for RAG-based personalization using LiteLLMs, Qdrant, Supabase." Test locally; deploy to Vercel (frontend) + Render/Fly.io (backend) for quick demos.
- **Dev Environment Setup (Pre-Day 1)**: Clone a Next.js + FastAPI starter (e.g., from GitHub templates). Set up Supabase project (auth, DB, storage); Qdrant cloud instance; LiteLLMs proxy with Groq/Gemini keys. Use GitHub for version control; Better Stack for basic monitoring.
- **Risks & Mitigations**: Hallucinations—enforce RAG in every AI call. Performance—limit to 20 users; use caching. Trust—build overrides first. If 2 days slip, prioritize teacher/student dashboards over admin.
- **Testing Strategy**: Manual end-to-end (e.g., teacher uploads PDF → AI assigns → student submits photo → grade/flag → view insights). Use Postman for API tests; browser dev tools for offline PWA. Aim for 85% grading accuracy in 5-10 mock tests.
- **Deployment**: Vercel for Next.js (free tier); Render for FastAPI. Supabase handles DB/storage. Add .env for keys (Groq, Google Vision, LiteLLMs).
- **NEP/Privacy Compliance**: From day 1, ensure no external data sharing; use Supabase's row-level security (RLS) for roles; log audits minimally.

Phases are broken into priorities with sub-steps: **Overview**, **UI/Frontend Details (Next.js)**, **Backend Logic (FastAPI/LiteLLMs/Qdrant/Supabase)**, **Integrations & Dependencies**, **Build Steps in Cursor Pro**, **Testing & Debugging**, and **Potential Gotchas**.

#### Priority 1 (Must): Teacher Dashboard – Simple Assignment Creation & Personalized Distribution
**Overview**: This is the entry point—teachers upload CBSE-aligned materials (PDFs/images for math topics, e.g., algebra) and trigger AI to personalize/distribute 5-10 questions per student. Ground everything in uploads via RAG to keep hallucinations <5%. Profiles start simple: Basic quiz (3-5 questions) to set tiers. Distribution: Auto-push to student feeds. Benefits: Immediate automation value; sets up data for later features.

**UI/Frontend Details (Next.js)**:
- Main page: Responsive layout (mobile-first for rural teachers) with sidebar (classes, assignments, progress). Central area: Drag-and-drop zone for uploads (use react-dropzone library).
- Upload form: Fields for class (dropdown: 6-10), subject (math only for MVP), topic (text input, e.g., "Quadratic Equations"). Button: "Personalize & Distribute."
- Profile quiz modal: Pops up if no profiles (5 MCQs, e.g., "Prefer visuals? Y/N" → tier assignment).
- Preview pane: Post-AI, show sample personalized questions (e.g., "Student A: Easy version" with toggle for all).
- Notifications: Toast for success ("Assigned to 20 students") or errors (e.g., "Upload failed—retry").
- Accessibility: Hindi/English toggle (basic, via i18n); low-bandwidth images (compressed).

**Backend Logic (FastAPI/LiteLLMs/Qdrant/Supabase)**:
- Endpoint: POST /upload-assign – Accepts file multipart, class/subject/topic metadata.
- Processing: Chunk PDF/image (use PyPDF2 for text extraction), embed chunks via Qdrant (collection: "uploads" with metadata like class/topic).
- Personalization: For each student (query Supabase profiles table), RAG retrieve relevant chunks → prompt LiteLLMs (e.g., "Generate 5 questions on [topic] tailored to [tier], grounded in [retrieved text]"). Route to Groq primary; failover to Gemini if rate-limited.
- Distribution: Store assignments in Supabase (assignments table: id, student_id, questions_json). Push notification via Supabase realtime (for student feed refresh).
- Hallucination Control: Always prepend prompt with "Only use provided context; do not invent facts."

**Integrations & Dependencies**:
- Supabase: Auth (teacher role check via RLS); storage for files; tables (classes, profiles: {student_id, tier, performance_score}).
- Qdrant: Vector search for quick retrieval (similarity threshold 0.8).
- LiteLLMs: Unified API for LLMs; config for cost/accuracy balance.

**Build Steps in Cursor Pro**:
- Day 1 Morning: Prompt "Create Next.js teacher dashboard page with react-dropzone for PDF/image uploads, form for class/topic, and modal for student profile quizzes."
- Integrate backend: "Add API call to FastAPI /upload-assign endpoint; handle file upload and display AI-generated previews."
- Afternoon: "Implement RAG in FastAPI: Chunk uploads, embed to Qdrant, retrieve for personalization prompt via LiteLLMs."

**Testing & Debugging**:
- Upload a sample CBSE math PDF; verify questions are grounded (e.g., match book examples).
- Test personalization: Mock 3 students with different tiers; ensure variations (easy/hard).
- Debug: Check console for Qdrant insert errors; use LiteLLMs logs for failover.

**Potential Gotchas**:
- File size limits (Supabase default 100MB—compress if needed).
- Profile bootstrapping: Seed dummy data in Supabase for testing.

#### Priority 2 (Must): Auto-Grading with Contextual Verification & Failover
**Overview**: Students submit answers (text/photo); AI grades with feedback, verifying against uploads. Flag ambiguities for teacher review (e.g., unclear handwriting). Manual override to build trust. Accuracy target: 95% for simple math. Failover ensures uptime.

**UI/Frontend Details (Next.js)**:
- In student dashboard (linked): Submission form with photo upload (camera integration via input) or text box.
- Post-submission: Spinner → display grade/feedback (e.g., "85% - Good steps, but error in step 3").
- Teacher review queue: Dedicated tab showing flagged submissions; editable fields (grade, feedback) with "Save Override" button.
- Visuals: Highlight errors in feedback (e.g., red text for issues).

**Backend Logic (FastAPI/LiteLLMs/Qdrant/Supabase)**:
- Endpoint: POST /grade – Accepts submission_id, answer (text or base64 image).
- Processing: If photo, OCR via Google Vision (extract text/math steps). RAG: Retrieve assignment/upload chunks from Qdrant.
- Grading: Prompt LiteLLMs ("Grade [answer] against [context/solution]; provide detailed feedback; flag if uncertain"). Parse output (JSON: {score, feedback, flag}).
- Failover: LiteLLMs auto-routes (e.g., Groq down → Gemini); log in Supabase for audits.
- Override: PATCH /override-grade – Update Supabase grades table; retrain profile if needed.

**Integrations & Dependencies**:
- Google Vision: For OCR (setup API key in .env).
- Supabase: Submissions table ({id, student_id, assignment_id, answer, grade, feedback, flagged}); realtime for teacher notifications.

**Build Steps in Cursor Pro**:
- Day 1 Afternoon: "Build Next.js submission form in student dashboard with photo/text; call FastAPI /grade."
- Day 2 Morning: "In FastAPI, add /grade endpoint with Google Vision OCR, Qdrant RAG, LiteLLMs prompt, and JSON parsing."
- Add overrides: "Create teacher review tab in Next.js with editable forms; PATCH to /override-grade."

**Testing & Debugging**:
- Mock submissions: Handwritten photo vs. text; verify flags (e.g., poor OCR → flag).
- Failover sim: Mock Groq error; confirm Gemini switch.
- Accuracy: Run 10 tests; manual review mismatches.

**Potential Gotchas**:
- OCR inaccuracies in handwriting—prompt for "best-effort" and flag liberally.
- Prompt engineering: Iterate in Cursor to refine for math-specific (e.g., steps vs. just answer).

#### Priority 3 (Must): Student Dashboard – Submission & Basic Personalization Feed
**Overview**: Simple, engaging view for students: OTP login, personalized assignment list, submission tools. Offline queuing for rural low-connectivity. Profiles update post-submission.

**UI/Frontend Details (Next.js)**:
- Login: OTP via Supabase Auth (email/phone).
- Feed: Card list of assignments (title, due date, 3-5 questions with hints button—pulls from uploads).
- Progress bar: Per assignment (e.g., 60% complete).
- Offline: PWA manifest; queue submissions in IndexedDB, sync on reconnect.

**Backend Logic (FastAPI/LiteLLMs/Qdrant/Supabase)**:
- Endpoint: GET /student-feed – Query Supabase for assignments by student_id; include RAG hints.
- Sync: POST /sync-offline – Handle queued submissions.

**Integrations & Dependencies**:
- Supabase Auth: OTP flow.
- Next.js PWA: Service workers for caching feeds.

**Build Steps in Cursor Pro**:
- Day 1 Morning: "Set up Next.js PWA with OTP login via Supabase; build feed page with cards."
- Afternoon: "Add offline queuing using IndexedDB; sync endpoint in FastAPI."

**Testing & Debugging**:
- Offline mode: Disconnect, submit, reconnect—verify sync.
- Feed personalization: Ensure hints are context-grounded.

**Potential Gotchas**:
- PWA install prompts—test on mobile browsers.
- OTP rate limits—use test mode.

#### Priority 4 (Must): Basic Progress Tracking & Class Insights
**Overview**: Auto-insights from grades: Student reports, class heatmaps. Exports for sharing.

**UI/Frontend Details (Next.js)**:
- Teacher tab: Heatmap grid (topics vs. mastery %); clickable student reports.
- Export buttons: PDF (jsPDF) or Excel (xlsx).

**Backend Logic (FastAPI/LiteLLMs/Qdrant/Supabase)**:
- Endpoint: GET /insights – Aggregate Supabase grades; LiteLLMs for suggestions (e.g., "Weak in algebra—remedial").

**Integrations & Dependencies**:
- Recharts for visuals.

**Build Steps in Cursor Pro**:
- Day 2 Morning: "Add insights tab in Next.js with Recharts heatmap; fetch from FastAPI /insights."

**Testing & Debugging**:
- Aggregate accuracy: Mock data; verify % calculations.

**Potential Gotchas**:
- Data privacy: RLS to limit views.

#### Priority 5 (Should): AI-Assisted Lesson Plan Generation
**Overview**: Chat input for plans; grounded outputs.

**UI/Frontend Details (Next.js)**:
- Chat modal: Input topic → AI response with editable text.

**Backend Logic (FastAPI/LiteLLMs/Qdrant/Supabase)**:
- Endpoint: POST /lesson-plan – RAG + prompt.

**Build Steps in Cursor Pro**:
- Day 2 Afternoon: "Implement chat modal in Next.js; backend endpoint with RAG."

**Testing & Debugging**:
- Relevance: Compare to uploads.

#### Priority 6 (Should): Admin/Principal Overview & Bulk Setup
**Overview**: Basic management; CSV uploads.

**UI/Frontend Details (Next.js)**:
- Admin page: Reports view, CSV import button.

**Backend Logic (FastAPI/LiteLLMs/Qdrant/Supabase)**:
- Endpoint: POST /bulk-setup – Parse CSV to Supabase users.

**Build Steps in Cursor Pro**:
- Day 2 Afternoon: "Build admin page with CSV import; FastAPI parsing."

**Testing & Debugging**:
- Import validation.

#### Priority 7 (Could): Ethical AI Monitoring (Basic)
**Overview**: Log AI calls; basic bias checks.

**Backend Logic (FastAPI/LiteLLMs/Qdrant/Supabase)**:
- Middleware: Log to audits table; simple prompt for bias (e.g., "Check for gender bias").

**Build Steps in Cursor Pro**:
- Day 2 Evening: "Add FastAPI middleware for logging; basic bias prompt in LiteLLMs."

**Testing & Debugging**:
- Log review.

**Final 2-Day Wrap-Up**: Deploy, run pilot demo (e.g., Zoom with teachers). Iterate based on feedback. This prototype will validate core value—expand in future phases. If stuck, prompt Cursor for specifics like "Debug Qdrant connection."


ionia-backend/
│
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── supabase_client.py
│   │   ├── events.py
│   │   ├── logger.py
│   │   ├── constants.py
│   │   └── __init__.py
│   │
│   ├── api/
│   │   ├── v1/
│   │   │   ├── routes/
│   │   │   │   ├── auth_routes.py
│   │   │   │   ├── assignment_routes.py
│   │   │   │   ├── grading_routes.py
│   │   │   │   ├── lesson_routes.py
│   │   │   │   ├── admin_routes.py
│   │   │   │   ├── audit_routes.py
│   │   │   │   └── __init__.py
│   │   │   ├── dependencies/
│   │   │   │   ├── supabase_auth.py
│   │   │   │   ├── role_guard.py
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   ├── responses.py
│   │   ├── errors.py
│   │   ├── exceptions.py
│   │   └── __init__.py
│   │
│   ├── services/
│   │   ├── audit_service.py
│   │   ├── admin_service.py
│   │   ├── user_service.py
│   │   ├── ai/
│   │   │   ├── embedding_service.py
│   │   │   └── __init__.py
│   │   └── __init__.py
|   ├── db/
|    │   ├── base.py              # Base declarative model, DB engine, session
|   │   ├── models/
|    │   │   ├── user_model.py
|    │   │   ├── assignment_model.py
|    │   │   ├── submission_model.py
|    │   │   ├── grade_model.py
|    │   │   └── __init__.py
|    │   ├── __init__.py
|    │   │
│   ├── schemas/
│   │   ├── assignment_schema.py
│   │   ├── submission_schema.py
│   │   ├── grade_schema.py
│   │   ├── profile_schema.py
│   │   ├── analytics_schema.py
│   │   ├── audit_schema.py
│   │   ├── lesson_schema.py
│   │   ├── admin_schema.py
│   │   └── __init__.py
│   │
│   ├── middleware/
│   │   ├── error_handler.py
│   │   ├── audit_logger.py
│   │   └── __init__.py
│   │
│   ├── utils/
│   │   ├── cache_utils.py
│   │   └── __init__.py
│   │
│   ├── tasks/
│   │   ├── background_tasks.py
│   │   └── __init__.py
│   │
│   └── __init__.py
│
├── tests/
│   ├── test_assignments.py
│   ├── test_grading.py
│   ├── test_auth.py
│   ├── test_lessons.py
│   └── __init__.py
│
├── scripts/
│   ├── seed_db.py
│   ├── sync_supabase_schemas.py
│   └── __init__.py
│
├── .env
├── .env.example
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── alembic/
├── alembic.ini
└── README.md


