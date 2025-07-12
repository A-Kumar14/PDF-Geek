from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import fitz  # PyMuPDF

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

    # ✅ Extract text using PyMuPDF
    try:
        doc = fitz.open(filepath)
        full_text = ""
        for page in doc:
            full_text += page.get_text()

        return jsonify({
            "message": "PDF uploaded and text extracted!",
            "text": full_text
        }), 200

    except Exception as e:
        print("Error extracting text:", e)
        return jsonify({"error": "Failed to extract text"}), 500

if __name__ == '__main__':
    app.run(debug=True)
