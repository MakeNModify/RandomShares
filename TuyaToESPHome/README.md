Edit: later saw that ther is also an led and button we can use, i added it to the example configuration
# How to flash ESPHome onto Tuya devices
Here I show my method of converting tuya wifi devices to ESPHome devices. This can be done with most tuya devices. This USB Switch is a relatively simple example but what is done here also applies for more complicated hardware.

## Needed Tools and Software:
Basic ESPHome knowlage + 
### Hardware:
- USB switch or any target Tuya device https://s.click.aliexpress.com/e/_oDWQrDL
- USB to TTL Adpater (CH340G) https://s.click.aliexpress.com/e/_ol6f1e5
### Software:
- LTChipTool https://github.com/libretiny-eu/ltchiptool
- BK7231tools https://github.com/tuya-cloudcutter/bk7231tools
- Kickstart Firmware https://github.com/libretiny-eu/esphome-kickstart/releases
## Connecting to the device
### Crack it open
![PXL_20250831_221407597.jpg](images/0.jpg)     ![pins.jpg](images/1.jpg)  
![cbu.svg](images/2.svg)
Connect TX, RX, GND and something switchable to 3V3 or power the device on.  
Make sure to connect TX of the device to RX on the converter and RX to TX.

## Dump firmware
With converter connected, device powered OFF execute:  
`ltchiptool flash read -d /dev/ttyUSB0 BK72XX flashdump1.bin`  

Wait for tool to start and wait, then power ON the device
![image.png](images/3.png)  

Dump it twice and use `md5sum *.bin` to compare the dumps  

![image.png](images/4.png)

## Reversing the Firmware
`bk7231tools dissect_dump -e -O dump flashdump2.bin`  

![image.png](images/5.png)  

look into flashdump2_storage.json for hints on the used pins. In this case:
```YAML
"rl1_pin": 7,
"rl2_pin": 26,
"rl3_pin": 24,
```
## (optional) Flash Kickstart
download the proper kickstart firmware from  
https://github.com/libretiny-eu/esphome-kickstart/releases  

Device powered ON  
`ltchiptool flash write -d /dev/ttyUSB0 kickstart-bk7231n-2025-05-28.uf2`  

![image.png](images/6.png)  

When the tool is ready shortly connect CEN to GND and the upload will start  
After flashing it will set a hotspot and be reachable via http://kickstart-bk7231n.local/  
Now you can connect it to your wifi and still reach it under the same address  
Helpful for further reversing, testing and uploading  

![image.png](images/7.png)

## flashing ESPHome
Generate a config in HomeAssistant choosing
```YAML
bk72xx:
board: cbu
```
Most settings can be left unchanged, but we need to add the pins...  
Edit: or so thought xD after realizing that there is also a button and an LED it got a bit more involved. The config below adds the LED and the button. 
### Button logic:
- 1 button press -> toggle USB1
- 2 button presses -> toggle USB2
- 3 button presses -> toggle USB3
- Long press while one of the USBs is ON -> All OFF
- Long press while all the USBs are OFF -> All ON

The LED can be toggled via Home Assistant (like the USB ports)
```YAML
switch:
  - platform: gpio
    name: "USB1"
    id: usb1
    pin: GPIO7
  - platform: gpio
    name: "USB2"
    id: usb2
    pin: GPIO26
  - platform: gpio
    name: "USB3"
    id: usb3
    pin: GPIO24
  - platform: gpio
    name: "LED"
    id: led_switch
    pin: GPIO6

binary_sensor:
  - platform: gpio
    pin: GPIO8
    name: "Button"
    id: button
    filters:
      - invert:  # Assuming active low
      - delayed_on_off: 50ms  # Debounce
    on_multi_click:
      - timing:
          - ON for at most 500ms
          - OFF for at least 250ms
        then:
          - switch.toggle: usb1
      - timing:
          - ON for at most 500ms
          - OFF for 50ms to 250ms
          - ON for at most 500ms
          - OFF for at least 250ms
        then:
          - switch.toggle: usb2
      - timing:
          - ON for at most 500ms
          - OFF for 50ms to 250ms
          - ON for at most 500ms
          - OFF for 50ms to 250ms
          - ON for at most 500ms
          - OFF for at least 250ms
        then:
          - switch.toggle: usb3
      - timing:
          - ON for at least 2000ms
        then:
          - if:
              condition:
                or:
                  - switch.is_on: usb1
                  - switch.is_on: usb2
                  - switch.is_on: usb3
              then:
                - switch.turn_off: usb1
                - switch.turn_off: usb2
                - switch.turn_off: usb3
              else:
                - switch.turn_on: usb1
                - switch.turn_on: usb2
                - switch.turn_on: usb3
```
Flash via ESPHome integration in HomeAssistant or locally  
`esphome compile 3xusbswitch.yaml`  
`esphome upload --device devicename.local devicename.yaml`

## Done!
Just add it inside your ESPHome devices and done
![image.png](images/8.png)

