-- Owners need full access to buyer_questions for Activity / lead follow-up UIs.

DROP POLICY IF EXISTS buyer_questions_owner ON buyer_questions;
CREATE POLICY buyer_questions_owner
  ON buyer_questions FOR ALL
  TO authenticated
  USING (is_property_owner(property_id))
  WITH CHECK (is_property_owner(property_id));
