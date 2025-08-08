from flask import jsonify, request
import os

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok= True)

def uploadfilecheck():
    if 'pdf' not in request.files:
        print("Error, no pdf file detected")
        return jsonify({"ERROR" : "NO PDF FILE DETECTED"}), 400
    
    file = request.files['pdf']
    if file.filename == '':
        return jsonify({"ERROR" : "NO FILE DETECTED"}), 400
    
    #saving filepath
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    return None, 200, filepath