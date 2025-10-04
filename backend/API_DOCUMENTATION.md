# Loqui AI Voice Clone Studio - API Documentation

## Base URL
http://localhost:8000

## Authentication

All endpoints except `/api/auth/register` and `/api/auth/login` require authentication.

Include the JWT token in the Authorization header:
Authorization: Bearer <your_token>

---

## Endpoints

### Authentication

#### 1. Register User
```http
POST /api/auth/register
Request Body:
json{
  "username": "string",
  "email": "user@example.com",
  "password": "string",
  "full_name": "string" // optional
}
Response (201):
json{
  "user_id": 1,
  "username": "string",
  "email": "user@example.com",
  "full_name": "string",
  "created_at": "2024-01-01T00:00:00",
  "is_active": true
}
2. Login
httpPOST /api/auth/login
Request Body (form-data):
username=testuser
password=testpass123
Response (200):
json{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
3. Get Current User
httpGET /api/auth/me
Headers:
Authorization: Bearer <token>
Response (200):
json{
  "user_id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "full_name": "Test User",
  "created_at": "2024-01-01T00:00:00",
  "is_active": true
}

Audio Samples
4. Upload Audio Sample
httpPOST /api/samples/upload
Headers:
Authorization: Bearer <token>
Content-Type: multipart/form-data
Form Data:
sample_name: "My Voice Sample"
upload_type: "uploaded" // or "recorded"
file: <audio_file.wav>
Response (201):
json{
  "sample_id": 1,
  "user_id": 1,
  "sample_name": "My Voice Sample",
  "file_name": "uuid-filename.wav",
  "file_path": "./app/storage/samples/uuid-filename.wav",
  "file_size": 1024000,
  "duration_seconds": 5.2,
  "upload_type": "uploaded",
  "uploaded_at": "2024-01-01T00:00:00"
}
5. Get All Samples
httpGET /api/samples/?skip=0&limit=100
Response (200):
json{
  "samples": [...],
  "total": 5
}
6. Get Single Sample
httpGET /api/samples/{sample_id}
Response (200):
json{
  "sample_id": 1,
  "sample_name": "My Voice Sample",
  ...
}
7. Delete Sample
httpDELETE /api/samples/{sample_id}
Response (204): No content

Voice Generation
8. Create Generation Request
httpPOST /api/generation/create
Request Body:
json{
  "sample_id": 1,
  "model_name": "My Custom Voice",
  "script_text": "Hello, this is a test of my cloned voice."
}
Response (201):
json{
  "audio_id": 1,
  "user_id": 1,
  "sample_id": 1,
  "model_name": "My Custom Voice",
  "script_text": "Hello, this is a test...",
  "output_file_path": null,
  "status": "pending",
  "generated_at": "2024-01-01T00:00:00",
  "completed_at": null
}
9. Check Generation Status
httpGET /api/generation/status/{audio_id}
Response (200):
json{
  "audio_id": 1,
  "status": "processing",
  "progress": 50,
  "message": "Generating your audio..."
}
10. Get All Generations
httpGET /api/generation/?skip=0&limit=100
Response (200):
json{
  "generations": [...],
  "total": 3
}
11. Get Single Generation
httpGET /api/generation/{audio_id}
Response (200):
json{
  "audio_id": 1,
  "model_name": "My Custom Voice",
  "status": "completed",
  ...
}
12. Delete Generation
httpDELETE /api/generation/{audio_id}
Response (204): No content

Library
13. Get All Library Items
httpGET /api/library/all?skip=0&limit=100
Response (200):
json{
  "items": [
    {
      "id": 1,
      "item_type": "sample",
      "name": "My Voice Sample",
      "file_path": "./app/storage/samples/...",
      "file_size": 1024000,
      "duration_seconds": 5.2,
      "created_at": "2024-01-01T00:00:00"
    },
    {
      "id": 2,
      "item_type": "generated",
      "name": "My Custom Voice",
      "file_path": "./app/storage/generated/...",
      "file_size": 2048000,
      "duration_seconds": 10.5,
      "created_at": "2024-01-01T00:00:00",
      "status": "completed"
    }
  ],
  "total": 8,
  "samples_count": 5,
  "generated_count": 3
}
14. Get Samples Only
httpGET /api/library/samples?skip=0&limit=100
15. Get Generated Only
httpGET /api/library/generated?skip=0&limit=100
16. Download Audio File
httpGET /api/library/download/{item_type}/{item_id}
Example:
GET /api/library/download/sample/1
GET /api/library/download/generated/2
Response: Audio file download
17. Delete Library Item
httpDELETE /api/library/{item_type}/{item_id}
Example:
DELETE /api/library/sample/1
DELETE /api/library/generated/2
Response (200):
json{
  "message": "Item deleted successfully"
}

Status Codes

200 - OK
201 - Created
204 - No Content
400 - Bad Request
401 - Unauthorized
404 - Not Found
500 - Internal Server Error


Error Response Format
json{
  "detail": "Error message here"
}

Testing with cURL
Register & Login
bash# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -d "username=test&password=test123"
Upload Sample
bashcurl -X POST http://localhost:8000/api/samples/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "sample_name=Test Sample" \
  -F "upload_type=uploaded" \
  -F "file=@audio.wav"
Create Generation
bashcurl -X POST http://localhost:8000/api/generation/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sample_id":1,"model_name":"Test Voice","script_text":"Hello world"}'
