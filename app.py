from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# Функция для загрузки артефактов и конвертации значений
def load_artifacts():
    try:
        with open("artifacts.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        for artifact in data:
            for variant in artifact["Варианты"]:
                for key, value in variant.items():
                    if isinstance(value, str):
                        value = value.replace(',', '.')  # Меняем запятую на точку
                        if value.replace('.', '').replace('-', '').isdigit():
                            variant[key] = float(value) if '.' in value else int(value)

        return data

    except Exception as e:
        print("❌ Ошибка загрузки артефактов:", str(e))
        return []

@app.route("/")
def index():
    artifacts = load_artifacts()
    return render_template("index.html", artifacts=artifacts)

@app.route("/get_artifacts")
def get_artifacts():
    return jsonify(load_artifacts())

@app.route("/calculate", methods=["POST"])
def calculate():
    try:
        data = request.json
        print("📩 Полученные данные:", data)  # ✅ Логируем входные данные

        selected_artifacts = data.get("artifacts", [])
        if not selected_artifacts:
            return jsonify({"error": "Нет артефактов для расчёта"}), 400

        result = {}

        for item in selected_artifacts:
            artifact_name = item["name"]
            tier = item["tier"]

            for artifact in load_artifacts():
                if artifact["Имя"] == artifact_name:
                    for variant in artifact["Варианты"]:
                        if variant["Тир"] == tier:
                            for key, value in variant.items():
                                if key not in ["Имя", "Тир"] and value is not None:
                                    try:
                                        numeric_value = 0  # Значение по умолчанию
                                        
                                        if isinstance(value, (int, float)):  
                                            numeric_value = value  # Если уже число, оставляем
                                        elif isinstance(value, str):  
                                            value = value.replace(',', '.')  # Меняем запятые на точки
                                            if value.replace('.', '').replace('-', '').isdigit():  
                                                numeric_value = float(value)  # Преобразуем в число
                                        
                                        result[key] = result.get(key, 0) + numeric_value  
                                    except ValueError:
                                        print(f"⚠️ Ошибка преобразования: {key} = {value}")
                                        continue

        print("✅ Итоговые характеристики:", result)
        return jsonify(result)

    except Exception as e:
        print("❌ Ошибка в /calculate:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":  # ✅ Исправлено (__name__ с двумя подчёркиваниями)
    port = int(os.environ.get("PORT", 10000))  # Render требует PORT из окружения
    app.run(host="0.0.0.0", port=port)