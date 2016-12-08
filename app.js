'use strict';

const Hapi = require('hapi');
const firebase = require('firebase');
const _ = require('lodash');
const faker = require('faker');
const Rx = require('rxjs/Rx');
const most = require('most');
const md5 = require('md5');
const EventEmitter = require('events');
const fbconfig = require('./config-firebase');
firebase.initializeApp(fbconfig);

const peopleRef = firebase.database().ref('people');
const emailRef = firebase.database().ref('lookups/emails');
const statsRef = firebase.database().ref('stats/people');

//peopleRef.on('child_added', function(snap) {
//  const peep = snap.val();
//  console.log(peep.email);
//  emailRef.child(emailToKey(peep.email)).set({
//    ref: snap.key
//  });
//  peopleRef.once('value', function(snap) {
//    statsRef.child('total').set(snap.numChildren());
//  });
//  statsRef.child('latest_user').set(peep.email);
//  statsRef.child('latest_user_added').set(firebase.database.ServerValue.TIMESTAMP);
//});
const emailToKey = function(emailAddress) {
   return md5(emailAddress);
}

const on$ = Rx.Observable.create(function(observer) {
  return function(ref, evt) { }
});

let peopleChildAdded = (snap) => console.log(snap.val().email);

peopleRef.on('child_added', peopleChildAdded)

const myInterval = Rx.Observable.interval(5000);
myInterval.subscribe(v => {
  peopleRef.push(faker.helpers.contextualCard());
});

const db = firebase.database();
const people = db.ref('people'); 
const query = people
		.orderByChild('email')
		.equalTo('smallboy33@manglass.com')
		.limitToFirst(1);
const logUser = (snap) => console.log(snap.val());
query.on('value', logUser);

const searchRefByValue$ = (ref, k, val) => {
  let emitter = new EventEmitter();
  ref.orderByChild(k)
    .equalTo(val)
    .limitToFirst(1)
    .on('value', (snap) => emitter.emit('value', snap));
  return most.fromEvent('value', emitter); 
}

searchRefByValue$(peopleRef, 'email', 'Hope.Schaden5.Bruen@yahoo.com')
  .map(s => s.val())
  .tap(s => console.log(s))
  .drain()

