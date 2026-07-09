-- PropertyPilot PRD-002: Row Level Security policies

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_object_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_knowledge_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE poi_knowledge_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_objections ENABLE ROW LEVEL SECURITY;
ALTER TABLE unanswered_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: property belongs to authenticated user
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_property_owner(property_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM properties
    WHERE id = property_uuid
      AND owner_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_active_property(property_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM properties
    WHERE id = property_uuid
      AND status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------------------

CREATE POLICY "Owners can manage own properties"
  ON properties FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Public can view active properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- ---------------------------------------------------------------------------
-- Property-scoped tables: owner full access
-- ---------------------------------------------------------------------------

CREATE POLICY "Owners manage knowledge objects"
  ON knowledge_objects FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read knowledge for active properties"
  ON knowledge_objects FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Authenticated users read features"
  ON features FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners manage feature links"
  ON knowledge_object_features FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_objects ko
      WHERE ko.id = knowledge_object_id
        AND is_property_owner(ko.property_id)
    )
  );

CREATE POLICY "Public read feature links for active properties"
  ON knowledge_object_features FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_objects ko
      WHERE ko.id = knowledge_object_id
        AND is_active_property(ko.property_id)
    )
  );

CREATE POLICY "Owners manage systems"
  ON systems FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read systems for active properties"
  ON systems FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Owners manage appliances"
  ON appliances FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read appliances for active properties"
  ON appliances FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Owners manage documents"
  ON documents FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read documents for active properties"
  ON documents FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Owners manage photos"
  ON photos FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read photos for active properties"
  ON photos FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Owners manage photo knowledge links"
  ON photo_knowledge_objects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos p
      WHERE p.id = photo_id
        AND is_property_owner(p.property_id)
    )
  );

CREATE POLICY "Public read photo knowledge links"
  ON photo_knowledge_objects FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos p
      WHERE p.id = photo_id
        AND is_active_property(p.property_id)
    )
  );

CREATE POLICY "Owners manage POIs"
  ON points_of_interest FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read POIs for active properties"
  ON points_of_interest FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Owners manage POI knowledge links"
  ON poi_knowledge_objects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM points_of_interest poi
      WHERE poi.id = poi_id
        AND is_property_owner(poi.property_id)
    )
  );

CREATE POLICY "Public read POI knowledge links"
  ON poi_knowledge_objects FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM points_of_interest poi
      WHERE poi.id = poi_id
        AND is_active_property(poi.property_id)
    )
  );

CREATE POLICY "Owners manage photo POI links"
  ON photo_pois FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos p
      WHERE p.id = photo_id
        AND is_property_owner(p.property_id)
    )
  );

CREATE POLICY "Public read photo POI links"
  ON photo_pois FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos p
      WHERE p.id = photo_id
        AND is_active_property(p.property_id)
    )
  );

CREATE POLICY "Owners manage voice personalities"
  ON voice_personalities FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read voice for active properties"
  ON voice_personalities FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Owners manage AI policies"
  ON ai_policies FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Public read AI policy for active properties"
  ON ai_policies FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

-- ---------------------------------------------------------------------------
-- Visitor-facing tables (anonymous tour access)
-- ---------------------------------------------------------------------------

CREATE POLICY "Anyone can create sessions for active properties"
  ON visitor_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Anyone can read own session by token"
  ON visitor_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update sessions for active properties"
  ON visitor_sessions FOR UPDATE
  TO anon, authenticated
  USING (is_active_property(property_id))
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Owners view all sessions for their properties"
  ON visitor_sessions FOR SELECT
  TO authenticated
  USING (is_property_owner(property_id));

CREATE POLICY "Anyone can create leads for active properties"
  ON leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Owners manage leads"
  ON leads FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Anyone can create conversations for active properties"
  ON conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Anyone can update conversations for active properties"
  ON conversations FOR UPDATE
  TO anon, authenticated
  USING (is_active_property(property_id))
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Anyone can read conversations for active properties"
  ON conversations FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Owners manage conversations"
  ON conversations FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Anyone can insert conversation turns"
  ON conversation_turns FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Anyone can read conversation turns for active properties"
  ON conversation_turns FOR SELECT
  TO anon, authenticated
  USING (is_active_property(property_id));

CREATE POLICY "Owners manage conversation turns"
  ON conversation_turns FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Anyone can record buyer interests"
  ON buyer_interests FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Anyone can update buyer interests"
  ON buyer_interests FOR UPDATE
  TO anon, authenticated
  USING (is_active_property(property_id))
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Owners view buyer interests"
  ON buyer_interests FOR SELECT
  TO authenticated
  USING (is_property_owner(property_id));

CREATE POLICY "Anyone can record buyer objections"
  ON buyer_objections FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Owners view buyer objections"
  ON buyer_objections FOR SELECT
  TO authenticated
  USING (is_property_owner(property_id));

CREATE POLICY "Anyone can flag unanswered questions"
  ON unanswered_questions FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Owners manage unanswered questions"
  ON unanswered_questions FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));

CREATE POLICY "Anyone can record analytics events"
  ON analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_active_property(property_id));

CREATE POLICY "Owners view analytics"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (is_property_owner(property_id));
