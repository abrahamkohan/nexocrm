// src/simulator/pdf/styles.ts
import { StyleSheet } from '@react-pdf/renderer'

export const COLOR = {
  primary:      '#1a56db',
  dark:         '#111827',
  gray:         '#6b7280',
  light:        '#f3f4f6',
  border:       '#e5e7eb',
  white:        '#ffffff',
  airbnb:       '#e53935',
  airbnbTint:   '#fdecea',
  alquiler:     '#2e7d32',
  alquilerTint: '#e8f5e9',
  plusvalia:    '#1565c0',
  plusvaliaTint:'#e3f0ff',
} as const

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLOR.dark,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },

  // Header / Footer
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLOR.primary,
  },
  headerLeft: { flexDirection: 'column', gap: 2 },
  headerBrand: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: COLOR.primary },
  headerTagline: { fontSize: 8, color: COLOR.gray },
  headerLabel: { fontSize: 8, color: COLOR.gray, textAlign: 'right' },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
  },
  footerText: { fontSize: 7, color: COLOR.gray },

  // Cover
  coverTitle: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: COLOR.dark, marginBottom: 8 },
  coverSubtitle: { fontSize: 11, color: COLOR.gray, marginBottom: 24 },
  coverMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  coverMetaItem: { flexDirection: 'column', gap: 2 },
  coverMetaLabel: { fontSize: 7, color: COLOR.gray, textTransform: 'uppercase' },
  coverMetaValue: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  coverPhoto: { width: '100%', height: 220, objectFit: 'cover', borderRadius: 4 },

  // Status badge (text)
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  // Sections
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLOR.primary,
    marginTop: 16,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.primary,
  },
  paragraph: { fontSize: 9, color: COLOR.dark, lineHeight: 1.5, marginBottom: 8 },

  // Two-column layout
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },

  // Data table
  table: { marginBottom: 12 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLOR.border,
    paddingVertical: 5,
  },
  tableLabel: { flex: 1, fontSize: 8, color: COLOR.gray },
  tableValue: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  // Fila destacada (Rentabilidad / ROI)
  tableRowHighlight: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 2,
  },
  tableHighlightLabel: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  tableHighlightValue: { flex: 1, fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  // Scenario block
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 8,
  },
  scenarioTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLOR.white },

  // Amenities
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  amenityItem: {
    fontSize: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: COLOR.light,
    borderRadius: 3,
  },

  // Floor plan image
  floorPlan: { width: 200, height: 150, objectFit: 'contain', borderWidth: 1, borderColor: COLOR.border, borderRadius: 4 },
})
