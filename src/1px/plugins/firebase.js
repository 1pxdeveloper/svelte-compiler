import {Observable} from "../observable";

const itself = a => a;

export const createFirebaseReadable = (path, actionName = null) => new Observable(observer => {
  const ref = firebase.database().ref(path)
  ref.on('value', snapshot => {
    const value = snapshot.toJSON();

    console.group("[firebase]", path);
    console.log(value);
    observer.next(value)
    console.groupEnd();
  });
  return () => {
    ref.off();
  }
}).shareReplay(1);