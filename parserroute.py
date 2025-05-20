import threading
import requests
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import yaml
import logging
import psycopg2
import subprocess
import os
import time
from flask_cors import CORS
import PyPDF2
import re
import sys
import random
from difflib import SequenceMatcher
from datetime import datetime


# Flask app setup
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:varsha@localhost/rasa_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Logger setup
logging.basicConfig(level=logging.INFO)


# Knowledge base of questions and answers
TECHGENZI_QA = {
    "What is Techgenzi?": "Techgenzi is a digital solutions company specializing in full-stack web and mobile development, UI/UX design, cloud-based SaaS platforms, and digital marketing.",
    "Where is Techgenzi located?": "Techgenzi is headquartered in Bangalore, India, with a branch office in Coimbatore, Tamil Nadu.",
    "What does Techgenzi do?": "Techgenzi provides technology services like web development, mobile app development, UI/UX design, cloud services, and digital marketing.",
    # Add all 100 questions and answers here in the same format
    # ...
    "What is included in Techgenzi's knowledge base?": "Our knowledge base includes documentation, tutorials, FAQs, and best practices to help you get the most out of our solutions."
}

# Categorized suggestions for different topics
SUGGESTION_CATEGORIES = {
    "general": [
        "What services do you offer?",
        "Where is Techgenzi located?",
        "Can you tell me about your features?"
    ],
    "services": [
        "What's included in web development?",
        "Do you offer mobile app development?",
        "Can you explain your digital marketing services?"
    ],
    "pricing": [
        "What's your pricing model?",
        "Do you offer discounts for startups?",
        "Is there a free trial available?"
    ],
    "support": [
        "How do I contact support?",
        "What are your support hours?",
        "Do you provide training?"
    ],
    "company": [
        "How long has Techgenzi been in business?",
        "Who are your founders?",
        "What are your core values?"
    ],
    "leadership": [
        "Who is the CEO?",
        "Who founded the company?",
        "Who are the key executives?"
    ]
}

class ProductTrainingData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(100))
    category = db.Column(db.String(100))
    intents = db.Column(db.JSON)
    responses = db.Column(db.JSON)
    stories = db.Column(db.JSON)
    rules = db.Column(db.JSON)

class UnansweredQuestions(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class KnowledgeBase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.String(500), unique=True)
    answer = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_text = db.Column(db.String(500))
    bot_response = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Create tables
with app.app_context():
    db.create_all()


def similar(a, b):
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def find_most_similar_question(user_question):
    """Find the most similar question from our knowledge base"""
    max_similarity = 0
    best_match = None

    # Check both hardcoded QA and database entries
    all_questions = list(TECHGENZI_QA.keys()) + [kb.question for kb in KnowledgeBase.query.all()]

    for question in all_questions:
        similarity = similar(user_question, question)
        if similarity > max_similarity:
            max_similarity = similarity
            best_match = question

    return best_match if max_similarity > 0.6 else None

def get_contextual_suggestions(user_question, response_text):
    """Generate contextual suggestions based on the question and response"""
    # First try to match the exact question
    matched_question = find_most_similar_question(user_question)

    # Determine the category based on the question or response
    category = "general"

    if matched_question:
        if "service" in matched_question.lower() or "offer" in matched_question.lower():
            category = "services"
        elif "price" in matched_question.lower() or "cost" in matched_question.lower():
            category = "pricing"
        elif "support" in matched_question.lower() or "help" in matched_question.lower():
            category = "support"
        elif "company" in matched_question.lower() or "Techgenzi" in matched_question.lower():
            category = "company"
    else:
        # Fallback to analyzing the response text
        if "service" in response_text.lower():
            category = "services"
        elif "price" in response_text.lower() or "cost" in response_text.lower():
            category = "pricing"
        elif "support" in response_text.lower() or "help" in response_text.lower():
            category = "support"

    # Get base suggestions for the category
    suggestions = SUGGESTION_CATEGORIES.get(category, SUGGESTION_CATEGORIES["general"]).copy()

    # Add some random suggestions from other categories for variety
    other_categories = [cat for cat in SUGGESTION_CATEGORIES.keys() if cat != category]
    random_category = random.choice(other_categories)
    suggestions.extend(random.sample(SUGGESTION_CATEGORIES[random_category], 1))

    # Shuffle to avoid always showing the same order
    random.shuffle(suggestions)

    # Return top 3 unique suggestions
    return list(dict.fromkeys(suggestions))[:3]


