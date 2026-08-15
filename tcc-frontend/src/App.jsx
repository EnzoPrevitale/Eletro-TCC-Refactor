import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (response.status === 204) return null
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || `Falha na requisicao (${response.status})`)
  return body
}

const formatDate = (value) => value ? new Date(value.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Ainda nao iniciado'
const label = (value) => ({ IDLE: 'Aguardando', NEW_TEST: 'Em andamento', CYCLE: 'Por ciclos', TIME: 'Por tempo', CHARGE: 'Carga', DISCHARGE: 'Descarga' }[value] || value || '-')

function Stat({ value, caption, accent }) {
  return <div className={`stat ${accent || ''}`}><strong>{value}</strong><span>{caption}</span></div>
}

function NewTrialModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ mode: 'CYCLE', numberCycles: 10, time: '00:10:00' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        mode: form.mode,
        numberCycles: form.mode === 'CYCLE' ? Number(form.numberCycles) : null,
        time: form.mode === 'TIME' ? form.time : null,
        timeStarted: null,
        endTime: null,
        status: 'NEW_TEST',
      }
      const created = await api('/trial/start', { method: 'POST', body: JSON.stringify(payload) })
      onCreated(created)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal" onSubmit={submit}>
      <div className="modal-heading"><div><span className="eyebrow">Novo ensaio</span><h2>Preparar teste</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">x</button></div>
      <label>Modo de teste<select value={form.mode} onChange={(event) => update('mode', event.target.value)}><option value="CYCLE">Por ciclos</option><option value="TIME">Por tempo</option></select></label>
      {form.mode === 'CYCLE' ? <label>Quantidade de ciclos<input type="number" min="1" value={form.numberCycles} onChange={(event) => update('numberCycles', event.target.value)} required /></label> : <label>Duracao<input type="time" step="1" value={form.time} onChange={(event) => update('time', event.target.value)} required /></label>}
      {error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose}>Cancelar</button><button className="button primary" disabled={saving}>{saving ? 'Criando...' : 'Iniciar teste'}</button></div>
    </form>
  </div>
}

function TrialDetail({ trial, cycles, measurements, loading }) {
  const trialMeasurements = measurements.filter((measurement) => cycles.some((cycle) => cycle.id === measurement.cycleId))
  return <section className="detail-panel">
    <div className="detail-top"><div><span className="eyebrow">Teste selecionado</span><h2>{label(trial.mode)} <span className="muted">/ {trial.id.slice(0, 8)}</span></h2></div><div className="detail-meta"><span className={`status ${trial.status === 'NEW_TEST' ? 'running' : ''}`}>{label(trial.status)}</span><span>{formatDate(trial.timeStarted)}</span></div></div>
    <div className="detail-stats"><div><b>{cycles.length}</b><span>ciclos registrados</span></div><div><b>{trialMeasurements.length}</b><span>medidas coletadas</span></div><div><b>{trial.numberCycles || trial.time || '-'}</b><span>configuracao</span></div></div>
    {loading ? <div className="empty">Carregando dados do teste...</div> : cycles.length === 0 ? <div className="empty">Nenhum ciclo registrado para este teste.</div> : <div className="cycle-list">{cycles.map((cycle) => { const cycleMeasurements = measurements.filter((measurement) => measurement.cycleId === cycle.id); return <article className="cycle-row" key={cycle.id}><div className="cycle-number"><span>CICLO</span><strong>{String(cycle.number).padStart(2, '0')}</strong></div><div className="measurement-list">{cycleMeasurements.length === 0 ? <span className="muted">Sem medidas</span> : cycleMeasurements.map((measurement) => <div className="measurement" key={measurement.id}><span className={`dot ${measurement.cycleStatus === 'CHARGE' ? 'charge' : 'discharge'}`}></span><span>{label(measurement.cycleStatus)}</span><b>{measurement.voltage ?? '-'} V</b><time>{measurement.time || '--:--:--'}</time></div>)}</div></article>})}</div>}
  </section>
}

export default function App() {
  const [trials, setTrials] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [cycles, setCycles] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const loadTrials = async () => {
    setLoading(true); setError('')
    try { const data = await api('/trial?size=100&sort=timeStarted,desc'); setTrials(data.content || []); if (!selectedId && data.content?.[0]) setSelectedId(data.content[0].id) } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }
  useEffect(() => { loadTrials() }, [])
  useEffect(() => {
    if (!selectedId) return
    let active = true
    setDetailLoading(true)
    Promise.all([api(`/cycle?trialId=${selectedId}&size=100&sort=number,asc`), api('/measurement?size=500&sort=time,asc')]).then(([cycleData, measurementData]) => { if (active) { setCycles(cycleData.content || []); setMeasurements(measurementData.content || []) } }).catch((requestError) => setError(requestError.message)).finally(() => active && setDetailLoading(false))
    return () => { active = false }
  }, [selectedId])
  const filteredTrials = useMemo(() => trials.filter((trial) => `${trial.id} ${trial.mode} ${trial.status}`.toLowerCase().includes(query.toLowerCase())), [trials, query])
  const selectedTrial = trials.find((trial) => trial.id === selectedId)
  const runningCount = trials.filter((trial) => trial.status === 'NEW_TEST').length
  const handleCreated = async (created) => { setModalOpen(false); await loadTrials(); setSelectedId(created.id) }

  return <main className="app-shell"><header className="topbar"><div className="brand"><div className="brand-mark">T</div><div><b>telemetria</b><span>laboratorio de ensaios</span></div></div><div className="connection"><span></span> Backend conectado</div></header><div className="content"><section className="page-heading"><div><span className="eyebrow">Painel de controle</span><h1>Ensaios elétricos</h1><p>Acompanhe testes, ciclos e medidas em um só lugar.</p></div><button className="button primary new-button" onClick={() => setModalOpen(true)}><span>+</span> Novo teste</button></section>{error && <div className="alert">{error}<button onClick={loadTrials}>Tentar novamente</button></div>}<section className="stats"><Stat value={trials.length} caption="testes registrados" /><Stat value={runningCount} caption="testes em andamento" accent="warm" /><Stat value={trials.reduce((sum, trial) => sum + (trial.numberCycles || 0), 0)} caption="ciclos planejados" accent="green" /></section><div className="workspace"><aside className="trial-sidebar"><div className="sidebar-heading"><div><span className="eyebrow">Historico</span><h2>Todos os testes</h2></div><span className="count">{filteredTrials.length}</span></div><div className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar teste..." /></div><div className="trial-list">{loading ? <div className="empty">Carregando testes...</div> : filteredTrials.length === 0 ? <div className="empty">Nenhum teste encontrado.</div> : filteredTrials.map((trial) => <button className={`trial-card ${selectedId === trial.id ? 'selected' : ''}`} onClick={() => setSelectedId(trial.id)} key={trial.id}><div className="trial-card-top"><span className={`status-dot ${trial.status === 'NEW_TEST' ? 'active' : ''}`}></span><span>{label(trial.status)}</span><time>{formatDate(trial.timeStarted)}</time></div><strong>{label(trial.mode)}</strong><small>{trial.numberCycles ? `${trial.numberCycles} ciclos` : trial.time || 'Configuracao pendente'}</small><div className="trial-id">{trial.id}</div></button>)}</div></aside><div className="main-panel">{selectedTrial ? <TrialDetail trial={selectedTrial} cycles={cycles} measurements={measurements} loading={detailLoading} /> : <div className="empty large">Selecione um teste para visualizar os detalhes.</div>}</div></div></div>{modalOpen && <NewTrialModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />}</main>
}
