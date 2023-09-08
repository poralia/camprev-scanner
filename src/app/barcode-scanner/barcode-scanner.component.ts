import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { animationFrames, concatMap, EMPTY, exhaustMap, filter, from, fromEvent, map, Subject, takeUntil, tap, throttleTime, timer } from 'rxjs';

import { Constraints } from './barcode-constraints';
import { ScannerLoadingImage } from './barcode-loading';

declare const BarcodeDetector: any;
declare const ImageCapture: any;

@Component({
  selector: 'app-barcode-scanner',
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.scss'],
})
export class BarcodeScannerComponent implements OnInit {

  @ViewChild('scannerEl', { static: true }) scannerEl: ElementRef;
  
  private unsubscribe: Subject<void> = new Subject();
  public scanActive: boolean = false;
  public formats: string[] = [
    'aztec',
    'code_128',
    'code_39',
    'code_93',
    'codabar',
    'data_matrix',
    'ean_13',
    'ean_8',
    'itf',
    'pdf417',
    'qr_code',
    'upc_a',
    'upc_e'
  ];
  public isFlashLightOn: boolean = false;
  private stream: any;
  private track: any;

  constructor(
    public modalCtrl: ModalController,
    private platform: Platform,
  ) { 
    this.platform.backButton.subscribeWithPriority(100, (processNextHandler) => {
      this.dismissScanner();
      processNextHandler();
    })
  }

  ngOnInit() { }

  ngOnDestroy(): void {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ionViewDidLeave() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  ngAfterViewInit(): void {
    this.startScan().subscribe();
  }

  private handleFlashLight(stream: any) {
    this.track = stream.getVideoTracks()[0];

    //Create image capture object and get camera capabilities
    const imageCapture = new ImageCapture(this.track);
    imageCapture.getPhotoCapabilities().then((capabilities: any) => {
      const toggleFlashLight = document.querySelector('.toggleFlashLight');
      const torchSupported = !!capabilities.torch || (
        'fillLightMode' in capabilities &&
        capabilities.fillLightMode.length != 0 &&
        capabilities.fillLightMode != 'none'
      );

      if (torchSupported) {
        let torch = false;

        toggleFlashLight.addEventListener('click', (e) => {
          this.isFlashLightOn = !this.isFlashLightOn;

          try {
            this.track.applyConstraints({
              advanced: [{
                // @ts-ignore
                torch: (torch = !torch)
              }]
            });
          } catch (err) {
            console.log(err);
          }
        });
      }
    });
  }

  private getRearCamera() {
    const constraint =  Constraints.Portrait;
    const video = this.scannerEl.nativeElement as HTMLVideoElement;
    video.poster = ScannerLoadingImage.image;

    const camera = navigator.mediaDevices.getUserMedia(constraint);
    return from(camera).pipe(
      tap((mediaStream) => {
        video.srcObject = mediaStream;
        video.autoplay = true;

        this.stream = mediaStream;
        this.handleFlashLight(this.stream);
      }),
      map(() => video)
    )
  }

  public dismissScanner(content: string = undefined) {
    this.unsubscribe.next();
    this.unsubscribe.complete();

    try {
      this.track.applyConstraints({
        advanced: [{
          // @ts-ignore
          torch: false,
        }]
      });
    } catch (err) {
      console.log(err);
    }

    this.modalCtrl.dismiss({content: content});
  }

  private scanBarcode(barcodeDetector: any, video: HTMLMediaElement) {
    return () => from(barcodeDetector.detect(video))
      .pipe(
        tap(console.log),
        filter((barcodes: { rawValue: string }[]) => barcodes?.length > 0),
        map(barcodes => barcodes[0].rawValue),
      )
  }

  private startScan() {
    try {
      const barcodeDetector = new BarcodeDetector({ formats: this.formats });
      const delayAfterScan = 3;
      const rearCamera$ = this.getRearCamera();
      const code$ = rearCamera$.pipe(
        concatMap((video: any) => fromEvent(video, 'play')
          .pipe(
            tap(() => console.log('pass')),
            concatMap(() => animationFrames().pipe(
              exhaustMap(() => timer(1000/1)),
              exhaustMap(this.scanBarcode(barcodeDetector, video)),
            )),
            throttleTime(delayAfterScan),
            tap(c => this.scanResult(c)),
            tap(() => this.dismissScanner()),
          )
        ),
        takeUntil(this.unsubscribe)
      )
    
      return code$;
    } 
    catch (error) {
      console.log(error)
      return EMPTY;
    }
  }

  private scanResult(data: any) {
    console.log(data);
  }

}