def extract_hrm_sections(text):
    """Extract sections from text with improved heading detection"""
    sections = {}
    current_section = None
    section_pattern = re.compile(
        r'^(#{1,3}\s*(.*?)|^(.*?(Management|System|Policy|Process|Procedure|Workflow|Module|Feature|Function)))',
        re.IGNORECASE | re.MULTILINE
    )

    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue

        match = section_pattern.match(line)
        if match:
            current_section = (match.group(2) or match.group(3)).strip()
            sections[current_section] = []
        elif current_section:
            sections[current_section].append(line)

    return sections

def generate_human_response(intent_name, section=None, content=None):
    """Generate natural, varied responses with personality"""
    response_map = {
        'greet': [
            "Hi there! 😊 How can I help you today?",
            "Hello! It's wonderful to connect with you. What can I do for you?",
            "Hey there! I'm excited to assist you. What brings you here today?"
        ],
        'goodbye': [
            "Take care! Hope to chat again soon! 👋",
            "Bye for now! Remember I'm here if you need anything else.",
            "See you later! It was a pleasure helping you today."
        ],
        'thanks': [
            "You're very welcome! 😊",
            "Happy to help! Don't hesitate to reach out if you have more questions.",
            "My pleasure! Let me know if there's anything else I can do."
        ],
        'bot_challenge': [
            "I'm an AI assistant here to have natural conversations and help you out! 🤖",
            "Yes, I'm a chatbot, but I'm designed to understand and respond like a human!",
            "I may be software, but I'm pretty good at conversation. How can I assist?"
        ],
        'confused': [
            "Hmm, I'm not sure I understood that. Could you rephrase it?",
            "I want to make sure I get this right - could you say that differently?",
            "Let me try to understand better. Could you explain in another way?"
        ]
    }

    if section and content:
        return [
            f"I'd be happy to explain {section}! Essentially, {content[0]}. Would you like more details?",
            f"Great question about {section}! Basically, {content[0]}. I can go deeper if you'd like.",
            f"Sure! {section} focuses on {content[0]}. Here's how it works in practice..."
        ]

    return response_map.get(intent_name, [
        "I'd be glad to help with that!",
        "Let me share some information about that.",
        "Great question! Here's what I know..."
    ])


def process_text(text, product_name="Product", category="General"):
    """Process text into training data with human-like responses"""
    sections = extract_hrm_sections(text)

    training_data = {
        'intents': {},
        'responses': {},
        'stories': [],
        'rules': []
    }

    # Enhanced greeting examples
    training_data['intents']['greet'] = [
        "- Hi there!",
        "- Hello! How's your day going?",
        "- Good morning! Beautiful day, isn't it?",
        "- Hey! What can I do for you today?",
        "- Hi there! How can I help?"
    ]

    # More natural responses with variations
    training_data['responses']['utter_greet'] = [
        {"text": response} for response in generate_human_response('greet')
    ]

    # Process each section with conversational responses
    for section, content in sections.items():
        if not content:
            continue

        intent_name = re.sub(r'[^a-zA-Z0-9]+', '_', section).lower()

        # Natural-sounding example questions
        training_data['intents'][intent_name] = [
            f"- Can you explain {section} to me?",
            f"- I'd love to understand more about {section}",
            f"- How exactly does {section} work?",
            f"- Could you break down {section} for me?",
            f"- What's involved in {section}?"
        ]

        # Human-like responses with context
        training_data['responses'][f"utter_{intent_name}"] = [
            {"text": response} for response in generate_human_response(intent_name, section, content)
        ]

        # Follow-up questions
        training_data['responses'][f"utter_{intent_name}_followup"] = [
            {"text": f"Did that explanation about {section} make sense? I can clarify if needed!"},
            {"text": f"Would you like me to go into more detail about {section}?"},
            {"text": f"Was that helpful? I can provide examples about {section} if you'd like."}
        ]

        # Conversational story flow
        training_data['stories'].append({
            "story": f"{intent_name}_flow",
            "steps": [
                {"intent": intent_name},
                {"action": f"utter_{intent_name}"},
                {"action": f"utter_{intent_name}_followup"}
            ]
        })

    # Add common conversational elements
    training_data['intents']['thanks'] = [
        "- Thank you!",
        "- Thanks a bunch!",
        "- I appreciate it!",
        "- That's very helpful, thanks!",
        "- Awesome, thank you!"
    ]

    training_data['responses']['utter_thanks'] = [
        {"text": response} for response in generate_human_response('thanks')
    ]

    return {
        'product_name': product_name,
        'category': category,
        'intents': training_data['intents'],
        'responses': training_data['responses'],
        'stories': training_data['stories'],
        'rules': training_data['rules']
    }

