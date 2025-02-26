# 📝 Perception - AI-Powered Online Evaluation Portal

## 🌍 Mission

In today’s education landscape, **automated assessments** often fail to provide meaningful feedback for descriptive answers.
Even with the presence of AES (Automated Essay Grading), it works in open-world and hence, not Context specific, and does not provide any feedback.

**Perception** bridges this gap by leveraging **Contextual AI-powered evaluation**, ensuring that students receive **accurate, personalized, and constructive feedback**—just like a human evaluator.

We aim to:

- Automate the **grading process** for descriptive-type questions.
- Provide **AI-driven insights** for students.
- Enhance **efficiency** without compromising on **fairness and accuracy**.

---

## 🚀 Features

### 🔹 **For Students**

- View **pending** and **submitted** question sets.
- Answer **descriptive** questions within the portal.
- Receive **AI-generated feedback and scores** in real-time.

### 🔹 **For Teachers**

- **Create** and **manage** question sets.
- Provide **model answers** to guide AI-based evaluation and obtain scores of students as evaluated by the LLM.
- **Review & finalize** AI-generated scores before submission.

### 🤖 **AI-Based Evaluation**

- Uses **LLM** to **compare** student responses with teacher-provided answers.
- Provides **personalized feedback** and **suggestions** for improvement.
- Ensures **fair and unbiased** evaluation across all students by using pre-defined rules.

---

## 🏆 Strengths

- **Efficient & Scalable** - Can evaluate large volumes of responses in real-time.
- **Fair & Unbiased** - Eliminates human subjectivity in grading.
- **Saves Time** - Teachers can **focus on teaching** rather than grading.
- **Detailed Feedback** - Students receive **insightful corrections** and guidance.

---

## ⚠ Weaknesses & Future Improvements

- **Limited Context Understanding** - LLM might struggle with **nuanced answers**.

- **Teacher Oversight Still Required** - AI **may misinterpret** complex responses, which would require teacher-intervention.

- **Dependence on Quality of Model Answer** - Poorly framed model answers may lead to **inaccurate grading**.

---

## 🛠 Tech Stack

🚀 **Frontend:** [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)  
⚡ **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
🧠 **AI Integration:** LLM-based (llama 3.3-70b) text evaluation with [Groq](https://groq.com/) inference API

---
