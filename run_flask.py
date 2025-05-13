#!/usr/bin/env python3
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import uuid

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Cấu hình mặc định
DEFAULT_DUCKS = [
    {
        "id": 1001,
        "name": "Vịt Vàng",
        "color": "#FFD700",
        "position": 0,
        "lane": 0,
        "isWinner": False,
    },
    {
        "id": 1002,
        "name": "Vịt Xanh",
        "color": "#4CAF50",
        "position": 0,
        "lane": 1,
        "isWinner": False,
    },
    {
        "id": 1003,
        "name": "Vịt Nước",
        "color": "#3498DB",
        "position": 0,
        "lane": 2,
        "isWinner": False,
    },
    {
        "id": 1004,
        "name": "Vịt Đỏ",
        "color": "#FF6B6B",
        "position": 0,
        "lane": 3,
        "isWinner": False,
    },
]

# In-memory data store (will be replaced with a proper database in production)
class DataStore:
    def __init__(self):
        self.ducks = DEFAULT_DUCKS.copy()
        self.race_duration = 10
        self.predetermined_winner_id = None
    
    def get_ducks(self):
        return self.ducks
    
    def add_duck(self):
        if len(self.ducks) >= 100:
            return None
        
        # Generate a unique ID
        unique_id = int(uuid.uuid4().hex[:8], 16)
        
        new_duck = {
            "id": unique_id,
            "name": f"Vịt {len(self.ducks) + 1}",
            "color": f"hsl({len(self.ducks) * 25 % 360}, 70%, 60%)",
            "position": 0,
            "lane": len(self.ducks),
            "isWinner": False,
        }
        
        self.ducks.append(new_duck)
        return new_duck
    
    def remove_duck(self, duck_id):
        if len(self.ducks) <= 1:
            return False
        
        index_to_remove = None
        for i, duck in enumerate(self.ducks):
            if duck["id"] == duck_id:
                index_to_remove = i
                break
        
        if index_to_remove is not None:
            del self.ducks[index_to_remove]
            # Update lanes
            for i, duck in enumerate(self.ducks):
                duck["lane"] = i
            
            # Reset predetermined winner if it was the removed duck
            if self.predetermined_winner_id == duck_id:
                self.predetermined_winner_id = None
            
            return True
        
        return False
    
    def update_duck(self, duck_id, updates):
        for duck in self.ducks:
            if duck["id"] == duck_id:
                for key, value in updates.items():
                    duck[key] = value
                return True
        return False
    
    def update_race_duration(self, duration):
        self.race_duration = max(1, min(60, duration))
        return self.race_duration
    
    def set_predetermined_winner(self, winner_id):
        if winner_id == "none":
            self.predetermined_winner_id = None
            return True
        
        for duck in self.ducks:
            if duck["id"] == int(winner_id):
                self.predetermined_winner_id = int(winner_id)
                return True
        
        return False

# Initialize data store
data_store = DataStore()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/ducks', methods=['GET'])
def get_ducks():
    return jsonify(data_store.get_ducks())

@app.route('/api/ducks', methods=['POST'])
def add_duck():
    new_duck = data_store.add_duck()
    if new_duck:
        return jsonify(new_duck), 201
    else:
        return jsonify({"error": "Không thể thêm vịt. Đã đạt giới hạn 100 con."}), 400

@app.route('/api/ducks/<int:duck_id>', methods=['DELETE'])
def remove_duck(duck_id):
    success = data_store.remove_duck(duck_id)
    if success:
        return jsonify({"success": True}), 200
    else:
        return jsonify({"error": "Không thể xóa vịt"}), 400

@app.route('/api/ducks/<int:duck_id>', methods=['PATCH'])
def update_duck(duck_id):
    updates = request.json
    success = data_store.update_duck(duck_id, updates)
    if success:
        return jsonify({"success": True}), 200
    else:
        return jsonify({"error": "Không thể cập nhật vịt"}), 400

@app.route('/api/settings', methods=['GET'])
def get_settings():
    return jsonify({
        "raceDuration": data_store.race_duration,
        "predeterminedWinnerId": data_store.predetermined_winner_id
    })

@app.route('/api/settings', methods=['PATCH'])
def update_settings():
    updates = request.json
    
    if updates and "raceDuration" in updates:
        data_store.update_race_duration(updates["raceDuration"])
    
    if updates and "predeterminedWinnerId" in updates:
        data_store.set_predetermined_winner(updates["predeterminedWinnerId"])
    
    return jsonify({
        "raceDuration": data_store.race_duration,
        "predeterminedWinnerId": data_store.predetermined_winner_id
    })

if __name__ == '__main__':
    # Use a different port to avoid conflict with the Node.js app
    port = 8081
    print(f"Starting Flask app on port {port}")
    app.run(host='localhost', port=port, debug=True)