from flask import Flask, request, jsonify
from transformers import pipeline
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # מאפשר קריאות מ-JS

ner_pipeline = pipeline(
    "token-classification",
    model="avichr/heBERT_NER",
    tokenizer="avichr/heBERT_NER",
    aggregation_strategy="simple"
)

TARGET_LABELS = {
    'address_or_location': ['LOC', 'GPE', 'FAC'],
    'person_name': ['PER'],
    'rent_or_money': ['MNY']
}

@app.route('/extract', methods=['POST'])
def extract_entities():
    data = request.get_json()
    text = data.get('text', '')
    print("[DEBUG] Incoming text:", repr(text))

    results = ner_pipeline(text)

    # המרה של כל תוצאה ל־dict פשוט עם score כ־float רגיל
    debug_entities = []
    for ent in results:
        debug_entities.append({
            'entity_group': ent['entity_group'],
            'score': float(ent['score']),
            'word': ent['word'],
            'start': ent['start'],
            'end': ent['end']
        })

    filtered = {
        'address_or_location': [],
        'person_name': [],
        'rent_or_money': [],
        'debug_entities': debug_entities
    }

    for entity in results:
        group = entity['entity_group']
        word = entity['word']
        score = float(entity['score'])  # המרה ל־float רגיל
        if score < 0.9:
            continue
        for label_key, label_values in TARGET_LABELS.items():
            if group in label_values:
                filtered[label_key].append(word)

    print("[NER] Extracted:", filtered)
    return jsonify(filtered)

@app.route('/log', methods=['POST'])
def log_message():
    data = request.get_json()
    print("[CLIENT LOG]", data.get('message', 'No message provided'))
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5005)
