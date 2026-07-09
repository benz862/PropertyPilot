import OpenAI from "openai";

import { env } from "@/lib/env";

import { buildSystemPrompt, PROPERTY_CONCIERGE_PROMPT } from "../reasoning/engine";
import type { ReasoningInput, ReasoningOutput } from "../types";

export interface ResponseGenerationResult {
  output: ReasoningOutput;
  tokenUsage: number;
  model: string;
  usedLlm: boolean;
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = env.openai.apiKey;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function generateResponse(
  input: ReasoningInput,
  ruleBasedOutput: ReasoningOutput,
): Promise<ResponseGenerationResult> {
  const client = getOpenAIClient();

  if (!client || ruleBasedOutput.confidence === "high" || ruleBasedOutput.escalationRequired) {
    return {
      output: polishResponse(ruleBasedOutput),
      tokenUsage: 0,
      model: "rule-based",
      usedLlm: false,
    };
  }

  const systemPrompt = buildSystemPrompt(input);

  try {
    const completion = await client.chat.completions.create({
      model: PROPERTY_CONCIERGE_PROMPT.model,
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            `Buyer question: ${input.question}`,
            ruleBasedOutput.unanswered
              ? "No verified answer was found. Acknowledge uncertainty without guessing."
              : `Draft answer (refine for natural speech, stay truthful): ${ruleBasedOutput.answer}`,
          ].join("\n"),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    const tokenUsage = completion.usage?.total_tokens ?? 0;

    if (!content) {
      return {
        output: ruleBasedOutput,
        tokenUsage,
        model: PROPERTY_CONCIERGE_PROMPT.model,
        usedLlm: true,
      };
    }

    return {
      output: {
        ...ruleBasedOutput,
        answer: content,
        confidence: ruleBasedOutput.unanswered ? "low" : ruleBasedOutput.confidence,
      },
      tokenUsage,
      model: PROPERTY_CONCIERGE_PROMPT.model,
      usedLlm: true,
    };
  } catch {
    return {
      output: ruleBasedOutput,
      tokenUsage: 0,
      model: PROPERTY_CONCIERGE_PROMPT.model,
      usedLlm: false,
    };
  }
}

function polishResponse(output: ReasoningOutput): ReasoningOutput {
  if (output.followUpSuggestion && !output.answer.includes("?")) {
    return {
      ...output,
      answer: `${output.answer} ${output.followUpSuggestion}`,
    };
  }
  return output;
}
