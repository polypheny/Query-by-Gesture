import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { VisualizationData } from './video-visualization/video-visualization.component';
import { Video, SelectedVideo } from './video-sidebar/video-sidebar.component';

/**
 * mode = 0: segmenting
 * mode = 1: classifying
 */
export interface LoadingScreenInfo {
  active: boolean;
  mode: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommunictaionService {
  private videoSelectedSubject = new Subject<SelectedVideo>();
  public videoSelectedObservable = this.videoSelectedSubject.asObservable();

  private visualizeVideoSubject = new Subject<VisualizationData>();
  public visualizeVideoObservable = this.visualizeVideoSubject.asObservable();

  private setVideoTimeSubject = new Subject<number>();
  public setVideoTimeObservable = this.setVideoTimeSubject.asObservable();

  private reloadAppSubject = new Subject<void>();
  public reloadAppObservable = this.reloadAppSubject.asObservable();

  private videoAddedSubject = new Subject<Video>();
  public videoAddedObservable = this.videoAddedSubject.asObservable();

  private startRecordingModeSubject = new Subject<void>();
  public startRecordingModeObservable = this.startRecordingModeSubject.asObservable();

  private uploadRecordingSubject = new Subject<any>();
  public uploadRecordingObservable = this.uploadRecordingSubject.asObservable();

  private resultActiveSubject = new Subject<boolean>();
  public resultActiveObservable = this.resultActiveSubject.asObservable();

  private classifyVideoSubject = new Subject<void>();
  public classifyVideoObservable = this.classifyVideoSubject.asObservable();

  private createSegmentationSubject = new Subject<VisualizationData>();
  public createSegmentationObservable = this.createSegmentationSubject.asObservable();

  private controlWebcamStreamSubjet = new Subject<boolean>();
  public controlWebcamStreamObservable = this.controlWebcamStreamSubjet.asObservable();

  private activateHelpSubjet = new Subject<void>();
  public activateHelpObservable = this.activateHelpSubjet.asObservable();

  private activateLabelsViewSubjet = new Subject<void>();
  public activateLabelsViewObservable = this.activateLabelsViewSubjet.asObservable();

  private activateLoadingScreenSubjet = new Subject<LoadingScreenInfo>();
  public activateLoadingScreenObservable = this.activateLoadingScreenSubjet.asObservable();

  constructor() { }

  public videoSelected(selectedVideo: SelectedVideo) {
    this.videoSelectedSubject.next(selectedVideo);
  }

  public visualizeVideo(visualizationData: VisualizationData) {
    this.visualizeVideoSubject.next(visualizationData);
  }

  public setVideoTime(time: number) {
    this.setVideoTimeSubject.next(time);
  }

  public reloadApp() {
    this.reloadAppSubject.next();
  }

  public videoAdded(video: Video) {
    this.videoAddedSubject.next(video);
  }

  public startRecordingMode() {
    this.startRecordingModeSubject.next();
  }

  public uploadRecording(blob: any) {
    this.uploadRecordingSubject.next(blob);
  }

  public resultActive(value: boolean) {
    this.resultActiveSubject.next(value);
  }

  public classifyVideo() {
    this.classifyVideoSubject.next();
  }

  public createSegmentation(data: VisualizationData) {
    this.createSegmentationSubject.next(data);
  }

  /**
   * true: startWebcamStream
   * false: stopWebcamStream
   */
  public controlWebcamStream(start: boolean) {
    this.controlWebcamStreamSubjet.next(start);
  }

  public activateHelp() {
    this.activateHelpSubjet.next();
  }

  public activateLabelsView() {
    this.activateLabelsViewSubjet.next();
  }

  public activateLoadingScreen(info: LoadingScreenInfo) {
    this.activateLoadingScreenSubjet.next(info);
  }
}
