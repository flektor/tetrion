import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ImageLoader, CanvasTexture } from 'three';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private imageLoader: ImageLoader;

  constructor(private httpClient: HttpClient) {
    this.imageLoader = new ImageLoader();
  }


  public async loadJson(filepath: string): Promise<any> {

    // return new Promise((resolve, reject) => {
    return this.httpClient.get(filepath, { responseType: "json" }).pipe().toPromise();
    // });
    // return new Promise((resolve, reject) => {
    //   this.httpClient.get(filepath, { responseType: "json" }).subscribe((objectsList: any) => {
    //     console.log("loading ");
    //     resolve(objectsList);
    //   });
    // });
  }


  public loadTexures(imageUrls: string[], colors, width: number, height: number) {
    let images = [];
    if (!imageUrls || imageUrls.length == 0) {
      for (let i = 0; i < colors.length; i++) {
        images.push(this.loadTexure(imageUrls[i], colors[i], width, height));
      }
    } else {
      for (let i = 0; i < imageUrls.length; i++) {
        images.push(this.loadTexure(imageUrls[i], colors[i], width, height));
      }
    }
    return Promise.all(images);
  }

  public loadTexure(imageUrl: string, color, width: number, height: number) {
    return new Promise((resolve) => {
      this.imageLoader.load(
        // resource URL
        imageUrl,
        // onLoad callback
        image => {
          // use the image, e.g. draw part of it on a canvas
          var canvas = document.createElement("canvas");
          var context = canvas.getContext('2d');
          canvas.width = width;
          canvas.height = height;
          context.strokeStyle = "#000000";
          context.lineWidth = 3;
          context.drawImage(image, 0, 0, width, height);
          context.strokeRect(0, 0, width, height);
          resolve(new CanvasTexture(canvas));
        },
        // onProgress callback currently not supported
        undefined,
        // onError callback
        () => {
          var canvas = document.createElement("canvas");
          var context = canvas.getContext('2d');
          canvas.width = width;
          canvas.height = height;
          context.fillStyle = color;
          context.strokeStyle = "#000000";
          context.lineWidth = 3;
          context.fillRect(0, 0, width, height);
          context.strokeRect(0, 0, width, height);
          resolve(new CanvasTexture(canvas));
        }
      );
    });
  }
}
