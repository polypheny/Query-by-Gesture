import { Component, OnInit } from '@angular/core';
import { ApiAccessService } from '../api-access.service';
import { CommunictaionService } from '../communictaion.service';
import { Video, SelectedVideo } from '../video-sidebar/video-sidebar.component';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface Result {
  videoName: string;
  segmentNumber: number;
  gestures: Gesture[];
}

export interface Gesture {
  name: string;
  probability: number;
}

export interface Labels {
  list: Label[];
}

export interface Label {
  name: string;
}

@Component({
  selector: 'app-result-sidebar',
  templateUrl: './result-sidebar.component.html',
  styleUrls: ['./result-sidebar.component.scss']
})
export class ResultSidebarComponent implements OnInit {
  public results: Result[];
  public videos: Video[];
  public labels: Labels;
  public labelsList: string[];
  private feedbackGesture: Result[];
  private feedbackSegmentation: Video;
  public selectedVideo: SelectedVideo;

  public expandedPanel: number;

  public resultActive: boolean;
  public resultThreshold: number;
  public streamResultActive: boolean;
  private streamStopped: boolean;
  public expertMode: boolean;
  public videoSelected: boolean;
  public classifying: boolean;

  public myControl: FormControl[];
  public filteredOptions: Observable<string[]>[];

  public feedbackValid: boolean;

  constructor(private communicationService: CommunictaionService) { }

  /**
   * Seconds into HH:MM:SS format
   */
  public static displayTime(seconds: number): string {
    const hours = seconds / 3600;
    const minutes = (seconds % 3600) / 60;
    seconds %= 60;

    return [hours, minutes, seconds].map(ResultSidebarComponent.format).join(':');
  }

  private static format(val: number) {
    return ('0' + Math.floor(val)).slice(-2);
  }

  /**
   * HH:MM:SS format into seconds
   */
  private static toSeconds(time: string): number {
    const reg = new RegExp('(?:[01]\\d|2[0123]):(?:[012345]\\d):(?:[012345]\\d)');
    let seconds = -1;
    if (reg.test(time)) {
      seconds = 0;
      seconds += parseInt(time.substring(0, 2), 10) * 3600;
      seconds += parseInt(time.substring(3, 5), 10) * 60;
      seconds += parseInt(time.substring(6, 8), 10);
    }
    return seconds;
  }

  ngOnInit() {
    this.results = [];
    this.videos = [];
    this.labelsList = [];
    this.feedbackGesture = [];
    this.feedbackSegmentation = {} as Video;
    this.expandedPanel = -1;
    this.resultThreshold = 10;
    this.resultActive = false;
    this.streamResultActive = false;
    this.streamStopped = false;
    this.expertMode = false;
    this.videoSelected = false;
    this.classifying = false;
    this.feedbackValid = true;

    ApiAccessService.resultReadyObservable.subscribe((selectedVideo) => {
      // click video -> videoSelected -> classifyVideo -> wait till result ready -> resultReady -> visualize result
      if (this.selectedVideo.segmentNumber === -1) {
        if (this.results.length + 1 === this.getVideo(this.selectedVideo.video.videoName).segments.length) {
          this.classifying = false;
          this.communicationService.activateLoadingScreen({active: false, mode: 1});
        }
      } else {
        this.classifying = false;
        this.communicationService.activateLoadingScreen({active: false, mode: 1});
      }
      this.visualizeResult(selectedVideo.video.videoName, selectedVideo.segmentNumber);
    });

    ApiAccessService.streamResultReadyObservable.subscribe((result) => {
      if (!this.streamStopped) {
        this.streamResultActive = true;
        this.setExpandedPanel(0);
        this.results = [result];
      }
    });

    this.communicationService.controlWebcamStreamObservable.subscribe((start) => {
      if (!start) {
        this.streamStopped = true;
        this.streamResultActive = false;
        this.setExpandedPanel(-1);
        this.results = [];
      } else {
        this.streamStopped = false;
      }
    });

    ApiAccessService.labelsReadyObservable.subscribe((labels) => {
      this.labels = labels;
      this.labels.list.forEach(element => {
        this.labelsList.push(element.name);
      });
      this.labelsList.sort((a, b) => {
        return (a).localeCompare(b);
      });
    });

    this.communicationService.videoSelectedObservable.subscribe((selectedVideo) => {
      this.resultActive = false;
      this.communicationService.resultActive(false);
      this.videoSelected = true;
      this.selectedVideo = selectedVideo;
      this.results = [];
      this.feedbackGesture = [];
      this.feedbackSegmentation = {} as Video;
      if (!this.resultAvaible(selectedVideo.video.videoName, selectedVideo.segmentNumber)) {
        this.expertMode = false;
      }
      this.setExpandedPanel(-1);
      if (selectedVideo.segmentNumber !== -1) {
        setTimeout(() => this.setExpandedPanel(0), 500);
      }
    });

    this.communicationService.videoAddedObservable.subscribe((video) => {
      this.videos.push(video);
    });

    this.communicationService.startRecordingModeObservable.subscribe(() => {
      this.resultActive = false;
      this.communicationService.resultActive(false);
      this.videoSelected = false;
      this.expertMode = false;
      this.selectedVideo = {} as SelectedVideo;
      this.results = [];
      this.feedbackGesture = [];
      this.feedbackSegmentation = {} as Video;
    });

    this.communicationService.classifyVideoObservable.subscribe(() => {
      this.classifying = true;
      this.communicationService.activateLoadingScreen({active: true, mode: 1});
      this.classifyVideo(this.selectedVideo);
    });
  }

