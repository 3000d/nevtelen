nevtelen
========

Netvelen is an interactive installation where faces are taken on the fly with a camera and lightpainted with a drawbot.


Structure
----------
    /common           common code (folder watcher is there) 
    /in               oF face detection
    /process          podtrace / gcode conversion
    /out              code for feedback
    /communication    communication with drawbot
    /web              web server to communicate with drawbot
    /data             files to process
       /jpg
       /svg
       /gcode
   

How to use
----------

1. Build a drawbot ! This project uses the Firmware from [https://github.com/MarginallyClever/Makelangelo](MarginallyClever's Makelangelo). You can build the drawbot yourself or buy a kit on their website.
2. Clone this repository
2. Run `$ npm install`
1. Go to `web` folder and run `$ npm install`
2. Run `$ bower install`
3. Run `$ node communication/draw.js`
4. Open `localhost:3000` in your browser
