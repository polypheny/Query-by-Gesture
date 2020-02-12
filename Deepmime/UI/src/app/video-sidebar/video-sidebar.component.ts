import { Component, OnInit } from '@angular/core';
import { ApiAccessService } from '../api-access.service';
import { CommunictaionService } from '../communictaion.service';
import { VisualizationData } from '../video-visualization/video-visualization.component';
import { ResultSidebarComponent } from '../result-sidebar/result-sidebar.component';

export interface Video {
  videoName: string;
  videoDuration: number;
  segments: Segment[];
}

export interface Segment {
  start: number;
  end: number;
}

export interface SelectedVideo {
  video: Video;
  segmentNumber: number;
}

@Component({
  selector: 'app-video-sidebar',
  templateUrl: './video-sidebar.component.html',
  styleUrls: ['./video-sidebar.component.scss'],
})
export class VideoSidebarComponent implements OnInit {
  public videos: Video[];
  private videoExpanded: boolean;
  private videoExpandedName: string;

  constructor(private communicationService: CommunictaionService) { }

  ngOnInit() {
    this.videos = [];
    this.videoExpanded = false;
    this.videoExpandedName = '';

    ApiAccessService.segmentationReadyObservable.subscribe((videoName) => {
      this.communicationService.activateLoadingScreen({active: false, mode: 0});
      this.createSegmentationElements(videoName);
    });

    this.communicationService.uploadRecordingObservable.subscribe((blob) => {
      if (!this.checkVideo(blob.name)) {
        ApiAccessService.uploadVideo(blob, blob.name);
        this.createVideoElement(blob);
      }
    });

    this.communicationService.createSegmentationObservable.subscribe((input) => {
      this.communicationService.activateLoadingScreen({active: true, mode: 0});
      this.createSegmentation(input);
    });
  }

  /**
   * When the video input object is changed the video is uploaded using the api
   */
  public inputChange(): void {
    const inputElement = document.getElementById('videoInput') as HTMLInputElement;
    if (!this.checkVideo(inputElement.files[0].name)) {
      ApiAccessService.uploadVideo(inputElement, inputElement.files[0].name);
      this.createVideoElement(inputElement);
    }
  }

  /**
   * Checks if a video name already'resultFiles/*' exists
   */
  private checkVideo(videoName: string): boolean {
    let check = false;
    this.videos.forEach(element => {
      if (element.videoName === videoName) {
        check = true;
      }
    });
    return check;
  }

  /**
   * Creates a thumbnail of the video including two buttons where the user can decide if he wants to segment the video or not
   */
  private createSegmentation(visualizationData: VisualizationData) {
    let videoName: string;
    videoName = visualizationData.videoName;
    const expandButton = document.getElementById(videoName + 'Expand');
    expandButton.style.visibility = 'visible';
    let duration = 0;
    this.videos.forEach((element) => {
      if (element.videoName === videoName) {
        element.segments = [];
        duration = element.videoDuration;
      }
    });
    ApiAccessService.requestSegmentation(videoName, duration);
    this.expandVideo(videoName);
  }


