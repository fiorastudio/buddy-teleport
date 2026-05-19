export function buildPermissionDecision(prompt, decision) {
  if (!prompt?.id) {
    throw new Error("pending prompt id is required");
  }
  if (decision !== "once" && decision !== "deny") {
    throw new Error('decision must be "once" or "deny"');
  }
  return {
    cmd: "permission",
    id: prompt.id,
    decision,
  };
}

export function promptSummary(prompt) {
  if (!prompt) {
    return "";
  }
  const tool = prompt.tool || "Tool";
  const hint = prompt.hint ? `: ${prompt.hint}` : "";
  return `${tool}${hint}`;
}