def generate_knowledgebase_entries():
    """Generate YAML entries from KnowledgeBase table"""
    knowledge_entries = KnowledgeBase.query.all()
    if not knowledge_entries:
        return None

    nlu_entries = []
    domain_intents = []
    domain_responses = {}
    stories = []

    for entry in knowledge_entries:
        # Create a sanitized intent name
        intent_name = re.sub(r'[^a-zA-Z0-9]+', '_', entry.question).lower()

        # NLU entries
        nlu_entries.append({
            "intent": intent_name,
            "examples": "\n".join([
                f"- {entry.question}",
                f"- Tell me about {entry.question}",
                f"- Explain {entry.question}",
                f"- What is {entry.question}",
                f"- I need help with {entry.question}"
            ])
        })

        # Domain intents
        domain_intents.append(intent_name)

        # Domain responses
        domain_responses[f"utter_{intent_name}"] = [
            {"text": entry.answer},
            {"text": f"Regarding {entry.question}, {entry.answer}"},
            {"text": f"Here's what I know: {entry.answer}"}
        ]

        # Simple story
        stories.append({
            "story": f"{intent_name}_flow",
            "steps": [
                {"intent": intent_name},
                {"action": f"utter_{intent_name}"}
            ]
        })

    return {
        "nlu": nlu_entries,
        "domain_intents": domain_intents,
        "domain_responses": domain_responses,
        "stories": stories
    }


def append_to_yml_files(knowledge_data):
    """Append knowledge base data to existing YML files, avoiding duplicates"""
    try:
        # NLU file
        nlu_path = 'y/data/nlu.yml'
        if os.path.exists(nlu_path):
            with open(nlu_path, 'r', encoding='utf-8') as f:
                existing_nlu = yaml.safe_load(f) or {"version": "3.1", "nlu": []}

            # Get existing examples for comparison
            existing_examples = {tuple(item.items()) for item in existing_nlu["nlu"]}

            # Append only new entries
            for new_item in knowledge_data["nlu"]:
                if tuple(new_item.items()) not in existing_examples:
                    existing_nlu["nlu"].append(new_item)

            # Write back
            with open(nlu_path, 'w', encoding='utf-8') as f:
                yaml.dump(existing_nlu, f, allow_unicode=True, sort_keys=False)

        # Domain file
        domain_path = 'y/domain.yml'
        if os.path.exists(domain_path):
            with open(domain_path, 'r', encoding='utf-8') as f:
                existing_domain = yaml.safe_load(f) or {"version": "3.1", "intents": [], "responses": {}}

            # Append only new intents
            existing_intents = set(existing_domain["intents"])
            for new_intent in knowledge_data["domain_intents"]:
                if new_intent not in existing_intents:
                    existing_domain["intents"].append(new_intent)

            # Merge only new responses
            for utter_name, response_list in knowledge_data["domain_responses"].items():
                if utter_name not in existing_domain["responses"]:
                    existing_domain["responses"][utter_name] = response_list
                else:
                    # Check for duplicate responses within the same utter action
                    existing_responses = {tuple(resp.items()) for resp in existing_domain["responses"][utter_name]}
                    for new_response in response_list:
                        if tuple(new_response.items()) not in existing_responses:
                            existing_domain["responses"][utter_name].append(new_response)

            # Write back
            with open(domain_path, 'w', encoding='utf-8') as f:
                yaml.dump(existing_domain, f, allow_unicode=True, sort_keys=False)

        # Stories file
        stories_path = 'y/data/stories.yml'
        if os.path.exists(stories_path):
            with open(stories_path, 'r', encoding='utf-8') as f:
                existing_stories = yaml.safe_load(f) or {"version": "3.1", "stories": []}

            # Get existing story names for comparison
            existing_story_names = {story["story"] for story in existing_stories["stories"]}

            # Append only new stories
            for new_story in knowledge_data["stories"]:
                if new_story["story"] not in existing_story_names:
                    existing_stories["stories"].append(new_story)

            # Write back
            with open(stories_path, 'w', encoding='utf-8') as f:
                yaml.dump(existing_stories, f, allow_unicode=True, sort_keys=False)

        return True
    except Exception as e:
        logging.error(f"Error appending to YAML files: {str(e)}")
        return False

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if file_extension not in ['txt', 'pdf']:
        return jsonify({'error': 'Unsupported file format. Use txt or pdf'}), 400

    try:
        extracted_text = ""
        if file_extension == 'txt':
            extracted_text = file.read().decode('utf-8', errors='ignore')
        elif file_extension == 'pdf':
            pdf_reader = PyPDF2.PdfReader(file)
            extracted_text = '\n'.join([page.extract_text() or '' for page in pdf_reader.pages])

        training_data = process_text(extracted_text)

        new_data = ProductTrainingData(
            product_name=training_data['product_name'],
            category=training_data['category'],
            intents=training_data['intents'],
            responses=training_data['responses'],
            stories=training_data['stories'],
            rules=training_data['rules']
        )
        db.session.add(new_data)
        db.session.commit()

        return jsonify({
            'message': 'File uploaded and processed successfully',
            'data': training_data
        }), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error processing file: {str(e)}")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500




