import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'email-manager';
  emailAddresses = [
    {email: 'iron.man@avengers.net', invalid: false},
    {email: 'stephen.strange@avengers.net', invalid: false},
    {email: 'black.widow', invalid: false},
    {email: 'black.widow2@avengers.net', invalid: false},
    {email: 'black.widow3@avengers.net', invalid: false},
    {email: 'black.widow4@avengers', invalid: false},
  ]
  formGroup: FormGroup;

  constructor() {}

  ngOnInit() {
    const formArr = new FormArray([]);
    this.emailAddresses.forEach((addr) => {
      const fg = new FormGroup({
        email: new FormControl(addr.email, [Validators.email]),
        invalid: new FormControl(addr.invalid)
      });
      fg.updateValueAndValidity();
      fg.get('invalid').setValue(fg.invalid);
      formArr.push(fg as FormGroup);
    });
    console.log('emailAddresses fa=', formArr);
    this.formGroup = new FormGroup({
      addresses: formArr
    });
  }

  get formArray() {
    return this.formGroup?.get('addresses') as FormArray;
  }

  /**
   * Should return true if invalid
   * @param emailAddress
   */
  jsEmailValidator(emailAddress: string) {
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    const properFormat = !emailRegex.test(emailAddress);
    const isAvengers = !emailAddress.includes('avengers.net');
    return properFormat === true && isAvengers === true;
  }
}
