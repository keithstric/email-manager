import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';

export interface EmailManagerAddress {
  email: string;
  invalid: boolean;
}

@Component({
  selector: 'app-email-manager',
  templateUrl: './email-manager.component.html',
  styleUrls: ['./email-manager.component.scss']
})
export class EmailManagerComponent implements OnInit, OnDestroy, AfterViewInit {
  /** A Reactive forms FormArray element, include any validators in the FormArray items */
  @Input() formArrayControl: FormArray;
  /** should return true if invalid **/
  @Input() validator: (emailAddress: string) => boolean;
  /** The number of email addresses to display */
  @Input() emailDisplayCount: number = 15;
  /** Set to true to show a separate container of invalid addresses */
  @Input() showInvalidContainer: boolean = false;
  /** Set to true to hide the input field */
  @Input() displayOnly: boolean = false;
  /** Array of email addresses */
  @Input() allAddresses: EmailManagerAddress[] = [];
  /** The label to show above the all addresses container */
  @Input() allContainerLabel: string = '';
  /** The label to show above the valid addresses container */
  @Input() validContainerLabel: string = 'Valid Email Addresses';
  /** The label to show above the invalid addresses container */
  @Input() invalidContainerLabel: string = 'Invalid Email Addresses';
  /** Set to true to not add a duplicate addresses and display an error if attempted */
  @Input() preventDuplicates: boolean = false;

  @Output() addEvt: EventEmitter<string> = new EventEmitter<string>();
  @Output() deleteEvt: EventEmitter<string> = new EventEmitter<string>();
  @Output() editEvt: EventEmitter<string> = new EventEmitter<string>();
  @Output() invalidEvt: EventEmitter<string> = new EventEmitter<string>();
  @Output() dupeAddedEvt: EventEmitter<string> = new EventEmitter<string>();

  private _formArrayListener: Subscription;
  dupeMsg: string = '';

  @ViewChild('inputElement') inputEl: ElementRef<HTMLInputElement>;

  constructor() { }

  ngOnInit(): void {
    if (this.formArrayControl) {
      this._listenToFormArray();
    }
    const allAddrs = this.formArrayControl ? this.formArrayControl.value : this.allAddresses;
    this.allAddresses = this._parseAddresses(allAddrs);
  }

  ngAfterViewInit() {
    if (!this.displayOnly) {
      this.inputEl.nativeElement.addEventListener('keyup', this._keyupListener.bind(this));
    }
  }

  ngOnDestroy() {
    this._formArrayListener?.unsubscribe();
  }

  get validAddresses() {
    const addrs = this.formArrayControl ? this.formArrayControl.value : this.allAddresses;
    return addrs.filter(addr => !addr.invalid);
  }

  get invalidAddresses() {
    const addrs = this.formArrayControl ? this.formArrayControl.value : this.allAddresses;
    return addrs.filter(addr => addr.invalid);
  }

  private _listenToFormArray() {
    if (!this._formArrayListener) {
      this._formArrayListener = this.formArrayControl?.valueChanges
        .subscribe((newValue: EmailManagerAddress[]) => {
          this.allAddresses = newValue;
        });
    }
  }

  private _parseAddresses(addresses: EmailManagerAddress[]) {
    if (addresses?.length) {
      return addresses.map((addr, idx) => {
        return {
          email: addr.email,
          invalid: this.formArrayControl ? this.formArrayControl.at(idx)?.invalid : this.validate(addr.email)
        }
      });
    }
    return addresses;
  }

  private _keyupListener(evt: KeyboardEvent) {
    this.dupeMsg = '';
    if (evt.keyCode === 188 || evt.keyCode === 32 || evt.keyCode === 13) {
      let email = this.inputEl.nativeElement.value;
      if (evt.keyCode !== 13) {
        email = email.substr(0, email.length - 1);
      }
      this.addAddress(email);
      this.inputEl.nativeElement.value = '';
    }
  }

  addAddress(emailAddress: string) {
    if (emailAddress) {
      const dupe = !!this.allAddresses.find(addr => addr.email === emailAddress);
      const isDupe = this.preventDuplicates && dupe;
      const newAddr = {
        email: emailAddress,
        invalid: this.validate(emailAddress)
      };
      if (!isDupe) {
        if (this.formArrayControl) {
          const newFg = new FormGroup({
            email: new FormControl(emailAddress, [Validators.email]),
            invalid: new FormControl(false)
          })
          newFg.updateValueAndValidity();
          newFg.get('invalid').setValue(newFg.invalid);
          this.formArrayControl.push(newFg);
        } else {
          this.allAddresses.push(newAddr);
        }
      }
      if (isDupe) {
        this.dupeAddedEvt.emit(emailAddress);
        this.dupeMsg = `${emailAddress} is a duplicate and was not added!`;
      }
      this.addEvt.emit(emailAddress);
      this.inputEl.nativeElement.value = '';
    }
  }

  getEntry(address: EmailManagerAddress, list: EmailManagerAddress[] = this.allAddresses) {
    let foundIdx = -1;
    const email = list.find((addr, idx) => {
      if (addr.email === address.email) {
        foundIdx = idx;
        return true;
      }
      return false;
    });
    return {idx: foundIdx, email};
  }

  onDeleteAddress(evt: MouseEvent, address: EmailManagerAddress) {
    evt.stopPropagation();
    const foundInAll = this.getEntry(address);
    if (foundInAll?.idx > -1) {
      this.allAddresses.splice(foundInAll.idx, 1);
      if (this.formArrayControl) {
        this.formArrayControl.removeAt(foundInAll.idx);
      }
      this.deleteEvt.emit(foundInAll.email.email);
    }
  }

  validate(emailAddress: string) {
    if (this.validator) {
      return this.validator(emailAddress);
    }else {
      const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      const invalid = !emailRegex.test(emailAddress);
      if (invalid) {
        this.invalidEvt.emit(emailAddress);
      }
      return invalid;
    }
  }

}
