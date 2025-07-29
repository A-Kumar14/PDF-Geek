from flask import Flask, jsonify, request
from flask_cors import CORS
from envloader import client
import text_extractor
import fileuploader

app = Flask(__name__)
CORS(app)


def gptanalysis(filepath, question):
    try:
        # Upload the file to OpenAI for user_data purpose
        with open(filepath, "rb") as f:
            file_resp = client.files.create(
                file=f,
                purpose="user_data"
            )

        # Create a GPT response using file ID and user question
        response = client.responses.create(
            model="gpt-4.1",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_file", "file_id": file_resp.id},
                        {"type": "input_text", "text": question},
                    ],
                }
            ]
        )

        return response.output_text

    except Exception as e:
        print("Error during OpenAI processing:", e)
        return None


@app.route('/upload', methods=['POST'])
def upload_pdf():
    # Step 1: Upload and verify file
    error_resp, status, filepath = fileuploader.uploadfilecheck()
    if error_resp:
        return error_resp, status

    # Step 2: Extract text from PDF
    extracted_text = text_extractor.extraction(filepath)
    if extracted_text is None:
        return jsonify({"error": "Failed to extract text"}), 500

    # Step 3: Get user question or use default
    question = request.form.get("question", "Give a detailed summary of the document.")

    # Step 4: Get AI response
    summary = gptanalysis(filepath, question)
    if summary is None:
        return jsonify({"error": "Failed to generate AI response"}), 500

    # Step 5: Return JSON result
    return jsonify({
        "message": "Document processed successfully.",
        "text": extracted_text,
        "answer": summary
    }), 200


if __name__ == '__main__':
    app.run(debug=True)
