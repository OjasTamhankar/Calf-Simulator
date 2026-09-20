const STATUS = {
  CONNECTED: 'CONNECTED',
  READY: 'READY',
  RUNNING: 'RUNNING',
  DISCONNECTED: 'DISCONNECTED'
};

const state = {
  connection: STATUS.CONNECTED,
  status: STATUS.READY,
  battery: 86,
  motorStatus: 'IDLE',
  frequency: 42,
  intensity: 58
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));

export const deviceController = {
  async connect() {
    state.connection = STATUS.CONNECTED;
    state.status = STATUS.READY;
    state.motorStatus = 'IDLE';
    return this.getSnapshot();
  },

  async disconnect() {
    state.connection = STATUS.DISCONNECTED;
    state.status = STATUS.DISCONNECTED;
    state.motorStatus = 'OFFLINE';
    return this.getSnapshot();
  },

  async start() {
    if (state.connection === STATUS.DISCONNECTED) return this.getSnapshot();
    state.status = STATUS.RUNNING;
    state.motorStatus = 'ACTIVE';
    state.battery = Math.max(18, state.battery - 1);
    return this.getSnapshot();
  },

  async stop() {
    state.status = state.connection === STATUS.DISCONNECTED ? STATUS.DISCONNECTED : STATUS.READY;
    state.motorStatus = 'IDLE';
    return this.getSnapshot();
  },

  async setFrequency(value) {
    state.frequency = Math.round(clamp(value, 10, 80));
    return this.getSnapshot();
  },

  async setIntensity(value) {
    state.intensity = Math.round(clamp(value, 0, 100));
    return this.getSnapshot();
  },

  async applyPreset(preset) {
    state.frequency = Math.round(clamp(preset.frequency, 10, 80));
    state.intensity = Math.round(clamp(preset.intensity, 0, 100));
    return this.getSnapshot();
  },

  async setProgramOutput({ frequency, intensity }) {
    state.frequency = Math.round(clamp(frequency, 10, 80));
    state.intensity = Math.round(clamp(intensity, 0, 100));
    return this.getSnapshot();
  },

  getStatus() {
    return state.status;
  },

  getSnapshot() {
    return { ...state };
  }
};

export { STATUS };
