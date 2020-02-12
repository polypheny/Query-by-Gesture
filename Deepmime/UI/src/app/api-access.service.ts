import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Result, Labels } from './result-sidebar/result-sidebar.component';
import { Video, SelectedVideo } from './video-sidebar/video-sidebar.component';

@Injectable({
  providedIn: 'root'
})
export class ApiAccessService {
  private static apiIP = 'http://127.0.0.1:5000/';
  private static results: Result[] = [];
  private static segmentations: Video[] = [];

  private static segmentationReadySubject = new Subject<string>();
  public static segmentationReadyObservable = ApiAccessService.segmentationReadySubject.asObservable();

  private static resultReadySubject = new Subject<SelectedVideo>();
  public static resultReadyObservable = ApiAccessService.resultReadySubject.asObservable();

  private static streamResultReadySubject = new Subject<Result>();
  public static streamResultReadyObservable = ApiAccessService.streamResultReadySubject.asObservable();

  private static labelsReadySubject = new Subject<Labels>();
  public static labelsReadyObservable = ApiAccessService.labelsReadySubject.asObservable();

  constructor() {  }

  /**
   * Requests the segmentation of a specified video
   * Saves it in segmentations array
   */
  public static requestSegmentation(videoName: string, videoDuration: number) {
    if (this.getSegmentation(videoName) == null) {
      const httpRequest: XMLHttpRequest = new XMLHttpRequest();
      httpRequest.onerror = () => {
        alert('Could not connect to API server. Check if the server is online!');
      };

      const formData = new FormData();
      formData.append('videoName', videoName);
      formData.append('videoDuration', videoDuration.toString());
      httpRequest.open('POST', this.apiIP + 'segment');
      httpRequest.send(formData);

      httpRequest.onreadystatechange = () => {
        if (httpRequest.readyState === 4) {
          const response: string = httpRequest.response;
          try {
            const videoObj: Video = JSON.parse(response);
            this.segmentations.push(videoObj);
            this.segmentationReadySubject.next(videoName);
          } catch {
            document.getElementById(videoName + 'Expand').style.visibility = 'hidden';
            alert('Segmentation failed! Not available at the moment');
          }
        }
      };
    } else {
      this.segmentationReadySubject.next(videoName);
    }
  }

  /**
   * Returns a "Video" object containing its segmentation
   */
  public static getSegmentation(videoName: string): Video {
    let segmentation: Video = null;
    this.segmentations.forEach(element => {
      if (videoName === element.videoName) {
        segmentation = element;
      }
    });
    return segmentation;
  }

  /**
   * Requests a classification result to a specified video
   * Saves it in results array
   */
  public static requestClassification(selectedVideo: SelectedVideo) {
    if (this.getResult(selectedVideo.video.videoName, selectedVideo.segmentNumber) == null) {
      const httpRequest: XMLHttpRequest = new XMLHttpRequest();
      httpRequest.onerror = () => {
        alert('Could not connect to API server. Check if the server is online!');
      };

      const formData = new FormData();
      formData.append('videoName', selectedVideo.video.videoName);
      formData.append('videoDuration', selectedVideo.video.videoDuration.toString());
      formData.append('segmentNumber', selectedVideo.segmentNumber.toString());
      httpRequest.open('POST', this.apiIP + 'classify');
      httpRequest.send(formData);

      httpRequest.onreadystatechange = () => {
        if (httpRequest.readyState === 4) {
          const response: string = httpRequest.response;
          try {
            const resultObj: Result = JSON.parse(response);

            this.results.push(resultObj);
            this.resultReadySubject.next({video: selectedVideo.video, segmentNumber: selectedVideo.segmentNumber});
          } catch {
            alert('Classification failed!');
          }
        }
      };
    } else {
      this.resultReadySubject.next({video: selectedVideo.video, segmentNumber: selectedVideo.segmentNumber});
    }
  }

