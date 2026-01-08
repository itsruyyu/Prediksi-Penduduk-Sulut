from app import app

with app.test_client() as client:
    rv = client.post('/api/prediksi_admin', json={'tahun_akhir': 2030})
    print('Status:', rv.status_code)
    data = rv.get_json()
    if data:
        print('Response keys:', list(data.keys()))
        if 'error' in data:
            print('Error:', data['error'])
        elif 'status' in data:
            print('Status:', data['status'])
            if 'prediksi' in data:
                print('Prediksi count:', len(data['prediksi']))
    else:
        print('No response data')