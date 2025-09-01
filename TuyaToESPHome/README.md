- ## Flashing Tuya devices
	- Needed:
		- USB to TTL converter (CH340G)
		- Basic ESPHome knowlage
		- LTChipTool
			- https://docs.libretiny.eu/docs/flashing/tools/ltchiptool/
			- https://github.com/libretiny-eu/ltchiptool
		- BK7231tools
			- https://github.com/tuya-cloudcutter/bk7231tools
- ## Connecting to the device
	- Crack it open
	  ![PXL_20250831_221407597.jpg](images/0.jpg){:height 280, :width 205}     ![pins.jpg](images/1.jpg){:height 301, :width 361}  
	- ![cbu.svg](images/2.svg){:height 300, :width 590}
	- Connect TX, RX, GND and something switchable to 3V3 or power the device on
	-
- ## Dump firmware
	- Converter connected, device powered OFF
	- `ltchiptool flash read -d /dev/ttyUSB0 BK72XX flashdump1.bin`
	- Wait for tool to start and wait, then power ON the device
		- ![image.png](images/3.png)
	- Dump it twice and use `md5sum *.bin` to compare the dumps
		- ![image.png](images/4.png)
	-
- ## Reversing the Firmware
	- `bk7231tools dissect_dump -e -O dump flashdump2.bin`
	- ![image.png](images/5.png)
	- look into flashdump2_storage.json for hints on the used pins. In this case:
		-
		  ```
		  "rl1_pin": 7,
		  "rl2_pin": 26,
		  "rl3_pin": 24,
		  ```
- ## (optional) Flash Kickstart
	- download the proper kickstart firmware from
		- https://github.com/libretiny-eu/esphome-kickstart/releases
	- Device powered ON
	- `ltchiptool flash write -d /dev/ttyUSB0 kickstart-bk7231n-2025-05-28.uf2`
	- ![image.png](images/6.png)
	- When the tool is ready shortly connect CEN to GND and the upload will start
	- After flashing it will set a hotspot and be reachable via http://kickstart-bk7231n.local/
	- Now you can connect it to your wifi and still reach it under the same address
	- Helpful for further reversing, testing and uploading
		- ![image.png](images/7.png)
- ## flashing ESPHome
	- Generate a config in HomeAssistant choosing
		-
		  ```
		  bk72xx:
		    board: cbu
		  ```
	- Most settings can be left unchanged, but we need to add the pins
		-
		  ```
		  switch:
		    - platform: gpio
		      name: "USB1"
		      pin: GPIO7
		    - platform: gpio
		      name: "USB2"
		      pin: GPIO26
		    - platform: gpio
		      name: "USB3"
		      pin: GPIO24
		  ```
	- Flash via ESPHome integration in HomeAssistant or locally
		- `esphome compile 3xusbswitch.yaml`
		- `esphome upload --device 3xusbswitch.local 3xusbswitch.yaml`
-
- ## Done!
	- Just add it inside your ESPHome devices and done
	- ![image.png](images/8.png)
-