  /**
   * Returns a "Result" object
   */
  public static getResult(videoName: string, segmentNumber: number): Result {
    let result: Result = null;
    this.results.forEach(element => {
       if (videoName === element.videoName && segmentNumber === element.segmentNumber) {
        result = element;
      }
    });
    return result;
  }

  /**
   * Sends a "Result" object as string to the backend
   */
  public static sendFeedbackGesture(improvedResult: Result) {
    const httpRequest: XMLHttpRequest = new XMLHttpRequest();
    httpRequest.onerror = () => {
      alert('Could not connect to API server. Check if the server is online!');
    };

    httpRequest.open('POST', this.apiIP + 'feedbackGesture');
    httpRequest.send(JSON.stringify(improvedResult));
  }

  /**
   * Sends a "Video" object as string to the backend
   */
  public static sendFeedbackSegmentation(improvedResult: Video) {
    const httpRequest: XMLHttpRequest = new XMLHttpRequest();

    httpRequest.open('POST', this.apiIP + 'feedbackSegmentation');
    httpRequest.send(JSON.stringify(improvedResult));
  }

  /**
   * Uploads a video choosen by a HTMLInputElement to the backend
   */
  public static uploadVideo(input: any, videoName: string) {
    let inputFile = null;
    if (input instanceof HTMLInputElement) {
      inputFile = input.files[0];
    } else {
      inputFile = input;
    }

    const httpRequest: XMLHttpRequest = new XMLHttpRequest();
    httpRequest.onerror = () => {
      alert('Could not connect to API server. Check if the server is online!');
    };

    const formData: FormData = new FormData();
    formData.append('file', inputFile);
    formData.append('videoName', videoName);
    httpRequest.open('POST', this.apiIP + 'upload');
    httpRequest.send(formData);
  }

  /**
   * Uploads a frame to the backend and receives its classification results
   */
  public static stream(blob: any, frameNumber: number) {
    const httpRequest: XMLHttpRequest = new XMLHttpRequest();
    httpRequest.onerror = () => {
      alert('Could not connect to API server. Check if the server is online!');
    };

    const formData: FormData = new FormData();
    formData.append('file', blob);
    formData.append('frameNumber', frameNumber.toString());
    httpRequest.open('POST', this.apiIP + 'stream');
    httpRequest.send(formData);

    httpRequest.onreadystatechange = () => {
      if (httpRequest.readyState === 4) {
        const response: string = httpRequest.response;
        try {
          const resultObj: Result = JSON.parse(response);
          this.streamResultReadySubject.next(resultObj);
        } catch {
          alert('Classification failed! #2');
        }
      }
    };
  }

  public static downloadVideo() {

  }

  /**
   * Deletes a certain file at the backend
   * @param path to the file you want to delete
   */
  public static deleteFolderContent(path: string) {
    const formData: FormData = new FormData();
    formData.append('path', path);

    const httpRequest: XMLHttpRequest = new XMLHttpRequest();
    httpRequest.onerror = () => {
      alert('Could not connect to API server. Check if the server is online!');
    };

    httpRequest.open('DELETE', this.apiIP + 'delete');
    httpRequest.send(formData);
  }

  /**
   * Requests the labels list
   */
  public static requestLabels() {
    const httpRequest: XMLHttpRequest = new XMLHttpRequest();
    httpRequest.onerror = () => {
      alert('Could not connect to API server. Check if the server is online!');
    };

    httpRequest.open('GET', this.apiIP + 'labels');
    httpRequest.send();

    httpRequest.onreadystatechange = () => {
      if (httpRequest.readyState === 4) {
        const response: string = httpRequest.response;
        try {
          const labelsObj: Labels = JSON.parse(response);
          this.labelsReadySubject.next(labelsObj);
        } catch {
          alert('Receiving labels failed!');
        }
      }
    };
  }

  /**
   * Sends new labels list (when label added)
   */
  public static addLabel(labels: Labels) {
    const httpRequest: XMLHttpRequest = new XMLHttpRequest();

    httpRequest.open('POST', this.apiIP + 'addLabel');
    httpRequest.send(JSON.stringify(labels));
  }
}
