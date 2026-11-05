-- PropertyPilot security boundary:
-- Public tours are now served by audited Next.js route handlers using the
-- service role and an explicit published-listing check. Do not expose the
-- source tables themselves through the Data API; they include private notes,
-- source documents, visitor data, and buyer conversations.

DROP POLICY IF EXISTS "Public can view active properties" ON properties;
DROP POLICY IF EXISTS property_rooms_public_read ON property_rooms;
DROP POLICY IF EXISTS buyer_questions_public_insert ON buyer_questions;

DROP POLICY IF EXISTS "Public read knowledge for active properties" ON knowledge_objects;
DROP POLICY IF EXISTS "Public read feature links for active properties" ON knowledge_object_features;
DROP POLICY IF EXISTS "Public read systems for active properties" ON systems;
DROP POLICY IF EXISTS "Public read appliances for active properties" ON appliances;
DROP POLICY IF EXISTS "Public read documents for active properties" ON documents;
DROP POLICY IF EXISTS "Public read photos for active properties" ON photos;
DROP POLICY IF EXISTS "Public read photo knowledge links" ON photo_knowledge_objects;
DROP POLICY IF EXISTS "Public read POIs for active properties" ON points_of_interest;
DROP POLICY IF EXISTS "Public read POI knowledge links" ON poi_knowledge_objects;
DROP POLICY IF EXISTS "Public read photo POI links" ON photo_pois;
DROP POLICY IF EXISTS "Public read voice for active properties" ON voice_personalities;
DROP POLICY IF EXISTS "Public read AI policy for active properties" ON ai_policies;

DROP POLICY IF EXISTS "Anyone can create sessions for active properties" ON visitor_sessions;
DROP POLICY IF EXISTS "Anyone can read own session by token" ON visitor_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions for active properties" ON visitor_sessions;
DROP POLICY IF EXISTS "Anyone can create leads for active properties" ON leads;
DROP POLICY IF EXISTS "Anyone can create conversations for active properties" ON conversations;
DROP POLICY IF EXISTS "Anyone can update conversations for active properties" ON conversations;
DROP POLICY IF EXISTS "Anyone can read conversations for active properties" ON conversations;
DROP POLICY IF EXISTS "Anyone can insert conversation turns" ON conversation_turns;
DROP POLICY IF EXISTS "Anyone can read conversation turns for active properties" ON conversation_turns;
DROP POLICY IF EXISTS "Anyone can record buyer interests" ON buyer_interests;
DROP POLICY IF EXISTS "Anyone can update buyer interests" ON buyer_interests;
DROP POLICY IF EXISTS "Anyone can record buyer objections" ON buyer_objections;
DROP POLICY IF EXISTS "Anyone can flag unanswered questions" ON unanswered_questions;
DROP POLICY IF EXISTS "Anyone can record analytics events" ON analytics_events;

-- Defense in depth: anon no longer needs direct table privileges. The public
-- site calls server routes only, and service_role bypasses RLS safely there.
REVOKE ALL ON TABLE
  properties,
  property_rooms,
  knowledge_objects,
  knowledge_object_features,
  systems,
  appliances,
  documents,
  photos,
  photo_knowledge_objects,
  points_of_interest,
  poi_knowledge_objects,
  photo_pois,
  voice_personalities,
  ai_policies,
  visitor_sessions,
  leads,
  conversations,
  conversation_turns,
  buyer_interests,
  buyer_objections,
  unanswered_questions,
  analytics_events,
  buyer_questions
FROM anon;

-- CRM connections and sync logs belong to the authenticated agent only.
DROP POLICY IF EXISTS "CRM connections are owner readable" ON crm_connections;
DROP POLICY IF EXISTS "CRM connections are owner writable" ON crm_connections;
DROP POLICY IF EXISTS "CRM sync events are owner readable" ON crm_sync_events;

CREATE POLICY "CRM connections are owner readable"
  ON crm_connections FOR SELECT
  TO authenticated
  USING (profile_id = (SELECT auth.uid()) OR created_by = (SELECT auth.uid()));

CREATE POLICY "CRM connections are owner writable"
  ON crm_connections FOR ALL
  TO authenticated
  USING (profile_id = (SELECT auth.uid()) OR created_by = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()) OR created_by = (SELECT auth.uid()));

CREATE POLICY "CRM sync events are owner readable"
  ON crm_sync_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM leads
      JOIN properties ON properties.id = leads.property_id
      WHERE leads.id = crm_sync_events.lead_id
        AND properties.owner_id = (SELECT auth.uid())
    )
  );
