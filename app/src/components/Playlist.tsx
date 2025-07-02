interface Props {
  embedUrl: string | null;
}

export default function Playlist({ embedUrl }: Props) {
  if (!embedUrl) return null;
  return (
    <iframe
      src={embedUrl}
      width="100%"
      height="380"
      allow="encrypted-media"
      title="playlist"
    ></iframe>
  );
}
