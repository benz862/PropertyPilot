-- PropertyPilot MVP: QR room voice agent

CREATE TABLE IF NOT EXISTS property_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]',
  updates JSONB NOT NULL DEFAULT '[]',
  included_items JSONB NOT NULL DEFAULT '[]',
  talking_points JSONB NOT NULL DEFAULT '[]',
  cautions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_rooms_property_id ON property_rooms(property_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_property_rooms_property_name
  ON property_rooms(property_id, name);

DROP TRIGGER IF EXISTS property_rooms_updated_at ON property_rooms;
CREATE TRIGGER property_rooms_updated_at
  BEFORE UPDATE ON property_rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE property_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS property_rooms_owner ON property_rooms;
CREATE POLICY property_rooms_owner
  ON property_rooms FOR ALL
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

DROP POLICY IF EXISTS property_rooms_public_read ON property_rooms;
CREATE POLICY property_rooms_public_read
  ON property_rooms FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_rooms.property_id
        AND properties.deleted_at IS NULL
    )
  );

ALTER TABLE buyer_questions
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES property_rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS selected_room TEXT,
  ADD COLUMN IF NOT EXISTS confidence TEXT,
  ADD COLUMN IF NOT EXISTS answered_from_sources JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS needs_agent_followup BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_email TEXT,
  ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
  ADD COLUMN IF NOT EXISTS input_type TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_buyer_questions_room_id ON buyer_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_buyer_questions_needs_agent_followup ON buyer_questions(needs_agent_followup);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'buyer_questions'
      AND policyname = 'buyer_questions_public_insert'
  ) THEN
    CREATE POLICY buyer_questions_public_insert
      ON buyer_questions FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM properties
          WHERE properties.id = buyer_questions.property_id
            AND properties.deleted_at IS NULL
        )
      );
  END IF;
END $$;
