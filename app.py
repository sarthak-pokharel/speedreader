from flask import Flask, request, jsonify
import json
from flask_cors import CORS, cross_origin
from flask_uploads import UploadSet, configure_uploads, DOCUMENTS


import toolkit



app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


app.config['UPLOADED_RESOURCES_DEST'] = 'resources'
resources = UploadSet('resources', DOCUMENTS)
configure_uploads(app, resources)

# A sample function to demonstrate the functionality



@app.route('/upload_doc', methods=['POST'])
@cross_origin()
def upload_file():
    if 'file' not in request.files:
        return 'No file uploaded', 400

    file = request.files['file']

    if file.filename == '':
        return 'No file selected', 400

    filename = resources.save(file)
    b_hash = toolkit.register_book(filename)
    return jsonify(dict(hash=b_hash))



@app.route('/load_book', methods=['POST'])
@cross_origin()
def process_hash_route():
    data = request.get_json()
    if 'hash' not in data:
        return jsonify({'error': 'Missing "hash" property in the request payload'}), 400

    hash_value = data['hash']
    bookname, pages = toolkit.load_book(hash_value)
    return jsonify(dict(result=dict(bookname=bookname.split('/')[-1], pages=pages)))



@app.route('/summarize_text', methods=['POST'])
@cross_origin()
def gen_summary():
    print('summarize_text')
    data = request.get_json()
    if 'content' not in data:
        return jsonify({'error': 'Missing "content" property in the request payload'}), 400

    content = data['content']
    precontext = data['precontext'] or ""
    summary = toolkit.summarize(content, precontext)
    return jsonify(dict(result=summary))



@app.route('/existing_uploads')
@cross_origin()
def loadExistingUploads():
    
    jres = json.loads(open('./resources/res.json').read())
    
    return jsonify(dict(books=jres))



if __name__ == '__main__':
    app.run(debug=True)