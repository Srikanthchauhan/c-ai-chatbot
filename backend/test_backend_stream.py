
import requests
import json
import base64
import sys

def test_stream_pdf_upload():
    print("Testing PDF upload to STREAM endpoint...", flush=True)
    # Create a dummy PDF
    from pypdf import PdfWriter
    import io
    
    buffer = io.BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    writer.write(buffer)
    pdf_bytes = buffer.getvalue()
    
    files = {'file': ('test_stream.pdf', pdf_bytes, 'application/pdf')}
    data = {'message': 'What is in this PDF?', 'conversation_history': '[]'}
    
    try:
        response = requests.post(
            "http://localhost:8000/chat/stream",
            data=data,
            files=files,
            stream=True
        )
        print(f"Stream Status: {response.status_code}", flush=True)
        
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                print(f"Stream Chunk: {decoded_line}", flush=True)
                
    except Exception as e:
        print(f"PDF Stream Error: {e}", flush=True)

if __name__ == "__main__":
    test_stream_pdf_upload()
