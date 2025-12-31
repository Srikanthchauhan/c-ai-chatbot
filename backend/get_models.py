import os, groq, json
from dotenv import load_dotenv
load_dotenv()
client = groq.Groq()
with open("full_models.json", "w") as f:
    json.dump([{"id": m.id} for m in client.models.list().data], f, indent=2)
