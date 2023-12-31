import { Component, Sanitizer, ViewChild } from '@angular/core';
import { CameraPreview, CameraPreviewFlashMode, CameraPreviewOptions, CameraPreviewPictureOptions } from '@capacitor-community/camera-preview';
import { IonContent, Platform } from '@ionic/angular';
import { Filesystem, Directory, WriteFileOptions, MkdirOptions, DeleteFileOptions } from '@capacitor/filesystem';
import { BarcodeScanner, ReadBarcodesFromImageOptions } from '@capacitor-mlkit/barcode-scanning';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  @ViewChild(IonContent) ionContent: IonContent | any;

  private win: any = window;

  public cameraOn: boolean = false;
  public scanResult: any;
  public hasResult: boolean = false;
  public marginTop: number = 0;
  public fileUri: string = '';

  constructor(
    private platform: Platform,
    private sanitizer: DomSanitizer,
  ) {}

  ionViewDidEnter() {
    this.marginTop = this.platform.height() / 2;
  }

  sanitizedFileUri(fileUri: string) {
    return this.win.Ionic.WebView.convertFileSrc(this.fileUri);
  }

  async saveAsFile(base64: any) {
    const blob = this.b64toBlob(base64, 'image/jpeg');
    const fileName = 'tia-scaner-' + (new Date().getTime()).toString(16);
    const filePath = `barcode/${fileName}.jpg`;

    const options: WriteFileOptions = {
      path: filePath,
      data: base64,
      recursive: true,
      directory: Directory.Cache,
    }

    try {
      const mkdirOptins: MkdirOptions = {
        path: 'barcode',
        directory: Directory.Cache,
        recursive: true,
      }
      const dir = await Filesystem.mkdir(mkdirOptins);

      console.log(dir, 'DIR');
    }
    catch (e) {
      console.log(e);
    }

    const { uri } = await Filesystem.writeFile(options);
    console.log(uri);
    this.fileUri = uri;
    this.scanBarcode(uri, filePath);
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

  async scanBarcode(fileUri: any, filePath: string) {
    const options: ReadBarcodesFromImageOptions = {
      path: fileUri,
    }
    const { barcodes } = await BarcodeScanner.readBarcodesFromImage(options);
    console.log(barcodes);
    
    if (barcodes.length > 0) {
      this.hasResult = true;
      this.scanResult = barcodes;
    }

    // delete file
    const deleteOptions: DeleteFileOptions = {
      path: filePath,
      directory: Directory.Cache,
    }

    try {
      const deleted = await Filesystem.deleteFile(deleteOptions);
      console.log('deleted', deleted);
    }
    catch (e) {
      console.log(e);
    }
  }

  async start() {
    const width: number = this.platform.width();
    const height: number = this.platform.height() / 2;

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

  async turnOnFlashlight() {
    const flashModes = await CameraPreview.getSupportedFlashModes();
    const supportedFlashModes: CameraPreviewFlashMode[] = flashModes.result;
    
    const cameraPreviewFlashMode: CameraPreviewFlashMode = 'torch';
    await CameraPreview.setFlashMode({ flashMode: cameraPreviewFlashMode });
  }

  async turnOffFlashlight() {
    const cameraPreviewFlashMode: CameraPreviewFlashMode = 'off';
    await CameraPreview.setFlashMode({ flashMode: cameraPreviewFlashMode });
  }

}
