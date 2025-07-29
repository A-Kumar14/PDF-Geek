import pdfplumber

def extraction(filepath):
    full_text = []    
    try:
        with pdfplumber.open(filepath) as pdf:
            for pages in pdf.pages:
                text = pages.extract_text() or ""
                if text.strip():
                    full_text.append(text.strip())
        return "\n\n".join(full_text)
    except Exception as e:
        print("Error processing the file : ", e)
        return None
