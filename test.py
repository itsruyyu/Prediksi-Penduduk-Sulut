import urllib.request
import json

try:
    with urllib.request.urlopen('http://127.0.0.1:5000/api/data_admin') as response:
        data = json.loads(response.read().decode())
        print("data_admin OK:", len(data), "records")
except Exception as e:
    print("Error data_admin:", e)

try:
    with urllib.request.urlopen('http://127.0.0.1:5000/api/status_model') as response:
        data = json.loads(response.read().decode())
        print("status_model OK:", data)
except Exception as e:
    print("Error status_model:", e)