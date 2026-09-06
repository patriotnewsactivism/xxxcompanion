/**
 * Minimal 16kHz mono 16-bit PCM WAV recorder for mic input.
 *
 * Why not MediaRecorder: it emits webm/opus, which Gemini's inline-audio
 * STT doesn't accept. Raw WAV sidesteps codec conversion entirely and
 * works in every modern browser (ScriptProcessor is deprecated but
 * universally supported, including in-app webviews).
 */
export class WavRecorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private recording = false;

  async start(): Promise<void> {
    if (this.recording) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    this.ctx = new AudioContext({ sampleRate: 16000 });
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createScriptProcessor(4096, 1, 1);
    this.chunks = [];

    this.node.onaudioprocess = (event) => {
      if (!this.recording) return;
      this.chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };

    // Zero-gain sink — never route mic to speakers (feedback loop).
    const sink = this.ctx.createGain();
    sink.gain.value = 0;
    source.connect(this.node);
    this.node.connect(sink);
    sink.connect(this.ctx.destination);
    this.recording = true;
  }

  async stop(): Promise<Blob> {
    this.recording = false;
    if (this.node) this.node.onaudioprocess = null;
    this.node?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    await this.ctx?.close();

    const sampleRate = 16000;
    const length = this.chunks.reduce((n, c) => n + c.length, 0);
    const pcm = new Float32Array(length);
    let offset = 0;
    for (const c of this.chunks) {
      pcm.set(c, offset);
      offset += c.length;
    }

    // Encode 16-bit PCM WAV.
    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    const writeStr = (pos: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + pcm.length * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, pcm.length * 2, true);
    let pos = 44;
    for (let i = 0; i < pcm.length; i++, pos += 2) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    this.ctx = null;
    this.stream = null;
    this.node = null;
    this.chunks = [];
    return new Blob([view], { type: "audio/wav" });
  }

  get isRecording() {
    return this.recording;
  }
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read recording."));
    reader.readAsDataURL(blob);
  });
}

/** Strip [voice:...] cue tags for display. */
const CUE_RE = /\[voice:[a-z]+\]/g;
export function stripVoiceCues(text: string): string {
  return text.replace(CUE_RE, "").trim();
}

/** First [voice:...] cue in a message, if any. */
export function firstVoiceCue(text: string): string | null {
  const m = text.match(CUE_RE);
  return m ? m[0].slice(7, -1) : null;
}
