// src/simulator/pdf/SimReport.tsx
// PDF Document for a single simulation. Rendered client-side with @react-pdf/renderer.
// All image URLs must be resolved before passing (use getPublicUrl on storage paths).

import { Document, Page, View, Text, Image } from '@react-pdf/renderer'
import { styles, COLOR } from './styles'
import type { AirbnbInputs, AirbnbResult, AlquilerInputs, AlquilerResult, PlusvaliaInputs, PlusvaliaResult } from '@/simulator/engine/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConsultoraInfo {
  nombre: string
  logoUrl: string | null   // PNG/JPG/JPEG only for PDF; SVG rendered as text
  telefono: string | null
  email: string | null
}

export interface SimReportProps {
  // Consultora
  consultora: ConsultoraInfo

  // Metadata
  clientName: string
  date: string

  // Project snapshot
  projectName: string
  projectLocation: string | null
  projectStatus: string
  projectDelivery: string | null
  projectDeveloper: string | null
  amenities: string[]
  coverPhotoUrl: string | null

  // Typology snapshot
  typologyName: string
  typologyArea: number
  typologyPriceDisplay: string
  floorPlanUrl: string | null

  // Scenarios (null = scenario not saved)
  airbnb: { inputs: AirbnbInputs; result: AirbnbResult } | null
  alquiler: { inputs: AlquilerInputs; result: AlquilerResult } | null
  plusvalia: { inputs: PlusvaliaInputs; result: PlusvaliaResult } | null
}

// SVG cannot be rendered by react-pdf Image — only PNG/JPG/JPEG work
function isRasterImage(url: string): boolean {
  return /\.(png|jpe?g)(\?.*)?$/i.test(url)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AMENITY_LABELS: Record<string, string> = {
  piscina: 'Piscina',
  gimnasio: 'Gimnasio',
  cochera: 'Cochera',
  sum: 'SUM',
  seguridad: 'Seguridad 24hs',
  ascensor: 'Ascensor',
  terraza: 'Terraza',
  parrilla: 'Parrilla / BBQ',
  coworking: 'Coworking',
  playground: 'Área de juegos',
}

const STATUS_LABELS: Record<string, string> = {
  en_pozo: 'En pozo',
  en_construccion: 'En construcción',
  entregado: 'Entregado',
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Header({ consultora }: { consultora: ConsultoraInfo }) {
  const showLogo = consultora.logoUrl && isRasterImage(consultora.logoUrl)
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showLogo ? (
          <Image src={consultora.logoUrl!} style={{ height: 28, maxWidth: 120, objectFit: 'contain' }} />
        ) : (
          <Text style={styles.headerBrand}>{consultora.nombre}</Text>
        )}
      </View>
      <View>
        {consultora.telefono && <Text style={styles.headerLabel}>{consultora.telefono}</Text>}
        {consultora.email && <Text style={styles.headerLabel}>{consultora.email}</Text>}
      </View>
    </View>
  )
}

function Footer({ consultora, pageNumber, totalPages }: { consultora: ConsultoraInfo; pageNumber: number; totalPages: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{consultora.nombre} — Informe de Inversión</Text>
      <Text style={styles.footerText}>{pageNumber} / {totalPages}</Text>
    </View>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tableRow}>
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={styles.tableValue}>{value}</Text>
    </View>
  )
}

function HighlightDataRow({ label, value, bgColor, textColor }: { label: string; value: string; bgColor: string; textColor: string }) {
  return (
    <View style={[styles.tableRowHighlight, { backgroundColor: bgColor }]}>
      <Text style={[styles.tableHighlightLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.tableHighlightValue, { color: textColor }]}>{value}</Text>
    </View>
  )
}

// ─── Pages ───────────────────────────────────────────────────────────────────

