# 🧠 PDF Geek

A full-stack intelligent chatbot for analyzing PDF documents using AI. Built with REACT and FLASK, it provides a clean web interface where users can upload PDFs, view them live, and chat with the document using OpenAI's language models.

---

## Directory Structure

| Directory     | Description                                                                 |
|---------------|-----------------------------------------------------------------------------|
| `ChatBot-main`| Original proof-of-concept with basic AI-PDF logic                           |
| `backend/`    | Flask backend that handles PDF upload, processing with pdfplumber, and GPT calls |
| `frontend/`   | React-based UI for PDF viewing and chatting                                  |
| `uploads/`    | Temporary storage for uploaded PDFs                                          |

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/A-Kumar14/PDF-Geek.git
cd PDF-Geek
````

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
# Create a .env file with your OpenAI API key
# Example:
# OPENAI_API_KEY=your_key_here
python app.py
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

Open your browser at `http://localhost:3000`.

---

## Key Features

* 📄 **Upload and preview** PDF documents side-by-side
* 💬 **Chat with your documents** using OpenAI-powered prompt input
* 📤 Upload by clicking anywhere on the left panel
* 🎯 Clean split-screen layout: PDF on the left, chat interface on the right
* 🧼 Markdown-rendered AI responses for a clean reading experience

---

## Prompt Examples

Try these prompts after uploading your PDF:

* `"Summarize the main points of the document"`
* `"List all clinical trials mentioned"`
* `"What are the key findings in this report?"`
* `"Summarize the contact and institutional information"`

---

## 🤝 Contributing

Contributions are welcome!
Feel free to submit pull requests or open issues for bugs, ideas, or features.

<<<<<<< HEAD
---
=======
---
>>>>>>> 85c4241 (Added AI loading spinner next to Ask button and fixed canvas render conflicts)