  /**
   * Sends request for classification via ApiAccessService
   */
  public classifyVideo(selectedVideo: SelectedVideo): void {
    if (selectedVideo.segmentNumber === -1) {
      this.getVideo(selectedVideo.video.videoName).segments.forEach((element, index) => {
        ApiAccessService.requestClassification({video: selectedVideo.video, segmentNumber: index});
      });
    } else {
      ApiAccessService.requestClassification(selectedVideo);
    }
  }

  /**
   * Visualizes the result of the active video
   */
  private visualizeResult(videoName: string, segmentNumber: number) {
    this.results.push(ApiAccessService.getResult(videoName, segmentNumber));
    this.results.sort((a, b) => {
      return (a.segmentNumber) - (b.segmentNumber);
    });
    this.results.forEach(element => {
      element.gestures.sort((a, b) => {
        return (b.probability) - (a.probability);
      });
    });
    this.resultActive = true;
    this.communicationService.resultActive(true);
    this.createFeedback(videoName, segmentNumber);
    this.filteredOptions = [];
    this.myControl = [];
    let option: Observable<string[]>;
    this.results.forEach((element, index) => {
      this.myControl.push(new FormControl());
      option = this.myControl[index].valueChanges.pipe(
        startWith(''),
        map(value => this._filter(value))
      );
      this.filteredOptions.push(option);
    });
  }

  /**
   * Instance method that calls the static displayTime function
   */
  public displayTime2(seconds: number) {
    return ResultSidebarComponent.displayTime(seconds);
  }

  public displayTimeSE(start: number, end: number) {
    return ResultSidebarComponent.displayTime(start) + ' - ' + ResultSidebarComponent.displayTime(end);
  }

  /**
   * Check if results are present to display
   * if avaible:
   *   visualize them.
   * Else
   *   show classification button
   */
  private resultAvaible(videoName: string, segmentNumber: number): boolean {
    let isAvaible = true;
    if (segmentNumber === -1) {
      this.getVideo(videoName).segments.forEach((element, index) => {
        if (ApiAccessService.getResult(videoName, index) == null) {
          isAvaible = false;
        }
      });
    } else {
      if (ApiAccessService.getResult(videoName, segmentNumber) == null) {
        isAvaible = false;
      }
    }
    if (isAvaible) {
      if (segmentNumber === -1) {
        this.getVideo(videoName).segments.forEach((element, index) => {
          this.visualizeResult(videoName, index);
        });
      } else {
        this.visualizeResult(videoName, segmentNumber);
      }
    }
    return isAvaible;
  }

