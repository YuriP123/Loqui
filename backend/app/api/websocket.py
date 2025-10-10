from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from app.utils.websocket_manager import manager
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.database import get_db
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time updates
    
    Connect with: ws://localhost:8000/api/ws/{user_id}?token=YOUR_JWT_TOKEN
    """
    # Verify token and user
    try:
        from app.utils.security import decode_access_token
        username = decode_access_token(token)
        
        if not username:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        from app.models.user import User
        user = db.query(User).filter(User.username == username).first()
        
        if not user or user.user_id != user_id:
            await websocket.close(code=1008, reason="Unauthorized")
            return
        
    except Exception as e:
        logger.error(f"WebSocket auth error: {e}")
        await websocket.close(code=1008, reason="Authentication failed")
        return
    
    # Accept connection
    await manager.connect(websocket, user_id)
    
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to generation updates",
            "user_id": user_id
        })
        
        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            # Echo back for now
            await websocket.send_json({
                "type": "echo",
                "message": data
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        logger.info(f"Client {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)
