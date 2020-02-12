import { Component, OnInit } from '@angular/core';
import { CommunictaionService } from './communictaion.service';
import { ApiAccessService } from './api-access.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public helpActive: boolean;
  public loadingScreenActive: boolean;
  public labelsViewActive: boolean;
  public loadingText: string;
  private mode0Text: string;
  private mode1Text: string;

  public labels: string[];
  public startingLetters: string[];

  constructor(private communicationService: CommunictaionService) { }

  ngOnInit() {
    this.helpActive = false;
    this.loadingScreenActive = false;
    this.labelsViewActive = false;

    this.mode0Text = 'Segmenting...';
    this.mode1Text = 'Classifying...';

    this.startingLetters = [];
    this.labels = [];

    ApiAccessService.requestLabels();

    ApiAccessService.labelsReadyObservable.subscribe((labels) => {
      labels.list.forEach(element => {
        this.labels.push(element.name);
      });
      this.labels.sort((a, b) => {
        return (a).localeCompare(b);
      });

      this.labels.forEach(element => {
        if (!this.startingLetters.includes(element.charAt(0).toUpperCase())) {
          this.startingLetters.push(element.charAt(0).toUpperCase());
        }
      });
    });

    this.communicationService.reloadAppObservable.subscribe(() => {
      this.reloadApp();
    });

    this.communicationService.activateHelpObservable.subscribe(() => {
      this.helpActive = true;
    });

    this.communicationService.activateLabelsViewObservable.subscribe(() => {
      this.labelsViewActive = true;
    });

    this.communicationService.activateLoadingScreenObservable.subscribe((info) => {
      this.loadingScreenActive = info.active;
      if (info.active) {
        if (info.mode === 0) {
          this.loadingText = this.mode0Text;
        } else {
          this.loadingText = this.mode1Text;
        }
      }
    });
  }

  /**
   * Reloads whole UI
   */
  private reloadApp() {
    location.reload();
  }

  /**
   * Exits the help window
   */
  public deactivateHelp() {
    this.helpActive = false;
  }

  /**
   * Exits the labels view
   */
  public deactivateLabelsView() {
    this.labelsViewActive = false;
  }

  /**
   * Returns a list of all labels starting with a specified letter
   */
  public labelsWithLetter(letter: string): string[] {
    const list = [];
    this.labels.forEach(element => {
      if (letter.toLocaleUpperCase() === element.charAt(0).toLocaleUpperCase()) {
        list.push(element);
      }
    });
    return list;
  }
}
