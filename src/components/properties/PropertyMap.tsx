import { Map, Marker } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin } from 'lucide-react'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

interface Props {
  lat: number
  lng: number
  label?: string
}

export function PropertyMap({ lat, lng }: Props) {
  return (
    <div style={{ height: 280, borderRadius: 8, overflow: 'hidden' }}>
      <Map
        initialViewState={{ longitude: lng, latitude: lat, zoom: 15 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        scrollZoom={false}
        attributionControl={false}
      >
        <Marker longitude={lng} latitude={lat} anchor="bottom">
          <MapPin
            className="w-7 h-7 text-red-500 fill-red-200"
            style={{ filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.25))' }}
          />
        </Marker>
      </Map>
    </div>
  )
}
