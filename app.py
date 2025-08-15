from flask import Flask, request, jsonify
import pandas as pd
import random
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image
import io

model = YOLO("runs/detect/train/weights/best.pt")  # Load your trained model



app = Flask(__name__)
CORS(app, origins="*")  # Allow all origins


def calculate_bmr(weight, height, age, gender):
    weight = float(weight)
    height = float(height)
    age = int(age)
    if gender.lower() == "male":
        return (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        return (10 * weight) + (6.25 * height) - (5 * age) - 161


def calculate_tdee(bmr, activity_level):
    """Calculate Total Daily Energy Expenditure (TDEE) based on activity level."""
    activity_multipliers = {
        "sedentary": 1.2,
        "lightly active": 1.375,
        "moderately active": 1.55,
        "very active": 1.725,
        "super active": 1.9
    }
    return bmr * activity_multipliers.get(activity_level.lower(), 1.2)


def load_food_data():
    """Load food database from an Excel file."""
    file_path = r"Anuvaad_INDB_2024.11.xlsx"
    return pd.read_excel(file_path, sheet_name="Sheet1")

food_df = load_food_data()  

def generate_meal(food_df, calorie_target, macronutrient_ratio, used_foods):
    """Generate a meal with better food selection and debugging."""
    protein_ratio, carb_ratio, fat_ratio = macronutrient_ratio
    protein_target = (calorie_target * protein_ratio) / 4
    carb_target = (calorie_target * carb_ratio) / 4
    fat_target = (calorie_target * fat_ratio) / 9

    # Adjusted food filtering
    filtered_foods = food_df[
        (food_df["energy_kcal"] > 20) &  
        (~food_df["food_name"].isin(used_foods))  
    ]

    if len(filtered_foods) == 0:
        print("No available foods matching criteria!")  # Debugging
        return {"items": [], "calories": 0, "protein": 0, "carbs": 0, "fats": 0}

    available_foods = filtered_foods.sample(min(30, len(filtered_foods)))
    total_calories, total_protein, total_carbs, total_fats = 0, 0, 0, 0
    meal = []

    for _, food in available_foods.iterrows():
        if total_calories < calorie_target and len(meal) < 4:
            portion_size = max(30, min(300, (calorie_target - total_calories) / max(food["energy_kcal"], 1) * 100))

            if 30 <= portion_size <= 300:
                expected_protein = (food["protein_g"] * portion_size) / 100
                expected_carbs = (food["carb_g"] * portion_size) / 100
                expected_fats = (food["fat_g"] * portion_size) / 100

                if (
                    total_protein + expected_protein <= protein_target * 1.3 and
                    total_carbs + expected_carbs <= carb_target * 1.3 and
                    total_fats + expected_fats <= fat_target * 1.3
                ):
                    meal.append(f"{food['food_name']} ({round(portion_size, 1)}g)")
                    used_foods.add(food["food_name"])
                    total_calories += (food["energy_kcal"] * portion_size) / 100
                    total_protein += expected_protein
                    total_carbs += expected_carbs
                    total_fats += expected_fats

    return {
        "items": meal,
        "calories": round(total_calories, 1),
        "protein": round(total_protein, 1),
        "carbs": round(total_carbs, 1),
        "fats": round(total_fats, 1)
    }

def generate_day_meal_plan(food_df, daily_calories, macronutrient_ratio, used_foods):
    """Generate a meal plan for one day with Breakfast, Lunch, and Dinner in the correct order."""
    meal_plan = {
        "Breakfast": generate_meal(food_df, daily_calories * 0.3, macronutrient_ratio, used_foods),
        "Lunch": generate_meal(food_df, daily_calories * 0.4, macronutrient_ratio, used_foods),
        "Dinner": generate_meal(food_df, daily_calories * 0.3, macronutrient_ratio, used_foods)
    }
    return meal_plan  # Ensures correct ordering


def get_food_details(food_name):
    """Retrieve all details of a specific food by name."""
    df = load_food_data()
    
    if "food_name" not in df.columns:
        return {"error": "Column 'food_name' not found in dataset"}
    
    # Find the food item (case-insensitive match)
    food_item = df[df["food_name"].str.lower() == food_name.lower()]
    
    if food_item.empty:
        return {"error": f"No data found for food: {food_name}"}
    
    return food_item.iloc[0].to_dict()


@app.route('/generate-meal-plan', methods=['POST'])
def generate_meal_plan():
    data = request.json
    weight = data['weight']
    height = data['height']
    age = data['age']
    gender = data['gender']
    activity_level = data['activity_level']
    goal = data['goal']
    user_id = data['user']  # user is the alphanumeric user ID

    bmr = calculate_bmr(weight, height, age, gender)
    tdee = calculate_tdee(bmr, activity_level)

    goal_settings = {
        "muscle gain": (tdee * 1.2, (0.3, 0.5, 0.2)),
        "weight loss": (tdee * 0.8, (0.4, 0.4, 0.2)),
        "maintenance": (tdee, (0.3, 0.4, 0.3))
    }

    target_calories, macronutrient_ratio = goal_settings.get(goal, (tdee, (0.3, 0.4, 0.3)))

    used_foods = set()  # Track used foods across all days
    weekly_meal_plan = {}

    for day in range(1, 8):  # 7-day meal plan
        daily_meals = generate_day_meal_plan(food_df, target_calories, macronutrient_ratio, used_foods)
        
        # Map the generated meals to the appropriate structure for each day
        weekly_meal_plan[f"Day {day}"] = {
            "Breakfast": daily_meals["Breakfast"],
            "Lunch": daily_meals["Lunch"],
            "Dinner": daily_meals["Dinner"]
        }

    # Include the user ID in the response and map it to the 'days' field as per the DietPlan schema
    response = {
        "userId": user_id,  # Returning the user ID
        "days": weekly_meal_plan  # Map the days to the structure for DietPlan
    }

    return jsonify(response)

@app.route('/food', methods=['GET'])
def get_food_names():
    """Retrieve all food names from the food database."""
    df = load_food_data()
    if "food_name" not in df.columns:
        return jsonify({"message": "Column 'food_name' not found"}), 404
    
    food_names = df["food_name"].dropna().tolist()  # Remove NaN values and convert to list
    return jsonify({"food_names": food_names})


@app.route('/food/details', methods=['GET'])
def get_food_by_name():
    """API Endpoint to get food details by name."""
    food_name = request.args.get('name')  # Get food name from query parameters
    
    if not food_name:
        return jsonify({"error": "Please provide a food name using the 'name' query parameter"}), 400
    
    food_details = get_food_details(food_name)
    
    # Check if an error message is returned
    if "error" in food_details:
        return jsonify(food_details), 404
    
    return jsonify(food_details)



@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        file = request.files["image"]
        img = Image.open(io.BytesIO(file.read()))
        results = model(img, conf=0.25)
        class_names = set()
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0].item())
                class_name = results[0].names[class_id].replace("_", " ")  # Replace underscores with spaces
                class_names.add(class_name)
        
        df = load_food_data()
        df["food_name_lower"] = df["food_name"].str.lower()
        food_details = []
        
        for class_name in class_names:
            food_item = df[df["food_name_lower"] == class_name.lower()]
            if not food_item.empty:
                food_details.append(food_item.iloc[0].drop("food_name_lower").to_dict())
            else:
                food_details.append({"food_name": class_name, "error": "No data found"})
        
        return jsonify({"detected_classes": list(class_names), "food_details": food_details})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)