  /**
   * Creates feedback object
   */
  private createFeedback(videoName: string, segmentNumber: number) {
    const res = {} as Result;
    let gestureName = '';
    this.results.forEach(element => {
      if (element.segmentNumber === segmentNumber) {
        gestureName = element.gestures[0].name;
      }
    });
    res.videoName = videoName;
    res.segmentNumber = segmentNumber;
    res.gestures = [];
    res.gestures.push({name: gestureName, probability: 100});
    this.feedbackGesture.push(res);
    this.feedbackSegmentation = JSON.parse(JSON.stringify(this.getVideo(videoName)));
  }

  /**
   * Changes feedback gesture
   */
  public changeGesture(gesture: Event, segmentNumber: number) {
    this.feedbackGesture[segmentNumber].gestures[0].name = (gesture.target as HTMLInputElement).value;
    this.setFeedbackValid();
  }

  /**
   * Changes feedback start time
   */
  public changeStartTime(start: Event, segmentNumber: number) {
    const seconds = ResultSidebarComponent.toSeconds((start.target as HTMLInputElement).value);
    this.feedbackSegmentation.segments[segmentNumber].start = seconds;
    this.setFeedbackValid();
  }

  /**
   * Changes feedback end time
   */
  public changeEndTime(end: Event, segmentNumber: number) {
    const seconds = ResultSidebarComponent.toSeconds((end.target as HTMLInputElement).value);
    this.feedbackSegmentation.segments[segmentNumber].end = seconds;
    this.setFeedbackValid();
  }

  /**
   * Sends the feedback to the backend via ApiAccessService
   */
  public sendFeedback() {
    ApiAccessService.sendFeedbackSegmentation(this.feedbackSegmentation);
    this.feedbackGesture.forEach(element => {
      ApiAccessService.sendFeedbackGesture(element);
      if (!this.labelsList.includes(element.gestures[0].name)) {
        this.addLabel(element.gestures[0].name);
      }
    });
    alert('The feedback was sent successfully!');
  }

  /**
   * Sets video player time
   */
  public setVideoPlayerTime(videoName: string, segmentNumber: number) {
    if (!this.streamResultActive) {
      const time: number = this.getVideo(videoName).segments[segmentNumber].start;
      this.communicationService.setVideoTime(time);
    }
  }

  /**
   * Returns the specified video object
   */
  public getVideo(videoName: string): Video {
    let video: Video = {} as Video;
    this.videos.forEach(element => {
      if (element.videoName === videoName) {
        video = element;
      }
    });
    return video;
  }

  /**
   * Adds a new label to the list
   */
  public addLabel(label: string) {
    this.labels.list.push({name: label});
    this.labelsList.push(label);
    this.labelsList.sort((a, b) => {
      return (a).localeCompare(b);
    });
    ApiAccessService.addLabel(this.labels);
  }

  /**
   * Returns a sorted list of all labels. The first entries are the ones that occure in the result
   */
  public sortLabels(result: Result) {
    let sortedLabels: string[] = [];
    result.gestures.forEach(element => {
      sortedLabels.push(element.name);
    });
    this.labels.list.forEach(element => {
      sortedLabels.push(element.name);
    });
    sortedLabels = Array.from(new Set(sortedLabels));
    this.labelsList = sortedLabels;
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.labelsList.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  /**
   * Sets the number of the currently expanded panel in the results view
   */
  public setExpandedPanel(i: number) {
    this.expandedPanel = i;
  }

  /**
   * Checks if the current feedbak is valid
   */
  private setFeedbackValid() {
    this.feedbackValid = true;
    this.feedbackGesture.forEach(element => {
      if (!element.gestures[0].name.replace(/\s/g, '').length) {
        this.feedbackValid = false;
      }
    });
    this.feedbackSegmentation.segments.forEach(element => {
      if (Math.floor(element.end) - Math.floor(element.start) <= 0) {
        this.feedbackValid = false;
      }
      if (element.start === -1 || element.end === -1) {
        this.feedbackValid = false;
      }
      if (element.end > this.feedbackSegmentation.videoDuration) {
        this.feedbackValid = false;
      }
    });
  }
}
