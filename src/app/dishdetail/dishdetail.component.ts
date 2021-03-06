import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { Comment } from '../shared/comment';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { visibility, flyInOut, expand } from '../animations/app.animation';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { DishService } from '../services/dish.service'
@Component({
    selector: 'app-dishdetail',
    templateUrl: './dishdetail.component.html',
    styleUrls: ['./dishdetail.component.scss'],
    host: {
      '[@flyInOut]': 'true',
      'style': 'display: block;'
    },
    animations: [
      flyInOut(),
      visibility(),
      expand()
    ]
            
})
export class DishdetailComponent implements OnInit {

    dish: Dish;
    dishIds: string[];
    prev: string;
    next: string;
    errMess: string;
    dishcopy: Dish;
    visibility = 'shown';

    commentForm: FormGroup;
    comment: Comment;
    @ViewChild('fform') commentFormDirective;

    formErrors = {
        'author': "",
        'comment': "",
        'rating': '5'
    }

    validationMessages = {
        'author': {
            'required': "Name is requied",
            'minlength': "Name needs minimum 2 characters",
        },
        'comment': {
            'required': "Comment is requied",
        }
    }

    constructor(private dishService: DishService, private route: ActivatedRoute, private location: Location, private fb: FormBuilder, @Inject('BaseURL') public BaseURL) {
        this.createForm();
    }

    ngOnInit(): void {
        this.dishService.getDishIds()
            .subscribe((dishIds) => this.dishIds = dishIds,
                errmess => this.errMess = <any>errmess);
        this.route.params.pipe(switchMap((params: Params) => {this.visibility = 'hidden'; return this.dishService.getDish(params['id']);}))
            .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
                errmess => this.errMess = <any>errmess);
    }

    setPrevNext(dishId: string) {
        const index = this.dishIds.indexOf(dishId);
        this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
        this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
    }

    goBack(): void {
        this.location.back();
    }

    createForm() {
        this.commentForm = this.fb.group({
            author: ['', [Validators.required, Validators.minLength(2)]],
            rating: ['5'],
            comment: ['', Validators.required]
        });
        this.commentForm.valueChanges
            .subscribe(data => this.onValueChanged(data));

        this.onValueChanged(); //re(set) form validation messages
    }

    onValueChanged(data?: any) {
        if (!this.commentForm) { return; }
        const form = this.commentForm;
        for (const field in this.formErrors) {
            if (this.formErrors.hasOwnProperty(field)) {
                //clear previos error message
                this.formErrors[field] = '';
                const control = form.get(field);
                if (control && control.dirty && !control.valid) {
                    const messages = this.validationMessages[field];
                    for (const key in control.errors) {
                        if (control.errors.hasOwnProperty(key)) {
                            this.formErrors[field] += messages[key] + ' ';
                        }
                    }
                }
            }
        }
    }

    onSubmit() {
        this.comment = this.commentForm.value;
        console.log(this.comment);

        var d = new Date();
        this.comment["date"] = d.toISOString();

        this.dishcopy.comments.push(this.comment);
        this.dishService.putDish(this.dishcopy)
            .subscribe(dish => {
                this.dish = dish;
                this.dishcopy = dish;
            });

        this.commentFormDirective.resetForm();

        this.commentForm.reset({
            author: '',
            comment: '',
            rating: '5'
        });

    }

}
