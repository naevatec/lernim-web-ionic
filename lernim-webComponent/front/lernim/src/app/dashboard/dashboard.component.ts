import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  public roomForm: FormGroup;
  public version = require('../../../package.json').version;

  constructor(private router: Router, public formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.roomForm = this.formBuilder.group({
      userName: [this.generateName(), Validators.compose([this.whitespacesValidation])],
      roomName: ['SessionA', Validators.compose([this.whitespacesValidation])],
      isTeacher: [false, Validators.compose([])]
    });
  }

  /**
   * Validates the inputs to check that they do not have whitespaces.
   */
  private whitespacesValidation(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value;
    const position = value.indexOf(' ');

    if (position >= 0) {
      return {key: 'Parameters don\'t allow whitespaces inside'};
    } else {
      return null;
    }
  }

  public goToVideoCall() {
    if (this.roomForm.valid) {
      const userName = this.roomForm.value.userName;
      const roomName = this.roomForm.value.roomName;
      const role = this.roomForm.value.isTeacher ? 't' : 's';

      this.router.navigate(['/', role, roomName, userName]);
    }
  }

  // NAME GENERATOR -----------------------------------------------------------


  private nouns = ['adamant',
    'adroit',
    'amatory',
    'animistic',
    'antic',
    'arcadian',
    'baleful',
    'bellicose',
    'bilious',
    'boorish',
    'calamitous',
    'caustic',
    'cerulean',
    'comely',
    'concomitant',
    'contumacious',
    'corpulent',
    'crapulous',
    'defamatory',
    'didactic',
    'dilatory',
    'dowdy',
    'efficacious',
    'effulgent',
    'egregious',
    'endemic',
    'equanimous',
    'execrable',
    'fastidious',
    'feckless',
    'fecund',
    'friable',
    'fulsome',
    'garrulous',
    'guileless',
    'gustatory',
    'heuristic',
    'histrionic',
    'hubristic',
    'incendiary',
    'insidious',
    'insolent',
    'intransigent',
    'inveterate',
    'invidious',
    'irksome',
    'jejune',
    'jocular',
    'judicious',
    'lachrymose',
    'limpid',
    'loquacious',
    'luminous',
    'mannered',
    'mendacious',
    'meretricious',
    'minatory',
    'mordant',
    'munificent',
    'nefarious',
    'noxious',
    'obtuse',
    'parsimonious',
    'pendulous',
    'pernicious',
    'pervasive',
    'petulant',
    'platitudinous',
    'precipitate',
    'propitious',
    'puckish',
    'querulous',
    'quiescent',
    'rebarbative',
    'recalcitant',
    'redolent',
    'rhadamanthine',
    'risible',
    'ruminative',
    'sagacious',
    'salubrious',
    'sartorial',
    'sclerotic',
    'serpentine',
    'spasmodic',
    'strident',
    'taciturn',
    'tenacious',
    'tremulous',
    'trenchant',
    'turbulent',
    'turgid',
    'ubiquitous',
    'uxorious',
    'verdant',
    'voluble',
    'voracious',
    'wheedling',
    'withering',
    'zealous'];

  generateName() {
    const i = Math.floor(Math.random() * this.nouns.length);
    return this.nouns[i] + '-user';
  }
}
