from flask import Flask, request, jsonify, render_template
import os
import openai
from dotenv import load_dotenv, find_dotenv

# Load environment variables from .env file
load_dotenv(find_dotenv())

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY_")

app = Flask(__name__)

# OpenAI configuration
MODEL = "gpt-4o"  
TEMPERATURE = 1
MAX_TOKENS = 2048



@app.route("/")
def home():
    return render_template("index.html")

@app.route("/ask", methods=["POST"])
def ask_question():
    user_question = request.json.get("question", "")
    category = request.json.get("category", "כללי")
    website = request.json.get("website")

    if not user_question:
        return jsonify({"error": "No question provided."}), 400

    try:

        if website == "כל זכות":
            prompt_instruction = "ענה על כל שאלה רק מאתר כל זכות בלבד."
        elif website == "ביטוח לאומי":
            prompt_instruction = "ענה על כל שאלה רק מאתר ביטוח לאומי בלבד. https://www.btl.gov.il/."
        elif website == "משרד הרווחה":
            prompt_instruction = "ענה על כל שאלה רק מאתר משרד הרווחה בלבד. קח את התשובות מאתר https://www.gov.il/he/departments/molsa/govil-landing-page   "

        # בניית הפרומט בהתאם לקטגוריה שנבחרה
        if category != "כללי":
            prompt_instruction += (
                f" והתייחס לשאלה בתור המומחה המקצועי ביותר לתחום '{category}'. "
            )

        system_prompt = (
            prompt_instruction +
            "ענה בצורה מסודרת. "
            " תן את כל הפרטים, במיוחד כשמדובר בסכומים או  מספרים,ענה בדיוק וכמה שפחות בכלליות . "
            "אחרי כל סיום משפט תרד שורה! הקפד על פורמט ברור וקל לקריאה. "
            "בסוף התשובה ציין את קישור המקור המלא שממנו לקחת את המידע ותעשה שהקישור יהיה לחיץ. "
            "give me the output with <p> tags for the sentences and html format"
        )

        response = openai.ChatCompletion.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question}
            ],
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS
        )

        answer = response['choices'][0]['message']['content']
        return jsonify({"answer": answer})

    except openai.error.OpenAIError as e:
        return jsonify({"error": f"OpenAI API Error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected Error: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True)



