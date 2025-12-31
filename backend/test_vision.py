import os
import groq
import base64
import json
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))
dummy_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

model_to_test = "meta-llama/llama-4-scout-17b-16e-instruct"
print(f"Testing model: {model_to_test}")

try:
    response = client.chat.completions.create(
        model=model_to_test,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What is in this image?"},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{dummy_image}"}}
                ]
            }
        ],
        max_tokens=20
    )
    print("Success!")
except groq.BadRequestError as e:
    print(f"Full Error: {json.dumps(e.body, indent=2)}")
except Exception as e:
    print(f"Unexpected Error: {e}")
