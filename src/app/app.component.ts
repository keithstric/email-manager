import {Component, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {EmailManagerAddress} from 'src/app/email-manager/email-manager.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'email-manager';
  emailAddresses = [
    {email: 'iron.man@avengers.net', invalid: false},
    {email: 'dr.strange@avengers.net', invalid: false},
    {email: 'black.widow', invalid: false},
    {email: 'black.widow@avengers.net', invalid: false},
    {email: 'ant.man@avengers.net', invalid: false},
    {email: 'hulk@avengers', invalid: false},
    {email: 'thor@avengers.com', invalid: false},
    {email: 'the.collector@knowhere.net', invalid: false},
    {email: 'loki@asgard.gov', invalid: false},
    {email: 'scarlet.witch@avengers.net', invalid: false},
    {email: 'vision@avengers.net', invalid: false},
    {email: 'pepper.potts@stark.com', invalid: false},
    {email: 'captain.marvel@avengers.net', invalid: false},
    {email: 'nick.fury@shield.com', invalid: false},
    {email: 'phil.coulson@shield.com', invalid: false},
    {email: 'captain.america@avengers.net', invalid: false},
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

  sortAddresses(addr1: EmailManagerAddress, addr2: EmailManagerAddress) {
    const a = addr1.email;
    const b = addr2.email;
    return a > b ? 1 : a < b ? -1 : 0;
  }
}
