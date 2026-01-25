Traverum Storage Plan
Bucket
traverum-assets (public)
File Structure
partners/
└── {partner_id}/
    └── experiences/
        └── {experience_id}/
            ├── {uuid}.webp
            ├── {uuid}.webp
            └── ...
Logic

All images stored flat under experience folder
media table tracks each image with sort_order
Cover = first image (sort_order = 0)
Changing cover = reorder in database, no file operations
Deleting image = delete from storage + delete media row

Media Table
sqlmedia (
  id, partner_id, experience_id, 
  storage_path, url, sort_order, created_at
)
Key Queries
sql-- Cover image
SELECT url FROM media WHERE experience_id = $1 ORDER BY sort_order LIMIT 1;

-- All images ordered
SELECT url FROM media WHERE experience_id = $1 ORDER BY sort_order;