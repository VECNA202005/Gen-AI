from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import json, os, uuid, datetime, re

app = Flask(__name__)
CORS(app)
MONGO_URI = 'mongodb+srv://231801041_db_user:gokul2k05@cluster.gqc9kf7.mongodb.net/?retryWrites=true&w=majority'
client = MongoClient(MONGO_URI)
db = client['ai_interview_chatbot']
users_col = db['users']
user_questions_col = db['user_questions']
results_col = db['results']

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
QUESTIONS_PATH = os.path.join(BASE_DIR, 'questions.json')

with open(QUESTIONS_PATH, 'r', encoding='utf-8-sig') as f:
    QUESTIONS_DATA = json.load(f)

sessions = {}
auth_tokens = {}
MAX_QUESTIONS_PER_TEST = int(os.getenv('MAX_QUESTIONS_PER_TEST', 10))

def get_user_from_token():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    user_id = auth_tokens.get(token)
    if not user_id:
        return None
    return users_col.find_one({'_id': user_id})

@app.route('/register', methods=['POST'])
def register():
    body = request.get_json() or {}
    name = (body.get('name') or '').strip()
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400

    if users_col.find_one({'email': email}):
        return jsonify({'error': 'Email already registered'}), 400

    password_hash = generate_password_hash(password)
    user_id = users_col.insert_one({
        'name': name,
        'email': email,
        'password_hash': password_hash,
        'created_at': datetime.datetime.utcnow()
    }).inserted_id

    return jsonify({'message': 'User registered successfully', 'user_id': str(user_id)})

@app.route('/login', methods=['POST'])
def login():
    body = request.get_json() or {}
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''

    user = users_col.find_one({'email': email})
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = str(uuid.uuid4())
    auth_tokens[token] = user['_id']

    return jsonify({'message': 'Login successful', 'token': token, 'user': {'name': user['name'], 'email': user['email']}})

@app.route('/start', methods=['POST'])
def start():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    body = request.get_json() or {}
    role = body.get('role')

    if not role or role not in QUESTIONS_DATA:
        return jsonify({'error': 'Invalid role'}), 400

    existing_session = sessions.get(user['_id'])
    if existing_session and existing_session.get('role') != role:
        return jsonify({'error': 'Role cannot be changed once selected for this session.'}), 400

    role_data = QUESTIONS_DATA[role]
    user_q = user_questions_col.find_one({'user_id': user['_id'], 'role': role})
    asked_set = set(user_q.get('asked_questions', [])) if user_q else set()

    if len(asked_set) >= len(role_data):
        asked_set = set()

    available = [q for q in role_data if q['question'] not in asked_set]
    session_limit = min(MAX_QUESTIONS_PER_TEST, len(role_data))

    next_q = available[0] if available else None
    if next_q:
        asked_set.add(next_q['question'])
        user_questions_col.update_one(
            {'user_id': user['_id'], 'role': role},
            {'$set': {'asked_questions': list(asked_set), 'updated_at': datetime.datetime.utcnow()}},
            upsert=True
        )

    sessions[user['_id']] = {
        'role': role,
        'score': 0,
        'total_attempted': 0,
        'details': [],
        'asked': asked_set,
        'limit': session_limit
    }

    return jsonify({
        'question': next_q['question'] if next_q else None,
        'total_questions': session_limit,
        'reset': len(asked_set) == 1,
        'remaining': session_limit-1 if next_q else 0
    })

@app.route('/answer', methods=['POST'])
def answer():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    body = request.get_json() or {}
    user_answer = (body.get('answer') or '').strip()
    question_text = (body.get('question') or '').strip()

    if not user_answer or not question_text:
        return jsonify({'error': 'Question and answer required'}), 400

    session = sessions.get(user['_id'])
    if not session:
        return jsonify({'error': 'Session not found. Please start role again.'}), 400

    role = session['role']
    question_data = next((q for q in QUESTIONS_DATA.get(role, []) if q['question'] == question_text), None)
    if not question_data:
        return jsonify({'error': 'Question invalid for this role'}), 400

    keywords = question_data.get('keywords', [])
    lower_answer = user_answer.lower()
    matched = [kw for kw in keywords if kw.lower() in lower_answer]
    matches_count = len(matched)

    if matches_count >= 3:
        level = 'Excellent'
    elif matches_count == 2:
        level = 'Good'
    elif matches_count == 1:
        level = 'Needs Improvement'
    else:
        level = 'Poor'

    missing = [kw for kw in keywords if kw not in matched]
    feedback = f"{level}. You matched {matches_count} keyword(s): {', '.join(matched) if matched else 'none'}."
    suggested_answer = None

    if missing and matches_count == 0:
        feedback += f" Missing: {', '.join(missing)}."
        question_text = question_data.get('question', 'this question')
        question_simple = re.sub(r"\s*-\s*Advanced scenario\s*#\d+$", '', question_text, flags=re.IGNORECASE).strip()
        suggested_answer = (
            f"A strong answer should mention: {', '.join(keywords)}. "
            f"Example: 'I focus on {', '.join(keywords[:-1])} and {keywords[-1]}, providing concrete steps and outcomes.'"
        )
    else:
        suggested_answer = None

    session['score'] += matches_count
    session['total_attempted'] += 1
    session['details'].append({
        'question': question_text,
        'answer': user_answer,
        'matched_keywords': matched,
        'score': matches_count,
        'feedback': feedback,
        'timestamp': datetime.datetime.utcnow()
    })

    role_data = QUESTIONS_DATA.get(role, [])
    user_q = user_questions_col.find_one({'user_id': user['_id'], 'role': role})
    asked_set = set(user_q.get('asked_questions', [])) if user_q else set()

    available = [q for q in role_data if q['question'] not in asked_set]
    next_question = None
    done = False

    if session['total_attempted'] >= session['limit'] - 1:
        done = True
    else:
        if available:
            next_question = available[0]['question']
            asked_set.add(next_question)
            user_questions_col.update_one(
                {'user_id': user['_id'], 'role': role},
                {'$set': {'asked_questions': list(asked_set), 'updated_at': datetime.datetime.utcnow()}},
                upsert=True
            )
        else:
            done = True

    if done:
        total_questions = session.get('limit', len(role_data))
        overall_msg = 'Great effort! Complete session.'
        if session['score'] >= total_questions * 3:
            overall_msg = 'Excellent performance!'
        elif session['score'] >= total_questions * 2:
            overall_msg = 'Good performance.'
        elif session['score'] >= total_questions:
            overall_msg = 'Average, keep practicing.'
        else:
            overall_msg = 'Needs improvement.'

        results_col.insert_one({
            'user_id': user['_id'],
            'role': role,
            'score': session['score'],
            'total_questions': total_questions,
            'attempted': session['total_attempted'],
            'created_at': datetime.datetime.utcnow(),
            'message': overall_msg,
            'details': session['details']
        })

        sessions.pop(user['_id'], None)

        return jsonify({
            'feedback': feedback,
            'suggested_answer': suggested_answer,
            'score': session['score'],
            'next_question': None,
            'completed': True,
            'result': {
                'score': session['score'],
                'total_questions': total_questions,
                'message': overall_msg
            }
        })

    return jsonify({
        'feedback': feedback,
        'suggested_answer': suggested_answer,
        'score': session['score'],
        'next_question': next_question,
        'completed': False,
        'total_attempted': session['total_attempted'],
        'total_questions': session.get('limit', len(role_data))
    })

