# gcode2png

### Stack
* Angular 12
* Angular Material

### NPM Packages & 3rd Party Code
* [save-svg-as-png](https://www.npmjs.com/package/save-svg-as-png)
* [rounding.js developed by Yona-Appletree](http://plnkr.co/edit/kGnGGyoOCKil02k04snu?preview)


### Description

I needed an application to take in gcode produced for a cnc machine and read the gcode to create a png with an accurate representaton of the cutout and the tool path.

The application takes in a tool diameter which is used to calculate the stroke width which accurately represents the tool and its cutting path.

The application is live at https://gcode2png.herokuapp.com/

Currently only has been tested with with Mach 3 and Mach 4 .tap and .txt files.
