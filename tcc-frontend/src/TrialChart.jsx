function TrialCharts({
  trials,
  cycles,
  measurements,
  selectedTrial,
  onSelectTrial,
  loading,
}) {
  const [selectedCycleId, setSelectedCycleId] = useState(null)

  useEffect(() => {
    setSelectedCycleId(cycles[0]?.id || null)
  }, [selectedTrial?.id, cycles])

  const selectedCycle = cycles.find(
    (cycle) => cycle.id === selectedCycleId
  )

  const cycleMeasurements = measurements.filter(
    (measurement) => measurement.cycleId === selectedCycleId
  )

  const trialMeasurements = measurements.filter((measurement) =>
    cycles.some((cycle) => cycle.id === measurement.cycleId)
  )

  return (
    <section className="charts-panel">
      <div className="charts-header">
        <div>
          <span className="eyebrow">Análise</span>
          <h2>Gráficos de medições</h2>
          <p>
            Visualize as medições de cada ciclo do teste selecionado.
          </p>
        </div>
      </div>

      <div className="chart-controls">
        <label>
          <span>Teste</span>

          <select
            value={selectedTrial?.id || ''}
            onChange={(event) => onSelectTrial(event.target.value)}
          >
            {trials.map((trial) => (
              <option key={trial.id} value={trial.id}>
                {label(trial.mode)} / {trial.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Ciclo</span>

          <select
            value={selectedCycleId || ''}
            onChange={(event) => setSelectedCycleId(event.target.value)}
            disabled={loading || cycles.length === 0}
          >
            {cycles.length === 0 ? (
              <option value="">Nenhum ciclo</option>
            ) : (
              cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  Ciclo {String(cycle.number).padStart(2, '0')}
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
                <span className="eyebrow">Ciclo selecionado</span>

                <h3>
                  Ciclo {String(selectedCycle.number).padStart(2, '0')}
                </h3>
              </div>

              <div className="cycle-status">
                <span>
                  {cycleMeasurements.length} medições
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
                <span className="eyebrow">Ciclos</span>
                <h3>Medições por ciclo</h3>
              </div>

              <span>
                {trialMeasurements.length} medições no teste
              </span>
            </div>

            <div className="cycle-chart-list">
              {cycles.map((cycle) => {
                const count = measurements.filter(
                  (measurement) =>
                    measurement.cycleId === cycle.id
                ).length

                const selected =
                  cycle.id === selectedCycleId

                return (
                  <button
                    key={cycle.id}
                    className={`cycle-chart-item ${
                      selected ? 'selected' : ''
                    }`}
                    onClick={() => setSelectedCycleId(cycle.id)}
                  >
                    <div className="cycle-chart-number">
                      {String(cycle.number).padStart(2, '0')}
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
                            Math.min(
                              count / Math.max(
                                ...cycles.map((currentCycle) =>
                                  measurements.filter(
                                    (measurement) =>
                                      measurement.cycleId ===
                                      currentCycle.id
                                  ).length
                                ),
                                1
                              ),
                              1
                            ) * 100
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