function CoverPage({ props }: { props: SimReportProps }) {
  const statusColor =
    props.projectStatus === 'en_pozo'        ? COLOR.plusvalia :
    props.projectStatus === 'en_construccion' ? COLOR.airbnb :
    COLOR.alquiler

  return (
    <Page size="A4" style={styles.page}>
      <Header consultora={props.consultora} />

      {/* Status badge */}
      <View style={[styles.badge, { backgroundColor: statusColor }]}>
        <Text style={styles.badgeText}>
          {STATUS_LABELS[props.projectStatus] ?? props.projectStatus}
        </Text>
      </View>

      {/* Title block */}
      <Text style={styles.coverTitle}>{props.projectName}</Text>
      <Text style={styles.coverSubtitle}>{props.typologyName}</Text>

      {/* Meta grid */}
      <View style={styles.coverMeta}>
        {props.projectLocation && (
          <View style={styles.coverMetaItem}>
            <Text style={styles.coverMetaLabel}>Ubicación</Text>
            <Text style={styles.coverMetaValue}>{props.projectLocation}</Text>
          </View>
        )}
        <View style={styles.coverMetaItem}>
          <Text style={styles.coverMetaLabel}>Área</Text>
          <Text style={styles.coverMetaValue}>{props.typologyArea} m²</Text>
        </View>
        <View style={styles.coverMetaItem}>
          <Text style={styles.coverMetaLabel}>Precio</Text>
          <Text style={styles.coverMetaValue}>{props.typologyPriceDisplay}</Text>
        </View>
        {props.projectDelivery && (
          <View style={styles.coverMetaItem}>
            <Text style={styles.coverMetaLabel}>Entrega estimada</Text>
            <Text style={styles.coverMetaValue}>{props.projectDelivery}</Text>
          </View>
        )}
        <View style={styles.coverMetaItem}>
          <Text style={styles.coverMetaLabel}>Preparado para</Text>
          <Text style={styles.coverMetaValue}>{props.clientName}</Text>
        </View>
        <View style={styles.coverMetaItem}>
          <Text style={styles.coverMetaLabel}>Fecha</Text>
          <Text style={styles.coverMetaValue}>{props.date}</Text>
        </View>
      </View>

      {/* Cover photo */}
      {props.coverPhotoUrl && (
        <Image src={props.coverPhotoUrl} style={styles.coverPhoto} />
      )}

      <Footer consultora={props.consultora} pageNumber={1} totalPages={3} />
    </Page>
  )
}