@app.route('/get-suggestions', methods=['POST'])
def get_suggestions():
    try:
        last_message = request.json.get("message", "").lower()
        conversation_context = request.json.get("context", [])

        # Analyze conversation for contextual suggestions
        is_greeting = any(word in last_message for word in ['hi', 'hello', 'hey'])
        is_thanks = any(word in last_message for word in ['thank', 'thanks', 'appreciate'])
        is_question = '?' in last_message
        mentioned_topic = None

        # Check for mentioned topics in last message
        topics = ['service', 'feature', 'product', 'demo', 'price', 'cost']
        for topic in topics:
            if topic in last_message:
                mentioned_topic = topic
                break

        # Generate context-aware suggestions
        if is_greeting:
            suggestions = [
                "I'd be happy to explain our services. Would you like an overview?",
                "We have multiple locations. Shall I help you find the nearest one?",
                "Our features include [key features]. Would you like me to elaborate?"
            ]
        elif is_thanks:
            suggestions = [
                "You're very welcome! Is there another topic I can assist with?",
                "I'm glad I could help! Would you like information about [related topic]?",
                "Happy to be of service! Can I provide any additional details?"
            ]
        elif mentioned_topic == 'demo':
            suggestions = [
                "I can schedule a demo for you right now. Would you prefer [time options]?",
                "Our demo covers [key aspects]. Would you like me to focus on any specific area?",
                "We offer free demo sessions. Shall I check availability for you?"
            ]
        elif mentioned_topic == 'price':
            suggestions = [
                "Our basic plan includes [features]. Would you like a full breakdown?",
                "We have special offers available. Should I check eligibility for you?",
                "A free trial is possible. Would you like me to set one up?"
            ]
        elif is_question:
            suggestions = [
                "I can provide more details about that. What specifically would you like to know?",
                "The main benefits are [benefits]. Shall I compare these to other solutions?",
                "That's an excellent question. Would you like me to explain how we handle this?"
            ]
        else:
            suggestions = [
                "Would you like me to outline our service offerings?",
                "I can highlight our key features. Which interests you most?",
                "We offer customized pricing. Should I check options for your organization?"
            ]

        return jsonify({"suggestions": suggestions})

    except Exception as e:
        logging.error(f"Error generating suggestions: {str(e)}")
        return jsonify({"suggestions": [
            "What services do you offer?",
            "Can I see a demo?",
            "How does pricing work?"
        ]})


