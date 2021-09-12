import { Component, Input, AfterViewInit, ViewChild, ElementRef, Renderer2, SimpleChanges, SimpleChange } from '@angular/core';
import * as svg from 'save-svg-as-png';
import { SvgOption } from '../_models/svgOption';

@Component({
  selector: 'app-svg',
  template: '<div class="btn-cont"><button mat-raised-button type="button" (click)="reset()">Reset</button><button mat-raised-button color="accent" type="button" (click)="downloadSvg()">Download PNG</button></div><div #el class="svg-cont"></div>',
  styleUrls: ['./svg.component.scss']
})
export class SvgComponent implements AfterViewInit {
  @Input() option: SvgOption;
  @Input() resetFunc: () => void;
  @ViewChild('el') div: ElementRef;

  svg: any;

  pathEl: any;

  constructor(private render: Renderer2, private host: ElementRef) { }

  ngAfterViewInit(): void {
    this.buildSvg();
  }

  ngAfterViewChecked(): void {
    this.render.appendChild(this.div.nativeElement, this.svg);
  }

  updateSvg() {
    if (this.pathEl) {
      this.setSvgPath();
      this.setFill();
      this.setStroke();
    }
  }

  buildSvg() {
    this.svg = this.render.createElement("svg", "http://www.w3.org/2000/svg");
    this.pathEl = this.render.createElement("path", "http://www.w3.org/2000/svg");
    this.render.setAttribute(this.pathEl, "stroke-linecap", "round");
    this.render.setAttribute(this.pathEl, "stroke-linejoin", "round");
    this.render.setAttribute(this.pathEl, "fill-rule", "evenodd");
    this.setSvgPath();
    this.setFill();
    this.setStroke();
    this.render.appendChild(this.svg, this.pathEl);
  }

  setSvgPath() {
    this.render.setAttribute(this.svg, "width", "550px");
    this.render.setAttribute(this.svg, "height", this.option.height.toString() + "px");
    this.render.setAttribute(this.pathEl, "d", this.option.path);
  }

  setFill() {
    if (this.option.fill) {
      this.render.setAttribute(this.pathEl, "fill", this.option.fillColor);
    } else {
      this.render.setAttribute(this.pathEl, "fill", "none");
    }
  }

  setStroke() {
    if (this.option.stroke) {
      this.render.setAttribute(this.pathEl, "stroke", this.option.strokeColor);
      this.render.setAttribute(this.pathEl, "stroke-width", this.option.strokeWidth.toFixed(6));
    } else {
      this.render.setAttribute(this.pathEl, "stroke", "white");
      this.render.setAttribute(this.pathEl, "stroke-width", this.option.strokeWidth.toFixed(6));
    }
  }

  downloadSvg() {
    svg.saveSvgAsPng(this.div.nativeElement.querySelector("svg"), this.option.fileName + "-g2p.png");
  }

  reset() {
    this.resetFunc();
  }

}
