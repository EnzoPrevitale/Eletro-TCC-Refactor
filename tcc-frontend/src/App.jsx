import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (response.status === 204) return null

  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error || `Falha na requisicao (${response.status})`)
  }

  return body
}

const formatDate = (value) =>
  value
    ? new Date(value.replace(' ', 'T')).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Ainda nao iniciado'

const label = (value) =>
  ({
    IDLE: 'Aguardando',
    NEW_TEST: 'Em andamento',
    CYCLE: 'Por ciclos',
    TIME: 'Por tempo',
    CHARGE: 'Carga',
    DISCHARGE: 'Descarga',
  }[value] || value || '-')

function Stat({ value, caption, accent }) {
  return (
    <div className={`stat ${accent || ''}`}>
      <strong>{value}</strong>
      <span>{caption}</span>
    </div>
  )
}

function NewTrialModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    mode: 'CYCLE',
    numberCycles: 10,
    time: '00:10:00',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        mode: form.mode,
        numberCycles:
          form.mode === 'CYCLE'
            ? Number(form.numberCycles)
            : null,
        time: form.mode === 'TIME' ? form.time : null,
        timeStarted: null,
        endTime: null,
        status: 'NEW_TEST',
      }

      const created = await api('/trial/start', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      onCreated(created)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) =>
        event.target === event.currentTarget && onClose()
      }
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <span className="eyebrow">Novo ensaio</span>
            <h2>Preparar teste</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar"
          >
            x
          </button>
        </div>

        <label>
          Modo de teste

          <select
            value={form.mode}
            onChange={(event) =>
              update('mode', event.target.value)
            }
          >
            <option value="CYCLE">Por ciclos</option>
            <option value="TIME">Por tempo</option>
          </select>
        </label>

        {form.mode === 'CYCLE' ? (
          <label>
            Quantidade de ciclos

            <input
              type="number"
              min="1"
              value={form.numberCycles}
              onChange={(event) =>
                update('numberCycles', event.target.value)
              }
              required
            />
          </label>
        ) : (
          <label>
            Duracao

            <input
              type="time"
              step="1"
              value={form.time}
              onChange={(event) =>
                update('time', event.target.value)
              }
              required
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="button primary"
            disabled={saving}
          >
            {saving ? 'Criando...' : 'Iniciar teste'}
          </button>
        </div>
      </form>
    </div>
  )
}

