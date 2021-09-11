import { Component, Input, AfterViewInit, ViewChild, ElementRef, Renderer2, SimpleChanges, SimpleChange } from '@angular/core';
import * as svg from 'save-svg-as-png';

@Component({
  selector: 'app-svg',
  template: '<div class="btn-cont"><button mat-raised-button type="button" (click)="reset()">Reset</button><button mat-raised-button color="accent" type="button" (click)="downloadSvg()">Download PNG</button></div><div #el class="svg-cont"></div>',
  styleUrls: ['./svg.component.scss']
})
export class SvgComponent implements AfterViewInit {
  @Input() path: string;
  @Input() height: string;
  @Input() fileName: string;
  @Input() resetFunc: () => void;
  @ViewChild('el') div:ElementRef;

  svg: any;

  pathEl: any;

  constructor(private render: Renderer2,private host: ElementRef) { }

  ngAfterViewInit(): void {
    this.buildSvg();
  }

  ngAfterViewChecked(): void {
    this.render.appendChild(this.div.nativeElement, this.svg);
  }

  ngOnChanges(changes: SimpleChanges) {
    const currentItem: SimpleChange = changes.item;
    if (this.pathEl) {
      this.render.setAttribute(this.pathEl, "d", this.path);
    }
  }

  buildSvg() {

    this.svg = this.render.createElement("svg","http://www.w3.org/2000/svg");
    this.render.setAttribute(this.svg,"width","550px");
    this.render.setAttribute(this.svg,"height",this.height+"px");

    this.pathEl = this.render.createElement("path","http://www.w3.org/2000/svg");
    this.render.setAttribute(this.pathEl, "d", this.path);
    this.render.setAttribute(this.pathEl, "stroke", "black");
    this.render.setAttribute(this.pathEl, "stroke-width", "3");
    this.render.setAttribute(this.pathEl, "fill", "none");
    this.render.appendChild(this.svg,this.pathEl);

  }

  downloadSvg() {
    svg.saveSvgAsPng(this.div.nativeElement.querySelector("svg"), this.fileName+"-g2p.png");
  }

  reset() {
    this.resetFunc();
  }

}