@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get("message")
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # First check if we have a direct answer from our knowledge base
    matched_question = find_most_similar_question(user_message)
    if matched_question:
        # Check both hardcoded QA and database
        if matched_question in TECHGENZI_QA:
            response_text = TECHGENZI_QA[matched_question]
        else:
            kb_entry = KnowledgeBase.query.filter_by(question=matched_question).first()
            response_text = kb_entry.answer if kb_entry else "I found a matching question but no answer."

        suggestions = get_contextual_suggestions(user_message, response_text)
        return jsonify({
            "response": response_text,
            "suggestions": suggestions
        })

    # Otherwise handle greetings, thanks, etc.
    if any(word in user_message.lower() for word in ['hi', 'hello', 'hey']):
        return jsonify({
            "response": random.choice(generate_human_response('greet')),
            "suggestions": SUGGESTION_CATEGORIES["general"]
        })

    if any(word in user_message.lower() for word in ['thank', 'thanks']):
        return jsonify({
            "response": random.choice(generate_human_response('thanks')),
            "suggestions": [
                "What else can I help with?",
                "Did you have other questions?",
                "Is there anything else you'd like to know?"
            ]
        })

    # Forward to Rasa if we don't have a direct answer
    try:
        payload = {"sender": "user", "message": user_message}
        response = requests.post("http://localhost:5005/webhooks/rest/webhook", json=payload)

        if response.status_code == 200:
            rasa_response = response.json()
            full_text = "\n".join([item.get("text", "") for item in
                                   rasa_response]) if rasa_response else "I'm not sure I understood. Could you rephrase that?"

            # Only save to unanswered_questions if we get the specific "not sure" response
            if full_text == "I'm not sure I understood. Could you rephrase that?":
                new_question = UnansweredQuestions(question=user_message)
                db.session.add(new_question)
                db.session.commit()

            # Get context-aware suggestions
            suggestions = get_contextual_suggestions(user_message, full_text)

            return jsonify({
                "response": full_text,
                "suggestions": suggestions
            })
        else:
            return jsonify({
                "response": random.choice(generate_human_response('confused')),
                "suggestions": [
                    "Can you try asking differently?",
                    "Maybe I can help if you ask about services or features?",
                    "Could you rephrase your question?"
                ]
            })
    except Exception as e:
        return jsonify({
            "response": "I'm having some technical difficulties. Could you try again in a moment?",
            "suggestions": [
                "Try asking again",
                "Maybe ask about our services?",
                "Could you rephrase your question?"
            ]
        })


@app.route('/unanswered-questions', methods=['GET'])
def get_unanswered_questions():
    try:
        # Get all unanswered questions from database
        unanswered = UnansweredQuestions.query.all()

        # Format the response
        questions = [{
            "id": q.id,
            "question": q.question,
            "timestamp": q.timestamp.isoformat() if q.timestamp else None
        } for q in unanswered]
        return jsonify(questions), 200

    except Exception as e:
        logging.error(f"Error fetching unanswered questions: {str(e)}")
        return jsonify({"error": "Failed to fetch unanswered questions"}), 500


