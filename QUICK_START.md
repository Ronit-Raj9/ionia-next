# ⚡ QUICK START - Ionia AI Demo

## 🚀 Start Everything (2 Commands)

```bash
# 1. Add your API key
cd lms_ai/fastapi_server
cp env.template .env
nano .env  # Add GROQ_API_KEY=your_key_here

# 2. Start all services
cd ../..
./start-all.sh
```

**Done!** Open http://localhost:3001

---

## 📍 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3001 | Main LMS app |
| **AI Service** | http://localhost:8000 | FastAPI backend |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **Health Check** | http://localhost:8000/health | Status check |

---

## 🎯 Demo Flow (5 Minutes)

### 1. Show Architecture (30s)
- Open `AI_DEMO_README.md`
- Show diagram
- Mention: "3 AI agents, multi-agent collaboration"

### 2. GRADE Agent (2min)
1. Login as student
2. Submit assignment answer
3. **Open DevTools → Network tab**
4. Show `/api/grade/evaluate-submission` request
5. Show response JSON with `agents_used`
6. Point out detailed feedback

**Key Quote**: "Three agents collaborated: Grading Expert, Feedback Specialist, Gap Analyzer"

### 3. ARC Agent (1.5min)
1. Login as teacher
2. Create new assignment
3. Enable personalization
4. **Open DevTools → Network tab**
5. Show `/api/arc/personalize-assignment` requests
6. Show different personalized versions

**Key Quote**: "Each student gets questions adapted to their OCEAN personality and learning style"

### 4. LENS Agent (1min)
1. Go to Academic Planner
2. Upload sample syllabus
3. Click "Generate Lesson Plan"
4. Show AI-generated timeline

**Key Quote**: "AI analyzes curriculum and creates balanced coverage with learning objectives"

---

## 🐛 If Something Breaks

```bash
# Restart everything
./stop-all.sh
./start-all.sh

# Check logs
tail -f lms_ai/fastapi_server/fastapi.log
tail -f lms_frontend/nextjs.log

# Test manually
curl http://localhost:8000/health
```

---

## 💬 Investor Talking Points

### Technical
- ✅ Multi-agent AI (not single LLM)
- ✅ 100+ LLM support (not locked to OpenAI)
- ✅ FastAPI microservice (scales independently)
- ✅ Direct PraisonAI integration
- ✅ Graceful fallback system

### Business
- ✅ $0.02 per grading (vs $5-10 human grader)
- ✅ ~$300/month for 1000 students
- ✅ Can scale to 100K+ students
- ✅ 3-5s response time (real-time)

---

## 📚 Full Documentation

- **Demo Script**: `AI_DEMO_README.md`
- **Technical Details**: `AI_INTEGRATION_GUIDE.md`
- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **FastAPI Docs**: `lms_ai/fastapi_server/README.md`

---

## ✅ Pre-Demo Checklist

- [ ] Get Groq API key: https://console.groq.com/
- [ ] Add key to `.env`
- [ ] Run `./start-all.sh`
- [ ] Test grading once (warms up cache)
- [ ] Open DevTools in browser
- [ ] Have backup slides ready
- [ ] Practice 5-minute script

---

**You're ready to impress! 🚀**

