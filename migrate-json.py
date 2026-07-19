import json
import os

def migrate_xperience_data():
    data_dir = os.path.join(os.getcwd(), 'dev-data', 'data')
    
    # 1. REMAP TOURS TO TRIPS
    old_tours_path = os.path.join(data_dir, 'tours.json')
    new_trips_path = os.path.join(data_dir, 'trips.json')
    
    if os.path.exists(old_tours_path):
        print("🔄 Processing Trip data matrix migrations...")
        with open(old_tours_path, 'r', encoding='utf-8') as f:
            tours_data = json.load(f)
        
        # Convert array contents safely into your new architectural strings
        raw_string = json.dumps(tours_data)
        raw_string = raw_string.replace('"tour"', '"trip"').replace('"tours"', '"trips"')
        migrated_trips = json.loads(raw_string)
        
        with open(new_trips_path, 'w', encoding='utf-8') as f:
            json.dump(migrated_trips, f, indent=2)
        print("✨ tours.json successfully transformed and written to trips.json!")
        
        # Clean up old legacy reference file if desired
        try:
            os.remove(old_tours_path)
            print("🪓 Removed legacy tours.json file reference safely.")
        except Exception:
            pass

    # 2. REMAP RELATIONSHIPS INSIDE REVIEWS
    reviews_path = os.path.join(data_dir, 'reviews.json')
    if os.path.exists(reviews_path):
        print("🔄 Aligning nested relational keys inside reviews collection...")
        with open(reviews_path, 'r', encoding='utf-8') as f:
            reviews_data = json.load(f)
            
        reviews_string = json.dumps(reviews_data)
        # Crucial step: changes "tour": "ID" to "trip": "ID" to match your virtual population hooks
        reviews_string = reviews_string.replace('"tour":', '"trip":')
        migrated_reviews = json.loads(reviews_string)
        
        with open(reviews_path, 'w', encoding='utf-8') as f:
            json.dump(migrated_reviews, f, indent=2)
        print("✨ reviews.json keys updated seamlessly to track Trip relationship keys!")

    print("\n✅ Xperience JSON dev-data migration completed perfectly!")

if __name__ == '__main__':
    migrate_xperience_data()
