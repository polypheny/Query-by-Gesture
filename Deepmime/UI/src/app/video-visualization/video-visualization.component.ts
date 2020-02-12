import { Component, OnInit } from '@angular/core';
import { CommunictaionService } from '../communictaion.service';
import * as RecordRTC from 'recordrtc';
import { ApiAccessService } from '../api-access.service';

export interface VisualizationData {
  videoName: string;
  input: any;
  source: string;
  startTime: number;
  segmented: boolean;
}

@Component({
  selector: 'app-video-visualization',
  templateUrl: './video-visualization.component.html',
  styleUrls: ['./video-visualization.component.scss']
})
export class VideoVisualizationComponent implements OnInit {
  private videoPlayer: HTMLVideoElement;
  public visualizationData: VisualizationData[];
  public currentVisualization: number;
  public currentVisualizationSegmented: boolean;
  private recorder;
  public currentRecordingBlob;
  public recordingMode: boolean;
  public isRecording: boolean;
  public recordingReady: boolean;
  public videoSelected: boolean;
  public resultActive: boolean;
  public isStreaming: boolean;
  public classifying: boolean;

  constructor(private communicationService: CommunictaionService) { }

  ngOnInit() {
    this.videoPlayer = document.getElementById('videoPlayer') as HTMLVideoElement;
    this.videoPlayer.style.display = 'none';
    this.visualizationData = [];
    this.currentVisualization = -1;
    this.currentVisualizationSegmented = false;
    this.currentRecordingBlob = null;
    this.recordingMode = false;
    this.isRecording = false;
    this.recordingReady = false;
    this.videoSelected = false;
    this.resultActive = false;
    this.isStreaming = false;
    this.classifying = false;

    this.communicationService.visualizeVideoObservable.subscribe((visualizationData: VisualizationData) => {
      this.currentRecordingBlob = null;
      this.recordingMode = false;
      this.isRecording = false;
      this.recordingReady = false;
      const index = this.checkVisualization(visualizationData.videoName);
      if (index === -1) {
        this.visualizationData.push(visualizationData);
        this.currentVisualization = this.visualizationData.length - 1;
      } else {
        this.currentVisualization = index;
      }
      this.setCurrentVisualizationSegmented();
      this.setVideoPlayer(visualizationData);
      this.videoSelected = true;
    });

    this.communicationService.setVideoTimeObservable.subscribe((time: number) => {
      this.videoPlayer.currentTime = time;
    });

    this.communicationService.startRecordingModeObservable.subscribe(() => {
      this.recordingMode = true;
      this.currentVisualization = -1;
      this.currentVisualizationSegmented = true;
      this.videoSelected = false;
      this.initializeRecorder();
    });

    this.communicationService.resultActiveObservable.subscribe((value: boolean) => {
      this.resultActive = value;
    });

    ApiAccessService.resultReadyObservable.subscribe((seletedVideo) => {
      this.classifying = false;
    });

    this.communicationService.classifyVideoObservable.subscribe(() => {
      this.classifying = true;
    });
  }

  /**
   * Request classification of a video
   */
  public classifyVideo() {
    this.communicationService.classifyVideo();
  }

  /**
   * Sets a video player for a specified video
   */
  public setVideoPlayer(visualizationData: VisualizationData) {
    this.videoPlayer.style.display = 'block';

    this.videoPlayer.srcObject = null;
    this.videoPlayer.src = visualizationData.source;
    this.videoPlayer.currentTime = visualizationData.startTime;
    this.videoPlayer.controls = true;
    this.videoPlayer.setAttribute('class', 'videoPlayer');
  }

  /**
   * Sets the video player object source for displaying the webcam stream
   */
  public setVideoPlayerStream(source) {
    this.videoPlayer.style.display = 'block';
    this.videoPlayer.srcObject = source;
    this.videoPlayer.controls = false;
  }

  /**
   * Sets up the recorder object for recording the webam stream
   */
  public initializeRecorder() {
    this.isRecording = false;
    this.currentRecordingBlob = null;
    this.recordingReady = false;
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then(async (stream) => {
      this.recorder = RecordRTC(stream, {
          type: 'video'
      });
      this.setVideoPlayerStream(stream);
      this.videoPlayer.play();
    });
  }

  public startRecording() {
    this.isRecording = true;
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    }).then(async (stream) => {
      this.recorder = RecordRTC(stream, {
          type: 'video',
      });
      this.recorder.startRecording();
    });
    setTimeout(() => {
      const stopButton = document.getElementById('stopButton') as HTMLButtonElement;
      stopButton.disabled = false;
    }, 1000);
  }

  public stopRecording() {
    this.recordingReady = true;
    this.isRecording = false;
    this.recorder.stopRecording(() => {
      const blob = this.recorder.getBlob();
      blob.name = Date.now() + '.webm';
      this.currentRecordingBlob = blob;
      this.videoPlayer.srcObject = null;
      this.videoPlayer.controls = true;
      this.videoPlayer.src = URL.createObjectURL(blob);
    });
  }

  public uploadRecording() {
    if (this.currentRecordingBlob != null) {
      this.communicationService.uploadRecording(this.currentRecordingBlob);
      this.initializeRecorder();
    }
  }

  /**
   * Requests the segmentation of a video
   */
  public segmentVideo() {
    this.setSegmentation(this.visualizationData[this.currentVisualization], true);
    this.currentVisualizationSegmented = true;
    this.communicationService.createSegmentation(this.visualizationData[this.currentVisualization]);
  }

  /**
   * Checks if there the specified data for the visualization is already safed
   * returns -1 if not
   */
  private checkVisualization(videoName: string): number {
    let index = -1;
    this.visualizationData.forEach((element, i) => {
      if (element.videoName === videoName) {
        index = i;
      }
    });
    return index;
  }

  /**
   * Changes segmentation information on a visualization instance
   */
  private setSegmentation(visualizationData: VisualizationData, value: boolean) {
    this.visualizationData.forEach(element => {
      if (element.videoName === visualizationData.videoName) {
        element.segmented = value;
      }
    });
  }


  /**
   * Checks if current visualization is segmented
   */
  public setCurrentVisualizationSegmented() {
    if (this.currentVisualization !== -1 && this.visualizationData.length !== 0) {
      this.currentVisualizationSegmented = this.visualizationData[this.currentVisualization].segmented;
    } else {
      this.currentVisualizationSegmented = false;
    }
  }

  /**
   * Takes a snapshot of the videoplayer and returns the dataURI to the newly created image
   */
  private getSnapshot(): Blob {
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = this.videoPlayer.videoWidth;
    canvas.height = this.videoPlayer.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.videoPlayer, 0, 0, canvas.width, canvas.height);

    const dataURI = canvas.toDataURL('image/jpeg');

    const arr = dataURI.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
  }

  /**
   * Sends single frames from the webcam to the backend
   */
  public streamWebcam(fps: number) {
    this.communicationService.controlWebcamStream(true);
    const timeout = Math.round(1000 / fps);
    this.isStreaming = true;
    let frameNumber = 0;
    const func = () => {
      if (this.isStreaming) {
        ApiAccessService.stream(this.getSnapshot(), frameNumber);
        frameNumber++;
        setTimeout(func, timeout);
      }
    };
    func();
  }

  /**
   * Stops streaming video and delets all image files from backend
   */
  public stopStreamWebcam() {
    this.isStreaming = false;
    this.communicationService.controlWebcamStream(false);
    ApiAccessService.deleteFolderContent('streamFiles/*');
  }
}
