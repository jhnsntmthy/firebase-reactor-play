'use strict';

const firebase = require('firebase');
const _ = require('lodash');
const faker = require('faker');
const md5 = require('md5');

// const Rx = require('rxjs/Rx');
const most = require('most');
const EventEmitter = require('events');

const fbconfig = require('./config-firebase');
firebase.initializeApp(fbconfig);

const peopleRef = firebase.database().ref('people');
const emailRef = firebase.database().ref('lookups/emails');
const statsRef = firebase.database().ref('stats/people');

// Typical FireBase denormalization with callbacks
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

// FIREBASE HELPERS for RxJS
// const onRefEvent$ = (ref, evt) => {
//   return Rx.Observable.create((o) => ref.on(evt, (snap) => o.next(snap)));
// }
//
// Firebase Interval with RxJS
// const myInterval = Rx.Observable.interval(5000);
// myInterval.subscribe(v => {
//   peopleRef.push(faker.helpers.contextualCard());
// });


// FUNCTIONAL SIDE EFFECTS, for use with most.js or Rx.js
// SIDE EFFECTS

// we do console logging this way because Node vs browser implementations
// of console are a bit different in nature, you can't simply "tap" it in browser
const consolelogger = (q) => console.log(q);

const refSet = (ref, k, v) => ref.child(k).set(v);

const indexEmailRef = (snap) => refSet(emailRef, md5(snap.val().email), { ref: snap.key });

const cacheLatestUser = (snap) => refSet(statsRef, 'latest_user', snap.val().email);

const cacheLatestUserAdded = () => refSet(statsRef, 'latest_user_added', firebase.database.ServerValue.TIMESTAMP);

const cachePeopleCounter = (snap) => refSet(statsRef, 'total', snap.numChildren())

const countPeopleThenCache = () => peopleRef.once('value', cachePeopleCounter);

const createFakePerson = () => peopleRef.push(faker.helpers.contextualCard());


// most.js helpers to create a stream out of watching a collection
const mostRefEvent$ = (ref, evt) => {
  let emitter = new EventEmitter();
  ref.on(evt, (snap) => emitter.emit(evt, snap))
  return most.fromEvent(evt, emitter)
}
const moistRefEvent$ = (ref, evt) => {
  return most.fromEvent(evt, { 
    addListener: (type, listener) => ref.on(type, listener),
    removeListener: (type, listener) => ref.off(type, listener)
  });
}

const run = () => {
  // clear DB
  peopleRef.remove();
  emailRef.remove();

  // Set up the iterative creation of users
  most.periodic(2000).forEach(createFakePerson);

  // Denormalize users and store stats with most.js
  moistRefEvent$(peopleRef, 'child_added')
    .map(params => params[0])
    .tap(indexEmailRef)
    .tap(cacheLatestUser)
    .tap(cacheLatestUserAdded)
    .tap(countPeopleThenCache)
    .map(s => s.val().username)
    .tap(consolelogger)
    .drain()
};
run(); // start the process

// here is the straightforward way to query a collection on a value
const findSmallBoy = () => {
  let db = firebase.database();
  let people = db.ref('people'); 
  let query = people
      .orderByChild('email')
      .equalTo('smallboy33@manglass.com')
      .limitToFirst(1);
  let logUser = (snap) => console.log(snap.val());
  query.on('value', logUser);  
}

// Here is the most.js functional way of setting up a helper then querying
const searchRefByValue$ = (ref, k, val) => {
  let emitter = new EventEmitter();
  ref.orderByChild(k)
    .equalTo(val)
    .limitToFirst(1)
    .on('value', (snap) => emitter.emit('value', snap));
  return most.fromEvent('value', emitter); 
}
const findHope = () => {
  searchRefByValue$(peopleRef, 'email', 'Hope.Schaden5.Bruen@yahoo.com')
    .map(s => s.val())
    .tap(s => console.log(s))
    .subscribe({})
}
// findHope();
