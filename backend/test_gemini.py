import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
print(f"Testing with key: {api_key[:10]}...")

import json
try:
    genai.configure(api_key=api_key)
    models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    with open('models.json', 'w', encoding='utf-8') as f:
        json.dump(models, f, indent=2)
except Exception as e:
    print("ERROR:", e)
