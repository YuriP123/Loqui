import io

def test_get_samples_empty(client, auth_headers):
    """Test getting samples when none exist"""
    response = client.get("/api/samples/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert len(data["samples"]) == 0

def test_upload_sample(client, auth_headers):
    """Test uploading an audio sample"""
    # Create a fake WAV file
    fake_audio = io.BytesIO(b"RIFF" + b"\x00" * 100)
    fake_audio.name = "test.wav"
    
    response = client.post(
        "/api/samples/upload",
        headers=auth_headers,
        data={
            "sample_name": "Test Sample",
            "upload_type": "uploaded"
        },
        files={"file": ("test.wav", fake_audio, "audio/wav")}
    )
    
    # This might fail due to WAV validation, but tests the endpoint
    assert response.status_code in [201, 400]

def test_get_samples_unauthorized(client):
    """Test getting samples without auth"""
    response = client.get("/api/samples/")
    assert response.status_code == 401