@app.route('/result', methods=['GET'])
def get_result():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    doc = results_col.find_one({'user_id': user['_id']}, sort=[('created_at', -1)])
    if not doc:
        return jsonify({'error': 'No results found'}), 404

    return jsonify({
        'id': str(doc['_id']),
        'role': doc['role'],
        'score': doc['score'],
        'total_questions': doc['total_questions'],
        'attempted': doc.get('attempted', 0),
        'message': doc.get('message', ''),
        'details': doc.get('details', []),
        'created_at': doc['created_at'].isoformat()
    })

@app.route('/result/<result_id>', methods=['GET'])
def get_result_by_id(result_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    from bson import ObjectId
    try:
        oid = ObjectId(result_id)
    except Exception:
        return jsonify({'error': 'Invalid result id'}), 400

    doc = results_col.find_one({'_id': oid, 'user_id': user['_id']})
    if not doc:
        return jsonify({'error': 'Result not found'}), 404

    return jsonify({
        'id': str(doc['_id']),
        'role': doc['role'],
        'score': doc['score'],
        'total_questions': doc['total_questions'],
        'attempted': doc.get('attempted', 0),
        'message': doc.get('message', ''),
        'details': doc.get('details', []),
        'created_at': doc['created_at'].isoformat()
    })

@app.route('/profile-results', methods=['GET'])
def profile_results():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    docs = []
    for r in results_col.find({'user_id': user['_id']}).sort('created_at', -1):
        docs.append({
            'id': str(r['_id']),
            'role': r['role'],
            'score': r['score'],
            'total_questions': r['total_questions'],
            'attempted': r.get('attempted', 0),
            'message': r.get('message', ''),
            'created_at': r['created_at'].isoformat(),
            'details': r.get('details', [])
        })

    return jsonify({'results': docs})

@app.route('/finish', methods=['POST'])
def finish():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    session = sessions.get(user['_id'])
    if not session:
        # If session was already concluded by answer logic, return latest stored result silently.
        last_result = results_col.find_one({'user_id': user['_id']}, sort=[('created_at', -1)])
        if last_result:
            return jsonify({
                'message': 'Session already finished',
                'result': {
                    'role': last_result.get('role'),
                    'score': last_result.get('score'),
                    'total_questions': last_result.get('total_questions'),
                    'attempted': last_result.get('attempted', 0),
                    'message': last_result.get('message'),
                    'details': last_result.get('details', [])
                }
            })
        return jsonify({'error': 'No active session'}), 400

    role = session['role']
    score = session.get('score', 0)
    attempted = session.get('total_attempted', 0)
    total_questions = session.get('limit', len(QUESTIONS_DATA.get(role, [])))
    details = session.get('details', [])

    overall_msg = 'Test timed out.'
    if score >= total_questions * 3:
        overall_msg = 'Excellent performance!'
    elif score >= total_questions * 2:
        overall_msg = 'Good performance.'
    elif score >= total_questions:
        overall_msg = 'Average, keep practicing.'
    else:
        overall_msg = 'Needs improvement.'

    results_col.insert_one({
        'user_id': user['_id'],
        'role': role,
        'score': score,
        'total_questions': total_questions,
        'attempted': attempted,
        'created_at': datetime.datetime.utcnow(),
        'message': overall_msg,
        'details': details
    })

    sessions.pop(user['_id'], None)

    return jsonify({
        'message': 'Session finished',
        'result': {
            'role': role,
            'score': score,
            'total_questions': total_questions,
            'attempted': attempted,
            'message': overall_msg,
            'details': details
        }
    })

@app.route('/chart-data', methods=['GET'])
def chart_data():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    docs = list(results_col.find({'user_id': user['_id']}).sort('created_at', 1))
    labels = [d['created_at'].strftime('%Y-%m-%d %H:%M') for d in docs]
    scores = [d['score'] for d in docs]

    return jsonify({'labels': labels, 'scores': scores})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
