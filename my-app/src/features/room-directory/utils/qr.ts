const DIRECT_ROOM_CODE_PATTERN = /^V[SH][A-Z0-9]+$/i;

export function extractRoomCodeFromQr(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/').filter(Boolean);

    if (url.hostname.toLowerCase() === 'apps.rmit.edu.vn' && parts[0]?.toLowerCase() === 'r' && parts[1]) {
      return parts[1].trim().toUpperCase();
    }

    const queryRoom =
      url.searchParams.get('room') ||
      url.searchParams.get('roomCode') ||
      url.searchParams.get('location') ||
      url.searchParams.get('loc');

    if (queryRoom && DIRECT_ROOM_CODE_PATTERN.test(queryRoom.trim())) {
      return queryRoom.trim().toUpperCase();
    }

    const pathRoom = parts.find((part) => DIRECT_ROOM_CODE_PATTERN.test(part));
    if (pathRoom) {
      return pathRoom.toUpperCase();
    }
  } catch {
    // Plain room codes are handled below.
  }

  if (DIRECT_ROOM_CODE_PATTERN.test(raw)) {
    return raw.toUpperCase();
  }

  return null;
}
