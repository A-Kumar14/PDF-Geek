from flask import Flask, jsonify, request
from flask_cors import CORS
from envloader import client
import text_extractor
import fileuploader
import json

app = Flask(__name__)
CORS(app)

def gptanalysis(filepath, question, chat_history):
    try:
        # Upload the file to OpenAI
        with open(filepath, "rb") as f:
            file_resp = client.files.create(
                file=f,
                purpose="user_data"
            )

        # Format chat history
        messages = [
            {
                "role" : 'system',
                "content" : (
                    "You are a helpful assistant that answers **only in the context of clinical trials**. "
                    "You strictly rely on the contents of the uploaded PDF. If a question is unrelated to clinical trials, "
                    "reply politely that you can only help with clinical trial-related questions."
                )
            }
        ]        
        for entry in chat_history:
            messages.append({"role": "user", "content": entry["question"]})
            messages.append({"role": "assistant", "content": entry["answer"]})

        # Add current question
        messages.append({
            "role": "user",
            "content": [
                {"type": "input_file", "file_id": file_resp.id},
                {"type": "input_text", "text": question}
            ]
        })

        # Call OpenAI chat endpoint
        response = client.responses.create(
            model="gpt-4.1",
            input=messages
        )

        return response.output_text

    except Exception as e:
        print("Error during OpenAI processing:", e)
        return None

@app.route('/upload', methods=['POST'])
def upload_pdf():
    error_resp, status, filepath = fileuploader.uploadfilecheck()
    if error_resp:
        return error_resp, status

    extracted_text = text_extractor.extraction(filepath)
    if extracted_text is None:
        return jsonify({"error": "Failed to extract text"}), 500

    question = request.form.get("question", "Give a detailed summary of the document.")
    chat_history_str = request.form.get("chatHistory", "[]")
    
    try:
        chat_history = json.loads(chat_history_str)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid chat history format"}), 400

    summary = gptanalysis(filepath, question, chat_history)
    if summary is None:
        return jsonify({"error": "Failed to generate AI response"}), 500

    return jsonify({
        "message": "Document processed successfully.",
        "text": extracted_text,
        "answer": summary
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
