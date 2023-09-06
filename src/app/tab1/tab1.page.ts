import { Component, ViewChild } from '@angular/core';
import { CameraPreview, CameraPreviewOptions, CameraPreviewPictureOptions } from '@capacitor-community/camera-preview';
import { IonContent, Platform } from '@ionic/angular';
import { Filesystem, Directory, WriteFileOptions, MkdirOptions } from '@capacitor/filesystem';
import { BarcodeScanner, ReadBarcodesFromImageOptions } from '@capacitor-mlkit/barcode-scanning';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  @ViewChild(IonContent) ionContent: IonContent | any;

  public cameraOn: boolean = false;
  public scanResult: any;
  public hasResult: boolean = false;

  constructor(
    private platform: Platform
  ) {}

  ionViewDidEnter() {
    
  }

  async saveAsFile(base64: any) {
    const blob = this.b64toBlob(base64, 'image/jpeg');
    const fileName = 'tia-scaner-' + (new Date().getTime()).toString(16);

    const options: WriteFileOptions = {
      path: `barcode/${fileName}.jpg`,
      data: base64,
      recursive: true,
      directory: Directory.Documents,
    }

    try {
      const mkdirOptins: MkdirOptions = {
        path: 'barcode',
        directory: Directory.Documents,
        recursive: true,
      }
      const dir = await Filesystem.mkdir(mkdirOptins);

      console.log(dir, 'DIR');
    }
    catch {
      console.log('dir exist');
    }

    const { uri } = await Filesystem.writeFile(options);
    console.log(uri);
    this.scanBarcode(uri);
  }

  b64toBlob(b64Data: any, contentType: any) {
    contentType = contentType || '';
    var sliceSize = 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  async scanBarcode(filePath: any) {
    const options: ReadBarcodesFromImageOptions = {
      path: filePath,
    }
    const { barcodes } = await BarcodeScanner.readBarcodesFromImage(options);
    console.log(barcodes);
    
    if (barcodes.length > 0) {
      this.hasResult = true;
      this.scanResult = barcodes;
    }
  }

  async start() {
    const width: number = this.platform.width();
    const height: number = 600;

    const options: CameraPreviewOptions = {
      parent: 'cameraPreview',
      toBack: true,
      width: width,
      height: height,
      enableZoom: true,
      enableHighResolution: false,
    }

    CameraPreview.start(options).then(async () => {
      this.cameraOn = true;
    
      while (!this.hasResult) {
        const captureOptions: CameraPreviewPictureOptions = {
          quality: 50,
        }

        const result = await CameraPreview.captureSample(captureOptions);
        const value = result.value;

        this.saveAsFile(value);
      }
    });
  }

  async stop() {
    await CameraPreview.stop();

    this.hasResult = false;
    this.scanResult = '';
  }

  async reset() {
    await this.stop();
    await this.start();
  }

}
