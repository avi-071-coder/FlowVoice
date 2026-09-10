import { LocalAudioTrack, Room, RoomEvent, Track, type RemoteParticipant, type RoomOptions } from "livekit-client";

export interface LiveKitConnection {
  room: Room;
  localStream: MediaStream;
  disconnect: () => void;
}

async function getToken(roomName: string, participantName: string) {
  const response = await fetch(`/api/livekit/token?room=${encodeURIComponent(roomName)}&participant=${encodeURIComponent(participantName)}`, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "LiveKit token service is not configured");
  return payload as { token: string; url: string };
}

export async function connectLiveKit(options: {
  roomName?: string;
  participantName?: string;
  onRemoteAudio?: (participant: RemoteParticipant) => void;
  onTranscript?: (transcript: string) => void;
  onState?: (state: string) => void;
} = {}): Promise<LiveKitConnection> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser does not support microphone capture");
  const roomName = options.roomName ?? `flowvoice-${crypto.randomUUID().slice(0, 8)}`;
  const participantName = options.participantName ?? `guest-${crypto.randomUUID().slice(0, 6)}`;
  options.onState?.("requesting microphone");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const { token, url } = await getToken(roomName, participantName);
  const roomOptions: RoomOptions = { adaptiveStream: true, dynacast: true, audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } };
  const room = new Room(roomOptions);
  room.on(RoomEvent.ConnectionStateChanged, (state) => options.onState?.(state));
  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    if (track.kind === Track.Kind.Audio) {
      const audioElement = track.attach();
      audioElement.autoplay = true;
      audioElement.setAttribute("data-flowvoice-audio", participant.identity);
      document.body.appendChild(audioElement);
      options.onRemoteAudio?.(participant);
    }
  });
  options.onState?.("connecting");
  await room.connect(url, token, { autoSubscribe: true });
  await room.localParticipant.publishTrack(new LocalAudioTrack(stream.getAudioTracks()[0]!));
  let recording = true;
  const recorder = typeof MediaRecorder !== "undefined" ? new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" }) : null;
  recorder?.addEventListener("dataavailable", async (event) => {
    if (!recording || event.data.size < 1000 || !options.onTranscript) return;
    const response = await fetch("/api/deepgram/transcribe", { method: "POST", headers: { "Content-Type": "audio/webm" }, body: event.data });
    if (!response.ok) return;
    const payload = await response.json() as { transcript?: string };
    if (payload.transcript?.trim()) options.onTranscript(payload.transcript.trim());
  });
  recorder?.start(1800);
  options.onState?.("connected");
  return { room, localStream: stream, disconnect: () => { recording = false; recorder?.stop(); document.querySelectorAll("[data-flowvoice-audio]").forEach((node) => node.remove()); stream.getTracks().forEach((track) => track.stop()); room.disconnect(); } };
}
