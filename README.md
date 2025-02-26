# Perception - AI-Powered Online Evaluation Portal

In today’s education landscape, **automated assessments** often fail to provide meaningful feedback for descriptive answers.
Even with the presence of AES (Automated Essay Grading), it works in open-world and hence, not Context specific, and does not provide any feedback.

**Perception** bridges this gap by leveraging **Contextual AI-powered evaluation**, ensuring that students receive **accurate, personalized, and constructive feedback**—just like a human evaluator.

## Features

### **For Students**

- View **pending** and **submitted** question sets.
- Answer **descriptive** questions within the portal.
- Receive **AI-generated feedback and scores** in real-time.

### **For Teachers**

- **Create** and **manage** question sets.
- Provide **model answers** to guide AI-based evaluation and obtain scores of students as evaluated by the LLM.
- **Review & finalize** AI-generated scores before submission.

### **AI-Based Evaluation**

- Uses **LLM** to **compare** student responses with teacher-provided answers.
- Provides **personalized feedback** and **suggestions** for improvement.
- Ensures **fair and unbiased** evaluation across all students by using pre-defined rules.


## 🛠 Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) 
- **Auth:** [Firebase](https://firebase.google.com/)
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI Integration:** LLM-based (llama 3.3-70b) text evaluation with [Groq](https://groq.com/) inference API

## To Run

### 1. Start the Frontend  

```bash
cd peak-app
npm install
npm run dev
```

### 2. Start the Backend  

```bash
cd backend
source venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app
```
