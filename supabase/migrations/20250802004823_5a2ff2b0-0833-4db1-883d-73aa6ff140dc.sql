-- Add unique constraint for conversation memory upsert functionality
-- This allows the upsert operation to work correctly by preventing duplicate memories
-- for the same user, session, and memory type combination

CREATE UNIQUE INDEX IF NOT EXISTS conversation_memory_unique_constraint 
ON conversation_memory (user_name, session_id, memory_type);

-- Add a comment to explain the constraint
COMMENT ON INDEX conversation_memory_unique_constraint IS 
'Ensures unique conversation memories per user, session, and memory type combination for upsert operations';