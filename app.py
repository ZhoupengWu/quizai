import json
import os
import uuid
from datetime import datetime, UTC # Import UTC
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Correctly locate the data file in src/data
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'data', 'quizzes.json')

def read_quizzes_from_db():
    """Reads the full list of quizzes from the JSON file."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as file:
            return json.load(file)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def write_quizzes_to_db(quizzes):
    """Writes the full list of quizzes to the JSON file."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as file:
        json.dump(quizzes, file, indent=2, ensure_ascii=False)

@app.route('/api/quizzes', methods=['GET'])
def get_quizzes():
    """Returns the list of all quizzes."""
    return jsonify(read_quizzes_from_db())

@app.route('/api/quizzes', methods=['POST'])
def create_quiz():
    """Creates a new quiz."""
    payload = request.json
    if not payload:
        return jsonify({"error": "Invalid data"}), 400

    quizzes = read_quizzes_from_db()

    now = datetime.now(UTC).isoformat() # Use timezone-aware UTC
    new_quiz = {
        "id": str(uuid.uuid4()),  # Generate a unique ID
        "createdAt": now,
        "updatedAt": now,
        **payload
    }

    quizzes.append(new_quiz)
    write_quizzes_to_db(quizzes)

    return jsonify(new_quiz), 201

@app.route('/api/quizzes/<quiz_id>', methods=['PUT'])
def update_quiz(quiz_id):
    """Updates an existing quiz."""
    payload = request.json
    if not payload:
        return jsonify({"error": "Invalid data"}), 400

    quizzes = read_quizzes_from_db()
    quiz_to_update = None
    quiz_index = -1

    for i, q in enumerate(quizzes):
        if q['id'] == quiz_id:
            quiz_to_update = q
            quiz_index = i
            break

    if not quiz_to_update:
        return jsonify({"error": "Quiz not found"}), 404

    now = datetime.now(UTC).isoformat() # Use timezone-aware UTC
    # Merge payload into the existing quiz, keeping original values for fields not in payload
    updated_quiz = {**quiz_to_update, **payload, "updatedAt": now}
    
    quizzes[quiz_index] = updated_quiz
    write_quizzes_to_db(quizzes)

    return jsonify(updated_quiz)

@app.route('/api/quizzes/<quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id):
    """Deletes a quiz."""
    quizzes = read_quizzes_from_db()
    
    quiz_exists = any(q['id'] == quiz_id for q in quizzes)
    if not quiz_exists:
        return jsonify({"error": "Quiz not found"}), 404
        
    quizzes_after_deletion = [q for q in quizzes if q['id'] != quiz_id]
    
    if len(quizzes) == len(quizzes_after_deletion):
        # This case is unlikely if the previous check passes, but it's good practice
        return jsonify({"error": "Quiz could not be deleted"}), 500

    write_quizzes_to_db(quizzes_after_deletion)

    return '', 204

if __name__ == '__main__':
    # Ensure the port is different from the frontend dev server
    app.run(debug=True, port=5001)
