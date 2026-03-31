interface LocationMapProps {
  lat: number
  lng: number
}

export function LocationMap({ lat, lng }: LocationMapProps) {
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <iframe
        src={embedUrl}
        width="100%"
        height="200"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Experience location"
      />
    </div>
  )
}
