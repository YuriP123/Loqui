def test_get_all_library_items(client, auth_headers):
    """Test getting all library items"""
    response = client.get("/api/library/all", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "samples_count" in data
    assert "generated_count" in data

def test_get_samples_only(client, auth_headers):
    """Test filtering library by samples"""
    response = client.get("/api/library/samples", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["generated_count"] == 0

def test_get_generated_only(client, auth_headers):
    """Test filtering library by generated audio"""
    response = client.get("/api/library/generated", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["samples_count"] == 0

def test_library_unauthorized(client):
    """Test library access without auth"""
    response = client.get("/api/library/all")
    assert response.status_code == 401
