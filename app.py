from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import toolkit



app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# A sample function to demonstrate the functionality

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



if __name__ == '__main__':
    app.run(debug=True)