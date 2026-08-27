CREATE TABLE chronicle_chapters (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL CHECK (chapter_number > 0),
  title TEXT NOT NULL,
  pov TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('static', 'r2')),
  source_path TEXT,
  r2_key TEXT,
  file_name TEXT,
  size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
  UNIQUE (content_id, chapter_number),
  CHECK (
    (source_kind = 'static' AND source_path IS NOT NULL AND r2_key IS NULL) OR
    (source_kind = 'r2' AND r2_key IS NOT NULL AND source_path IS NULL)
  )
);

INSERT OR IGNORE INTO chronicle_chapters (
  id, content_id, chapter_number, title, pov, status, source_kind, source_path,
  file_name, sort_order, created_by, published_at
)
SELECT
  'legacy-' || c.id || '-' || CAST(json_extract(ch.value, '$.num') AS TEXT),
  c.id,
  CAST(json_extract(ch.value, '$.num') AS INTEGER),
  json_extract(ch.value, '$.title'),
  json_extract(ch.value, '$.pov'),
  CASE WHEN json_extract(ch.value, '$.status') = 'published' THEN 'published' ELSE 'draft' END,
  'static',
  json_extract(ch.value, '$.file'),
  printf('chapter-%02d.html', CAST(json_extract(ch.value, '$.num') AS INTEGER)),
  CAST(json_extract(ch.value, '$.num') AS INTEGER) * 10,
  'system',
  CASE WHEN json_extract(ch.value, '$.status') = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END
FROM content_items c, json_each(c.data_json, '$.chapters') ch
WHERE c.type = 'chronicle'
  AND json_valid(c.data_json)
  AND json_type(c.data_json, '$.chapters') = 'array'
  AND CAST(json_extract(ch.value, '$.num') AS INTEGER) > 0
  AND json_extract(ch.value, '$.title') IS NOT NULL
  AND json_extract(ch.value, '$.file') LIKE '/chronicles/%.html';

INSERT OR IGNORE INTO chronicle_chapters (
  id, content_id, chapter_number, title, status, source_kind, source_path,
  file_name, sort_order, created_by, published_at
) SELECT
  'legacy-seed-chronicle-empire-of-shadows-10',
  c.id,
  10,
  'Omega-Class Asset',
  'published',
  'static',
  '/chronicles/black-ledger/pt2/chapter-10.html',
  'chapter-10.html',
  100,
  'system',
  CURRENT_TIMESTAMP
FROM content_items c
WHERE c.id = 'seed-chronicle-empire-of-shadows' AND c.type = 'chronicle';

CREATE INDEX idx_chronicle_chapters_content
  ON chronicle_chapters(content_id, status, sort_order, chapter_number);
CREATE INDEX idx_chronicle_chapters_published
  ON chronicle_chapters(status, published_at DESC);
