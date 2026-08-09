import "./load-env.server";

/** Rime TTS -> base64 mp3 so the browser can play the examiner's voice. */
export async function speakWithRime(text: string): Promise<string | null> {
  const key = process.env["RIME_API_KEY"];
  if (!key) return null;
  const res = await fetch("https://users.rime.ai/v1/rime-tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "audio/mp3",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      speaker: process.env["RIME_SPEAKER"] ?? "cove",
      modelId: "mistv2",
      samplingRate: 22050,
    }),
  });
  if (!res.ok) throw new Error(`Rime ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]!);
  return btoa(binary);
}
