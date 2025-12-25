from flask import Flask, request, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
import torch
from threading import Lock

app = Flask(__name__, static_folder='.', static_url_path='')
app.config['SECRET_KEY'] = 'medresearch-ai-secret-key-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///medresearch.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, supports_credentials=True)
db = SQLAlchemy(app)

# ===== MedGemma Model Setup =====
model = None
tokenizer = None
model_lock = Lock()
MODEL_LOADED = False

def load_medgemma_model():
    """MedGemma 4B 모델 로드"""
    global model, tokenizer, MODEL_LOADED
    
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        
        print("Loading MedGemma 4B model... This may take a few minutes.")
        
        model_name = "google/medgemma-4b-it"
        
        # 토크나이저 로드
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # CPU 강제 사용 (CUDA 에러 방지)
        device = "cpu"
        print("Using CPU for stable inference (GPU has compatibility issues).")
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float32,
            device_map=None,
            low_cpu_mem_usage=True
        )
        model = model.to(device)
        model.eval()
        
        MODEL_LOADED = True
        print("MedGemma 4B model loaded successfully on CPU!")
        return True
        
    except Exception as e:
        print(f"Failed to load MedGemma model: {e}")
        print("The chatbot will use fallback responses.")
        MODEL_LOADED = False
        return False

def generate_response(user_message: str, max_length: int = 512) -> str:
    """MedGemma 모델을 사용하여 응답 생성"""
    global model, tokenizer, MODEL_LOADED
    
    if not MODEL_LOADED or model is None or tokenizer is None:
        return get_fallback_response()
    
    try:
        with model_lock:
            # MedGemma/Gemma 형식의 프롬프트
            prompt = f"""<bos><start_of_turn>user
당신은 의료 연구자를 돕는 AI 어시스턴트입니다. 한국어로 정확하고 전문적인 답변을 제공하세요.

질문: {user_message}<end_of_turn>
<start_of_turn>model
"""
            
            # 토크나이저 설정
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # 토큰화
            inputs = tokenizer(
                prompt, 
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=2048
            )
            
            # CPU로 강제 설정
            device = "cpu"
            inputs = {k: v.to(device) for k, v in inputs.items()}
            
            # 응답 생성
            with torch.no_grad():
                outputs = model.generate(
                    input_ids=inputs["input_ids"],
                    attention_mask=inputs["attention_mask"],
                    max_new_tokens=max_length,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    top_k=40,
                    repetition_penalty=1.15,
                    pad_token_id=tokenizer.pad_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                )
            
            # 입력 길이 이후의 토큰만 디코딩 (생성된 응답만)
            input_length = inputs["input_ids"].shape[1]
            generated_tokens = outputs[0][input_length:]
            response = tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            # 불필요한 태그 제거
            response = response.replace("<end_of_turn>", "").strip()
            response = response.replace("<eos>", "").strip()
            
            print(f"Generated response length: {len(response)}")
            return response if response else get_fallback_response()
            
    except Exception as e:
        import traceback
        print(f"Error generating response: {e}")
        print(traceback.format_exc())
        return get_fallback_response()

def get_fallback_response() -> str:
    """모델 로드 실패 시 대체 응답"""
    import random
    fallback_responses = [
        "죄송합니다. 현재 AI 모델이 로드되지 않았습니다. 잠시 후 다시 시도해주세요.",
        "모델 초기화 중입니다. 잠시만 기다려주세요.",
        "현재 서비스가 준비 중입니다. 곧 정상적인 응답이 가능합니다."
    ]
    return random.choice(fallback_responses)

# ===== User Model =====
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    job = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'job': self.job,
            'email': self.email
        }

# ===== Routes =====

# Serve main page
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# 채팅 API - MedGemma 모델 사용
@app.route('/api/chat', methods=['POST'])
def chat():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    
    data = request.get_json()
    user_message = data.get('message', '').strip()
    
    if not user_message:
        return jsonify({'success': False, 'message': '메시지를 입력해주세요.'}), 400
    
    # MedGemma 모델로 응답 생성
    ai_response = generate_response(user_message)
    
    return jsonify({
        'success': True,
        'response': ai_response,
        'model': 'MedGemma-4B' if MODEL_LOADED else 'Fallback'
    }), 200

# 모델 상태 확인
@app.route('/api/model-status', methods=['GET'])
def model_status():
    return jsonify({
        'loaded': MODEL_LOADED,
        'model_name': 'MedGemma-4B' if MODEL_LOADED else None,
        'device': 'cpu'  # CPU 강제 사용
    }), 200

# 회원가입
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    required_fields = ['user_id', 'password', 'name', 'job', 'email']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'success': False, 'message': f'{field}를 입력해주세요.'}), 400
    
    if User.query.filter_by(user_id=data['user_id']).first():
        return jsonify({'success': False, 'message': '이미 사용 중인 아이디입니다.'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': '이미 등록된 이메일입니다.'}), 400
    
    hashed_password = generate_password_hash(data['password'])
    
    new_user = User(
        user_id=data['user_id'],
        password=hashed_password,
        name=data['name'],
        job=data['job'],
        email=data['email']
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'success': True, 'message': '회원가입이 완료되었습니다.'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': '회원가입 중 오류가 발생했습니다.'}), 500

# 로그인
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user_id = data.get('user_id')
    password = data.get('password')
    
    if not user_id or not password:
        return jsonify({'success': False, 'message': '아이디와 비밀번호를 입력해주세요.'}), 400
    
    user = User.query.filter_by(user_id=user_id).first()
    
    if not user or not check_password_hash(user.password, password):
        return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 일치하지 않습니다.'}), 401
    
    session['user_id'] = user.id
    session['logged_in'] = True
    
    return jsonify({
        'success': True,
        'message': '로그인 성공',
        'user': user.to_dict()
    }), 200

# 로그아웃
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': '로그아웃 되었습니다.'}), 200

# 현재 사용자 정보
@app.route('/api/me', methods=['GET'])
def get_current_user():
    if not session.get('logged_in'):
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'message': '사용자를 찾을 수 없습니다.'}), 404
    
    return jsonify({'success': True, 'user': user.to_dict()}), 200

# 아이디 중복 확인
@app.route('/api/check-id/<user_id>', methods=['GET'])
def check_user_id(user_id):
    exists = User.query.filter_by(user_id=user_id).first() is not None
    return jsonify({'exists': exists}), 200

# 이메일 중복 확인
@app.route('/api/check-email/<email>', methods=['GET'])
def check_email(email):
    exists = User.query.filter_by(email=email).first() is not None
    return jsonify({'exists': exists}), 200

# ===== Initialize =====
with app.app_context():
    db.create_all()
    print("Database initialized!")

if __name__ == '__main__':
    # 서버 시작 시 MedGemma 모델 로드
    print("=" * 50)
    print("MedResearch AI Server Starting...")
    print("=" * 50)
    load_medgemma_model()
    print("=" * 50)
    app.run(debug=True, port=5000, use_reloader=False)