function TrialDetail({
  trial,
  cycles,
  measurements,
  loading,
}) {
  const trialMeasurements = measurements.filter((measurement) =>
    cycles.some((cycle) => cycle.id === measurement.cycleId)
  )

  return (
    <section className="detail-panel">
      <div className="detail-top">
        <div>
          <span className="eyebrow">Teste selecionado</span>

          <h2>
            {label(trial.mode)}{' '}
            <span className="muted">
              / {trial.id.slice(0, 8)}
            </span>
          </h2>
        </div>

        <div className="detail-meta">
          <span
            className={`status ${
              trial.status === 'NEW_TEST' ? 'running' : ''
            }`}
          >
            {label(trial.status)}
          </span>

          <span>{formatDate(trial.timeStarted)}</span>
        </div>
      </div>

      <div className="detail-stats">
        <div>
          <b>{cycles.length}</b>
          <span>ciclos registrados</span>
        </div>

        <div>
          <b>{trialMeasurements.length}</b>
          <span>medidas coletadas</span>
        </div>

        <div>
          <b>{trial.numberCycles || trial.time || '-'}</b>
          <span>configuracao</span>
        </div>
      </div>

      {loading ? (
        <div className="empty">
          Carregando dados do teste...
        </div>
      ) : cycles.length === 0 ? (
        <div className="empty">
          Nenhum ciclo registrado para este teste.
        </div>
      ) : (
        <div className="cycle-list">
          {cycles.map((cycle) => {
            const cycleMeasurements = measurements.filter(
              (measurement) =>
                measurement.cycleId === cycle.id
            )

            return (
              <article className="cycle-row" key={cycle.id}>
                <div className="cycle-number">
                  <span>CICLO</span>

                  <strong>
                    {String(cycle.number).padStart(2, '0')}
                  </strong>
                </div>

                <div className="measurement-list">
                  {cycleMeasurements.length === 0 ? (
                    <span className="muted">
                      Sem medidas
                    </span>
                  ) : (
                    cycleMeasurements.map((measurement) => (
                      <div
                        className="measurement"
                        key={measurement.id}
                      >
                        <span
                          className={`dot ${
                            measurement.cycleStatus === 'CHARGE'
                              ? 'charge'
                              : 'discharge'
                          }`}
                        />

                        <span>
                          {label(measurement.cycleStatus)}
                        </span>

                        <b>
                          {measurement.voltage ?? '-'} V
                        </b>

                        <time>
                          {measurement.time || '--:--:--'}
                        </time>
                      </div>
                    ))
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function MeasurementChart({ measurements }) {
  const values = measurements
    .map((measurement) => Number(measurement.voltage))
    .filter((value) => Number.isFinite(value))

  if (values.length === 0) {
    return (
      <div className="chart-empty">
        <span>∅</span>

        <strong>Nenhuma medição disponível</strong>

        <p>
          Este ciclo ainda não possui medições de tensão.
        </p>
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

  const chartWidth =
    width - padding.left - padding.right

  const chartHeight =
    height - padding.top - padding.bottom

  const points = values.map((value, index) => {
    const x =
      values.length === 1
        ? padding.left + chartWidth / 2
        : padding.left +
          (index / (values.length - 1)) * chartWidth

    const y =
      padding.top +
      chartHeight -
      ((value - minValue) / range) * chartHeight

    return {
      x,
      y,
      value,
    }
  })

  const line = points
    .map((point) => `${point.x},${point.y}`)
    .join(' ')

  const area = [
    `${points[0].x},${padding.top + chartHeight}`,
    ...points.map(
      (point) => `${point.x},${point.y}`
    ),
    `${
      points[points.length - 1].x
    },${padding.top + chartHeight}`,
  ].join(' ')

  const average =
    values.reduce((sum, value) => sum + value, 0) /
    values.length

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
          {Array.from({ length: gridLines }).map(
            (_, index) => {
              const ratio =
                index / (gridLines - 1)

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
            }
          )}

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
                Medição {index + 1}:{' '}
                {point.value.toFixed(2)} V
              </title>
            </circle>
          ))}

          {points.map((point, index) => {
            if (
              values.length > 12 &&
              index %
                Math.ceil(values.length / 10) !==
                0 &&
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

function TrialCharts({
  trials,
  cycles,
  measurements,
  selectedTrial,
  onSelectTrial,
  loading,
}) {
  const [selectedCycleId, setSelectedCycleId] =
    useState(null)

  useEffect(() => {
    setSelectedCycleId(cycles[0]?.id || null)
  }, [selectedTrial?.id, cycles])

  const selectedCycle = cycles.find(
    (cycle) => cycle.id === selectedCycleId
  )

  const cycleMeasurements = measurements.filter(
    (measurement) =>
      measurement.cycleId === selectedCycleId
  )

  const trialMeasurements = measurements.filter(
    (measurement) =>
      cycles.some(
        (cycle) => cycle.id === measurement.cycleId
      )
  )

  return (
    <section className="charts-panel">
      <div className="charts-header">
        <div>
          <span className="eyebrow">Análise</span>

          <h2>Gráficos de medições</h2>

          <p>
            Visualize as medições de cada ciclo do teste
            selecionado.
          </p>
        </div>
      </div>

      <div className="chart-controls">
        <label>
          <span>Teste</span>

          <select
            value={selectedTrial?.id || ''}
            onChange={(event) =>
              onSelectTrial(event.target.value)
            }
          >
            {trials.map((trial) => (
              <option
                key={trial.id}
                value={trial.id}
              >
                {label(trial.mode)} /{' '}
                {trial.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Ciclo</span>

          <select
            value={selectedCycleId || ''}
            onChange={(event) =>
              setSelectedCycleId(event.target.value)
            }
            disabled={
              loading || cycles.length === 0
            }
          >
            {cycles.length === 0 ? (
              <option value="">
                Nenhum ciclo
              </option>
            ) : (
              cycles.map((cycle) => (
                <option
                  key={cycle.id}
                  value={cycle.id}
                >
                  Ciclo{' '}
                  {String(cycle.number).padStart(
                    2,
                    '0'
                  )}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="empty large">
          Carregando dados do teste...
        </div>
      ) : !selectedCycle ? (
        <div className="empty large">
          Nenhum ciclo disponível para este teste.
        </div>
      ) : (
        <>
          <div className="chart-card">
            <div className="chart-card-header">
              <div>
                <span className="eyebrow">
                  Ciclo selecionado
                </span>

                <h3>
                  Ciclo{' '}
                  {String(
                    selectedCycle.number
                  ).padStart(2, '0')}
                </h3>
              </div>

              <div className="cycle-status">
                <span>
                  {cycleMeasurements.length}{' '}
                  medições
                </span>
              </div>
            </div>

            <MeasurementChart
              measurements={cycleMeasurements}
            />
          </div>

          <div className="cycle-overview">
            <div className="cycle-overview-header">
              <div>
                <span className="eyebrow">
                  Ciclos
                </span>

                <h3>Medições por ciclo</h3>
              </div>

              <span>
                {trialMeasurements.length}{' '}
                medições no teste
              </span>
            </div>

            <div className="cycle-chart-list">
              {cycles.map((cycle) => {
                const count =
                  measurements.filter(
                    (measurement) =>
                      measurement.cycleId ===
                      cycle.id
                  ).length

                const selected =
                  cycle.id === selectedCycleId

                const maxCount = Math.max(
                  ...cycles.map((currentCycle) =>
                    measurements.filter(
                      (measurement) =>
                        measurement.cycleId ===
                        currentCycle.id
                    ).length
                  ),
                  1
                )

                return (
                  <button
                    key={cycle.id}
                    className={`cycle-chart-item ${
                      selected ? 'selected' : ''
                    }`}
                    onClick={() =>
                      setSelectedCycleId(cycle.id)
                    }
                  >
                    <div className="cycle-chart-number">
                      {String(
                        cycle.number
                      ).padStart(2, '0')}
                    </div>

                    <div className="cycle-chart-info">
                      <strong>
                        Ciclo {cycle.number}
                      </strong>

                      <span>
                        {count === 1
                          ? '1 medição'
                          : `${count} medições`}
                      </span>
                    </div>

                    <div className="cycle-chart-bar">
                      <div
                        style={{
                          width: `${
                            (count / maxCount) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default function App() {
  const [trials, setTrials] = useState([])
  const [selectedId, setSelectedId] =
    useState(null)

  const [cycles, setCycles] = useState([])
  const [measurements, setMeasurements] =
    useState([])

  const [query, setQuery] = useState('')

  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] =
    useState(false)

  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] =
    useState(false)

  const [activeTab, setActiveTab] =
    useState('trials')

  const loadTrials = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await api(
        '/trial?size=100&sort=timeStarted,desc'
      )

      setTrials(data.content || [])

      if (
        !selectedId &&
        data.content?.[0]
      ) {
        setSelectedId(data.content[0].id)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrials()
  }, [])

  useEffect(() => {
    if (!selectedId) return

    let active = true

    setDetailLoading(true)

    Promise.all([
      api(
        `/cycle?trialId=${selectedId}&size=100&sort=number,asc`
      ),
      api(
        '/measurement?size=99999&sort=time,asc'
      ),
    ])
      .then(
        ([cycleData, measurementData]) => {
          if (!active) return

          setCycles(
            cycleData.content || []
          )

          setMeasurements(
            measurementData.content || []
          )
        }
      )
      .catch((requestError) => {
        if (active) {
          setError(requestError.message)
        }
      })
      .finally(() => {
        if (active) {
          setDetailLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [selectedId])

  const filteredTrials = useMemo(
    () =>
      trials.filter((trial) =>
        `${trial.id} ${trial.mode} ${trial.status}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [trials, query]
  )

  const selectedTrial = trials.find(
    (trial) => trial.id === selectedId
  )

  const runningCount = trials.filter(
    (trial) => trial.status === 'NEW_TEST'
  ).length

  const handleCreated = async (created) => {
    setModalOpen(false)

    await loadTrials()

    setSelectedId(created.id)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">T</div>

          <div>
            <b>telemetria</b>
            <span>laboratorio de ensaios</span>
          </div>
        </div>

      </header>

      <div className="content">
        <section className="page-heading">
          <div>
            <span className="eyebrow">
              Painel de controle
            </span>

            <h1>Ensaios elétricos</h1>

            <p>
              Acompanhe testes, ciclos e medidas em
              um só lugar.
            </p>
          </div>
          {
          /*
          <button
            className="button primary new-button"
            onClick={() => setModalOpen(true)}
          >
            <span>+</span>
            Novo teste
          </button>
        */
        }
        </section>

        {error && (
          <div className="alert">
            {error}

            <button onClick={loadTrials}>
              Tentar novamente
            </button>
          </div>
        )}

        <section className="stats">
          <Stat
            value={trials.length}
            caption="testes registrados"
          />

          <Stat
            value={runningCount}
            caption="testes em andamento"
            accent="warm"
          />

          <Stat
            value={trials.reduce(
              (sum, trial) =>
                sum + (trial.numberCycles || 0),
              0
            )}
            caption="ciclos planejados"
            accent="green"
          />
        </section>

        <div className="tabs">
          <button
            className={
              activeTab === 'trials'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveTab('trials')
            }
          >
            <span>▦</span>
            Testes
          </button>

          <button
            className={
              activeTab === 'charts'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveTab('charts')
            }
          >
            <span>⌁</span>
            Gráficos
          </button>
        </div>

        {activeTab === 'trials' ? (
          <div className="workspace">
            <aside className="trial-sidebar">
              <div className="sidebar-heading">
                <div>
                  <span className="eyebrow">
                    Historico
                  </span>

                  <h2>Todos os testes</h2>
                </div>

                <span className="count">
                  {filteredTrials.length}
                </span>
              </div>

              <div className="search">
                <span>⌕</span>

                <input
                  value={query}
                  onChange={(event) =>
                    setQuery(event.target.value)
                  }
                  placeholder="Buscar teste..."
                />
              </div>

              <div className="trial-list">
                {loading ? (
                  <div className="empty">
                    Carregando testes...
                  </div>
                ) : filteredTrials.length === 0 ? (
                  <div className="empty">
                    Nenhum teste encontrado.
                  </div>
                ) : (
                  filteredTrials.map((trial) => (
                    <button
                      className={`trial-card ${
                        selectedId === trial.id
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        setSelectedId(trial.id)
                      }
                      key={trial.id}
                    >
                      <div className="trial-card-top">
                        <span
                          className={`status-dot ${
                            trial.status ===
                            'NEW_TEST'
                              ? 'active'
                              : ''
                          }`}
                        />

                        <span>
                          {label(trial.status)}
                        </span>

                        <time>
                          {formatDate(
                            trial.timeStarted
                          )}
                        </time>
                      </div>

                      <strong>
                        {label(trial.mode)}
                      </strong>

                      <small>
                        {trial.numberCycles
                          ? `${trial.numberCycles} ciclos`
                          : trial.time ||
                            'Configuracao pendente'}
                      </small>

                      <div className="trial-id">
                        {trial.id}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>

            <div className="main-panel">
              {selectedTrial ? (
                <TrialDetail
                  trial={selectedTrial}
                  cycles={cycles}
                  measurements={measurements}
                  loading={detailLoading}
                />
              ) : (
                <div className="empty large">
                  Selecione um teste para visualizar
                  os detalhes.
                </div>
              )}
            </div>
          </div>
        ) : (
          <TrialCharts
            trials={trials}
            cycles={cycles}
            measurements={measurements}
            selectedTrial={selectedTrial}
            onSelectTrial={setSelectedId}
            loading={detailLoading}
          />
        )}
      </div>

      {modalOpen && (
        <NewTrialModal
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  )
}