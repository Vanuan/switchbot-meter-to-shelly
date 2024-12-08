# switchbot-meter-to-shelly

Shelly script to import Switchbot meter data using BLE and control other Shelly devices based on temperature and humidity readings.

## What it does

This script enables:
- BLE scanning for Switchbot meters and hubs to read humidity and temperature data
- Storage of scanned data in Shelly virtual components
- Automation of other Shelly devices based on temperature/humidity triggers

Example use cases:
- Trigger bathroom fan extractor based on high humidity
- Convert a "dumb" heater into a smart thermostat by controlling its relay based on temperature readings

## Version Requirements

Tested on:
- Shelly 1PM Mini firmware v1.4.4
- Switchbot Outdoor Meter firmware v0.4, v0.8
- Switchbot Hub firmware v1.4-2.3

## Configuration Steps

1. In the Shelly web UI, create a new script and paste the contents of `switchbot-meter-ble.js`

2. Edit the `DEVICES` section in the script to match your Switchbot devices:

```javascript
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
```

Note: The key is the BLE MAC address without colons. `temp` and `hum` are the virtual component IDs.

3. In the Shelly web UI, go to Virtual Components and create a virtual component for each temperature and humidity value
4. Run the script

## Usage

1. Once the script is running, go to Virtual Components in the Shelly UI
2. Create a group including all your sensor data - this will appear on the devices home screen
3. Create actions based on temperature or humidity changes:
   - Go to Actions in the Shelly UI
   - Create a new action for temperature or humidity change
   - To turn a relay on, use a "hit URL" action: `http://192.168.0.xxx/relay/0?turn=on`
     (Replace `192.168.0.xxx` with the IP address of the relay you want to control)

## Files

- `switchbot-meter-ble.js` - Main script file
- `README.md` - This documentation

## Contributing

Feel free to submit issues and pull requests.
