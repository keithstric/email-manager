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

export interface ListInfo {
  addresses: EmailManagerAddress[];
  showMore: boolean;
  label: string;
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
  /** The number of email addresses to display, not currently implemented */
  @Input() emailDisplayCount: number = 20;
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
  /** Include a sort function to sort the email addresses */
  @Input() sortFunc: (addr1: EmailManagerAddress, addr2: EmailManagerAddress) => number;

  @Output() addEvt: EventEmitter<string> = new EventEmitter<string>();
  @Output() deleteEvt: EventEmitter<string> = new EventEmitter<string>();
  @Output() editEvt: EventEmitter<string> = new EventEmitter<string>();
  @Output() invalidEvt: EventEmitter<string> = new EventEmitter<string>();
  @Output() dupeAddedEvt: EventEmitter<string> = new EventEmitter<string>();

  private _formArrayListener: Subscription;
  dupeMsg: string = '';
  editing: boolean = false;
  editingIdx: number = -1;
  showingAllAddresses: boolean = false;
  displayAddresses: ListInfo;

  @ViewChild('inputElement') inputEl: ElementRef<HTMLInputElement>;

  constructor() {}

  ngOnInit(): void {
    if (this.formArrayControl) {
      this._listenToFormArray();
    }
    this._updateAddresses();
  }

  ngAfterViewInit() {
    if (!this.displayOnly) {
      this.inputEl.nativeElement.addEventListener('keyup', this._keyupListener.bind(this));
    }
  }

  ngOnDestroy() {
    this._formArrayListener?.unsubscribe();
  }

  /**
   * The valid addresses
   */
  get validAddresses() {
    const addrs = this.formArrayControl ? this.formArrayControl.value : this.allAddresses;
    const filtered = addrs.filter(addr => !addr.invalid);
    const showMore = filtered.length > this.emailDisplayCount;
    if (this.showingAllAddresses) {
      return {addresses: filtered, label: this.invalidContainerLabel, showMore};
    }else{
      return {addresses: filtered.slice(0, this.emailDisplayCount), label: this.validContainerLabel, showMore};
    }
  }

  /**
   * The invalid addresses
   */
  get invalidAddresses() {
    const addrs = this.formArrayControl ? this.formArrayControl.value : this.allAddresses;
    const filtered = addrs.filter(addr => addr.invalid);
    const showMore = filtered.length > this.emailDisplayCount;
    if (this.showingAllAddresses) {
      return {addresses: filtered, label: this.invalidContainerLabel, showMore};
    }else{
      return {addresses: filtered.slice(0, this.emailDisplayCount), label: this.invalidContainerLabel, showMore};
    }
  }

  /**
   * Listen to the formArrayControl and updates allAddresses when the value changes
   * @private
   */
  private _listenToFormArray() {
    if (!this._formArrayListener) {
      this._formArrayListener = this.formArrayControl?.valueChanges
        .subscribe((newValue: EmailManagerAddress[]) => {
          this.allAddresses = [...newValue];
          this._updateAddresses();
        });
    }
  }

  /**
   * Parses the array of email addresses and updates the invalid property
   * @param addresses
   * @private
   */
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

  /**
   * Listens for keyup on the input field
   * @param evt
   * @private
   */
  private _keyupListener(evt: KeyboardEvent) {
    this.dupeMsg = '';
    if (evt.keyCode === 188 || evt.keyCode === 32 || evt.keyCode === 13) {
      let email = this.inputEl.nativeElement.value;
      if (evt.keyCode !== 13) {
        email = email.substr(0, email.length - 1);
      }
      if (!this.editing) {
        this.addAddress(email);
      }else{
        this.editAddress(email, this.editingIdx);
        this.editing = false;
        this.editingIdx = -1;
      }
      this.inputEl.nativeElement.value = '';
    }
  }

  /**
   * Update allAddresses and displayAddresses
   * @private
   */
  private _updateAddresses() {
    // Don't like this as it loops multiple times through the array of addresses
    const allAddrs = this.formArrayControl ? this.formArrayControl.value : this.allAddresses;
    this.allAddresses = this._parseAddresses(allAddrs).sort(this.sortFunc);
    const addresses = this.allAddresses.slice(0, this.emailDisplayCount);
    this.displayAddresses = {addresses, label: this.allContainerLabel, showMore: this.allAddresses.length > addresses.length};
    if (this.showingAllAddresses) {
      this.showAllAddresses();
    }
  }

  /**
   * Fired from the _keyupListener after comma, enter or space is entered if editing = false
   * @param emailAddress
   */
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
          this._updateAddresses();
        }
      }
      if (isDupe) {
        this.dupeMsg = `${emailAddress} is a duplicate and was not added!`;
      }
      if (dupe) {
        this.dupeAddedEvt.emit(emailAddress);
      }
      this.addEvt.emit(emailAddress);
      this.inputEl.nativeElement.value = '';
    }
  }

  /**
   * Fired from the _keyupListener after comma, enter or space is entered if editing = true
   * @param newEmailAddress
   * @param idx
   */
  editAddress(newEmailAddress: string, idx: number) {
    const addr = this.formArrayControl ? this.formArrayControl.at(idx)?.value : this.allAddresses[idx];
    addr.email = newEmailAddress;
    if (this.formArrayControl) {
      const ctrl = this.formArrayControl.at(idx);
      ctrl?.get('email')?.setValue(addr?.email);
      ctrl?.updateValueAndValidity();
      ctrl?.get('invalid')?.setValue(ctrl?.invalid);
    }else{
      addr.invalid = this.validate(addr.email);
      this._updateAddresses();
    }
  }

  /**
   * Get an entry
   * @param address
   * @param list
   */
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

  /**
   * Fired when the delete button is clicked
   * @param evt
   * @param address
   */
  onDeleteAddress(evt: MouseEvent, address: EmailManagerAddress) {
    evt.stopPropagation();
    const foundInAll = this.getEntry(address);
    if (foundInAll?.idx > -1) {
      this.allAddresses.splice(foundInAll.idx, 1);
      if (this.formArrayControl) {
        this.formArrayControl.removeAt(foundInAll.idx);
      }else{
        this._updateAddresses();
      }
      this.deleteEvt.emit(foundInAll.email.email);
      this.inputEl.nativeElement.value = '';
    }
  }

  /**
   * If there is a validator provided as the validator @Input, use that
   * otherwise, just check the format
   *
   * regex from http://emailregex.com/
   * @param emailAddress
   */
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

  /**
   * Fired when an address tag is clicked
   * @param address
   */
  onEditEmail(address: EmailManagerAddress) {
    this.inputEl.nativeElement.value = address.email;
    this.allAddresses.find((addr, idx) => {
      if (addr.email === address.email) {
        this.editingIdx = idx;
        return true;
      }
      return false;
    });
    this.editing = true;
  }

  showAllAddresses() {
    if (this.showingAllAddresses === true) {
      this.displayAddresses.addresses = this.allAddresses.slice(0, this.emailDisplayCount);
    }else{
      this.displayAddresses.addresses = this.allAddresses;
    }
    this.showingAllAddresses = !this.showingAllAddresses;
  }
}
