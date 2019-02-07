import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError as observableThrowError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpenViduService {
  URL_OV: string;
  MY_SECRET: string;

  constructor(private httpClient: HttpClient) {}

  getToken(mySessionId: string, openviduServerUrl: string , openviduSecret: string): Promise<string> {
    return this.getCredentials().then(() => {
      const ov_url = openviduServerUrl !== undefined ? openviduServerUrl : this.URL_OV;
      const ov_secret = openviduSecret !== undefined ? openviduSecret : this.MY_SECRET;
      return this.createSession(mySessionId, ov_url, ov_secret).then((sessionId: string) => {
          return this.createToken(sessionId, ov_url, ov_secret);
      });
    });
  }

  getOnlyToken(mySessionId: string, openviduServerUrl: string , openviduSecret: string): Promise<string> {
    return this.getCredentials().then(() => {
      const ov_url = openviduServerUrl !== undefined ? openviduServerUrl : this.URL_OV;
      const ov_secret = openviduSecret !== undefined ? openviduSecret : this.MY_SECRET;
      return this.createToken(mySessionId, ov_url, ov_secret);
    });
  }

  createSession(sessionId: string, openviduServerUrl: string, openviduSecret: string) {
    return new Promise((resolve, reject) => {

      const body = JSON.stringify({ customSessionId: sessionId });
      const options = {
        headers: new HttpHeaders({
          Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + openviduSecret),
          'Content-Type': 'application/json',
        })
      };
      return this.httpClient.post<any>(openviduServerUrl + '/api/sessions', body, options)
        .pipe(
          catchError(error => {
            if (error.status === 409) {
              resolve(sessionId);
          } else {
              console.warn(
                  'No connection to OpenVidu Server. This may be a certificate error at ' + openviduServerUrl,
              );
              if (
                  window.confirm(
                      'No connection to OpenVidu Server. This may be a certificate error at "' + openviduServerUrl +
                      '"\n\nClick OK to navigate and accept it. If no certificate warning is shown, then check that your OpenVidu Server' +
                      'is up and running at "' +
                      openviduServerUrl +
                      '"',
                  )
              ) {
                  location.assign(openviduServerUrl + '/accept-certificate');
              }
          }
          return observableThrowError(error);
      }),
  )
        .subscribe(response => {
          console.log(response);
          resolve(response['id']);
        });
    });
  }

  createToken(sessionId: string, openviduServerUrl: string, openviduSecret: string): Promise<string> {
    return new Promise((resolve, reject) => {

      const body = JSON.stringify({ session: sessionId });
      const options = {
        headers: new HttpHeaders({
          Authorization: 'Basic ' + btoa('OPENVIDUAPP:' + openviduSecret),
          'Content-Type': 'application/json',
        })
      };
      return this.httpClient.post<any>(openviduServerUrl + '/api/tokens', body, options)
        .pipe(
          catchError(error => {
            reject(error);
            return observableThrowError(error);
          })
        )
        .subscribe(response => {
          console.log(response);
          resolve(response['token']);
        });
    });
  }

  private getCredentials(): Promise<any> {
    return new Promise((resolve) => {
      console.warn('Credentials file not found ');
      if (environment.openvidu_url) {
        console.warn('Getting from environment ');
        this.URL_OV = environment.openvidu_url;
        this.MY_SECRET = environment.openvidu_secret;
      } else {
        console.warn('Getting default data ');
        this.URL_OV = 'https://' + location.hostname + ':4443';
        this.MY_SECRET = 'MY_SECRET';
      }
      console.log('URL Environment', this.URL_OV);
      resolve();
    });
  }
}

