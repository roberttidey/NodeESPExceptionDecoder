# ESPExceptiondecoder
Node JS based exception decoder for use with Arduino IDE v2 as this currently doesn't have the equivalent of the java based one in v1

## Install
- Install Node JS
- Copy git material into a Node project folder
- npm install express and fast-glob
- Edit Index.js to have the path to the addr2line utility found under tools in the esp8266 packages folder
- Edit Index.js to have the search path for elf files typically in your users AppData/local/temp

##Use
- Start Node server handler (node index.js from project folder
- enter name of ino files
- paste exception text from a log files
- press decode






