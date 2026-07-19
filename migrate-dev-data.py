import json
import os
import re

def migrate_xperience_json_files():
    data_dir = os.path.join(os.getcwd(), 'dev-data', 'data')
    
    # Define targets and mapping parameters
    files_to_process = ['tours.json', 'trips.json', 'reviews.json', 'users.json']
    
    print("🚀 Commencing absolute structural find-and-replace loop configuration...")

    # Helper function to recursively find and replace text across JSON strings or data points
    def replace_tour_with_trip(text_content):
        # 1. Capture exact filename suffix mutations (e.g., tour-3-1.jpg -> trip-3-1.jpg)
        text_content = re.sub(r'tour-', 'trip-', text_content)
        text_content = re.sub(r'Tour-', 'Trip-', text_content)
        
        # 2. Capture standard terminology and relational key entries
        text_content = text_content.replace('"tour"', '"trip"').replace('"tours"', '"trips"')
        text_content = text_content.replace('"tour":', '"trip":')
        
        # 3. Capture descriptive summaries inside copy fields (case-insensitive words)
        text_content = re.sub(r'\btour\b', 'trip', text_content)
        text_content = re.sub(r'\btours\b', 'trips', text_content)
        text_content = re.sub(r'\bTour\b', 'Trip', text_content)
        text_content = re.sub(r'\bTours\b', 'Trips', text_content)
        return text_content

    for filename in files_to_process:
        file_path = os.path.join(data_dir, filename)
        
        # Special routing handling to account for potential pre-existing renaming conditions
        if filename == 'tours.json' and not os.path.exists(file_path):
            file_path = os.path.join(data_dir, 'trips.json')
            if not os.path.exists(file_path):
                continue
                
        if os.path.exists(file_path):
            print(f"🔄 Migrating terminology & image suffix references in: {os.path.basename(file_path)}...")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
            
            # Serialize to raw string format to perform a swift total file pass regex replace
            serialized_str = json.dumps(raw_data, ensure_ascii=False)
            updated_str = replace_tour_with_trip(serialized_str)
            final_json = json.loads(updated_str)
            
            # If the current target was tours.json, seamlessly write it straight out to your new trips.json destination path footprint
            output_name = 'trips.json' if filename == 'tours.json' else os.path.basename(file_path)
            output_path = os.path.join(data_dir, output_name)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(final_json, f, indent=2, ensure_ascii=False)
                
            # Safely eliminate the old redundant tours.json file to clean up your project scope tracking folder
            if filename == 'tours.json' and os.path.exists(os.path.join(data_dir, 'tours.json')):
                os.remove(os.path.join(data_dir, 'tours.json'))

    print("\n✨ Migration successful! All image name suffixes, keys, and descriptions have been converted to trip/trips.")

if __name__ == '__main__':
    migrate_xperience_json_files()
