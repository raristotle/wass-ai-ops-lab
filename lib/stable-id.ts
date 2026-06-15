/**
 * Small deterministic hash for building collision-resistant ids from free text.
 *
 * Several durable entities key their store record on a slug of caller-supplied
 * text (orderId/clientRef, responseId, vmiPolicyId). A bare slug truncates and
 * collides, so we append `fnv1aHex` of the FULL input: distinct inputs cannot
 * map to the same key even when their readable prefixes coincide.
 */
export function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
