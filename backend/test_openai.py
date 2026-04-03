import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(r'c:\Users\GOKUL\Downloads\gen ai project\backend\.env')
api_key = os.getenv('OPENAI_API_KEY', '')
print(f"KEY: {api_key[:5] if api_key else 'NO KEY'}")

try:
    openai_client = OpenAI(api_key=api_key)
    response = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "say hi"}],
        temperature=0.7,
        max_tokens=10
    )
    print("Response:", response.choices[0].message.content.strip())
except Exception as e:
    import traceback
    traceback.print_exc()