function DetailsPage({ props }: { props: SimReportProps }) {
  const visibleAmenities = props.amenities
    .map((key) => AMENITY_LABELS[key] ?? key)

  return (
    <Page size="A4" style={styles.page}>
      <Header consultora={props.consultora} />

      {/* Two-column layout */}
      <View style={styles.row}>
        {/* Left column — project info */}
        <View style={styles.col}>
          <SectionTitle>Proyecto</SectionTitle>
          <View style={styles.table}>
            <DataRow label="Nombre" value={props.projectName} />
            {props.projectDeveloper && (
              <DataRow label="Desarrolladora" value={props.projectDeveloper} />
            )}
            {props.projectLocation && (
              <DataRow label="Ubicación" value={props.projectLocation} />
            )}
            <DataRow label="Estado" value={STATUS_LABELS[props.projectStatus] ?? props.projectStatus} />
            {props.projectDelivery && (
              <DataRow label="Entrega estimada" value={props.projectDelivery} />
            )}
          </View>

          {visibleAmenities.length > 0 && (
            <>
              <SectionTitle>Amenities</SectionTitle>
              <View style={styles.amenityGrid}>
                {visibleAmenities.map((label) => (
                  <Text key={label} style={styles.amenityItem}>{label}</Text>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Right column — typology info */}
        <View style={styles.col}>
          <SectionTitle>Tipología</SectionTitle>
          <View style={styles.table}>
            <DataRow label="Unidad" value={props.typologyName} />
            <DataRow label="Superficie" value={`${props.typologyArea} m²`} />
            <DataRow label="Precio" value={props.typologyPriceDisplay} />
          </View>

          {props.floorPlanUrl && (
            <>
              <SectionTitle>Plano</SectionTitle>
              <Image src={props.floorPlanUrl} style={styles.floorPlan} />
            </>
          )}
        </View>
      </View>

      <Footer consultora={props.consultora} pageNumber={2} totalPages={3} />
    </Page>
  )
}

function ScenariosPage({ props }: { props: SimReportProps }) {
  return (
    <Page size="A4" style={styles.page}>
      <Header consultora={props.consultora} />

      {props.airbnb && (
        <>
          <View style={[styles.scenarioHeader, { backgroundColor: COLOR.airbnb }]}>
            <Text style={styles.scenarioTitle}>Escenario 1 — Alquiler Temporal (Airbnb)</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <View style={styles.table}>
                <DataRow label="Precio de propiedad" value={fmt(props.airbnb.inputs.precio_compra_propiedad_usd)} />
                <DataRow label="Amoblamiento STR" value={fmt(props.airbnb.inputs.amoblamiento_preparacion_str_usd)} />
                <DataRow label="Noches ocupadas/mes" value={String(props.airbnb.inputs.noches_ocupadas_mes)} />
                <DataRow label="Tarifa diaria" value={fmt(props.airbnb.inputs.tarifa_diaria_promedio_usd)} />
                <DataRow label="Administración" value={`${props.airbnb.inputs.tarifa_administracion_percent}%`} />
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.table}>
                <DataRow label="Inversión total" value={fmt(props.airbnb.result.inversion_total)} />
                <DataRow label="Ingresos brutos/mes" value={fmt(props.airbnb.result.ingresos_brutos_mensuales)} />
                <DataRow label="Ganancia neta/mes" value={fmt(props.airbnb.result.ganancia_neta_mensual)} />
                <DataRow label="Ganancia neta anual" value={fmt(props.airbnb.result.ganancia_neta_anual)} />
                <HighlightDataRow label="Rentabilidad anual" value={`${props.airbnb.result.rentabilidad_percent.toFixed(2)}%`} bgColor={COLOR.airbnbTint} textColor={COLOR.airbnb} />
                <DataRow label="Recupero inversión" value={isFinite(props.airbnb.result.anos_recuperacion) ? `${props.airbnb.result.anos_recuperacion.toFixed(1)} años` : '—'} />
              </View>
            </View>
          </View>
        </>
      )}

      {props.alquiler && (
        <>
          <View style={[styles.scenarioHeader, { backgroundColor: COLOR.alquiler }]}>
            <Text style={styles.scenarioTitle}>Escenario 2 — Alquiler Tradicional</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <View style={styles.table}>
                <DataRow label="Precio de propiedad" value={fmt(props.alquiler.inputs.precio_compra_propiedad_usd)} />
                <DataRow label="Alquiler mensual" value={fmt(props.alquiler.inputs.alquiler_mensual_usd)} />
                <DataRow label="Administración" value={`${props.alquiler.inputs.tarifa_administracion_percent}%`} />
                <DataRow label="Expensas/mes" value={fmt(props.alquiler.inputs.expensas_usd_mes)} />
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.table}>
                <DataRow label="Inversión total" value={fmt(props.alquiler.result.inversion_total)} />
                <DataRow label="Ganancia neta/mes" value={fmt(props.alquiler.result.ganancia_neta_mensual)} />
                <DataRow label="Ganancia neta anual" value={fmt(props.alquiler.result.ganancia_neta_anual)} />
                <HighlightDataRow label="Rentabilidad anual" value={`${props.alquiler.result.rentabilidad_percent.toFixed(2)}%`} bgColor={COLOR.alquilerTint} textColor={COLOR.alquiler} />
                <DataRow label="Recupero inversión" value={isFinite(props.alquiler.result.anos_recuperacion) ? `${props.alquiler.result.anos_recuperacion.toFixed(1)} años` : '—'} />
              </View>
            </View>
          </View>
        </>
      )}

      {props.plusvalia && (
        <>
          <View style={[styles.scenarioHeader, { backgroundColor: COLOR.plusvalia }]}>
            <Text style={styles.scenarioTitle}>Escenario 3 — Plusvalía en Obra</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <View style={styles.table}>
                <DataRow label="Precio de compra" value={fmt(props.plusvalia.inputs.precio_compra_propiedad_usd)} />
                <DataRow label="Precio estimado venta" value={fmt(props.plusvalia.inputs.precio_estimado_venta_usd)} />
                <DataRow label="Años de tenencia" value={`${props.plusvalia.inputs.anios_tenencia} años`} />
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.table}>
                <DataRow label="Inversión total" value={fmt(props.plusvalia.result.inversion_total)} />
                <DataRow label="Plusvalía" value={fmt(props.plusvalia.result.plusvalia)} />
                <DataRow label="ROI total" value={`${props.plusvalia.result.roi_total_percent.toFixed(2)}%`} />
                <HighlightDataRow label="ROI anualizado" value={`${props.plusvalia.result.roi_anualizado_percent.toFixed(2)}%`} bgColor={COLOR.plusvaliaTint} textColor={COLOR.plusvalia} />
              </View>
            </View>
          </View>
        </>
      )}

      <Footer consultora={props.consultora} pageNumber={3} totalPages={3} />
    </Page>
  )
}

// ─── Main Document ────────────────────────────────────────────────────────────

export function SimReport(props: SimReportProps) {
  return (
    <Document
      title={`Informe — ${props.projectName} — ${props.clientName}`}
      author={props.consultora.nombre}
    >
      <CoverPage props={props} />
      <DetailsPage props={props} />
      <ScenariosPage props={props} />
    </Document>
  )
}
