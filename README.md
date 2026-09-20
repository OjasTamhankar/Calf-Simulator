# CALF//FLOW

Frontend prototype for an ESP32-ready IoT calf massager control surface.

## Run

```bash
npm install
npm run dev
```

Open the Local address shown in the terminal, normally `http://localhost:5173`.

The prototype keeps all device behavior local through `src/services/deviceController.js`, so a future ESP32/WebSocket/BLE/HTTP transport can replace that layer without reshaping the UI.

## Notes

- Start/stop is simulated locally.
- Frequency is constrained to 10-80 Hz.
- Intensity is constrained to 0-100%.
- Presets update both values immediately.
- Session time pauses when stopped.
