import base64
import json

key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZ3N3ZGdzamV1ZnRhZnF6ZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwOTcwMzcsImV4cCI6MjA4MDY3MzAzN30.LyZ9-ASeuV65_GeozHbVi70AgiOmIxx9UB4nRJur6os"
parts = key.split('.')
if len(parts) > 1:
    payload = parts[1]
    # Add padding if necessary
    payload += '=' * (-len(payload) % 4)
    decoded = base64.b64decode(payload).decode('utf-8')
    print(decoded)
else:
    print("Invalid JWT")
