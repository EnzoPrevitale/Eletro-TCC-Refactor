function MeasurementChart({ measurements }) {
  const values = measurements
    .map((measurement) => Number(measurement.voltage))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) {
    return (
      <div className="chart-empty">
        <span>∅</span>
        <strong>Nenhuma medição disponível</strong>
        <p>Este ciclo ainda não possui medições de tensão.</p>
      </div>
    )
  }

  const width = 900
  const height = 360
  const padding = {
    top: 30,
    right: 35,
    bottom: 55,
    left: 65,
  }

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)

  const range = maxValue - minValue || 1

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (values.length - 1)) * chartWidth

    const y =
      padding.top +
      chartHeight -
      ((value - minValue) / range) * chartHeight

    return { x, y, value }
  })

  const line = points
    .map((point) => `${point.x},${point.y}`)
    .join(' ')

  const area = [
    `${points[0].x},${padding.top + chartHeight}`,
    ...points.map((point) => `${point.x},${point.y}`),
    `${points[points.length - 1].x},${padding.top + chartHeight}`,
  ].join(' ')

  const average =
    values.reduce((sum, value) => sum + value, 0) / values.length

  const gridLines = 5

  return (
    <div className="chart-wrapper">
      <div className="chart-summary">
        <div>
          <strong>{values.length}</strong>
          <span>medições</span>
        </div>

        <div>
          <strong>{minValue.toFixed(2)} V</strong>
          <span>mínimo</span>
        </div>

        <div>
          <strong>{maxValue.toFixed(2)} V</strong>
          <span>máximo</span>
        </div>

        <div>
          <strong>{average.toFixed(2)} V</strong>
          <span>média</span>
        </div>
      </div>

      <div className="chart-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="measurement-chart"
        >
          {Array.from({ length: gridLines }).map((_, index) => {
            const ratio = index / (gridLines - 1)

            const y =
              padding.top +
              ratio * chartHeight

            const value =
              maxValue - ratio * range

            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  className="chart-grid"
                />

                <text
                  x={padding.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="chart-label"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            )
          })}

          <line
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={padding.top + chartHeight}
            className="chart-axis"
          />

          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + chartHeight}
            y2={padding.top + chartHeight}
            className="chart-axis"
          />

          <polygon
            points={area}
            className="chart-area"
          />

          <polyline
            points={line}
            fill="none"
            className="chart-line"
          />

          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              className="chart-point"
            >
              <title>
                Medição {index + 1}: {point.value.toFixed(2)} V
              </title>
            </circle>
          ))}

          {points.map((point, index) => {
            if (
              values.length > 12 &&
              index % Math.ceil(values.length / 10) !== 0 &&
              index !== values.length - 1
            ) {
              return null
            }

            return (
              <text
                key={`x-${index}`}
                x={point.x}
                y={height - 20}
                textAnchor="middle"
                className="chart-label"
              >
                {index + 1}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="chart-axis-labels">
        <span>Medição</span>
        <span>Tensão (V)</span>
      </div>
    </div>
  )
}