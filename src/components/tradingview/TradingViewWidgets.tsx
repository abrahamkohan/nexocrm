// src/components/tradingview/TradingViewWidgets.tsx
// Embeds TradingView widgets client-side via their external-embedding scripts.
// Each component is intentionally mounted once — the script injects the widget iframe.

import { useEffect, useRef } from 'react'

function useTV(widgetName: string, config: Record<string, unknown>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    container.innerHTML = '' // clear on remount (Strict Mode safe)
    const script = document.createElement('script')
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widgetName}.js`
    script.async = true
    script.innerHTML = JSON.stringify(config)
    container.appendChild(script)
    return () => { if (container) container.innerHTML = '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}

function colorTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// ─── Ticker Tape ──────────────────────────────────────────────────────────────
// Horizontal band: USD/ARS · USD/BRL · USD/PYG in real time

export function TVTickerTape() {
  const ref = useTV('ticker-tape', {
    symbols: [
      { proName: 'FX_IDC:USDPYG', title: 'USD / PYG — Guaraní'  },
      { proName: 'FX:USDARS',     title: 'USD / ARS — Peso'     },
      { proName: 'FX:USDBRL',     title: 'USD / BRL — Real'     },
    ],
    showSymbolLogo: false,
    colorTheme: colorTheme(),
    isTransparent: true,
    displayMode: 'adaptive',
    locale: 'es',
  })
  return (
    <div ref={ref} className="tradingview-widget-container w-full" style={{ minHeight: 46 }} />
  )
}

// ─── Market Overview ──────────────────────────────────────────────────────────
// Panel with forex charts and key currency pairs

export function TVMarketOverview() {
  const ref = useTV('market-overview', {
    colorTheme: colorTheme(),
    dateRange: '1M',
    showChart: true,
    locale: 'es',
    isTransparent: false,
    showSymbolLogo: true,
    showFloatingTooltip: false,
    width: '100%',
    height: 400,
    plotLineColorGrowing: 'rgba(41, 98, 255, 1)',
    plotLineColorFalling: 'rgba(41, 98, 255, 1)',
    belowLineFillColorGrowing: 'rgba(41, 98, 255, 0.1)',
    belowLineFillColorFalling: 'rgba(41, 98, 255, 0.1)',
    tabs: [
      {
        title: 'Forex',
        symbols: [
          { s: 'FX:USDARS',     d: 'USD / ARS' },
          { s: 'FX:USDBRL',     d: 'USD / BRL' },
          { s: 'FX_IDC:USDPYG', d: 'USD / PYG' },
          { s: 'OANDA:EURUSD',  d: 'EUR / USD' },
          { s: 'FX:USDCLP',     d: 'USD / CLP' },
        ],
        originalTitle: 'Forex',
      },
    ],
  })
  return (
    <div ref={ref} className="tradingview-widget-container w-full" style={{ height: 400 }} />
  )
}

// ─── Economic Calendar ────────────────────────────────────────────────────────
// TradingView economic calendar — embedded via iframe (script embed not supported for this widget)

export function TVEconomicCalendar() {
  const theme = colorTheme()
  const config = encodeURIComponent(JSON.stringify({
    colorTheme: theme,
    isTransparent: false,
    width: '100%',
    height: 450,
    locale: 'es',
    importanceFilter: '0,1',
    countryFilter: 'py,ar,br,us',
  }))
  return (
    <iframe
      src={`https://www.tradingview.com/embed-widget/events/?locale=es#${config}`}
      width="100%"
      height={450}
      frameBorder="0"
      allowTransparency
      scrolling="no"
      style={{ display: 'block', borderRadius: 8, border: '1px solid var(--border)' }}
    />
  )
}

// ─── Forex Cross Rates ────────────────────────────────────────────────────────
// Grid table: USD · ARS · BRL · EUR · PYG cross rates

export function TVForexRates() {
  const ref = useTV('forex-cross-rates', {
    width: '100%',
    height: 400,
    currencies: ['USD', 'PYG', 'ARS', 'BRL'],
    isTransparent: false,
    colorTheme: colorTheme(),
    locale: 'es',
  })
  return (
    <div ref={ref} className="tradingview-widget-container w-full" style={{ height: 400 }} />
  )
}
