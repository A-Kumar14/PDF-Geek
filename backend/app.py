from dotenv import load_dotenv
load_dotenv()  

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import pdfplumber
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
    )

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_pdf(): 
    if 'pdf' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['pdf']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        full_text = []
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                if text.strip():
                    full_text.append(text.strip())
        full_text = "\n\n".join(full_text)

        with open(filepath, "rb") as f:
            file_resp = client.files.create(
                file=f,
                purpose="user_data"
            )

        user_question = request.form.get(
            "question",
            "Give a detailed summary of the document."
        )

        resp = client.responses.create(
            model="gpt-4.1",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_file", "file_id": file_resp.id},
                        {"type": "input_text", "text": user_question},
                    ],
                }
            ]
        )
        summary = resp.output_text

        return jsonify({
            "message": "Document processed successfully.",
            "text": full_text,
            "answer": summary
        }), 200

    except Exception as e:
        print("Error during processing:", e)
        return jsonify({"error": "Processing failed"}), 500

if __name__ == '__main__':
    app.run(debug=True)
