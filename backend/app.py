from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
import json, os, uuid, datetime, re, functools
from flask_mail import Mail, Message
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(BASE_DIR, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Mail Configuration (Mock Service)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'mock@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'mock_password')
app.config['MAIL_SUPPRESS_SEND'] = True # Set to False and provide real credentials to send real emails

db = SQLAlchemy(app)
mail = Mail(app)

QUESTIONS_PATH = os.path.join(BASE_DIR, 'questions.json')
SKILLS_PATH = os.path.join(BASE_DIR, 'skills_data.json')

with open(QUESTIONS_PATH, 'r', encoding='utf-8-sig') as f:
    QUESTIONS_DATA = json.load(f)

with open(SKILLS_PATH, 'r', encoding='utf-8-sig') as f:
    SKILLS_DATA = json.load(f)

sessions = {}
auth_tokens = {}
MAX_QUESTIONS_PER_TEST = int(os.getenv('MAX_QUESTIONS_PER_TEST', 10))

# --- Models ---
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(80), nullable=True)
    profile_photo = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class UserQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    # Store questions as a JSON string
    asked_questions = db.Column(db.Text, default="[]")
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Result(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, default=0)
    total_questions = db.Column(db.Integer, default=0)
    attempted = db.Column(db.Integer, default=0)
    message = db.Column(db.String(255))
    # Store details as a JSON string
    details = db.Column(db.Text, default="[]")
    infractions = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class SkillTest(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('user.id'), nullable=False)
    test_type = db.Column(db.String(50), nullable=False) # 'APTITUDE' or 'CODING'
    score = db.Column(db.Integer)
    ai_feedback = db.Column(db.Text)
    raw_data = db.Column(db.Text) # JSON string of answers or code
    infractions = db.Column(db.Text, default="[]")
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Create tables
with app.app_context():
    db.create_all()

def token_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token missing'}), 401
        token = auth_header.split(' ')[1]
        user_id = auth_tokens.get(token)
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 401
        return f(user, *args, **kwargs)
    return decorated

def get_user_from_token():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    user_id = auth_tokens.get(token)
    if not user_id:
        return None
    return User.query.filter_by(id=user_id).first()

from flask import send_from_directory
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload-profile-photo', methods=['POST'])
@token_required
def upload_profile_photo(current_user):
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo part'}), 400
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = f"{current_user.id}_{str(uuid.uuid4())[:8]}.jpg"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        current_user.profile_photo = f"/uploads/{filename}"
        db.session.commit()
        
        return jsonify({
            'message': 'Photo uploaded successfully',
            'photo_url': current_user.profile_photo
        })

@app.route('/register', methods=['POST'])
def register():
    body = request.get_json() or {}
    name = (body.get('name') or '').strip()
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    role = body.get('role') or 'software_engineer'

    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400

    password_hash = generate_password_hash(password)
    new_user = User(name=name, email=email, password_hash=password_hash, role=role)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully', 'user_id': new_user.id})

@app.route('/login', methods=['POST'])
def login():
    body = request.get_json() or {}
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = str(uuid.uuid4())
    auth_tokens[token] = user.id

    return jsonify({
        'message': 'Login successful',
        'token': token, 
        'user': {
            'name': user.name, 
            'email': user.email,
            'role': user.role,
            'profile_photo': user.profile_photo
        }
    })

