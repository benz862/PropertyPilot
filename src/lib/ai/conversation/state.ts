export type ConversationState =
  | "greeting"
  | "exploration"
  | "question_answering"
  | "discovery"
  | "recommendation"
  | "lead_capture"
  | "closing";

interface StateTransitionInput {
  messageCount: number;
  intent: string;
  hasBuyerInterests: boolean;
  escalated: boolean;
  leadCaptureSuggested: boolean;
}

export function determineConversationState(input: StateTransitionInput): ConversationState {
  if (input.escalated || input.leadCaptureSuggested) {
    return "lead_capture";
  }

  if (input.messageCount <= 1) {
    return "greeting";
  }

  if (input.intent === "general_conversation" && input.messageCount <= 3) {
    return "exploration";
  }

  if (input.hasBuyerInterests && input.messageCount >= 4) {
    return "recommendation";
  }

  if (input.intent === "property_question" || input.intent === "room_question" || input.intent === "mechanical_system") {
    return "question_answering";
  }

  if (input.hasBuyerInterests) {
    return "discovery";
  }

  if (input.messageCount >= 8) {
    return "closing";
  }

  return "question_answering";
}

export function getStateGuidance(state: ConversationState): string {
  switch (state) {
    case "greeting":
      return "Welcome warmly. Keep greeting to 10-20 seconds. Then pause and listen.";
    case "exploration":
      return "Guide naturally. Suggest areas to explore without dominating the conversation.";
    case "question_answering":
      return "Answer in 5-15 seconds. Stop after answering. Do not continue talking.";
    case "discovery":
      return "Discover buyer needs naturally from what they share. Never interrogate.";
    case "recommendation":
      return "Connect buyer interests to relevant property features. Offer one helpful suggestion.";
    case "lead_capture":
      return "Wait for a natural pause. Offer property guide, floor plan, or feature sheet.";
    case "closing":
      return "Wrap up gracefully. Offer brochure or showing if appropriate. Never pressure.";
  }
}
