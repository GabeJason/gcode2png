import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { roundPathCorners } from './rounding.js';
import { SvgComponent } from './svg/svg.component';
import { Command } from './_models/command';
import { SvgOption } from './_models/svgOption';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
  @Input() requiredFileType: string;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(SvgComponent) svgComp: SvgComponent;

  displayedColumns: string[] = ['line', 'command', 'x', 'y', 'i', 'j'];

  fileContent: any = '';

  gCommands: Command[] = [];
  commandList = new MatTableDataSource<Command>(this.gCommands);
  bigX = 0;
  bigY = 0;

  invertY = false;
  invertX = false;
  duplicates = false;

  svgScale: number;
  svgScaleDisplay: string;
  svgReady = false;

  toolDiam = 0.0625;

  loading = false;

  firstLoad = false;

  svgOption: SvgOption = {
    path: '', 
    height: 0, 
    fileName: '', 
    fill: false, 
    fillColor: "#000000",
    stroke: true,
    strokeWidth: 1,
    strokeColor: "#000000"
  }

  constructor(private http: HttpClient) { }

  ngAfterViewInit() {
    this.commandList.paginator = this.paginator;
  }

  onFileSelected(event: any) {

    const file: File = event.target.files[0];

    if (file) {
      let fileName = file.name;
      let regMatch = fileName.match(/\./g);
      this.svgOption.fileName = fileName.substring(0,fileName.indexOf(regMatch[0]));
      let fileReader: FileReader = new FileReader();
      let self = this;
      fileReader.onloadend = function (x) {
        self.fileContent = fileReader.result;
        self.commandBuilder();
      }
      fileReader.readAsText(file);

    }

  }

  commandBuilder() {
    this.loading = true;
    this.svgReady = false;
    this.gCommands = [];
    let gCom = '';
    let x = -1;
    let y = -1;
    let io = 0;
    let j = 0;
    let regNL = /\n/g;
    let smallY = 999999;
    let smallX = 999999;
    this.bigX = 0;
    this.bigY = 0;
    this.svgScale = 1;

    let fileLine = '';
    let filePos = 0;
    let fileLineCheck = false;
    let comList = ["G0", "G1", "G2 X", "G3 X", "X", "G00X", "G1X"];

    let nlCount = this.fileContent.match(regNL);

    for (let i = 0; i < nlCount.length; i++) {
      fileLine = this.fileContent.substring(filePos, this.fileContent.indexOf(nlCount[0], filePos));
      filePos = filePos + fileLine.length + 1;
      fileLineCheck = false;
      comList.forEach(com => {
        if (fileLine.includes(com)) {
          if (com != "X") {
            fileLineCheck = true;
            if (com.includes("0")) {
              gCom = "G0";
            }
            if (com.includes("1")) {
              gCom = "G1";
            }
            if (com.includes("2")) {
              gCom = "G2";
            }
            if (com.includes("3")) {
              gCom = "G3";
            }
          } else {
            if (gCom != '') {
              fileLineCheck = true;
            }
          }
        }
      })
      if (fileLineCheck) {
        io = 0;
        j = 0;

        x = this.retrieveCoor(fileLine, "X");
        y = (this.retrieveCoor(fileLine, "Y") == -1) ? y : this.retrieveCoor(fileLine, "Y");
        io = (this.retrieveCoor(fileLine, "I") == -1) ? 0 : this.retrieveCoor(fileLine, "I");
        j = (this.retrieveCoor(fileLine, "J") == -1) ? 0 : this.retrieveCoor(fileLine, "J");;

        if (x != -1) {
          if (x > this.bigX) {
            this.bigX = x;
          }
          if (x < smallX && gCom != "G0") {
            smallX = x;
          }
        }

        if (y != -1) {
          if (y > this.bigY) {
            this.bigY = y;
          }
          if (y < smallY && gCom != "G0") {
            smallY = y;
          }
        }

        if (x != -1) {

          let command: Command = { line: (i+1), com: gCom, x: x, y: y, i: io, j: j };

          //console.log("Line " + i + " " + fileLine + " : " + gCom + " X" + x + " Y" + y + " I" + io + " J" + j);
          this.gCommands.push(command);
        }
      } else {
        gCom = '';
      }
    }

    if (this.gCommands.length > 0) {

      this.svgOption.path = '';

      if (this.duplicates) {
        this.removeDuplicates();
      }

      let smallYDiff = 0;
      let smallXDiff = 0;

      if (smallX != 0) {
        smallXDiff = smallX;
      }

      if (smallY != 0) {
        smallYDiff = smallY;
      }

      this.bigX = this.bigX - smallXDiff;

      if ((this.bigX + this.toolDiam) != 530) {
        this.svgScale = 530 / (this.bigX + this.toolDiam);
      }

      if (this.svgScale != 1) {
        this.svgScaleDisplay = this.svgScale.toFixed(3);
      }

      this.gCommands.forEach(command => {
        x = command.x;
        y = command.y;
        io = command.i;
        j = command.j;

        x = (((x - smallXDiff) * this.svgScale) + 10);
        y = (((y - smallYDiff) * this.svgScale) + 10);

        if (y > this.bigY) {
          this.bigY = y;
        }

        if (command[0] == "G2" || command[0] == "G3") {
          io = (io * this.svgScale);
          j = (j * this.svgScale);
        }

        command.x = x;
        command.y = y;
        command.i = io;
        command.j = j;

      });

      this.bigY = Math.ceil((this.bigY + 10));

      if (this.invertY) {
        this.gCommandsInvertY();
      }

      if (this.invertX) {
        this.gCommandsInvertX();
      }

      this.svgOption.height = this.bigY;

      this.commandList = new MatTableDataSource<Command>(this.gCommands);
      this.commandList.paginator = this.paginator;

      this.gCommands.forEach(command => {
        if (command.com == "G0") {
          this.svgOption.path = this.svgOption.path + " M " + command.x.toFixed(6) + ' ' + command.y.toFixed(6);
        }
        if (command.com == "G1") {
          this.svgOption.path = this.svgOption.path + " L " + command.x.toFixed(6) + ' ' + command.y.toFixed(6);
        }
        if (command.com == "G2" || command.com == "G3") {
          this.svgOption.path = this.svgOption.path + " Q " + (command.x + command.i).toFixed(6) + ' ' + (command.y + command.j).toFixed(6) + " " + command.x.toFixed(6) + ' ' + command.y.toFixed(6);
        }
      });

      this.svgOption.path = this.svgOption.path + " Z";

      let radius = (this.toolDiam > 0 ? this.toolDiam : 0.0001) * this.svgScale;

      this.svgOption.strokeWidth = radius;

      this.svgOption.path = roundPathCorners(this.svgOption.path, radius, false);

      if(this.firstLoad) {
        this.svgComp.updateSvg();
      }

      this.svgReady = true;
      this.loading = false;
      this.firstLoad = true;

    } else {
      alert("Failed to process file.");
      this.loading = false;
    }

  }

  retrieveCoor(line: string, id: string) {
    let working = '';
    let match: any;
    let reg = /[^-.0-9]/g;
    let c = -1;
    if (line.indexOf(id) >= 0) {
      working = line.substring(line.indexOf(id) + 1);
      match = working.match(reg);
      c = (working.substring(0, working.indexOf(match[0])) == "0.") ? 0 : parseFloat(working.substring(0, working.indexOf(match[0])));
    }
    return c;
  }

  invertYChecked(checked: boolean) {
    if (this.fileContent.length > 0) {
      this.commandBuilder();
    }
  }

  invertXChecked(checked: boolean) {
    if (this.fileContent.length > 0) {
      this.commandBuilder();
    }
  }

  duplicateChecked(checked: boolean) {
    if (this.fileContent.length > 0) {
      this.commandBuilder();
    }
  }

  strokeChecked(checked: boolean) {
    if (this.fileContent.length > 0) {
      this.svgComp.updateSvg();
    }
  }

  fillChecked(checked: boolean) {
    if (this.fileContent.length > 0) {
      this.svgComp.updateSvg();
    }
  }

  updateTool() {
    if (this.fileContent.length > 0) {
      this.commandBuilder();
    }
  }

  strokeColorUpdate() {
    this.svgOption.strokeColor = this.colorFormat(this.svgOption.strokeColor);
    if (this.fileContent.length > 0) {
      this.svgComp.updateSvg();
    }
  }

  fillColorUpdate() {
    this.svgOption.fillColor = this.colorFormat(this.svgOption.fillColor);
    if (this.fileContent.length > 0) {
      this.svgComp.updateSvg();
    }
  }

  colorFormat(color: string) {
    color = color.replace(/[^a-fA-f0-9]/g,"");
    if (color.length > 6) {
      color = color.substr(0,6);
    } else {
      let size = 6 - color.length;
      for (let i = 0; i < size; i++) {
        color = color + "0";
      }
    }
    return "#" + color.toUpperCase();
  }

  gCommandsInvertY() {
    let y = 0;
    this.gCommands.forEach(command => {
      y = command.y;
      command.y = (this.bigY - y);
    })
  }

  gCommandsInvertX() {
    let x = 0;
    this.gCommands.forEach(command => {
      x = command.x;
      command.x = (550 - x);
    })
  }

  removeDuplicates() {
    let filterGCommands: Command[] = [];
    let sg = false;
    let sx = false;
    let sy = false;
    let si = false;
    let sj = false;
    let exist = false;

    this.gCommands.forEach(command => {
      if (filterGCommands) {
        filterGCommands.forEach(fCommand => {
          sg = false;
          sx = false;
          sy = false;
          si = false;
          sj = false;
          if (fCommand.com == command.com) {
            sg = true;
          }
          if (fCommand.x == command.x) {
            sx = true;
          }
          if (fCommand.y == command.y) {
            sy = true;
          }
          if (fCommand.i == command.i) {
            si = true;
          }
          if (fCommand.j == command.j) {
            sj = true;
          }
          if (sg && sx && sy && si && sj) {
            exist = true;
          }
        });

        if (!exist) {
          filterGCommands.push(command);
        }
        exist = false;
      }
    });

    this.gCommands = filterGCommands;
  }

  reset() {
    location.reload();
  }

}
