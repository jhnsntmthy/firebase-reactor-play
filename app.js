'use strict';

const Hapi = require('hapi');
const firebase = require('firebase');
const _ = require('lodash');
const faker = require('faker');
const Rx = require('rxjs/Rx');
const md5 = require('md5');

var config = {
  apiKey: "AIzaSyAiDeQB9B5Y9GrcBMhl_WX3znTKZN9_2C8",
  authDomain: "first-429e7.firebaseapp.com",
  databaseURL: "https://first-429e7.firebaseio.com",
  storageBucket: "first-429e7.appspot.com",
  messagingSenderId: "92529856761"
};
firebase.initializeApp(config);

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


