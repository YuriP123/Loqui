from typing import Dict, Set
from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manage WebSocket connections for real-time updates"""
    
    def __init__(self):
        # user_id -> Set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and store a new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"WebSocket connected for user {user_id}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Clean up empty sets
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to all connections for a specific user"""
        if user_id in self.active_connections:
            dead_connections = set()
            
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message: {e}")
                    dead_connections.add(connection)
            
            # Remove dead connections
            for connection in dead_connections:
                self.disconnect(connection, user_id)
    
    async def broadcast_status_update(self, audio_id: int, user_id: int, status: str, progress: int):
        """Broadcast generation status update to user"""
        message = {
            "type": "generation_status",
            "audio_id": audio_id,
            "status": status,
            "progress": progress,
            "timestamp": str(datetime.utcnow())
        }
        
        await self.send_personal_message(message, user_id)

# Global connection manager instance
manager = ConnectionManager()
