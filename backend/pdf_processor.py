import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import ConversationalRetrievalChain
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
import chromadb
from chromadb.config import Settings
import os
import logging
import json
from pdfplumber import PDF
import pdfplumber
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        )
        

        self.embeddings = SentenceTransformerEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )

        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.llm_model = "mixtral-8x7b-32768" 
        
        self._setup_chroma()
        
        self.qa_template = """
        You are a helpful assistant that provides accurate information based on the PDF content.
        Your response must always be in JSON format with exactly two keys: 'answer' and 'confidence'.

        Rules:
        1. Answer must be based only on the provided context
        2. Confidence score must be between 0 and 1:
        - 1.0: Answer is directly stated in context
        - 0.7-0.9: Answer can be clearly inferred from context
        - <= 0.6: Question is not relevant with the given context and can't be answered. I am using a fallback with threshold 0.6.  

        Context: {context}

        Question: {question}

        Provide your response in this exact format:
        {{"answer": "your answer here", "confidence": 0.X}}

        Remember: Always return a JSON object, no matter what. """

    def _setup_chroma(self):
        self.persist_directory = "chroma_db"
        os.makedirs(self.persist_directory, exist_ok=True)
    
        self.client = chromadb.PersistentClient(
        path=self.persist_directory,
        settings=chromadb.config.Settings(
            is_persistent=True,
            anonymized_telemetry=False,
            allow_reset=True
        )
    )
        logger.info(f"Chroma client initialized at {self.persist_directory}")



    def extract_text_from_pdf(self, file_path):
        try:
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                # Robust table handling
                    tables = page.extract_tables() or []
                    for table in tables:
                        if table:  # Skip empty tables
                            cleaned_table = [
                            [str(cell) if cell is not None else "" for cell in row]
                            for row in table
                        ]
                        text += "\n".join(["|".join(row) for row in cleaned_table]) + "\n"
                
                # Safe text extraction
                page_text = page.extract_text() or ""
                text += page_text + "\n"
                
            return self.clean_text(text)
    
        except Exception as e:
            logger.error(f"PDF extraction failed: {str(e)}")
            raise ValueError(f"Unprocessable PDF structure: {str(e)}")


    def clean_text(self, text):
        # Remove LaTeX formatting artifacts
        return re.sub(r'\\[a-z]+{.*?}|[{}]|\$', '', text)
    

    def _sanitize_collection_name(self, filename):
        base_name = os.path.splitext(filename)[0]
        sanitized = re.sub(r'[^a-zA-Z0-9-]', '_', base_name)
    
    # Remove leading/trailing non-alphanumeric characters
        sanitized = sanitized.strip('_').strip('-')
    
    # Ensure minimum 3 characters
        if len(sanitized) < 3:
            sanitized = f"doc_{sanitized}"
    
    # Ensure maximum 63 characters
        final_name = f"pdf_{sanitized}"[:63]
    
    # Remove consecutive special characters
        final_name = re.sub(r'_{2,}', '_', final_name)
        final_name = re.sub(r'-{2,}', '-', final_name)
    
        return final_name.lower()  # Chroma requires lowercase



    def create_knowledge_base(self, text, filename):
        sanitized_name = re.sub(r'[^a-zA-Z0-9-]', '_', filename.replace('.pdf', ''))
        sanitized_name = sanitized_name.strip('_')  # Remove leading/trailing underscores
        collection_name = f"pdf_{sanitized_name}"[:63].lower()  # Chroma requires lowercase
    
        logger.info(f"Creating collection: {collection_name}")
    
        try:
        # Delete existing collection if present
            try:
                self.client.delete_collection(collection_name)
            except Exception as delete_error:
                logger.info(f"No existing collection to delete: {delete_error}")
            
            texts = self.text_splitter.split_text(text)
        
            vectorstore = Chroma.from_texts(
                texts=texts,
                embedding=self.embeddings,
                client=self.client,
                collection_name=collection_name,
                persist_directory=self.persist_directory
        )
            vectorstore.persist()
        
            logger.info(f"Persisted collection: {collection_name}")
            return vectorstore
        
        except Exception as e:
            logger.error(f"Collection creation failed: {str(e)}")
            raise

    def load_knowledge_base(self, filename):
        try:
            collection_name = self._sanitize_collection_name(filename)
        
        # Directly attempt to access collection
            try:
                return Chroma(
                    client=self.client,
                    collection_name=collection_name,
                    embedding_function=self.embeddings,
                    persist_directory=self.persist_directory
            )
            except Exception as e:
                logger.error(f"Collection {collection_name} not found: {str(e)}")
                return None
            
        except Exception as e:
            logger.error(f"Error loading KB: {str(e)}")
            return None


    def create_conversation_chain(self, vectorstore):
        try:
            llm = ChatGroq(
                temperature=0.1, 
                groq_api_key=self.groq_api_key,
                model_name=self.llm_model
            )
        
            prompt = PromptTemplate(
                template=self.qa_template,
                input_variables=["context", "question"]
            )
            
            # Create the chain with specific configuration
            chain = ConversationalRetrievalChain.from_llm(
                llm=llm,
                retriever=vectorstore.as_retriever(
                    search_type="similarity",
                    search_kwargs={"k": 4}
                ),
                return_source_documents=False,
                combine_docs_chain_kwargs={"prompt": prompt},
                verbose=True
            )
            logger.info("Successfully created conversation chain")
            return chain
            
        except Exception as e:
            logger.error(f"Chain creation failed: {e}")
            raise

    def get_response(self, chain, question, history):
        try:
            result = chain({"question": question, "chat_history": history})
            raw = result.get('answer', '')
            
            try:
                response = json.loads(raw.split("``````")[0].strip())
                print(response)
                if response["confidence"] < 0.64:
                    return "I'm not sure. Please consult HR."
                return response["answer"]
            except:
                return raw.split("}")[0].split(":")[-1].strip('"')
                
        except Exception as e:
            logger.error(f"Response error: {e}")
            return "Error processing request"