@app.route('/start', methods=['POST'])
def start():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    # Strict Role Locking: Use the role from the user profile
    role = user.role or 'software_engineer'

    if not role or role not in QUESTIONS_DATA:
        return jsonify({'error': 'Invalid role'}), 400

    existing_session = sessions.get(user.id)
    if existing_session and existing_session.get('role') != role:
        return jsonify({'error': 'Role cannot be changed once selected for this session.'}), 400

    user_q = UserQuestion.query.filter_by(user_id=user.id, role=role).first()
    asked_set = set(json.loads(user_q.asked_questions)) if user_q else set()
    session_limit = MAX_QUESTIONS_PER_TEST

    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GEMINI_API_KEY', ''))
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = f"You are an expert technical interviewer. Generate a highly specific, realistic interview question for a candidate applying for the role of '{role}'. Just return the question text with no extra formatting."
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=800,
            )
        )
        ai_question = response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        ai_question = f"Let's start your interview for {role}. Can you introduce yourself and your relevant experience?"

    asked_set.add(ai_question)
    
    if not user_q:
        user_q = UserQuestion(user_id=user.id, role=role, asked_questions=json.dumps(list(asked_set)))
        db.session.add(user_q)
    else:
        user_q.asked_questions = json.dumps(list(asked_set))
    db.session.commit()

    sessions[user.id] = {
        'role': role,
        'score': 0,
        'total_attempted': 0,
        'details': [],
        'asked': asked_set,
        'limit': session_limit
    }

    return jsonify({
        'question': ai_question,
        'total_questions': session_limit,
        'reset': len(asked_set) == 1,
        'remaining': session_limit-1
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

    session = sessions.get(user.id)
    if not session:
        return jsonify({'error': 'Session not found. Please start role again.'}), 400

    role = session['role']
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GEMINI_API_KEY', ''))
        model = genai.GenerativeModel('gemini-2.0-flash')
        prompt = f"""You are assessing an interview candidate for the '{role}' role.
Question asked: "{question_text}"
Candidate's answer: "{user_answer}"

Evaluate the candidate's answer based on technical accuracy, relevance, and clarity.
STRICT SCORING RULES:
1. If the answer is factually incorrect, completely irrelevant, or "I don't know", the score LEVEL must be "Poor".
2. "Needs Improvement" is for answers that are partially correct but lack depth or key details.
3. "Good" is for answers that are correct and complete but standard.
4. "Excellent" is for answers that are insightful, demonstrate deep expertise, or provide great examples.

Provide exactly one short sentence of polite and encouraging feedback. (Even for Poor answers, be polite like "That's an interesting perspective, let's look at the standard approach").
Provide exactly one short sentence suggesting a better, more accurate answer.
Generate the next realistic interview question for this role, maintaining continuation of the interview.

Output your response strictly as a JSON object with these 4 keys exactly:
"score_level": "<Poor, Needs Improvement, Good, or Excellent>",
"feedback": "<your polite feedback>",
"suggested_answer": "<your suggested answer>",
"next_question": "<the next question>"
"""
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json",
            )
        )
        result_text = response.text
        ai_result = json.loads(result_text)
        
        level = ai_result.get("score_level", "Needs Improvement")
        feedback = ai_result.get("feedback", f"{level}.")
        suggested_answer = ai_result.get("suggested_answer", "")
        next_ai_question = ai_result.get("next_question", f"Could you provide more examples of your work as a {role}?")
        
        if level == "Excellent":
            matches_count = 3
        elif level == "Good":
            matches_count = 2
        elif level == "Needs Improvement":
            matches_count = 1
        else:
            matches_count = 0
            
    except Exception as e:
        print(f"Gemini error: {e}")
        level = 'Needs Improvement'
        feedback = "System Warning: AI API Quota Exceeded. Automatic feedback generation is temporarily disabled."
        suggested_answer = "Due to API rate limits, a suggested answer couldn't be generated."
        next_ai_question = f"Please continue with the next standard question: Describe a complex problem you solved as a {role}."
        matches_count = 1

    session['score'] += matches_count
    session['total_attempted'] += 1
    session['details'].append({
        'question': question_text,
        'answer': user_answer,
        'matched_keywords': [level],
        'score': matches_count,
        'feedback': feedback,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

    done = False
    next_question = None

    if session['total_attempted'] >= session['limit'] - 1:
        done = True
    else:
        next_question = next_ai_question
        session['asked'].add(next_question)
        
        user_q = UserQuestion.query.filter_by(user_id=user.id, role=role).first()
        if not user_q:
            user_q = UserQuestion(user_id=user.id, role=role, asked_questions=json.dumps(list(session['asked'])))
            db.session.add(user_q)
        else:
            user_q.asked_questions = json.dumps(list(session['asked']))
        db.session.commit()

    if done:
        total_questions = session.get('limit', len(QUESTIONS_DATA.get(role, [])))
        overall_msg = 'Great effort! Complete session.'
        if session['score'] >= total_questions * 3:
            overall_msg = 'Excellent performance!'
        elif session['score'] >= total_questions * 2:
            overall_msg = 'Good performance.'
        elif session['score'] >= total_questions:
            overall_msg = 'Average, keep practicing.'
        else:
            overall_msg = 'Needs improvement.'

        new_result = Result(
            user_id=user.id,
            role=role,
            score=session['score'],
            total_questions=total_questions,
            attempted=session['total_attempted'],
            message=overall_msg,
            details=json.dumps(session['details']),
            infractions=json.dumps(session.get('infractions', []))
        )
        db.session.add(new_result)
        db.session.commit()

        sessions.pop(user.id, None)

        return jsonify({
            'feedback': feedback,
            'suggested_answer': suggested_answer,
            'score': session['score'],
            'next_question': None,
            'completed': True,
            'result': {
                'score': session['score'],
                'total_questions': total_questions,
                'message': overall_msg,
                'infractions': session.get('infractions', [])
            }
        })

    return jsonify({
        'feedback': feedback,
        'suggested_answer': suggested_answer,
        'score': session['score'],
        'next_question': next_question,
        'completed': False,
        'total_attempted': session['total_attempted'],
        'total_questions': session.get('limit', MAX_QUESTIONS_PER_TEST)
    })

@app.route('/result', methods=['GET'])
def get_result():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    doc = Result.query.filter_by(user_id=user.id).order_by(Result.created_at.desc()).first()
    if not doc:
        return jsonify({'error': 'No results found'}), 404

    return jsonify({
        'id': doc.id,
        'role': doc.role,
        'score': doc.score,
        'total_questions': doc.total_questions,
        'attempted': doc.attempted,
        'message': doc.message,
        'details': json.loads(doc.details) if doc.details else [],
        'infractions': json.loads(doc.infractions) if doc.infractions else [],
        'created_at': doc.created_at.isoformat()
    })

@app.route('/result/<result_id>', methods=['GET'])
def get_result_by_id(result_id):
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    doc = Result.query.filter_by(id=result_id, user_id=user.id).first()
    if not doc:
        return jsonify({'error': 'Result not found'}), 404

    return jsonify({
        'id': doc.id,
        'role': doc.role,
        'score': doc.score,
        'total_questions': doc.total_questions,
        'attempted': doc.attempted,
        'message': doc.message,
        'details': json.loads(doc.details) if doc.details else [],
        'infractions': json.loads(doc.infractions) if doc.infractions else [],
        'created_at': doc.created_at.isoformat()
    })

@app.route('/profile-results', methods=['GET'])
@app.route('/results', methods=['GET'])
@token_required
def get_results(current_user):
    # Combine regular interview results and skill tests for historical overview
    interview_results = Result.query.filter_by(user_id=current_user.id).order_by(Result.created_at.desc()).all()
    skill_tests = SkillTest.query.filter_by(user_id=current_user.id).order_by(SkillTest.created_at.desc()).all()
    
    res = []
    for r in interview_results:
        res.append({
            'id': r.id,
            'role': r.role,
            'score': r.score,
            'total_questions': r.total_questions,
            'message': r.message,
            'created_at': r.created_at.isoformat(),
            'type': 'INTERVIEW'
        })
    for s in skill_tests:
        res.append({
            'id': s.id,
            'role': s.test_type,
            'score': s.score,
            'total_questions': 100,
            'message': s.ai_feedback,
            'created_at': s.created_at.isoformat(),
            'type': 'SKILL'
        })
    return jsonify({'results': res})

@app.route('/finish', methods=['POST'])
def finish():
    user = get_user_from_token()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    session = sessions.get(user.id)
    if not session:
        last_result = Result.query.filter_by(user_id=user.id).order_by(Result.created_at.desc()).first()
        if last_result:
            return jsonify({
                'message': 'Session already finished',
                'result': {
                    'role': last_result.role,
                    'score': last_result.score,
                    'total_questions': last_result.total_questions,
                    'attempted': last_result.attempted,
                    'message': last_result.message,
                    'details': json.loads(last_result.details) if last_result.details else [],
                    'infractions': json.loads(last_result.infractions) if last_result.infractions else []
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

    new_result = Result(
        user_id=user.id,
        role=role,
        score=score,
        total_questions=total_questions,
        attempted=attempted,
        message=overall_msg,
        details=json.dumps(details),
        infractions=session.get('infractions', [])
    )
    db.session.add(new_result)
    db.session.commit()

    sessions.pop(user.id, None)

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

    docs = Result.query.filter_by(user_id=user.id).order_by(Result.created_at.asc()).all()
    labels = [d.created_at.strftime('%Y-%m-%d %H:%M') for d in docs]
    scores = [d.score for d in docs]

    return jsonify({'labels': labels, 'scores': scores})

@app.route('/log-infraction', methods=['POST'])
def log_infraction():
    current_user = get_user_from_token()
    if not current_user:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json() or {}
    infraction_type = data.get('type', 'Unknown')
    user_id = current_user.id
    
    # sessions is indexed by user_id
    session = sessions.get(user_id)
    if session:
        if 'infractions' not in session:
            session['infractions'] = []
        session['infractions'].append({
            'type': infraction_type,
            'timestamp': datetime.datetime.utcnow().isoformat()
        })
        return jsonify({'status': 'logged'})
            
    return jsonify({'error': 'No active session'}), 404

# --- New Skill Test Endpoints ---

def send_skill_report_email(user, test):
    """Mocks sending a report email. Content is printed to terminal."""
    try:
        msg = Message(
            subject=f"🔍 Your {test.test_type.title()} Test Report - AI Interview Pro",
            recipients=[user.email]
        )
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #0ea5e9;">Test Report: {test.test_type}</h2>
            <p>Hello <strong>{user.name}</strong>,</p>
            <p>Congratulations on completing your assessment! Here are your results:</p>
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px;">
                <p><strong>Overall Score:</strong> {test.score}/100</p>
                <p><strong>AI Feedback:</strong> {test.ai_feedback}</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 20px;">This is an automated report from your AI Interview Preparation Assistant.</p>
        </div>
        """
        mail.send(msg)
        print(f"\n[MOCK EMAIL SENT TO {user.email}]\nSubject: {msg.subject}\nBody Preview: {test.ai_feedback[:100]}...\n")
    except Exception as e:
        print(f"Error sending mock email: {e}")

@app.route('/skills-questions', methods=['GET'])
def get_skills_questions():
    return jsonify(SKILLS_DATA)

def clean_ai_json(text):
    text = text.strip()
    if text.startswith('```json'):
        text = text[7:]
    elif text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]
    return text.strip()

@app.route('/submit-skill-test', methods=['POST'])
@token_required
def submit_skill_test(current_user):
    data = request.get_json() or {}
    test_type = data.get('test_type') # 'APTITUDE' or 'CODING'
    raw_data = data.get('raw_data')   # answers or {easy, medium, hard} code
    infractions = data.get('infractions', [])
    
    if not test_type or not raw_data:
        return jsonify({'error': 'Missing test data'}), 400

    # Use AI to evaluate the test
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv('GEMINI_API_KEY', ''))
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        if test_type == 'CODING':
            # Strict Logic: Check if 'failed' or 'error' was reported in the results (we'll update FE to include this)
            prompt = f"""
            Evaluate this 3-level coding trial. 
            Data (Solutions & Languages): {json.dumps(raw_data)}
            Infractions: {json.dumps(infractions)}
            
            RULES for Scoring:
            1. Calculate a fair total score based on the number of passed levels and code quality.
            2. If a level is 'failed' or incomplete, provide partial credit if the logic is mostly sound.
            3. Do NOT force a 0% score unless there is explicit Malpractice or no effort.
            4. If malpractice (3 tab switches) is flagged, the total score MUST be 0.
            
            Output strictly as JSON: {{"score": <number>, "feedback": "<text>"}}
            """
        else:
            # APTITUDE: Manual validation
            with open('skills_data.json', 'r') as f:
                skills_db = json.load(f)
            
            user_ans_map = raw_data.get('userAnswers', {})
            questions_pool = skills_db.get('aptitude', [])
            
            correct = 0
            total = len(user_ans_map)
            all_correct = True
            
            if total == 0:
                all_correct = False
            else:
                for q_id, u_ans in user_ans_map.items():
                    # Find question in DB
                    q_data = next((q for q in questions_pool if str(q['id']) == str(q_id)), None)
                    if q_data and q_data['answer'] == u_ans:
                        correct += 1
                    else:
                        all_correct = False
            
            # Calculate actual percentage
            score = (correct / total * 100) if total > 0 else 0
            
            prompt = f"""
            Evaluate this Aptitude test. 
            Final Accuracy: {score}%
            Data: {json.dumps(raw_data)}
            Provide a helpful feedback summary based on their performance.
            Output strictly as JSON: {{"score": {score}, "feedback": "<text>"}}
            """
        
        response = model.generate_content(prompt, generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json"
        ))
        eval_res = json.loads(clean_ai_json(response.text))
        
        # Override score if Malpractice detected in infractions
        if any("malpractice" in str(inf).lower() for inf in infractions):
            eval_res['score'] = 0
            eval_res['feedback'] = "SESSION TERMINATED: Malpractice (Tab Switch) detected. Final Score: 0%."

    except Exception as e:
        print(f"Eval Error: {e}")
        if test_type == 'APTITUDE':
            fallback_score = score 
            msg = f"System Warning: AI API Quota Exceeded. Your manual aptitude score ({fallback_score}%) was logged successfully."
        else:
            fallback_score = 0
            msg = "System Warning: AI API Quota Exceeded. Coding tests could not be auto-graded and require manual review. Score defaulted to pending (0)."
        eval_res = {"score": fallback_score, "feedback": msg}

    new_test = SkillTest(
        user_id=current_user.id,
        test_type=test_type,
        score=eval_res['score'],
        ai_feedback=eval_res['feedback'],
        raw_data=json.dumps(raw_data),
        infractions=json.dumps(infractions)
    )
    db.session.add(new_test)
    db.session.commit()
    
    # Send Report Email (Mock)
    send_skill_report_email(current_user, new_test)
    
    return jsonify({
        'id': new_test.id,
        'score': new_test.score,
        'feedback': new_test.ai_feedback
    })

@app.route('/skill-results', methods=['GET'])
@token_required
def get_skill_results(current_user):
    tests = SkillTest.query.filter_by(user_id=current_user.id).order_by(SkillTest.created_at.desc()).all()
    res = []
    for t in tests:
        res.append({
            'id': t.id,
            'test_type': t.test_type,
            'score': t.score,
            'feedback': t.ai_feedback,
            'created_at': t.created_at.isoformat()
        })
    return jsonify({'results': res})

@app.route('/skill-result/<id>', methods=['GET'])
@token_required
def get_single_skill_result(current_user, id):
    test = SkillTest.query.filter_by(id=id, user_id=current_user.id).first()
    if not test:
        return jsonify({'error': 'Report not found'}), 404
    return jsonify({
        'id': test.id,
        'test_type': test.test_type,
        'score': test.score,
        'feedback': test.ai_feedback,
        'raw_data': json.loads(test.raw_data),
        'infractions': json.loads(test.infractions),
        'created_at': test.created_at.isoformat()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