  /**
   * Creates a new video element in the sidebar on upload
   */
  private createVideoElement(input: any): void {
    let source = '';
    let videoNameParam = '';
    if (input instanceof HTMLInputElement) {
      source = URL.createObjectURL(input.files[0]);
      videoNameParam = input.files[0].name;
    } else {
      source = URL.createObjectURL(input);
      videoNameParam = input.name;
    }

    const videoContainer = document.getElementById('videoContainer');
    const videoDiv = document.createElement('div');
    const expandButton = document.createElement('mat-icon');
    const expandDiv = document.createElement('div');
    const videoElement =  document.createElement('video');
    const segmentContainer = document.createElement('div');
    const videoLabel = document.createElement('label');
    const divider = document.createElement('hr');

    videoDiv.setAttribute('class', 'videoDiv');
    videoDiv.setAttribute('id', videoNameParam + 'VideoDiv');

    expandButton.setAttribute('id', videoNameParam + 'Expand');
    expandButton.setAttribute('class', 'mat-icon notranslate material-icons mat-icon-no-color coloredIcons');
    expandButton.setAttribute('role', 'img');
    expandButton.setAttribute('aria-hidden', 'true');
    expandButton.innerHTML = 'expand_more';
    expandButton.addEventListener('click', (e: Event) => this.expandVideo(videoNameParam));
    expandButton.style.visibility = 'hidden';
    expandDiv.setAttribute('class', 'expandDiv');

    videoLabel.innerHTML = videoNameParam;

    videoElement.src = source;
    videoElement.controls = false;
    videoElement.setAttribute('id', videoNameParam + 'VideoElement');
    videoElement.setAttribute('class', 'videoDivContent videoDivThumbnail');

    segmentContainer.setAttribute('id', videoNameParam + 'SegmentContainer');
    segmentContainer.setAttribute('class', 'segmentContainer');
    segmentContainer.style.display = 'none';

    videoLabel.setAttribute('class', 'videoLabel videoDivContent');

    divider.setAttribute('class', 'videoDivider videoDivContent');

    expandDiv.appendChild(expandButton);
    expandDiv.appendChild(videoElement);
    videoDiv.appendChild(expandDiv);
    videoDiv.appendChild(segmentContainer);
    videoDiv.appendChild(videoLabel);
    videoDiv.appendChild(divider);
    videoContainer.appendChild(videoDiv);

    videoElement.preload = 'metadata';
    videoElement.onloadedmetadata = () => {

      if (videoElement.duration === Infinity) {
        videoElement.currentTime = Number.MAX_SAFE_INTEGER;
        videoElement.ontimeupdate = () => {
          videoElement.ontimeupdate = null;
          videoElement.currentTime = 0;
          let video = {} as Video;
          video = {videoName: videoNameParam, videoDuration: videoElement.duration, segments: [{start: 0, end: videoElement.duration}]};
          this.videos.push(video);
          this.communicationService.videoAdded(video);
          videoElement.addEventListener('click', (e: Event) => this.setVideo(input, source, video, 0, -1));
          this.setVideo(input, source, video, 0, -1);
        };
      } else {
        let video = {} as Video;
        video = {videoName: videoNameParam, videoDuration: videoElement.duration, segments: [{start: 0, end: videoElement.duration}]};
        this.videos.push(video);
        this.communicationService.videoAdded(video);
        videoElement.addEventListener('click', (e: Event) => this.setVideo(input, source, video, 0, -1));
        this.setVideo(input, source, video, 0, -1);
      }
    };
  }

  /**
   * Creates all segment elements for a video in the sidebar
   */
  private createSegmentationElements(videoName: string) {
    const video: Video = ApiAccessService.getSegmentation(videoName);
    this.videos.forEach((element, index) => {
      if (element.videoName === videoName) {
        this.videos.splice(index, 1);
        this.videos.push(video);
      }
    });
    const videoElement: HTMLVideoElement = document.getElementById(videoName + 'VideoElement') as HTMLVideoElement;
    this.communicationService.videoAdded(video);

    const segmentContainer = document.getElementById(videoName + 'SegmentContainer');
    video.segments.forEach((element, i) => {
      const segmentThumbnailContainer = document.createElement('div');
      segmentThumbnailContainer.setAttribute('class', 'segmentThumbnailContainer');

      const segmentElement = document.createElement('video');
      segmentElement.setAttribute('id', 'segment' + i + 'Video' + video.videoName + 'Element');
      segmentElement.setAttribute('class', 'segmentThumbnail');
      segmentElement.src = videoElement.src;
      segmentElement.currentTime = element.start + ((element.end - element.start) / 2);
      segmentElement.addEventListener('click', (e: Event) => this.setVideo(null, segmentElement.src, video, element.start, i));

      const segmentTime = document.createElement('p');
      segmentTime.setAttribute('class', 'segmentTime');
      segmentTime.innerHTML = ResultSidebarComponent.displayTime(element.start) + ' - ' + ResultSidebarComponent.displayTime(element.end);

      segmentThumbnailContainer.appendChild(segmentElement);
      segmentThumbnailContainer.appendChild(segmentTime);

      segmentContainer.appendChild(segmentThumbnailContainer);
    });
  }

