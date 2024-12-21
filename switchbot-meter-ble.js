const DEVICES = {
    "DD4698BD1111": {
        name: "Hub",
        temp: "number:200",
        hum: "number:201"
    },
    "D93011110001": {
        name: "Device 01",
        temp: "number:202",
        hum: "number:203"
    },
    "D13011110002": {
        name: "Device 02",
        temp: "number:204",
        hum: "number:205"
    },
    "D13011110003": {
        name: "Device 03",
        temp: "number:206",
        hum: "number:207"
    },
};

// Global state for storing latest readings
let deviceReadings = {};

function setupVirtual() {
    for (let deviceId in DEVICES) {
        let device = DEVICES[deviceId];
        if(!device.temp || !device.hum) { continue }
        
        let tempComponent = Virtual.getHandle(device.temp);
        let humComponent = Virtual.getHandle(device.hum);
        
        if (tempComponent) {
            tempComponent.setConfig({
                name: device.name + " Temperature",
                unit: "°C",
                min: -40,
                max: 60,
                precision: 1,
                persisted: true
            });
        }
        
        if (humComponent) {
            humComponent.setConfig({
                name: device.name + " Humidity",
                unit: "%",
                min: 0,
                max: 100,
                precision: 0,
                persisted: true
            });
        }
    }
}

function cleanMacAddress(addr) {
    let cleaned = "";
    for (let i = 0; i < addr.length; i++) {
        if (addr[i] !== ':') {
            cleaned += addr[i];
        }
    }
    return cleaned.toUpperCase();
}

function parseSwitchBotData(data, isHub) {
    try {
        if (isHub) {
            let temp = data.charCodeAt(8) & 0x7F;  // Extract temperature from byte 9 (index 8)
            let temp_decimal = (data.charCodeAt(7) & 0x0F);
            temp += temp_decimal * 0.1;
            let humidity = data.charCodeAt(9) & 0x7F;
            return { temperature: temp, humidity: humidity };
        } else {
            let temp = data.charCodeAt(3) & 0x7F;  // Extract temperature from the lowest 6 bits of 4th byte
            let temp_decimal = (data.charCodeAt(2) & 0x0F);
            temp += temp_decimal * 0.1;
            let humidity = data.charCodeAt(4) & 0x7F;  // Humidity in byte 5
            return { temperature: temp, humidity: humidity };
        }
    } catch (e) {
        print("Parse error:", e);
        return null;
    }
}

function handleScanResult(event, result) {

    if (event === BLE.Scanner.SCAN_RESULT && result && 
        result.manufacturer_data && result.manufacturer_data["0969"]) {
        let addr = cleanMacAddress(result.addr);
        let device = DEVICES[addr];
        
        if (device) {
            print("Device Found: " + device.name);

            let mfgData = result.manufacturer_data["0969"].substring(6, result.manufacturer_data["0969"].length);
            let isHub = addr === "DD4698BD8C71";
            let data = parseSwitchBotData(mfgData, isHub);

            if (data) {
                print("Parsed Data: " + JSON.stringify(data));
                deviceReadings[addr] = {
                    name: device.name,
                    temp: device.temp,
                    hum: device.hum,
                    temperature: data.temperature,
                    humidity: data.humidity,
                    timestamp: Date.now()
                };
            } else {
                print("Failed to parse data");
            }
        } else {
            print("Device not found in DEVICES");
        }
    }
}


// Start scanning
function startScan() {
    if (!BLE.Scanner.isRunning()) {
        let scanOptions = {
            duration_ms: 10000,
            active: true
        };
        BLE.Scanner.Start(scanOptions, handleScanResult);
    }
}
// Setup and start scanning
BLE.Scanner.Subscribe(handleScanResult);
Timer.set(30000, true, startScan, null);
startScan();

function updateVirtualComponents() {
    let now = Date.now();
    for (let addr in deviceReadings) {
        let reading = deviceReadings[addr];

        // Only update readings less than 5 minutes old
        if (now - reading.timestamp < 300000) {
            let tempComponent = Virtual.getHandle(reading.temp);
            let humComponent = Virtual.getHandle(reading.hum);
            
            if (tempComponent) {
                tempComponent.setValue(reading.temperature);
            }
            if (humComponent) {
                humComponent.setValue(reading.humidity);
            }
            print(reading.name + ": " + reading.temperature.toFixed(1) + "°C, " + 
                  reading.humidity + "%");
        }
    }
}

// Update virtual components every second
Timer.set(1000, true, updateVirtualComponents, null);
