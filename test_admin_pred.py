from app import app

with app.test_client() as client:
    rv = client.get('/api/get_prediksi_admin')
    print('Status:', rv.status_code)
    data = rv.get_json()
    print('Response:', data)