  /**
   * Expands segment container of a ceratin video
   */
  private expandVideo(videoName: string) {
    this.videos.forEach(element => {
      document.getElementById(element.videoName + 'SegmentContainer').style.display = 'none';
      document.getElementById(element.videoName + 'Expand').innerHTML = 'expand_more';
    });
    if (this.videoExpanded) {
      if (this.videoExpandedName === videoName) {
        document.getElementById(videoName + 'SegmentContainer').style.display = 'none';
        document.getElementById(videoName + 'Expand').innerHTML = 'expand_more';
        this.videoExpandedName = '';
      } else {
        document.getElementById(videoName + 'SegmentContainer').style.display = 'flex';
        document.getElementById(videoName + 'Expand').innerHTML = 'expand_less';
        this.videoExpandedName = videoName;
        this.videoExpanded = !this.videoExpanded;
      }
    } else {
      document.getElementById(videoName + 'SegmentContainer').style.display = 'flex';
      document.getElementById(videoName + 'Expand').innerHTML = 'expand_less';
      this.videoExpandedName = videoName;
    }
    this.videoExpanded = !this.videoExpanded;
  }

  /**
   * Visualizes video and its classification results
   */
  private setVideo(inputParam: any, videoSource: string, videoParam: Video, time: number, segmentNumberParam: number): void {
    this.videos.forEach(element => {
      document.getElementById(element.videoName + 'VideoElement').style.backgroundColor = '';
      element.segments.forEach((segment, i) => {
        const segmentElement = document.getElementById('segment' + i + 'Video' + element.videoName + 'Element');
        if (segmentElement !== null) {
          segmentElement.style.backgroundColor = '';
        }
      });
    });
    if (segmentNumberParam !== -1) {
      document.getElementById('segment' + segmentNumberParam + 'Video' + videoParam.videoName + 'Element').style.backgroundColor = 'black';
    } else {
      document.getElementById(videoParam.videoName + 'VideoElement').style.backgroundColor = 'black';
    }
    // tslint:disable-next-line:max-line-length
    this.communicationService.visualizeVideo({videoName: videoParam.videoName, input: inputParam, source: videoSource, startTime: time, segmented: false});
    this.communicationService.videoSelected({video: videoParam, segmentNumber: segmentNumberParam});
  }

  /**
   * Opens Recording mode
   */
  public startRecordingMode() {
    this.videos.forEach(element => {
      document.getElementById(element.videoName + 'VideoElement').style.backgroundColor = '';
      element.segments.forEach((segment, i) => {
        const segmentElement = document.getElementById('segment' + i + 'Video' + element.videoName + 'Element');
        if (document.getElementById('segment' + i + 'Video' + element.videoName + 'Element') !== null) {
          segmentElement.style.backgroundColor = '';
        }
      });
    });
    this.communicationService.startRecordingMode();
  }

  /**
   * Reloads the app -> deletes all video and result files at the backend
   */
  public reloadApp() {
    ApiAccessService.deleteFolderContent('resultFiles/*');
    ApiAccessService.deleteFolderContent('videoFiles/*');
    ApiAccessService.deleteFolderContent('segmentFiles/*');
    ApiAccessService.deleteFolderContent('streamFiles/*');
    this.communicationService.reloadApp();
  }

  /**
   * Activates help view
   */
  public activateHelp() {
    this.communicationService.activateHelp();
  }

  /**
   * Activates labels view
   */
  public activateLabelsView() {
    this.communicationService.activateLabelsView();
  }
}
