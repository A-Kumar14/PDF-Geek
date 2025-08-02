def build_message_context(document_text, chat_history, new_question):
    prompt = "You are a helpful assistant. Base your answers only on the uploaded PDF content.\n\n"
    prompt += f"Document:\n{document_text.strip()}\n\n"

    for turn in chat_history:
        prompt += f"User: {turn['question']}\n"
        prompt += f"Assistant: {turn['answer']}\n"

    prompt += f"User: {new_question}\nAssistant:"
    return prompt
