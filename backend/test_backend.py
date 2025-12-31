
import requests
import json
import base64

def test_text_chat():
    print("Testing text chat...")
    response = requests.post(
        "http://localhost:8000/chat",
        data={"message": "Hello, are you working?", "conversation_history": "[]"}
    )
    print(f"Text Chat Status: {response.status_code}")
    print(f"Text Chat Response: {response.text[:100]}...")

def test_pdf_upload():
    print("\nTesting PDF upload...")
    # Create a dummy PDF
    from pypdf import PdfWriter
    import io
    
    buffer = io.BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=72, height=72)
    writer.write(buffer)
    pdf_bytes = buffer.getvalue()
    
    files = {'file': ('test.pdf', pdf_bytes, 'application/pdf')}
    data = {'message': 'What is in this PDF?', 'conversation_history': '[]'}
    
    try:
        response = requests.post(
            "http://localhost:8000/chat",
            data=data,
            files=files
        )
        print(f"PDF Upload Status: {response.status_code}")
        print(f"PDF Upload Response: {response.text}")
    except Exception as e:
        print(f"PDF Upload Error: {e}")

if __name__ == "__main__":
    test_text_chat()
    test_pdf_upload()