@app.route('/api/knowledgebase', methods=['GET'])
def get_knowledgebase():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search_query = request.args.get('search', '', type=str)

        query = KnowledgeBase.query

        if search_query:
            query = query.filter(KnowledgeBase.question.ilike(f'%{search_query}%'))

        paginated_items = query.order_by(KnowledgeBase.timestamp.desc()) \
            .paginate(page=page, per_page=per_page, error_out=False)

        result = []
        for item in paginated_items.items:
            result.append({
                'id': item.id,
                'question': item.question,
                'answer': item.answer,
                'timestamp': item.timestamp.isoformat() if item.timestamp else None
            })

        return jsonify({
            'status': 'success',
            'data': result,
            'total': paginated_items.total,
            'pages': paginated_items.pages,
            'current_page': page
        }), 200

    except Exception as e:
        logging.error(f"Error fetching knowledge base: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500



@app.route('/add-to-knowledge-base', methods=['POST'])
def add_to_knowledge_base():
    try:
        data = request.json
        question = data.get('question')
        answer = data.get('answer')

        if not all([question, answer]):
            return jsonify({'error': 'Missing question or answer'}), 400

        # Store in database
        new_entry = KnowledgeBase(question=question, answer=answer)
        db.session.add(new_entry)
        db.session.commit()

        # Train the new entry
        train_response = train_knowledgebase()
        if train_response.status_code != 200:
            raise Exception("Training failed after adding knowledge")

        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/knowledgebase/<int:question_id>', methods=['GET', 'PUT'])
def handle_knowledgebase_question(question_id):
    if request.method == 'GET':
        question = KnowledgeBase.query.get(question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404
        return jsonify({
            'id': question.id,
            'question': question.question,
            'answer': question.answer,
            'timestamp': question.timestamp.isoformat() if question.timestamp else None
        })

    elif request.method == 'PUT':
        data = request.json
        question = KnowledgeBase.query.get(question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404

        try:
            question.question = data.get('question', question.question)
            question.answer = data.get('answer', question.answer)
            db.session.commit()
            return jsonify({'message': 'Question updated successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/train-knowledgebase', methods=['POST'])
def train_knowledgebase():
    """Endpoint to train only knowledge base additions"""
    try:
        # Generate knowledge base entries
        knowledge_data = generate_knowledgebase_entries()
        if not knowledge_data:
            return jsonify({'message': 'No new knowledge base entries to train'}), 200

        # Append to existing YML files
        if not append_to_yml_files(knowledge_data):
            return jsonify({'error': 'Failed to update training files'}), 500

        # Train the model
        result = subprocess.run(
            [sys.executable, "-m", "rasa", "train"],
            cwd=os.path.join(os.getcwd(), "y"),
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            return jsonify({
                'message': 'Training completed successfully!',
                'output': result.stdout,
                'trained_entries': len(knowledge_data["nlu"])
            })
        else:
            return jsonify({
                'error': 'Training failed',
                'details': result.stderr,
                'output': result.stdout
            }), 500
    except Exception as e:
        return jsonify({'error': f'Exception: {str(e)}'}), 500


@app.route('/unanswered-questions/<int:question_id>', methods=['DELETE'])
def delete_unanswered_question(question_id):
    try:
        question = UnansweredQuestions.query.get(question_id)
        if not question:
            return jsonify({'error': 'Question not found'}), 404

        db.session.delete(question)
        db.session.commit()

        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error deleting question: {str(e)}")
        return jsonify({'error': str(e)}), 500
@app.route('/messages', methods=['GET'])
def get_messages():
    messages = Message.query.all()
    return jsonify([{'user_text': msg.user_text, 'bot_response': msg.bot_response, 'timestamp': msg.timestamp} for msg in messages])


@app.route('/save-messages', methods=['POST'])
def save_messages():
    data = request.json
    messages = data.get('messages', [])

    for message in messages:
        new_message = Message(
            user_text=message.get('user_text', ''),
            bot_response=message.get('bot_response', ''),
            timestamp=datetime.fromisoformat(message.get('timestamp', ''))
        )
        db.session.add(new_message)
    db.session.commit()
    return jsonify({'status': 'success'}), 200

def start_rasa():
    print("Starting Rasa server...")
    with open("rasa_server.log", "w") as log_file:
        subprocess.Popen([
            "rasa", "run", "--enable-api", "--cors", "*", "--debug", "--port", "5006"
        ], stdout=log_file, stderr=log_file)
    time.sleep(5)


@app.route('/training-data', methods=['GET'])
def get_training_data():
    try:
        all_data = ProductTrainingData.query.all()
        return jsonify([{
            'id': data.id,
            'product_name': data.product_name,
            'category': data.category,
            'intents': data.intents,
            'responses': data.responses,
            'stories': data.stories,
            'rules': data.rules
        } for data in all_data])
    except Exception as e:
        return jsonify({'error': 'Error fetching data'}), 500
@app.route('/')
def index():
    return "AI Chatbot API is running!"


if __name__ == '__main__':
    threading.Thread(target=start_rasa).start()
    app.run(debug=True, port=5000)
