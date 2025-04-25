from flask import Flask, request, jsonify
from flask_cors import CORS
from pdf_processor import PDFProcessor
import tempfile
import os
import logging
import traceback

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/upload": {"origins": ["http://localhost:5173", "payslip-analyzer-ten.vercel.app"]},
    r"/ask": {
        "origins": ["http://localhost:5173", "payslip-analyzer-ten.vercel.app"],
        "methods": ["POST", "OPTIONS"],  # Explicitly allow OPTIONS
        "allow_headers": ["Content-Type"]
    }
})
processor = PDFProcessor()




@app.before_request
def log_request_info():
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())


@app.route('/upload', methods=['POST'])
def upload_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({"error": "No PDF file provided"}), 400
            
        pdf_file = request.files['pdf']
        if not pdf_file or pdf_file.filename == '':
            return jsonify({"error": "Invalid file"}), 400

        if not pdf_file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files allowed"}), 400

        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            pdf_file.save(tmp.name)
            try:
                text = processor.extract_text_from_pdf(tmp.name)
                if len(text) < 50:
                    raise ValueError("PDF contains insufficient text data")
                
                # Force create new knowledge base
                vectorstore = processor.create_knowledge_base(text, pdf_file.filename)
                
                # Verify persistence
                collection_name = processor._sanitize_collection_name(pdf_file.filename)
                if not processor.client.get_collection(collection_name):
                    raise Exception("Collection persistence failed")
                
                return jsonify({
                    "status": "success", 
                    "filename": pdf_file.filename,
                    "collection": collection_name,
                    "text_length": len(text)
                })
                
            except ValueError as ve:
                logger.error(f"Validation failed: {str(ve)}")
                return jsonify({"error": "Unsupported PDF format"}), 415
                
    except Exception as e:
        logger.error(f"Critical failure: {traceback.format_exc()}")
        return jsonify({"error": "PDF processing system error"}), 500


@app.route('/verify_collection', methods=['POST'])
def verify_collection():
    try:
        data = request.json
        filename = data.get('filename')
        collection_name = processor._sanitize_collection_name(filename)
        
        try:
            collection = processor.client.get_collection(collection_name)
            return jsonify({
                "exists": True,
                "count": collection.count(),
                "collection_name": collection_name
            })
        except Exception as e:
            return jsonify({
                "exists": False,
                "error": str(e),
                "collection_name": collection_name
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/ask', methods=['POST'])
def ask_question():
    try:
        data = request.json
        question = data.get('question')
        filename = data.get('filename')
        
        if not question or not filename:
            app.logger.error("Missing parameters in /ask request")
            return jsonify({"error": "Missing parameters"}), 400
        
        app.logger.info(f"Processing question '{question}' for {filename}")    
        vectorstore = processor.load_knowledge_base(filename)
        if not vectorstore:
            app.logger.error(f"Vectorstore not found for {filename}")
            return jsonify({"error": "PDF not processed"}), 404
            
        chain = processor.create_conversation_chain(vectorstore)
        response = processor.get_response(chain, question, [])
        
        return jsonify({
            "answer": response,
            "confidence": 0.9 
        })
        
    except Exception as e:
        app.logger.error(f"/ask endpoint error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500
    



@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
