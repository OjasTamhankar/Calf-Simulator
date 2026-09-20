import { useEffect, useMemo, useState } from 'react';
import { presets } from './data/presets';
import { deviceController, STATUS } from './services/deviceController';
import { formatElapsed, useSessionTimer } from './hooks/useSessionTimer';

function App() {
  const [device, setDevice] = useState(() => deviceController.getSnapshot());
  const [activePreset, setActivePreset] = useState('recovery');
  const [busy, setBusy] = useState(false);
  const [manualDurationSeconds, setManualDurationSeconds] = useState(() => presets.find((preset) => preset.id === 'recovery').duration);
  const [sessionDuration, setSessionDuration] = useState(() => presets.find((preset) => preset.id === 'recovery').duration);
  const [activeTab, setActiveTab] = useState('control');

  const isConnected = device.connection === STATUS.CONNECTED;
  const isRunning = device.status === STATUS.RUNNING;
  const activeProgram = presets.find((preset) => preset.id === activePreset);
  const modeName = activeProgram?.label ?? 'Manual';
  const { elapsed, remaining, progress, reset } = useSessionTimer(isRunning, sessionDuration);

  const visualStyle = useMemo(
    () => ({
      '--frequency': device.frequency,
      '--intensity': device.intensity,
      '--wave-speed': `${Math.max(0.34, 1.75 - device.frequency / 55)}s`,
      '--ring-speed': `${Math.max(0.7, (1.75 - device.frequency / 55) * 1.65)}s`,
      '--pulse-scale': 1 + device.intensity / 560,
      '--contact-opacity': 0.26 + device.intensity / 150,
      '--wave-opacity': 0.34 + device.intensity / 150,
      '--thumb-glow': `${device.intensity * 0.08}px`
    }),
    [device.frequency, device.intensity]
  );

  const updateFromController = (snapshot) => {
    setDevice(snapshot);
  };

  const toggleMassage = async () => {
    if (!isConnected) return;

    setBusy(true);
    if (!isRunning && remaining === 0) reset();
    const snapshot = isRunning ? await deviceController.stop() : await deviceController.start();
    updateFromController(snapshot);
    setBusy(false);
  };

  const toggleConnection = async () => {
    setBusy(true);
    const snapshot = isConnected ? await deviceController.disconnect() : await deviceController.connect();
    updateFromController(snapshot);
    setBusy(false);
  };

  const setFrequency = async (value) => {
    const snapshot = await deviceController.setFrequency(value);
    updateFromController(snapshot);
    setActivePreset('manual');
  };

  const stepFrequency = (amount) => {
    void setFrequency(device.frequency + amount);
  };

  const setIntensity = async (value) => {
    const snapshot = await deviceController.setIntensity(value);
    updateFromController(snapshot);
    setActivePreset('manual');
  };

  const updateManualDuration = (minutes) => {
    const nextMinutes = Math.max(1, Number(minutes) || 1);
    const nextSeconds = nextMinutes * 60;

    setManualDurationSeconds(nextSeconds);
    setActivePreset('manual');
    setSessionDuration(nextSeconds);
    if (!isRunning) reset();
  };

  const applyPreset = async (preset) => {
    setActivePreset(preset.id);
    setManualDurationSeconds(preset.duration);
    setSessionDuration(preset.duration);
    reset();
    const snapshot = await deviceController.applyPreset(preset);
    updateFromController(snapshot);
  };

  useEffect(() => {
    if (!isRunning || !activeProgram) return;

    const output = getProgramOutput(activeProgram.program, progress);
    void deviceController.setProgramOutput(output).then(updateFromController);
  }, [activeProgram, isRunning, progress]);

  useEffect(() => {
    if (!isRunning || remaining > 0) return;

    void deviceController.stop().then(updateFromController);
  }, [isRunning, remaining]);

  const motorStatus = device.motorStatus ?? 'IDLE';
  const motorHealthy = motorStatus === 'ACTIVE' || motorStatus === 'IDLE';
  const motorGrid = [
    { id: 'Motor 1', ok: true },
    { id: 'Motor 2', ok: true },
    { id: 'Motor 3', ok: true },
    { id: 'Motor 4', ok: true },
    { id: 'Motor 5', ok: true },
    { id: 'Motor 6', ok: true },
    { id: 'Motor 7', ok: true },
    { id: 'Motor 8', ok: true },
    { id: 'Motor 9', ok: true },
    { id: 'Motor 10', ok: true },
    { id: 'Motor 11', ok: true },
    { id: 'Motor 12', ok: true },
    { id: 'Motor 13', ok: true },
    { id: 'Motor 14', ok: true },
    { id: 'Motor 15', ok: false }
  ];

  return (
    <main className="app-shell" style={visualStyle}>
      <Header connection={device.connection} onToggleConnection={toggleConnection} busy={busy} />

      <section className={`control-console ${isRunning ? 'is-running' : ''} ${!isConnected ? 'is-offline' : ''}`}>
        <div className="console-topbar">
          <div>
            <p className="eyebrow">Calf massager</p>
            <h1>{modeName}</h1>
          </div>
          <StatusPill status={device.status} />
        </div>

        <div className="tab-strip" role="tablist" aria-label="Device tabs">
          {['control', 'motor status', 'info'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'tab is-active' : 'tab'}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="content-shell">
          {activeTab === 'control' && (
            <div className="control-panel">
              <div className="device-visual-wrap">
                <DeviceVisual isRunning={isRunning} />
                <SessionClock elapsed={elapsed} remaining={remaining} progress={progress} isRunning={isRunning} />
              </div>

              <div className="control-stack">
                <ControlPanel
                  activePreset={activePreset}
                  busy={busy}
                  device={device}
                  isConnected={isConnected}
                  isRunning={isRunning}
                  manualDurationSeconds={manualDurationSeconds}
                  onApplyPreset={applyPreset}
                  onFrequencyChange={setFrequency}
                  onFrequencyStep={stepFrequency}
                  onIntensityChange={setIntensity}
                  onManualDurationChange={updateManualDuration}
                  onToggleMassage={toggleMassage}
                />
              </div>
            </div>
          )}

          {activeTab === 'motor status' && (
            <div className="tab-panel motor-status-panel">
              <div className="motor-grid" aria-label="Motor health status">
                {motorGrid.map((motor) => (
                  <div key={motor.id} className={motor.ok ? 'motor-row ok' : 'motor-row fail'}>
                    <span className="motor-indicator" aria-hidden="true">
                      {motor.ok ? '✓' : '⚠'}
                    </span>
                    <span className="motor-name">{motor.id}</span>
                    <span className="motor-state">{motor.ok ? 'OK' : 'FAILED'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'info' && (
            <div className="info-panel detail-info-panel">
              <div className="info-card">
                <span>Product</span>
                <strong>CALF//FLOW</strong>
              </div>
              <div className="info-card">
                <span>Model</span>
                <strong>CF-1500 PRO</strong>
              </div>
              <div className="info-card">
                <span>Developer</span>
                <strong>Ojas</strong>
              </div>
              <div className="info-card">
                <span>Session</span>
                <strong>{modeName}</strong>
              </div>
              <div className="info-card">
                <span>Battery</span>
                <strong>{device.battery ?? 100}%</strong>
              </div>
              <div className="info-card">
                <span>Firmware</span>
                <strong>v1.1.1</strong>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Header({ connection, onToggleConnection, busy }) {
  return (
    <header className="topbar">
      <div className="brandmark">CALF//FLOW</div>
      <button className="connection" type="button" onClick={onToggleConnection} disabled={busy}>
        <span className={`status-dot ${connection === STATUS.DISCONNECTED ? 'is-offline' : ''}`} />
        ESP32 {connection}
      </button>
    </header>
  );
}

function StatusPill({ status }) {
  return (
    <div className="status-pill">
      <span>Device state</span>
      <strong>{status}</strong>
    </div>
  );
}

function ModeRail({ activePreset, onApplyPreset }) {
  return (
    <aside className="mode-rail" aria-label="Massage presets">
      <div className="rail-title">
        <span>Timed modes</span>
        <strong>{activePreset === 'manual' ? 'Manual' : 'Auto'}</strong>
      </div>
      <div className="preset-stack">
        {presets.map((preset) => (
          <button
            className={activePreset === preset.id ? 'preset is-active' : 'preset'}
            type="button"
            key={preset.id}
            onClick={() => onApplyPreset(preset)}
          >
            <span>{preset.label}</span>
            <small>{formatElapsed(preset.duration)}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}

function ControlPanel({
  activePreset,
  busy,
  device,
  isConnected,
  isRunning,
  manualDurationSeconds,
  onApplyPreset,
  onFrequencyChange,
  onFrequencyStep,
  onIntensityChange,
  onManualDurationChange,
  onToggleMassage
}) {
  return (
    <div className="controls-panel">
      <FrequencyControl value={device.frequency} onChange={onFrequencyChange} onStep={onFrequencyStep} />
      <IntensityControl value={device.intensity} onChange={onIntensityChange} />
      <ManualTimerControl
        activePreset={activePreset}
        durationSeconds={manualDurationSeconds}
        isRunning={isRunning}
        onChange={onManualDurationChange}
      />
      <PresetModes activePreset={activePreset} onApplyPreset={onApplyPreset} />

      <button className="power-button" type="button" onClick={onToggleMassage} disabled={busy || !isConnected}>
        {!isConnected ? 'Device offline' : isRunning ? 'Stop massage' : 'Start massage'}
      </button>
    </div>
  );
}

function PresetModes({ activePreset, onApplyPreset }) {
  return (
    <div className="preset-panel">
      <div className="preset-panel-header">
        <span>Preset modes</span>
      </div>
      <div className="preset-grid">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activePreset === preset.id ? 'preset-mode is-active' : 'preset-mode'}
            onClick={() => onApplyPreset(preset)}
          >
            <span>{preset.label}</span>
            <small>{formatElapsed(preset.duration)}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function TelemetryPanel({ battery, deviceStatus, elapsed, frequency, intensity, isRunning, modeName, motorStatus, remaining }) {
  return (
    <aside className="telemetry-panel" aria-label="Live massage state">
      <div className="metric-grid" aria-label="Current massage settings">
        <Metric value={frequency} unit="Hz" label="Frequency" />
        <Metric value={intensity} unit="%" label="Intensity" />
      </div>

      <div className="session-ledger">
        <div>
          <span>Mode</span>
          <strong>{modeName}</strong>
        </div>
        <div>
          <span>Device status</span>
          <strong>{deviceStatus}</strong>
        </div>
        <div>
          <span>Motor status</span>
          <strong>{motorStatus}</strong>
        </div>
        <div>
          <span>Battery</span>
          <strong>{battery}%</strong>
        </div>
        <div>
          <span>Elapsed</span>
          <strong>{formatElapsed(elapsed)}</strong>
        </div>
        <div>
          <span>Remaining</span>
          <strong>{formatElapsed(remaining)}</strong>
        </div>
      </div>

      <Waveform frequency={frequency} intensity={intensity} isRunning={isRunning} />
    </aside>
  );
}

function Metric({ value, unit, label }) {
  return (
    <div className="metric">
      <div>
        <strong>{value}</strong>
        <span>{unit}</span>
      </div>
      <p>{label}</p>
    </div>
  );
}

function SessionClock({ elapsed, remaining, progress, isRunning }) {
  return (
    <div className="session-clock" aria-label="Session timer">
      <div>
        <span>{isRunning ? 'Time remaining' : 'Session timer'}</span>
        <strong>{isRunning ? formatElapsed(remaining) : formatElapsed(elapsed)}</strong>
      </div>
      <i aria-hidden="true">
        <b style={{ transform: `scaleX(${progress})` }} />
      </i>
    </div>
  );
}

function DeviceVisual({ isRunning }) {
  return (
    <div className="device-stage" aria-label="Calf massager visualization">
      <div className="leg-silhouette">
        <span className="leg-highlight" />
        <span className="strap strap-top" />
        <span className="strap strap-bottom" />
        <span className="unit-shell">
          <span className="power-button-shell">
            <span className="power-button-core" />
          </span>
          <span className="status-led" />
        </span>
        <span className="cable-line" />
      </div>

      <div className={isRunning ? 'signal-rings is-active' : 'signal-rings'}>
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function FrequencyControl({ value, onChange, onStep }) {
  return (
    <div className="control-block">
      <div className="control-label">
        <span>Frequency</span>
        <strong>{value} Hz</strong>
      </div>
      <div className="frequency-tools">
        <button type="button" aria-label="Decrease frequency" onClick={() => onStep(-1)}>
          -
        </button>
        <input
          type="range"
          min="10"
          max="80"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Vibration frequency"
        />
        <button type="button" aria-label="Increase frequency" onClick={() => onStep(1)}>
          +
        </button>
      </div>
    </div>
  );
}

function IntensityControl({ value, onChange }) {
  return (
    <div className="control-block">
      <div className="control-label">
        <span>Intensity</span>
        <strong>{value}%</strong>
      </div>
      <div className="intensity-scale">
        <small>LOW</small>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Massage intensity"
        />
        <small>HIGH</small>
      </div>
    </div>
  );
}

function ManualTimerControl({ activePreset, durationSeconds, isRunning, onChange }) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  return (
    <div className="control-block">
      <div className="control-label">
        <span>Manual timer</span>
        <strong>{activePreset === 'manual' ? formatElapsed(durationSeconds) : `${minutes} min`}</strong>
      </div>
      <div className="intensity-scale">
        <small>1 min</small>
        <input
          type="range"
          min="1"
          max="90"
          step="1"
          value={minutes}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Manual massage duration in minutes"
          disabled={isRunning}
        />
        <small>90 min</small>
      </div>
    </div>
  );
}

function Waveform({ frequency, intensity, isRunning }) {
  const bars = Array.from({ length: 34 }, (_, index) => {
    const wave = Math.sin(index * 0.72 + frequency / 8);
    const height = 18 + Math.abs(wave) * 44 + intensity * 0.3;
    return <i key={index} style={{ '--bar-height': `${height}px`, '--bar-delay': `${index * 0.026}s` }} />;
  });

  return (
    <section className={isRunning ? 'waveform is-running' : 'waveform'} aria-label="Vibration waveform">
      {bars}
    </section>
  );
}

function getProgramOutput(program, progress) {
  const nextIndex = program.findIndex((step) => step.progress >= progress);
  const resolvedNextIndex = nextIndex === -1 ? program.length - 1 : nextIndex;
  const next = program[resolvedNextIndex];
  const previous = program[Math.max(resolvedNextIndex - 1, 0)];
  const range = next.progress - previous.progress || 1;
  const position = Math.min(1, Math.max(0, (progress - previous.progress) / range));

  return {
    frequency: previous.frequency + (next.frequency - previous.frequency) * position,
    intensity: previous.intensity + (next.intensity - previous.intensity) * position
  };
}

export default App;
